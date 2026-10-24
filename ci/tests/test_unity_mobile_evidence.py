"""Synthetic cross-platform evidence fixtures; not a Unity Editor or device run."""
import hashlib
import tempfile
import unittest
import zipfile
from pathlib import Path

from ci.verify_unity_mobile_evidence import verify
from ci.verify_unity_native import MINIMUM_EDITMODE_CASES, REQUIRED_TESTS

MIGRATION = "a" * 40
WORKFLOW = "b" * 40
PRODUCTS = "unity/Builds/iOS-derived/Build/Products/Release-iphoneos"


def _digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _synthetic_macho(filetype: int, cpu: int = 0x0100000C) -> bytes:
    """Minimal 64-bit Mach-O load-command fixture; not an iOS executable."""
    command = (0x19).to_bytes(4, "little") + (72).to_bytes(4, "little") + bytes(64)
    header = (b"\xcf\xfa\xed\xfe" + cpu.to_bytes(4, "little") +
              bytes(4) + filetype.to_bytes(4, "little") +
              (1).to_bytes(4, "little") + len(command).to_bytes(4, "little") +
              bytes(8))
    return header + command


def _synthetic_fat_macho(filetype: int, width: int = 4) -> bytes:
    magic = b"\xca\xfe\xba\xbe" if width == 4 else b"\xca\xfe\xba\xbf"
    record_size = 20 if width == 4 else 32
    offset = 8 + record_size
    record = (0x0100000C).to_bytes(4, "big") + bytes(4)
    record += offset.to_bytes(width, "big") + len(_synthetic_macho(filetype)).to_bytes(width, "big")
    record += bytes(record_size - 8 - 2 * width)
    return magic + (1).to_bytes(4, "big") + record + _synthetic_macho(filetype)


def _synthetic_apk(path: Path, include_runtime: bool = True) -> None:
    """Minimal structural APK fixture, not a real Unity build."""
    manifest = b"\x03\x00\x08\x00" + (16).to_bytes(4, "little") + bytes(8)
    dex = bytearray(0x70)
    dex[:8] = b"dex\n035\x00"
    dex[32:36] = len(dex).to_bytes(4, "little")
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("AndroidManifest.xml", manifest)
        archive.writestr("classes.dex", dex)
        if include_runtime:
            archive.writestr("lib/arm64-v8a/libunity.so", b"\x7fELF" + bytes(60))
            archive.writestr("assets/bin/Data/globalgamemanagers", b"synthetic-player")


class CrossPlatformEvidenceTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        self.android = root / "android"
        self.ios = root / "ios"
        report = self.android / "unity-test-results" / "results.xml"
        apk = self.android / "unity" / "Builds" / "Tamagoochi.apk"
        report.parent.mkdir(parents=True)
        apk.parent.mkdir(parents=True)
        sentinels = "".join(
            f'<test-case name="{method}" classname="Tamagoochi.Tests.SyntheticTests" '
            f'methodname="{method}" fullname="Tamagoochi.Tests.SyntheticTests.{method}" '
            f'result="Passed"/>' for method in sorted(REQUIRED_TESTS)
        )
        cases = sentinels + "".join(
            f'<test-case name="Case{i}" result="Passed"/>'
            for i in range(MINIMUM_EDITMODE_CASES - len(REQUIRED_TESTS))
        )
        report.write_text(
            f'<test-run result="Passed" total="{MINIMUM_EDITMODE_CASES}" '
            f'passed="{MINIMUM_EDITMODE_CASES}" failed="0" skipped="0" inconclusive="0">'
            f'<test-suite>{cases}</test-suite></test-run>'
        )
        _synthetic_apk(apk)
        (self.android / "unity-native-provenance.txt").write_text(
            f"migration_sha={MIGRATION}\nworkflow_sha={WORKFLOW}\nrun_id=101\n"
            f"nunit_sha256={_digest(report.read_bytes())}\napk_sha256={_digest(apk.read_bytes())}\n"
        )
        products = self.ios / PRODUCTS
        self.launcher = products / "Unity-iPhone.app" / "Unity-iPhone"
        self.framework = products / "UnityFramework.framework" / "UnityFramework"
        self.launcher.parent.mkdir(parents=True)
        self.framework.parent.mkdir(parents=True)
        self.launcher.write_bytes(_synthetic_macho(2))
        self.framework.write_bytes(_synthetic_macho(6))
        records = []
        for name, binary in [
            ("unity-ios-executable.sha256", self.launcher),
            ("unity-ios-framework.sha256", self.framework),
        ]:
            record = f"{_digest(binary.read_bytes())}  {binary.relative_to(self.ios).as_posix()}"
            (self.ios / name).write_text(record + "\n")
            records.append(record)
        (self.ios / "unity-ios-xcode-version.txt").write_text(
            "Xcode 16.0\nBuild version synthetic\n"
        )
        (self.ios / "unity-ios-xcode-build.log").write_text("** BUILD SUCCEEDED **\n")
        (self.ios / "unity-ios-provenance.txt").write_text(
            f"migration_sha={MIGRATION}\nworkflow_sha={WORKFLOW}\nrun_id=102\n"
            "result=unsigned_xcode_compile_only\nXcode 16.0\nBuild version synthetic\n"
            + "\n".join(records) + "\n"
        )

    def _replace_archived_report(self, original: str, replacement: str) -> None:
        report = self.android / "unity-test-results" / "results.xml"
        old_hash = _digest(report.read_bytes())
        contents = report.read_text()
        self.assertIn(original, contents)
        report.write_text(contents.replace(original, replacement, 1))
        provenance = self.android / "unity-native-provenance.txt"
        provenance.write_text(provenance.read_text().replace(old_hash, _digest(report.read_bytes())))

    def test_failed_nunit_report_with_matching_digest_fails(self):
        self._replace_archived_report('result="Passed" total=', 'result="Failed" total=')
        with self.assertRaisesRegex(ValueError, "fully passing"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_missing_nunit_case_with_matching_digest_fails(self):
        self._replace_archived_report('<test-case name="Case0" result="Passed"/>', "")
        with self.assertRaisesRegex(ValueError, "inconsistent"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_duplicate_nunit_case_identity_with_matching_digest_fails(self):
        self._replace_archived_report('name="Case1"', 'name="Case0"')
        with self.assertRaisesRegex(ValueError, "duplicated"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_hash_matched_missing_authored_gameplay_test_fails(self):
        method = sorted(REQUIRED_TESTS)[0]
        self._replace_archived_report(f'name="{method}"', 'name="ForgedSyntheticCase"')
        with self.assertRaisesRegex(ValueError, "authored gameplay sentinel"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_hash_matched_forged_gameplay_suite_identity_fails(self):
        method = sorted(REQUIRED_TESTS)[0]
        self._replace_archived_report(
            f'fullname="Tamagoochi.Tests.SyntheticTests.{method}"',
            f'fullname="Tamagoochi.Tests.UnreviewedTests.{method}"')
        with self.assertRaisesRegex(ValueError, "authored gameplay sentinel"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_invalid_xml_with_matching_digest_fails(self):
        self._replace_archived_report("</test-run>", "")
        with self.assertRaisesRegex(Exception, "no element found"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_matching_unsigned_cross_platform_evidence(self):
        verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_missing_or_unsuccessful_xcode_build_log_fails(self):
        path = self.ios / "unity-ios-xcode-build.log"
        path.unlink()
        with self.assertRaises(FileNotFoundError):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')
        path.write_text("** BUILD FAILED **\n")
        with self.assertRaisesRegex(ValueError, "successful build outcome"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_failed_final_xcode_build_after_prior_success_fails(self):
        log = self.ios / "unity-ios-xcode-build.log"
        log.write_text("** BUILD SUCCEEDED **\nRetrying build\n** BUILD FAILED **\n")
        with self.assertRaisesRegex(ValueError, "successful build outcome"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_embedded_success_claim_without_xcode_status_fails(self):
        log = self.ios / "unity-ios-xcode-build.log"
        log.write_text("Warning: literal ** BUILD SUCCEEDED ** was found in unrelated output\n")
        with self.assertRaisesRegex(ValueError, "successful build outcome"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_mismatched_xcode_version_provenance_fails(self):
        version = self.ios / "unity-ios-xcode-version.txt"
        version.write_text("Xcode 16.1\nBuild version other\n")
        with self.assertRaisesRegex(ValueError, "does not match"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_migration_revision_mismatch_fails(self):
        with self.assertRaisesRegex(ValueError, "reviewed migration SHA"):
            verify(self.android, self.ios, "c" * 40, WORKFLOW, "101", "102")

    def test_reviewed_workflow_revision_mismatch_fails(self):
        with self.assertRaisesRegex(ValueError, "trusted workflow SHA"):
            verify(self.android, self.ios, MIGRATION, "c" * 40, "101", "102")

    def test_platform_workflow_revision_mismatch_fails(self):
        path = self.ios / "unity-ios-provenance.txt"
        path.write_text(path.read_text().replace(f"workflow_sha={WORKFLOW}", f"workflow_sha={'c' * 40}"))
        with self.assertRaisesRegex(ValueError, "trusted workflow SHA"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_wrong_reviewed_android_run_id_fails(self):
        with self.assertRaisesRegex(ValueError, "reviewed Actions runs"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "999", "102")

    def test_wrong_reviewed_ios_run_id_fails(self):
        with self.assertRaisesRegex(ValueError, "reviewed Actions runs"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "999")

    def test_malformed_reviewed_run_id_fails(self):
        for value in ["", "0", "001", "run-101"]:
            with self.subTest(run_id=value):
                with self.assertRaisesRegex(ValueError, "positive GitHub Actions run IDs"):
                    verify(self.android, self.ios, MIGRATION, WORKFLOW, value, "102")

    def test_android_digest_tampering_fails(self):
        (self.android / "unity" / "Builds" / "Tamagoochi.apk").write_bytes(b"replaced")
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_invalid_apk_with_matching_digest_fails(self):
        apk = self.android / "unity" / "Builds" / "Tamagoochi.apk"
        original = _digest(apk.read_bytes())
        apk.write_bytes(b"not-an-android-archive")
        provenance = self.android / "unity-native-provenance.txt"
        provenance.write_text(provenance.read_text().replace(original, _digest(apk.read_bytes())))
        with self.assertRaisesRegex(ValueError, "Native Android APK"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_missing_unity_runtime_with_matching_digest_fails(self):
        apk = self.android / "unity" / "Builds" / "Tamagoochi.apk"
        original = _digest(apk.read_bytes())
        _synthetic_apk(apk, include_runtime=False)
        provenance = self.android / "unity-native-provenance.txt"
        provenance.write_text(provenance.read_text().replace(original, _digest(apk.read_bytes())))
        with self.assertRaisesRegex(ValueError, "Unity engine binary"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_duplicate_nunit_reports_fail(self):
        (self.android / "unity-test-results" / "another.xml").write_text("<test-run/>")
        with self.assertRaisesRegex(ValueError, "exactly one"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def _replace_ios_product(self, binary: Path, name: str, data: bytes) -> None:
        record_path = self.ios / name
        before = record_path.read_text().strip()
        binary.write_bytes(data)
        after = f"{_digest(data)}  {binary.relative_to(self.ios).as_posix()}"
        record_path.write_text(after + "\n")
        provenance = self.ios / "unity-ios-provenance.txt"
        provenance.write_text(provenance.read_text().replace(before, after))

    def test_hash_matched_non_macho_ios_binary_fails(self):
        self._replace_ios_product(self.launcher, "unity-ios-executable.sha256", b"not Mach-O")
        with self.assertRaisesRegex(ValueError, "ARM64 Mach-O"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_hash_matched_truncated_macho_header_fails(self):
        self._replace_ios_product(self.launcher, "unity-ios-executable.sha256",
                                  _synthetic_macho(2)[:16])
        with self.assertRaisesRegex(ValueError, "ARM64 Mach-O"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_hash_matched_macho_without_load_commands_fails(self):
        payload = _synthetic_macho(2)
        header_only = payload[:16] + bytes(16)
        self._replace_ios_product(self.launcher, "unity-ios-executable.sha256", header_only)
        with self.assertRaisesRegex(ValueError, "ARM64 Mach-O"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_hash_matched_truncated_macho_load_command_fails(self):
        payload = _synthetic_macho(2)
        self._replace_ios_product(self.launcher, "unity-ios-executable.sha256",
                                  payload[:-20])
        with self.assertRaisesRegex(ValueError, "ARM64 Mach-O"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_hash_matched_invalid_macho_command_size_fails(self):
        payload = bytearray(_synthetic_macho(2))
        payload[36:40] = (4).to_bytes(4, "little")
        self._replace_ios_product(self.launcher, "unity-ios-executable.sha256", bytes(payload))
        with self.assertRaisesRegex(ValueError, "ARM64 Mach-O"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_hash_matched_non_arm64_ios_binary_fails(self):
        self._replace_ios_product(self.framework, "unity-ios-framework.sha256",
                                  _synthetic_macho(6, cpu=7))
        with self.assertRaisesRegex(ValueError, "ARM64 Mach-O"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_hash_matched_wrong_macho_product_type_fails(self):
        self._replace_ios_product(self.launcher, "unity-ios-executable.sha256",
                                  _synthetic_macho(6))
        with self.assertRaisesRegex(ValueError, "expected type"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_hash_matched_fat_arm64_ios_binary_passes(self):
        for width in (4, 8):
            with self.subTest(architecture_record_width=width):
                self._replace_ios_product(self.launcher, "unity-ios-executable.sha256",
                                          _synthetic_fat_macho(2, width))
                verify(self.android, self.ios, MIGRATION, WORKFLOW, "101", "102")

    def test_ios_framework_digest_tampering_fails(self):
        self.framework.write_bytes(b"replaced")
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_ios_missing_product_fails(self):
        self.launcher.unlink()
        with self.assertRaisesRegex(ValueError, "Missing or unsafe"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_ios_hash_not_in_provenance_fails(self):
        path = self.ios / "unity-ios-provenance.txt"
        path.write_text(path.read_text().replace("  " + PRODUCTS + "/Unity-iPhone.app", "  other"))
        with self.assertRaisesRegex(ValueError, "absent from run provenance"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_duplicate_run_identifier_fails(self):
        path = self.ios / "unity-ios-provenance.txt"
        path.write_text(path.read_text().replace("run_id=102", "run_id=101"))
        with self.assertRaisesRegex(ValueError, "independent Android"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_signed_claim_cannot_relabel_unsigned_evidence(self):
        path = self.ios / "unity-ios-provenance.txt"
        path.write_text(path.read_text().replace("unsigned_xcode_compile_only", "signed_release"))
        with self.assertRaisesRegex(ValueError, "unsigned iOS build"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

    def test_unsafe_ios_binary_path_fails(self):
        path = self.ios / "unity-ios-executable.sha256"
        path.write_text(path.read_text().replace(PRODUCTS, "../" + PRODUCTS))
        with self.assertRaisesRegex(ValueError, "Invalid iOS product path"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')


if __name__ == "__main__":
    unittest.main()
