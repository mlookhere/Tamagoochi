# Security dependency overrides

These overrides exist only because the upstream dependency tree used by Expo SDK 57 temporarily contains high-severity advisories that cannot all be resolved by ordinary semver updates.

- `image-size@2.0.4`: official upstream patched release for the ICNS/JXL/HEIF infinite-loop advisories.
- `braces`: replaced with `@dieub/braces-depth-guard@3.0.3-pn.0`, a narrow backport of the depth-guard changes from micromatch/braces PR #72 at commit `28d440b5dd449dbf1fe6f3506cf94ecca4d02660`.
- `node-forge`: pinned to Krysthyan/forge commit `ceba34402e329f0365134f23fe19898756527d65`, the single-commit fix proposed in digitalbazaar/forge PR #1152 for CVE-2026-85393. That fork reports version `1.4.1-0`.

The repository's `npm audit --audit-level=high` gate remains unchanged. `scripts/vendor-security.test.mjs` exercises the two unpublished security fixes behaviorally. Remove each override once its maintained upstream publishes a fixed release that passes the same gates.
