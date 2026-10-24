#!/usr/bin/env python3
"""Verify that archived Android and unsigned iOS evidence targets one Unity migration revision."""
import argparse
import hashlib
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path, PurePosixPath

from ci.verify_unity_native import MINIMUM_EDITMODE_CASES, _validate_apk

SHA40 = re.compile(r"[0-9a-f]{40}")
SHA256 = re.compile(r"[0-9a-f]{64}")
IOS_PRODUCTS = "unity/Builds/iOS-derived/Build/Products/Release-iphoneos/"


def _digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _provenance(path: Path, required: set[str]) -> dict[str, str]:
    values = {}
    for line in path.read_text().splitlines():
        if "=" in line:
            key, value = line.split("=", 1)
            if key in required:
                if key in values:
                    raise ValueError(f"Duplicate evidence field {key}: {path}")
                values[key] = value
    if not required <= values.keys():
        raise ValueError(f"Missing provenance fields: {path}")
    if not SHA40.fullmatch(values["migration_sha"]) or not SHA40.fullmatch(values["workflow_sha"]):
        raise ValueError(f"Invalid source/workflow commit SHA: {path}")
    if not values["run_id"].isdigit() or int(values["run_id"]) < 1:
        raise ValueError(f"Invalid GitHub Actions run ID: {path}")
    return values


def _matched_file(root: Path, relative: str, expected: str) -> None:
    path = root / relative
    if not SHA256.fullmatch(expected) or not path.is_file() or not path.resolve().is_relative_to(root.resolve()):
        raise ValueError(f"Missing or unsafe evidence file: {relative}")
    if _digest(path) != expected:
        raise ValueError(f"Evidence hash mismatch: {relative}")


def _ios_binary(root: Path, hash_name: str, provenance: str, suffix: str) -> None:
    raw = (root / hash_name).read_text().strip()
    parts = raw.split(maxsplit=1)
    if len(parts) != 2 or not SHA256.fullmatch(parts[0]):
        raise ValueError(f"Invalid iOS binary hash record: {hash_name}")
    relative = parts[1].lstrip("*")
    pure = PurePosixPath(relative)
    if (pure.is_absolute() or ".." in pure.parts or
            not relative.startswith(IOS_PRODUCTS) or not relative.endswith(suffix)):
        raise ValueError(f"Invalid iOS product path: {relative}")
    if raw not in provenance:
        raise ValueError(f"iOS binary hash absent from run provenance: {hash_name}")
    _matched_file(root, relative, parts[0])


def _nunit_report_passed(path: Path) -> None:
    root = ET.parse(path).getroot()
    attributes = root.attrib
    required = {"result": "Passed", "failed": "0", "skipped": "0", "inconclusive": "0"}
    if root.tag != "test-run" or any(attributes.get(k) != v for k, v in required.items()):
        raise ValueError("Archived Unity NUnit report is not a fully passing test-run")
    total = int(attributes.get("total", "0"))
    passed = int(attributes.get("passed", "-1"))
    cases = root.findall(".//test-case")
    if (total < MINIMUM_EDITMODE_CASES or passed != total or len(cases) != total or
            any(case.get("result") != "Passed" for case in cases)):
        raise ValueError("Archived Unity NUnit report has missing, failed or inconsistent test cases")
    names = [case.get("fullname") or case.get("name") for case in cases]
    if len(set(names)) != total or any(not name for name in names):
        raise ValueError("Archived Unity NUnit test identities are incomplete or duplicated")


def _ios_build_evidence(ios: Path, provenance: str) -> None:
    version = (ios / "unity-ios-xcode-version.txt").read_text().strip()
    build_log = (ios / "unity-ios-xcode-build.log").read_text()
    if not version.startswith("Xcode ") or "\nBuild version " not in version:
        raise ValueError("Archived iOS Xcode version evidence is missing or invalid")
    if version not in provenance:
        raise ValueError("Archived Xcode version does not match iOS provenance")
    outcomes = re.findall(r"^\*\* BUILD (?:SUCCEEDED|FAILED) \*\*$", build_log, re.MULTILINE)
    if not outcomes or outcomes[-1] != "** BUILD SUCCEEDED **":
        raise ValueError("iOS Xcode build log does not end with a successful build outcome")


def verify(android: Path, ios: Path, migration_sha: str, workflow_sha: str,
           android_run_id: str, ios_run_id: str) -> None:
    if not SHA40.fullmatch(migration_sha) or not SHA40.fullmatch(workflow_sha):
        raise ValueError("Expected migration/workflow commits must be full 40-character SHAs")
    android_fields = {"migration_sha", "workflow_sha", "run_id", "nunit_sha256", "apk_sha256"}
    ios_fields = {"migration_sha", "workflow_sha", "run_id", "result"}
    a = _provenance(android / "unity-native-provenance.txt", android_fields)
    i = _provenance(ios / "unity-ios-provenance.txt", ios_fields)
    if a["migration_sha"] != migration_sha or i["migration_sha"] != migration_sha:
        raise ValueError("Android and iOS evidence must match the reviewed migration SHA")
    if a["workflow_sha"] != workflow_sha or i["workflow_sha"] != workflow_sha:
        raise ValueError("Android and iOS evidence must match the trusted workflow SHA")
    if a["run_id"] == i["run_id"] or i["result"] != "unsigned_xcode_compile_only":
        raise ValueError("Expected independent Android and unsigned iOS build runs")
    if not all(re.fullmatch(r"[1-9][0-9]*", value) for value in (android_run_id, ios_run_id)):
        raise ValueError("Expected positive GitHub Actions run IDs from reviewed run URLs")
    if a["run_id"] != android_run_id or i["run_id"] != ios_run_id:
        raise ValueError("Android/iOS evidence run IDs do not match the reviewed Actions runs")
    reports = list((android / "unity-test-results").rglob("*.xml"))
    if len(reports) != 1:
        raise ValueError("Expected exactly one archived Android NUnit XML report")
    _matched_file(android, reports[0].relative_to(android).as_posix(), a["nunit_sha256"])
    _nunit_report_passed(reports[0])
    apk = android / "unity/Builds/Tamagoochi.apk"
    _matched_file(android, "unity/Builds/Tamagoochi.apk", a["apk_sha256"])
    _validate_apk(apk)
    provenance = (ios / "unity-ios-provenance.txt").read_text()
    _ios_build_evidence(ios, provenance)
    _ios_binary(ios, "unity-ios-executable.sha256", provenance, "/Unity-iPhone.app/Unity-iPhone")
    _ios_binary(ios, "unity-ios-framework.sha256", provenance, "/UnityFramework.framework/UnityFramework")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--android", type=Path, required=True)
    parser.add_argument("--ios", type=Path, required=True)
    parser.add_argument("--migration-sha", required=True)
    parser.add_argument("--workflow-sha", required=True)
    parser.add_argument("--android-run-id", required=True)
    parser.add_argument("--ios-run-id", required=True)
    args = parser.parse_args()
    try:
        verify(args.android, args.ios, args.migration_sha, args.workflow_sha,
               args.android_run_id, args.ios_run_id)
    except (OSError, ValueError, ET.ParseError, zipfile.BadZipFile) as error:
        print(f"UNITY MOBILE EVIDENCE REJECTED: {error}", file=sys.stderr)
        return 1
    print("Native evidence matches reviewed SHAs and both Actions run IDs; signing/device QA not verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
