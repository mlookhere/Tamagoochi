#!/usr/bin/env python3
"""Fail-closed evidence validation for a real Unity EditMode + Android run."""
import argparse
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

EDITOR_VERSION = "6000.0.62f1"
MINIMUM_EDITMODE_CASES = 73  # Audited floor for the six migration suites.
SUITE_FILES = (
    "ArtImportTests", "ExpeditionTests", "GameSessionTests",
    "GameStoreTests", "GameplayParityTests", "PetAndInventoryTests",
)
DIRECT_TEST = re.compile(r"(?m)^[ \t]*\[Test\][ \t]*\r?\n[ \t]*public void ([A-Za-z]\w*)\(")
ART_CASE = re.compile(r'(?m)^[ \t]*\[TestCase\("([^"]+)"')
REQUIRED_TESTS = frozenset({
    "GeneratedUiFilesLiveInsideTheSelectedUnityProject",
    "ExpeditionFinishesAcrossOfflineTimeWithoutBackgroundTimers",
    "FullStateRoundTripsThroughUnityJson",
    "CorruptPrimaryRecoversBackupWithoutOverwritingIt",
    "StoneSkipPreviewCannotMutateAndRetriesAreFree",
    "PetCareMatchesOriginalRules",
})



def _expected_unity_tests(project: Path):
    folder = project / "Assets" / "Tests" / "EditMode"
    methods = {}
    art = []
    for name in SUITE_FILES:
        source = (folder / f"{name}.cs").read_text()
        found = DIRECT_TEST.findall(source)
        if not found:
            raise ValueError(f"Missing NUnit test methods in {name}")
        for method in found:
            if method in methods:
                raise ValueError(f"Duplicate NUnit test method: {method}")
            methods[method] = f"Tamagoochi.Tests.{name}"
        cases = ART_CASE.findall(source)
        if name == "ArtImportTests":
            art = cases
        elif cases:
            raise ValueError(f"Unexpected untracked parameterized tests in {name}")
    if (len(methods) < 62 or len(art) < 11 or
            not REQUIRED_TESTS <= methods.keys() or len(art) != len(set(art))):
        raise ValueError("Unity authored EditMode test source is incomplete or changed")
    return methods, art


def _matches_authored_suites(cases: list, methods: dict, assets: list) -> bool:
    actual = {(case.get("classname"), case.get("methodname"), case.get("fullname"))
              for case in cases}
    if any((suite, method, f"{suite}.{method}") not in actual
           for method, suite in methods.items()):
        return False
    return all(sum(case.get("classname") == "Tamagoochi.Tests.ArtImportTests" and
                   case.get("methodname") == "OriginalSpritesImportCorrectly" and
                   asset in (case.get("name") or "")
                   for case in cases) == 1 for asset in assets)


def _passing_nunit_report(path: Path, methods: set, art: list) -> bool:
    root = ET.parse(path).getroot()
    if root.tag != "test-run":
        return False
    attrs = root.attrib
    expected = {"result": "Passed", "failed": "0", "skipped": "0", "inconclusive": "0"}
    if any(attrs.get(key) != value for key, value in expected.items()):
        raise ValueError(f"Unity EditMode tests did not fully pass: {path}")
    total = int(attrs.get("total", "0"))
    passed = int(attrs.get("passed", "-1"))
    if total < max(MINIMUM_EDITMODE_CASES, len(methods) + len(art)) or passed != total:
        raise ValueError(f"Unity EditMode test count mismatch: {path}")
    cases = root.findall(".//test-case")
    if len(cases) != total or any(case.get("result") != "Passed" for case in cases):
        raise ValueError(f"Unity EditMode test-case results missing or inconsistent: {path}")
    names = [case.get("name") or "" for case in cases]
    present = set(names)
    if (len(present) != total or not methods.keys() <= present or
            not _matches_authored_suites(cases, methods, art)):
        raise ValueError(f"Unity EditMode suite is incomplete or duplicated: {path}")
    return True


def _validate_apk(apk: Path) -> None:
    if not apk.is_file() or apk.stat().st_size <= 0 or not zipfile.is_zipfile(apk):
        raise ValueError("Native Android APK missing, empty or invalid")
    with zipfile.ZipFile(apk) as archive:
        names = archive.namelist()
        if archive.testzip() is not None or not {"AndroidManifest.xml", "classes.dex"} <= set(names):
            raise ValueError("Android APK archive is damaged or missing runtime entries")
        if not archive.read("AndroidManifest.xml").startswith(b"\x03\x00\x08\x00"):
            raise ValueError("Android manifest is not compiled binary XML")
        if not archive.read("classes.dex").startswith(b"dex\n"):
            raise ValueError("Android DEX bytecode is missing or invalid")


def validate(project: Path, tests: Path, apk: Path) -> None:
    version = project / "ProjectSettings" / "ProjectVersion.txt"
    if not version.is_file() or f"m_EditorVersion: {EDITOR_VERSION}" not in version.read_text():
        raise ValueError("Unity project missing or Editor version does not match pinned build")
    reports = sorted(tests.rglob("*.xml")) if tests.is_dir() else []
    if not reports:
        raise ValueError("No Unity NUnit XML result files were produced")
    methods, art = _expected_unity_tests(project)
    if sum(_passing_nunit_report(path, methods, art) for path in reports) != 1:
        raise ValueError("Expected exactly one real NUnit test-run")
    _validate_apk(apk)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--tests", type=Path, required=True)
    parser.add_argument("--apk", type=Path, required=True)
    args = parser.parse_args()
    try:
        validate(args.project, args.tests, args.apk)
    except (OSError, ValueError, ET.ParseError, zipfile.BadZipFile) as error:
        print(f"UNITY NATIVE EVIDENCE FAILED: {error}", file=sys.stderr)
        return 1
    print("Unity EditMode NUnit and Android APK evidence validated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
