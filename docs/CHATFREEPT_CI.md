# Chat FreePT CI — Tamagoochi

This public repository uses **ChatGPT with the GitHub MCP connection** as its only autonomous release engineer. No third-party agent, API key, CLI, hook, or authentication is needed to develop or run its CI. The previous CI template is a source of runtime-neutral patterns, not a service to execute.

## Source of truth

- `main` is production, `dev` is integration.
- `.chatfreept/project.json` records the locked repository, work-branch prefix, risk paths, required checks, stage commands, and unchanged quality budgets.
- Issues carry `type:*`, `state:*` and appropriate `risk:*` labels. Each feature/maintenance change uses one Issue, `work/<issue>-slug` branch and PR into `dev`.
- `[CONTROL] Current repository state` is the durable coordination record.
- Never mutate `main` or `dev` by direct push after initial seeding.

## Verification

`./scripts/bootstrap --ci` provisions the existing pinned Python gate tools and runs `npm ci`. `./ci/run fast` enforces workflow policy, source quality, formatting, lint and TypeScript. `./ci/run pr` runs unit tests, coverage and the Expo web build. `./ci/run audit` performs the dependency audit. Release/nightly stages remain explicit.

GitHub Actions must report completed-success for **PR metadata**, **Fast deterministic gates**, **PR test/build gates**, **Dependency audit**, **Workflow policy** on the **same final head commit**. Zero, missing, pending, skipped-only, canceled or failed results are not green. PR descriptions require substantive Result, Implementation, Verification, Risk, Remaining work and an Issue reference.

## Security

Only GitHub-hosted Actions and source-controlled scripts are CI executors. Keep action SHAs pinned, prevent unsafe `pull_request_target` checkout, avoid writing raw untrusted model output into privileged workflows, preserve secret scanning, dependency auditing and risk labels. Do not commit credentials or any model-provider API keys. Use GitHub tools in ChatGPT for Issues, branches, PRs and Actions. Humans handle only genuine approvals or external device tests.

## Migration

Maintenance Issue #21 migrates the existing pre-Chat-FreePT control plane. Until its full PR passes all required checks and merges into `dev`, earlier CI assets remain historical integration state. The independent visual-system PR #20 stays open and may need an integration refresh when this work merges.
