#!/usr/bin/env python3
"""Fail-closed evidence validation for a real Unity EditMode + Android run."""
import argparse
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

EDITOR_VERSION = "6000.0.62f1"


def _passing_nunit_report(path: Path) -> bool:
    root = ET.parse(path).getroot()
    if root.tag != "test-run":
        return False
    attrs = root.attrib
    expected = {"result": "Passed", "failed": "0", "skipped": "0", "inconclusive": "0"}
    if any(attrs.get(key) != value for key, value in expected.items()):
        raise ValueError(f"Unity EditMode tests did not fully pass: {path}")
    total = int(attrs.get("total", "0"))
    passed = int(attrs.get("passed", "-1"))
    if total <= 0 or passed != total:
        raise ValueError(f"Unity EditMode test count mismatch: {path}")
    return True


def _validate_apk(apk: Path) -> None:
    if not apk.is_file() or apk.stat().st_size <= 0 or not zipfile.is_zipfile(apk):
        raise ValueError("Native Android APK missing, empty or invalid")
    with zipfile.ZipFile(apk) as archive:
        if archive.testzip() is not None or "AndroidManifest.xml" not in archive.namelist():
            raise ValueError("Android APK archive is damaged or lacks a manifest")


def validate(project: Path, tests: Path, apk: Path) -> None:
    version = project / "ProjectSettings" / "ProjectVersion.txt"
    if not version.is_file() or f"m_EditorVersion: {EDITOR_VERSION}" not in version.read_text():
        raise ValueError("Unity project missing or Editor version does not match pinned build")
    reports = sorted(tests.rglob("*.xml")) if tests.is_dir() else []
    if not reports:
        raise ValueError("No Unity NUnit XML result files were produced")
    if sum(_passing_nunit_report(path) for path in reports) != 1:
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
