#!/usr/bin/env python3
"""Deterministic, agent-independent CI control-plane self-tests."""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import py_compile
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / ".chatfreept" / "project.json"
REQUIRED_JOBS = (
    "PR metadata",
    "Fast deterministic gates",
    "PR test/build gates",
    "Dependency audit",
    "Workflow policy",
)
GATES = {
    "fast": ("workflow_self_test", "quality", "format_check", "lint", "typecheck"),
    "pr": ("unit", "coverage", "build"),
    "audit": ("security",),
    "release": ("security", "unit", "coverage", "build"),
}
EXECUTABLES = (
    "flow", "ci/run", "scripts/bootstrap", "scripts/setup-github",
    "scripts/validate-workflow",
)
DISALLOWED = (".claude", ".claude-workflow.json", ".github/claude",
              ".github/workflows/claude-review.yml")


def fail(message: str, failures: list[str]) -> None:
    failures.append(message)


def tracked() -> list[str]:
    result = subprocess.run(["git", "ls-files"], cwd=ROOT, check=True,
                            capture_output=True, text=True, encoding="utf-8")
    return result.stdout.splitlines()


def verify_repository(config: dict[str, Any], failures: list[str]) -> None:
    expected = config.get("github", {})
    if expected.get("expected_owner") != "mlookhere":
        fail("Repository owner must remain mlookhere.", failures)
    if expected.get("expected_repository") != "Tamagoochi":
        fail("Repository name must remain Tamagoochi.", failures)
    branches = config.get("branches", {})
    if branches.get("integration") != "dev" or branches.get("production") != "main":
        fail("Integration must be dev and production must be main.", failures)
    needed = expected.get("branch_protection", {}).get("integration", {}).get("required_checks", [])
    if tuple(needed) != REQUIRED_JOBS:
        fail("The five original mandatory PR checks must be preserved.", failures)
    required = expected.get("risk_paths", {})
    for name in ("risk:ci", "risk:deployment", "risk:security", "risk:dependencies"):
        if not required.get(name):
            fail(f"Missing required risk path category: {name}", failures)


def verify_stages(config: dict[str, Any], failures: list[str]) -> None:
    stages = config.get("stages", {})
    commands = config.get("commands", {})
    for name, required in GATES.items():
        selected = stages.get(name, [])
        for group in required:
            if group not in selected:
                fail(f"Mandatory {name} stage missing {group}", failures)
            if group != "quality" and not commands.get(group):
                fail(f"Mandatory command group {group} is empty", failures)
    for name, groups in stages.items():
        if not isinstance(groups, list):
            fail(f"Stage {name} must list commands", failures)
            continue
        for group in groups:
            if group != "quality" and not commands.get(group):
                fail(f"Stage {name} refers to absent command group {group}", failures)


def verify_quality(config: dict[str, Any], failures: list[str]) -> None:
    quality = config.get("quality", {})
    # Keep the original security, size and complexity limits or make them stricter.
    limits = {"max_changed_file_lines": 1500, "max_function_lines": 120,
              "max_cyclomatic_complexity": 15, "max_pr_files": 80,
              "max_pr_changed_lines": 4000}
    for key, cap in limits.items():
        value = quality.get(key)
        if not isinstance(value, int) or value > cap or value <= 0:
            fail(f"Quality budget {key} must not exceed {cap}", failures)
    if not quality.get("require_issue_for_todo"):
        fail("Issue references for TODOs must remain mandatory", failures)


def verify_sources(failures: list[str]) -> None:
    files = tracked()
    for name in DISALLOWED:
        for path in files:
            if path == name or path.startswith(name.rstrip("/") + "/"):
                fail(f"Unwanted agent-specific tracked file: {path}", failures)
    for relative in files:
        if not relative.endswith(".py"):
            continue
        path = ROOT / relative
        if not path.is_file():
            continue
        try:
            py_compile.compile(str(path), doraise=True)
        except (py_compile.PyCompileError, UnicodeError) as exc:
            fail(f"Invalid Python file {relative}: {exc}", failures)
    for relative in EXECUTABLES:
        path = ROOT / relative
        if not path.is_file() or (os.name != "nt" and not os.access(path, os.X_OK)):
            fail(f"Required executable is missing or not executable: {relative}", failures)
    for relative in ("scripts/claude-lease", "scripts/claude-exec",
                     "workflow/claude_flow.py", "workflow/claude_lease.py",
                     "workflow/claude_usage_report.py"):
        if (ROOT / relative).exists():
            fail(f"Agent-specific runtime still present: {relative}", failures)


def verify_workflows(failures: list[str]) -> None:
    workflows = ROOT / ".github" / "workflows"
    jobs = {
        "ci-pr.yml": ("PR metadata", "Fast deterministic gates",
                      "PR test/build gates", "Dependency audit"),
        "security.yml": ("Workflow policy",),
        "ci-release.yml": ("Release metadata", "Full regression and production build"),
    }
    for name, required in jobs.items():
        file = workflows / name
        if not file.is_file():
            fail(f"Required workflow missing: {name}", failures)
            continue
        text = file.read_text(encoding="utf-8")
        for title in required:
            if not re.search(r"(?m)^\s+name:\s*" + re.escape(title) + r"\s*$", text):
                fail(f"Workflow {name} missing named check: {title}", failures)
    for relative in ("ci/run.py", "ci/quality.py", "workflow/validate_pr.py",
                     "workflow/handle_pr_state.py", "workflow/check_workflow_policy.py"):
        content = (ROOT / relative).read_text(encoding="utf-8")
        if ".chatfreept/project.json" not in content and (
            '".chatfreept" / "project.json"' not in content
        ):
            fail(f"Generic policy/config reader not migrated: {relative}", failures)
    for path in workflows.glob("*.yml"):
        text = path.read_text(encoding="utf-8").lower()
        if "anthropics/" in text or "anthropic_api_key" in text:
            fail(f"External model-provider action or secret required: {path.name}", failures)


def verify_policy(failures: list[str]) -> None:
    checker = ROOT / "workflow" / "check_workflow_policy.py"
    result = subprocess.run([sys.executable, str(checker)], cwd=ROOT,
                            capture_output=True, text=True, encoding="utf-8")
    if result.returncode:
        details = (result.stdout + result.stderr).strip().splitlines()
        fail("Workflow policy did not complete successfully: " +
             (details[-1] if details else "empty output"), failures)
    checker_script = ROOT / "workflow" / "pin_actions.py"
    pins = subprocess.run([sys.executable, str(checker_script), "--check"],
                          cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    if pins.returncode:
        fail("Pinned GitHub Actions audit failed: " + pins.stderr.strip()[-500:], failures)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ci", action="store_true")
    parser.parse_args()
    failures: list[str] = []
    try:
        config = json.loads(CONFIG.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"Self-test cannot read Chat FreePT config: {exc}", file=sys.stderr)
        return 1
    verify_repository(config, failures)
    verify_stages(config, failures)
    verify_quality(config, failures)
    verify_sources(failures)
    verify_workflows(failures)
    verify_policy(failures)
    for item in failures:
        print(f"failure: {item}", file=sys.stderr)
    if failures:
        print(f"Chat FreePT CI self-test: {len(failures)} failure(s)", file=sys.stderr)
        return 1
    print("Chat FreePT CI self-test passed (config, scripts, stages, security and pinned Actions).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
