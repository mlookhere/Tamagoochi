"""Synthetic Git checkout integrity tests; no Unity Editor execution occurs."""
import subprocess
import tempfile
import unittest
from pathlib import Path

from ci.verify_unity_sources import verify


def _git(root: Path, *args: str) -> str:
    result = subprocess.run(["git", "-C", str(root), *args], text=True,
                            capture_output=True, check=True)
    return result.stdout.strip()


def _commit(root: Path) -> str:
    _git(root, "add", ".")
    _git(root, "-c", "user.name=CI", "-c", "user.email=ci@example.invalid",
         "commit", "-qm", "Synthetic verified baseline")
    return _git(root, "rev-parse", "HEAD")


class UnitySourceIntegrityTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        root = Path(directory.name)
        self.migration = root / "migration"
        self.control = root / "control"
        for project in (self.migration, self.control):
            project.mkdir()
            _git(project, "init", "-q")
        self.script = self.migration / "unity/Assets/Scripts/Pet.cs"
        self.manifest = self.migration / "unity/Packages/manifest.json"
        self.version = self.migration / "unity/ProjectSettings/ProjectVersion.txt"
        self.project_setting = self.migration / "unity/ProjectSettings/TagManager.asset"
        self.package_lock = self.migration / "unity/Packages/packages-lock.json"
        self.sprite = self.migration / "unity/Assets/Resources/Art/world/grove.png"
        self.sprite_meta = self.sprite.with_suffix(".png.meta")
        for file, value in [
            (self.script, "class Pet {}"),
            (self.manifest, '{"dependencies": {}}'),
            (self.version, "m_EditorVersion: 6000.0.62f1"),
            (self.project_setting, "reviewed project settings"),
            (self.package_lock, '{"dependencies": {}}'),
            (self.sprite, "original sprite bytes"),
            (self.sprite_meta, "reviewed sprite importer settings"),
        ]:
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text(value)
        trusted = self.control / "ci/verify_unity_sources.py"
        trusted.parent.mkdir(parents=True)
        trusted.write_text("TRUSTED = True\n")
        self.migration_sha = _commit(self.migration)
        self.workflow_sha = _commit(self.control)

    def verify(self):
        verify(self.migration, self.control, self.migration_sha, self.workflow_sha)

    def test_reviewed_source_checkout_passes(self):
        self.verify()

    def test_generated_scene_does_not_fail(self):
        generated = self.migration / "unity/Assets/Scenes/Home.unity"
        generated.parent.mkdir(parents=True)
        generated.write_text("legitimate generated Home scene")
        self.verify()

    def test_modified_csharp_source_fails(self):
        self.script.write_text("class Pet { public bool Rewritten = true; }")
        with self.assertRaisesRegex(ValueError, "Pet.cs"):
            self.verify()

    def test_deleted_reviewed_source_fails(self):
        self.script.unlink()
        with self.assertRaisesRegex(ValueError, "Pet.cs"):
            self.verify()

    def test_untracked_editor_script_fails(self):
        created = self.migration / "unity/Assets/Editor/Injected.cs"
        created.parent.mkdir(parents=True)
        created.write_text("class Injected {}")
        with self.assertRaisesRegex(ValueError, "Injected.cs"):
            self.verify()

    def test_modified_reviewed_original_sprite_fails(self):
        self.sprite.write_text("replaced sprite bytes")
        with self.assertRaisesRegex(ValueError, "grove.png"):
            self.verify()

    def test_modified_reviewed_import_metadata_fails(self):
        self.sprite_meta.write_text("changed sprite importer")
        with self.assertRaisesRegex(ValueError, r"grove\.png\.meta"):
            self.verify()

    def test_untracked_original_art_png_fails(self):
        extra = self.sprite.parent / "injected.png"
        extra.write_bytes(b"unreviewed sprite")
        with self.assertRaisesRegex(ValueError, "injected.png"):
            self.verify()

    def test_untracked_executable_metadata_fails(self):
        extra = self.migration / "unity/Assets/Editor/Unreviewed.cs.meta"
        extra.parent.mkdir(parents=True, exist_ok=True)
        extra.write_text("unreviewed importer metadata")
        with self.assertRaisesRegex(ValueError, r"Unreviewed\.cs\.meta"):
            self.verify()

    def test_generated_scene_and_metadata_do_not_fail(self):
        scene = self.migration / "unity/Assets/Scenes/Home.unity"
        scene.parent.mkdir(parents=True)
        scene.write_text("generated Home scene")
        scene.with_suffix(".unity.meta").write_text("generated scene importer")
        self.verify()

    def test_ignored_untracked_csharp_still_fails(self):
        hidden = self.migration / "unity/Assets/Editor/Hidden.cs"
        hidden.parent.mkdir(parents=True, exist_ok=True)
        hidden.write_text("class Hidden {}")
        exclude = self.migration / ".git/info/exclude"
        exclude.write_text(exclude.read_text() + "\nunity/Assets/Editor/Hidden.cs\n")
        self.assertEqual(_git(self.migration, "status", "--short", "--", str(hidden)), "")
        with self.assertRaisesRegex(ValueError, "Hidden.cs"):
            self.verify()

    def test_untracked_native_plugin_fails(self):
        for filename in ["libunityhack.so", "unreviewed.aar", "plugin.jar"]:
            with self.subTest(filename=filename):
                plugin = self.migration / "unity/Assets/Plugins" / filename
                plugin.parent.mkdir(parents=True, exist_ok=True)
                plugin.write_bytes(b"synthetic plugin")
                with self.assertRaisesRegex(ValueError, filename.replace(".", r"\.")):
                    self.verify()
                plugin.unlink()

    def test_changed_package_manifest_fails(self):
        self.manifest.write_text('{"dependencies":{"unreviewed":"latest"}}')
        with self.assertRaisesRegex(ValueError, "manifest.json"):
            self.verify()

    def test_modified_reviewed_project_settings_fails(self):
        self.project_setting.write_text("new scripting defines")
        with self.assertRaisesRegex(ValueError, "TagManager.asset"):
            self.verify()

    def test_modified_tracked_packages_lock_fails(self):
        self.package_lock.write_text('{"dependencies":{"replacement":"1.0"}}')
        with self.assertRaisesRegex(ValueError, "packages-lock.json"):
            self.verify()

    def test_untracked_embedded_package_code_fails(self):
        injected = self.migration / "unity/Packages/Embedded/Injected.cs"
        injected.parent.mkdir(parents=True)
        injected.write_text("class Injected {}")
        with self.assertRaisesRegex(ValueError, "Injected.cs"):
            self.verify()

    def test_untracked_dependency_metadata_fails(self):
        injected = self.migration / "unity/Packages/Unreviewed/package.json"
        injected.parent.mkdir(parents=True)
        injected.write_text('{"name":"unreviewed"}')
        with self.assertRaisesRegex(ValueError, "package.json"):
            self.verify()

    def test_generated_untracked_packages_lock_is_allowed(self):
        _git(self.migration, "rm", "-q", "unity/Packages/packages-lock.json")
        self.migration_sha = _commit(self.migration)
        self.package_lock.write_text('{"dependencies": {}}')
        self.verify()

    def test_changed_editor_version_fails(self):
        self.version.write_text("m_EditorVersion: 2022.3.0f1")
        with self.assertRaisesRegex(ValueError, "ProjectVersion.txt"):
            self.verify()

    def test_modified_trusted_verifier_fails(self):
        (self.control / "ci/verify_unity_sources.py").write_text("TRUSTED = False\n")
        with self.assertRaisesRegex(ValueError, "Trusted verifier checkout"):
            self.verify()

    def test_added_trusted_module_fails(self):
        (self.control / "ci/re.py").write_text("malicious import shadowing")
        with self.assertRaisesRegex(ValueError, "Trusted verifier checkout"):
            self.verify()

    def test_native_workflows_enforce_source_gate_before_accepting_evidence(self):
        workflows = Path(__file__).resolve().parents[2] / ".github/workflows"
        for name, before, after in [
            ("unity-native.yml", "      - name: Run actual Unity EditMode tests",
             "      - name: Reject missing/failed NUnit reports or Android APK"),
            ("unity-ios-native.yml", "      - name: Generate Xcode project using pinned Unity",
             "      - name: Compile iOS device player with Xcode (unsigned)"),
        ]:
            with self.subTest(workflow=name):
                contents = (workflows / name).read_text()
                before_idx = contents.index(before)
                gate_idx = contents.index("      - name: Reject modified or injected Unity executable source")
                after_idx = contents.index(after)
                self.assertLess(before_idx, gate_idx)
                self.assertLess(gate_idx, after_idx)
                self.assertIn("python3 -I -B .unity-ci-control/ci/verify_unity_sources.py", contents)
                self.assertIn("git -C .unity-ci-control", contents)

    def test_wrong_migration_head_fails(self):
        with self.assertRaisesRegex(ValueError, "migration checkout"):
            verify(self.migration, self.control, "a" * 40, self.workflow_sha)

    def test_wrong_trusted_workflow_head_fails(self):
        with self.assertRaisesRegex(ValueError, "verifier checkout"):
            verify(self.migration, self.control, self.migration_sha, "b" * 40)


if __name__ == "__main__":
    unittest.main()
