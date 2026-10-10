#!/usr/bin/env python3
"""GitHub-native control Issue synchronization (no external agent runtime)."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / ".chatfreept" / "project.json"
MARKER_START = "<!-- chatfreept-control:start -->"
MARKER_END = "<!-- chatfreept-control:end -->"


def gh(*args: str) -> Any:
    result = subprocess.run(["gh", *args], cwd=ROOT, capture_output=True,
                            text=True, encoding="utf-8", errors="replace")
    if result.returncode:
        print(result.stderr.strip(), file=sys.stderr)
        raise SystemExit(result.returncode)
    return result.stdout.strip()


def gh_json(*args: str) -> Any:
    return json.loads(gh(*args))


def current_issue(title: str) -> int:
    issues = gh_json("issue", "list", "--state", "all", "--limit", "200",
                     "--json", "number,title,state")
    selected = [i for i in issues if i.get("title") == title and i.get("state") == "OPEN"]
    if len(selected) != 1:
        raise SystemExit(f"Expected exactly one open control Issue, found {len(selected)}")
    return int(selected[0]["number"])


def checks_summary(pr: dict[str, Any]) -> str:
    checks = pr.get("statusCheckRollup") or []
    required = ["PR metadata", "Fast deterministic gates", "PR test/build gates",
                "Dependency audit", "Workflow policy"]
    status = {}
    for item in checks:
        name = item.get("name") or item.get("context")
        if name in required:
            status[name] = (item.get("conclusion") or item.get("state") or "").upper()
    if not status:
        return "unverified"
    if any(value in {"FAILURE", "ERROR", "CANCELLED", "TIMED_OUT"} for value in status.values()):
        return "failing"
    if len(status) != len(required) or any(value not in {"SUCCESS"} for value in status.values()):
        return "pending"
    return "passing"


def issue_table(issues: list[dict[str, Any]], prs: list[dict[str, Any]]) -> str:
    rows = []
    for issue in issues:
        labels = {label["name"] for label in issue.get("labels") or []}
        if not labels.intersection({"state:active", "state:blocked", "state:review"}):
            continue
        if issue["title"] == "[CONTROL] Current repository state":
            continue
        number = int(issue["number"])
        linked = [p for p in prs if p.get("headRefName", "").startswith(f"work/{number}-")]
        pr = linked[0] if linked else None
        branch = pr["headRefName"] if pr else f"work/{number}-…"
        state = next((v.split(":", 1)[1] for v in sorted(labels) if v.startswith("state:")), "active")
        risks = ", ".join(sorted(x.split(":", 1)[1] for x in labels if x.startswith("risk:"))) or "—"
        detail = f"[#{pr['number']}]({pr['url']}) / {checks_summary(pr)}" if pr else "—"
        rows.append(f"| [#{number}]({issue['url']}) {issue['title']} | `{branch}` | {state} | {risks} | {detail} |")
    return "\n".join(rows) if rows else "| — | — | no active task Issues | — | — |"


def control_header(config: dict[str, Any]) -> str:
    branches = config["branches"]
    refs = gh_json("api", "repos/{owner}/{repo}/branches",
                   "--jq", '[.[] | {name: .name, sha: .commit.sha}]')
    heads = {v["name"]: v["sha"][:12] for v in refs}
    issues = gh_json("issue", "list", "--state", "open", "--limit", "200",
                     "--json", "number,title,url,labels")
    prs = gh_json("pr", "list", "--state", "open", "--limit", "100",
                  "--json", "number,url,headRefName,baseRefName,statusCheckRollup")
    release = [x for x in issues if any(y["name"] == "type:release" for y in x.get("labels") or [])]
    release.sort(key=lambda x: x["number"])
    current = f"[#{release[-1]['number']}]({release[-1]['url']})" if release else "none"
    lines = [
        MARKER_START,
        "## Branch state",
        "",
        f"- Production: `{branches['production']}@{heads.get(branches['production'], 'unknown')}`",
        f"- Integration: `{branches['integration']}@{heads.get(branches['integration'], 'unknown')}`",
        f"- Current release Issue: {current}",
        "",
        "## Active work",
        "",
        "| Issue | Branch | State | Risk | PR / CI |",
        "|---|---|---|---|---|",
        issue_table(issues, prs),
        "",
        "_Last synchronized by the GitHub-native Chat FreePT control script._",
        MARKER_END,
    ]
    return "\n".join(lines)


def synchronize(config: dict[str, Any]) -> None:
    number = current_issue(config["github"]["control_issue_title"])
    current = gh_json("issue", "view", str(number), "--json", "body")["body"]
    match = re.match(r"(?s)\A<!-- (?:chatfreept|claude)-control:start -->.*?<!-- (?:chatfreept|claude)-control:end -->", current)
    tail = current[match.end():] if match else ("\n\n" + current if current else "")
    new_body = control_header(config) + tail
    if current == new_body:
        print("Control Issue already synchronized.")
        return
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", suffix=".md",
                                     delete=False) as stream:
        stream.write(new_body)
        path = Path(stream.name)
    try:
        gh("issue", "edit", str(number), "--body-file", str(path))
    finally:
        path.unlink(missing_ok=True)
    print(f"Updated control Issue #{number}.")


def doctor(config: dict[str, Any]) -> None:
    expected = config["github"]
    remote = gh("repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner")
    target = expected["expected_owner"] + "/" + expected["expected_repository"]
    if remote != target:
        raise SystemExit(f"Wrong GitHub repository: {remote!r}; expected {target!r}")
    current_issue(expected["control_issue_title"])
    print(f"Repository {remote} and control Issue available; GitHub-native CI configured.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("sync-control", "doctor"))
    args = parser.parse_args()
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    if args.command == "doctor":
        doctor(config)
    else:
        synchronize(config)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
