"""Synthetic cross-platform evidence fixtures; not a Unity Editor or device run."""
import hashlib
import tempfile
import unittest
from pathlib import Path

from ci.verify_unity_mobile_evidence import verify
from ci.verify_unity_native import MINIMUM_EDITMODE_CASES

MIGRATION = "a" * 40
WORKFLOW = "b" * 40
PRODUCTS = "unity/Builds/iOS-derived/Build/Products/Release-iphoneos"


def _digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


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
        cases = "".join(
            f'<test-case name="Case{i}" result="Passed"/>' for i in range(MINIMUM_EDITMODE_CASES)
        )
        report.write_text(
            f'<test-run result="Passed" total="{MINIMUM_EDITMODE_CASES}" '
            f'passed="{MINIMUM_EDITMODE_CASES}" failed="0" skipped="0" inconclusive="0">'
            f'<test-suite>{cases}</test-suite></test-run>'
        )
        apk.write_bytes(b"synthetic-apk")
        (self.android / "unity-native-provenance.txt").write_text(
            f"migration_sha={MIGRATION}\nworkflow_sha={WORKFLOW}\nrun_id=101\n"
            f"nunit_sha256={_digest(report.read_bytes())}\napk_sha256={_digest(apk.read_bytes())}\n"
        )
        products = self.ios / PRODUCTS
        self.launcher = products / "Unity-iPhone.app" / "Unity-iPhone"
        self.framework = products / "UnityFramework.framework" / "UnityFramework"
        self.launcher.parent.mkdir(parents=True)
        self.framework.parent.mkdir(parents=True)
        self.launcher.write_bytes(b"synthetic-launcher")
        self.framework.write_bytes(b"synthetic-framework")
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

    def test_duplicate_nunit_reports_fail(self):
        (self.android / "unity-test-results" / "another.xml").write_text("<test-run/>")
        with self.assertRaisesRegex(ValueError, "exactly one"):
            verify(self.android, self.ios, MIGRATION, WORKFLOW, '101', '102')

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
