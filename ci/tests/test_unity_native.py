"""Synthetic evidence tests. Passing these never means Unity itself ran."""
import tempfile
import unittest
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

from ci.verify_unity_native import MINIMUM_EDITMODE_CASES, REQUIRED_TESTS, SUITE_FILES, validate

METHODS = sorted(REQUIRED_TESTS) + [f"ExtraMethod{i}" for i in range(56)]
ART = [
    "companions/seedling-neutral", "companions/seedling-joyful",
    "companions/seedling-sad", "companions/seedling-asleep",
    "companions/seedling-surprised", "companions/action-seedling-eat",
    "companions/action-seedling-clean", "companions/action-seedling-play",
    "world/grove", "world/meadow", "world/pond",
]
def _art_size(asset: str) -> int:
    return 128 if asset.startswith("world/") else 256


def _method_case(index: int, name: str) -> str:
    suite = "Tamagoochi.Tests." + SUITE_FILES[min(index // 10, len(SUITE_FILES) - 1)]
    return (f'<test-case name="{name}" classname="{suite}" '
            f'methodname="{name}" fullname="{suite}.{name}" result="Passed"/>')


def _art_case(asset: str) -> str:
    case = f'OriginalSpritesImportCorrectly("{asset}",{_art_size(asset)})'
    fixture = "Tamagoochi.Tests.ArtImportTests"
    return (f"<test-case name='{case}' "
            f'classname="{fixture}" methodname="OriginalSpritesImportCorrectly" '
            f"fullname='{fixture}.{case}' result=\"Passed\"/>")


PASS = (f'<test-run result="Passed" total="{MINIMUM_EDITMODE_CASES}" '
        f'passed="{MINIMUM_EDITMODE_CASES}" failed="0" skipped="0" inconclusive="0">'
        '<test-suite type="Assembly">'
        + ''.join(_method_case(i, name) for i, name in enumerate(METHODS))
        + ''.join(_art_case(asset) for asset in ART)
        + '</test-suite></test-run>')

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
        folder = self.project / "Assets" / "Tests" / "EditMode"
        folder.mkdir(parents=True)
        for i, suite in enumerate(SUITE_FILES):
            names = METHODS[i * 10:(i + 1) * 10] if i < 5 else METHODS[50:]
            source = ''.join(f"[Test]\npublic void {name}() {{}}\n" for name in names)
            if suite == "ArtImportTests":
                source += ''.join(f'[TestCase("{asset}",{_art_size(asset)})]\n' for asset in ART)
                source += "public void OriginalSpritesImportCorrectly(string path,int size) {}\n"
            (folder / f"{suite}.cs").write_text(source)
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
        self.xml.write_text(PASS.replace('total="73" passed="73"', 'total="0" passed="0"'))
        self.assert_rejected()

    def test_root_only_passing_counters_fail(self):
        self.xml.write_text(PASS.split('<test-suite')[0] + '</test-run>')
        self.assert_rejected()

    def test_missing_or_failed_case_fails(self):
        required = sorted(REQUIRED_TESTS)[0]
        case = _method_case(METHODS.index(required), required)
        self.assertIn(case, PASS)
        for label, xml in [
            ("missing", PASS.replace(case, "")),
            ("failed", PASS.replace(case, case.replace('result="Passed"', 'result="Failed"'))),
        ]:
            with self.subTest(case=label):
                self.xml.write_text(xml)
                self.assert_rejected()

    def test_only_six_sentinels_cannot_pass_minimum_coverage(self):
        cases = ''.join(f'<test-case name="{name}" result="Passed"/>'
                        for name in sorted(REQUIRED_TESTS))
        self.xml.write_text('<test-run result="Passed" total="6" passed="6" '
                            'failed="0" skipped="0" inconclusive="0">'
                            f'{cases}</test-run>')
        self.assert_rejected()

    def test_non_sentinel_authored_test_cannot_be_substituted(self):
        self.xml.write_text(PASS.replace('name="ExtraMethod0"', 'name="not-authored"'))
        self.assert_rejected()

    def test_test_method_from_wrong_fixture_fails(self):
        self.xml.write_text(PASS.replace(
            'classname="Tamagoochi.Tests.ArtImportTests"',
            'classname="Tamagoochi.Tests.OtherTests"', 1))
        self.assert_rejected()

    def test_forged_test_fullname_fails(self):
        self.xml.write_text(PASS.replace(
            'fullname="Tamagoochi.Tests.ArtImportTests.',
            'fullname="Tamagoochi.Tests.OtherTests.', 1))
        self.assert_rejected()

    def test_art_case_with_wrong_authored_size_fails(self):
        self.assertIn('OriginalSpritesImportCorrectly("world/grove",128)', PASS)
        self.xml.write_text(PASS.replace(
            'OriginalSpritesImportCorrectly("world/grove",128)',
            'OriginalSpritesImportCorrectly("world/grove",256)'))
        self.assert_rejected()

    def test_sprite_case_from_wrong_fixture_fails(self):
        self.xml.write_text(PASS.replace(
            'classname="Tamagoochi.Tests.ArtImportTests" '
            'methodname="OriginalSpritesImportCorrectly"',
            'classname="Tamagoochi.Tests.OtherTests" '
            'methodname="OriginalSpritesImportCorrectly"', 1))
        self.assert_rejected()

    def test_duplicate_authored_method_between_fixtures_fails(self):
        second = self.project / "Assets" / "Tests" / "EditMode" / "ExpeditionTests.cs"
        source = second.read_text()
        prior = f"public void {METHODS[10]}()"
        self.assertIn(prior, source)
        second.write_text(source.replace(prior, f"public void {METHODS[0]}()"))
        self.assert_rejected()

    def test_unrecognized_inline_nunit_method_fails(self):
        path = self.project / "Assets" / "Tests" / "EditMode" / "ExpeditionTests.cs"
        path.write_text(path.read_text() + "\n[Test] public void AddedTest() {}\n")
        self.assert_rejected()

    def test_unrecognized_parameterized_nunit_case_fails(self):
        path = self.project / "Assets" / "Tests" / "EditMode" / "ArtImportTests.cs"
        path.write_text(path.read_text() + "\n[TestCase(true)]\n")
        self.assert_rejected()

    def test_untracked_editmode_suite_fails(self):
        path = self.project / "Assets" / "Tests" / "EditMode" / "AdditionalTests.cs"
        path.write_text("[Test]\npublic void AdditionalTest() {}\n")
        self.assert_rejected()

    def test_non_test_helper_source_is_allowed(self):
        path = self.project / "Assets" / "Tests" / "EditMode" / "FixtureHelper.cs"
        path.write_text("public static class FixtureHelper {}\n")
        validate(self.project, self.tests, self.apk)

    def test_missing_unity_source_suite_fails(self):
        (self.project / "Assets" / "Tests" / "EditMode" / "GameStoreTests.cs").unlink()
        self.assert_rejected()

    def test_original_sprite_parameter_case_must_be_reported(self):
        self.xml.write_text(PASS.replace('companions/seedling-neutral',
                                         'companions/not-authored'))
        self.assert_rejected()

    def test_filtered_suite_is_rejected_even_if_root_counts_pass(self):
        excluded = sorted(REQUIRED_TESTS)[0]
        original = _method_case(METHODS.index(excluded), excluded)
        self.assertIn(original, PASS)
        self.xml.write_text(PASS.replace(original, original.replace(
            f'name="{excluded}"', 'name="unrelated"', 1)))
        self.assert_rejected()

    def test_failed_and_partial_tests_fail(self):
        for xml in [FAIL, PASS.replace('passed="73"', 'passed="72"'),
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
                    PASS.replace(' passed="73"', '')]:
            with self.subTest(xml=xml):
                self.xml.write_text(xml)
                self.assert_rejected()

    def test_duplicate_nunit_results_fail(self):
        (self.tests / "duplicate.xml").write_text(PASS)
        self.assert_rejected()

    def test_extra_invalid_nunit_results_fail(self):
        for xml in ['<testsuite tests="0"/>', FAIL]:
            with self.subTest(report=xml.split(">")[0]):
                (self.tests / "extra.xml").write_text(xml)
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
