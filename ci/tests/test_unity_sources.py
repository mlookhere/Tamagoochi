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
        for file, value in [
            (self.script, "class Pet {}"),
            (self.manifest, '{"dependencies": {}}'),
            (self.version, "m_EditorVersion: 6000.0.62f1"),
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

    def test_changed_package_manifest_fails(self):
        self.manifest.write_text('{"dependencies":{"unreviewed":"latest"}}')
        with self.assertRaisesRegex(ValueError, "manifest.json"):
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

    def test_wrong_migration_head_fails(self):
        with self.assertRaisesRegex(ValueError, "migration checkout"):
            verify(self.migration, self.control, "a" * 40, self.workflow_sha)

    def test_wrong_trusted_workflow_head_fails(self):
        with self.assertRaisesRegex(ValueError, "verifier checkout"):
            verify(self.migration, self.control, self.migration_sha, "b" * 40)


if __name__ == "__main__":
    unittest.main()
