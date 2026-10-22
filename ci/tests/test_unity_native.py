"""Synthetic evidence tests. Passing these never means Unity itself ran."""
import tempfile
import unittest
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

from ci.verify_unity_native import validate

PASS = '<test-run result="Passed" total="3" passed="3" failed="0" skipped="0" inconclusive="0"/>'
FAIL = '<test-run result="Failed" total="3" passed="2" failed="1" skipped="0" inconclusive="0"/>'


class NativeEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.project = root / "unity"
        version = self.project / "ProjectSettings" / "ProjectVersion.txt"
        version.parent.mkdir(parents=True)
        version.write_text("m_EditorVersion: 6000.0.62f1\n")
        self.tests = root / "tests"
        self.tests.mkdir()
        self.xml = self.tests / "results.xml"
        self.xml.write_text(PASS)
        self.apk = root / "Tamagoochi.apk"
        with zipfile.ZipFile(self.apk, "w") as archive:
            archive.writestr("AndroidManifest.xml", b"\x03\x00\x08\x00" + b"synthetic")
            archive.writestr("classes.dex", b"dex\n035\x00" + b"synthetic")

    def assert_rejected(self):
        with self.assertRaises((ValueError, OSError, ET.ParseError, zipfile.BadZipFile)) as caught:
            validate(self.project, self.tests, self.apk)
        self.assertNotEqual(str(caught.exception), "")

    def test_valid_synthetic_evidence(self):
        validate(self.project, self.tests, self.apk)

    def test_missing_report_fails(self):
        self.xml.unlink()
        self.assert_rejected()

    def test_zero_tests_fails(self):
        self.xml.write_text(PASS.replace('total="3" passed="3"', 'total="0" passed="0"'))
        self.assert_rejected()

    def test_failed_and_partial_tests_fail(self):
        for xml in [FAIL, PASS.replace('passed="3"', 'passed="2"'),
                    PASS.replace('result="Passed"', 'result="Skipped"'),
                    PASS.replace('skipped="0"', 'skipped="1"')]:
            with self.subTest(xml=xml):
                self.xml.write_text(xml)
                self.assert_rejected()

    def test_inconclusive_fails(self):
        self.xml.write_text(PASS.replace('inconclusive="0"', 'inconclusive="1"'))
        self.assert_rejected()

    def test_invalid_xml_fails(self):
        self.xml.write_text("<test-run")
        self.assert_rejected()

    def test_wrong_root_or_missing_nunit_counters_fail(self):
        for xml in ['<testsuite tests="3"/>',
                    PASS.replace(' failed="0"', ''),
                    PASS.replace(' passed="3"', '')]:
            with self.subTest(xml=xml):
                self.xml.write_text(xml)
                self.assert_rejected()

    def test_duplicate_nunit_results_fail(self):
        (self.tests / "duplicate.xml").write_text(PASS)
        self.assert_rejected()

    def test_wrong_unity_version_fails(self):
        (self.project / "ProjectSettings" / "ProjectVersion.txt").write_text(
            "m_EditorVersion: 2022.3.10f1\n")
        self.assert_rejected()

    def test_missing_or_fake_apk_fails(self):
        self.apk.unlink()
        self.assert_rejected()
        self.apk.write_text("not an APK")
        self.assert_rejected()

    def test_uncompiled_manifest_fails(self):
        with zipfile.ZipFile(self.apk, "w") as archive:
            archive.writestr("AndroidManifest.xml", "not-binary-xml")
            archive.writestr("classes.dex", b"dex\n035\x00")
        self.assert_rejected()

    def test_missing_or_invalid_dex_fails(self):
        for include_dex, contents in [(False, b""), (True, b"not-dex")]:
            with self.subTest(include_dex=include_dex):
                with zipfile.ZipFile(self.apk, "w") as archive:
                    archive.writestr("AndroidManifest.xml", b"\x03\x00\x08\x00")
                    if include_dex:
                        archive.writestr("classes.dex", contents)
                self.assert_rejected()

    def test_apk_without_android_manifest_fails(self):
        with zipfile.ZipFile(self.apk, "w") as archive:
            archive.writestr("other.txt", "not a manifest")
        self.assert_rejected()


if __name__ == "__main__":
    unittest.main()
