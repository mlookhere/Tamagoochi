#!/usr/bin/env python3
"""Reject changes to reviewed Unity executable sources after licensed Editor execution."""
import argparse
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

SHA = re.compile(r"[0-9a-f]{40}")
CODE_EXTENSIONS = {".cs", ".asmdef", ".asmref", ".rsp", ".dll", ".shader", ".compute", ".hlsl", ".cginc"}
REVIEWED_FILES = {"unity/Packages/manifest.json", "unity/ProjectSettings/ProjectVersion.txt"}


def _git(root: Path, *args: str) -> bytes:
    result = subprocess.run(["git", "-C", str(root), *args], capture_output=True, check=True)
    return result.stdout


def _source_path(name: str) -> bool:
    if name in REVIEWED_FILES:
        return True
    path = PurePosixPath(name)
    return name.startswith("unity/Assets/") and path.suffix.lower() in CODE_EXTENSIONS


def verify(repository: Path, control: Path, migration_sha: str, workflow_sha: str) -> None:
    if not SHA.fullmatch(migration_sha) or not SHA.fullmatch(workflow_sha):
        raise ValueError("Expected full reviewed 40-character migration and workflow SHAs")
    if _git(repository, "rev-parse", "HEAD").decode().strip() != migration_sha:
        raise ValueError("Unity migration checkout does not match the reviewed SHA")
    if _git(control, "rev-parse", "HEAD").decode().strip() != workflow_sha:
        raise ValueError("Trusted evidence verifier checkout does not match the workflow SHA")
    if _git(control, "status", "--porcelain=v1", "--ignored=matching", "--untracked-files=all").strip():
        raise ValueError("Trusted verifier checkout is modified, ignored or contains injected files")
    scope = ("unity/Assets", "unity/Packages/manifest.json", "unity/ProjectSettings/ProjectVersion.txt")
    modified = _git(repository, "diff", "--name-only", "-z", "HEAD", "--", *scope)
    untracked = _git(repository, "ls-files", "--others", "--exclude-standard", "-z", "--", *scope)
    changes = [p.decode("utf-8", "surrogateescape") for p in (modified + untracked).split(b"\0") if p]
    changed_sources = sorted({name for name in changes if _source_path(name)})
    if changed_sources:
        raise ValueError("Reviewed Unity executable sources changed: " + ", ".join(changed_sources))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", type=Path, required=True)
    parser.add_argument("--control", type=Path, required=True)
    parser.add_argument("--migration-sha", required=True)
    parser.add_argument("--workflow-sha", required=True)
    args = parser.parse_args()
    try:
        verify(args.repository, args.control, args.migration_sha, args.workflow_sha)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(f"UNITY REVIEWED SOURCE INTEGRITY FAILED: {error}", file=sys.stderr)
        return 1
    print("Reviewed Unity executable sources and trusted verifier remain unchanged")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
