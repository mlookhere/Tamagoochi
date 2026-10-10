# Tamagoochi visual quality and regression protocol

## Current automated coverage

- Companion original-art format checks: 256×256 transparent RGBA PNGs, visible central silhouette, clear corners, distinct sprite variants.
- UI semantics: typed tab/destination icons; scene and status illustration names and accessible descriptions.
- WCAG AA text-palette contracts and motion/reduced-motion specification contracts.
- CI must run `./scripts/bootstrap --ci`, `./ci/run fast`, `./ci/run pr`, `./ci/run audit` without modifying thresholds.

**Browser-rendered screenshot-anchor regression now runs for the four player-facing screens at two phone sizes.** This verifies actual exported-web output, not pixel-identical native screenshots. The device capture and accessibility matrix below remains unverified until reviewed on iOS and Android.

## Native critical capture matrix — remaining deliverable

Capture Home, Adventure, Memories, Friends, error recovery and the development-only 39-case motion review, each at a compact and a larger native-device viewport. Review the welcome illustration as an onboarding artwork preview; a complete first-run flow is not yet implemented. Record platform, OS, font scale, color theme, pixel ratio and screenshot revision. Confirm:

- Companions have transparent edges and remain on the room floor without clipping during vertical, scale and tilt animations.
- Tabs have comfortable hit targets and visible selected/unselected icons.
- Text remains readable at enlarged fonts, including the error retry button.
- Error artwork and all scene previews expose equivalent information to screen readers.
- All animations become static under the operating-system Reduce Motion setting; toggling it while the app runs takes effect.
- New artwork contains no copyrighted source-game visual elements.

## Approval rule

The browser capture gate compares actual exported-app pixels against versioned signatures in `tests/visual-baseline.json`; missing or drifting baselines fail CI. For native review, retain device screenshots and evidence for every tested matrix cell, and do not infer iOS/Android correctness from browser, file-hash or source-only assertions.

## Release boundary

The current PR can remain draft while scene content, onboarding and later-stage sprite sets are refined. Issue #9 cannot be closed without an actual render-based visual regression pass, platform review and five real green PR checks on the final commit.

## Automated rendered-screen visual regressions

The PR test/build job captures **actual Chrome-rendered screenshots** after the Expo web export, for all four navigation destinations at 390×844 and 430×932. The zero-dependency runner is `scripts/visual-regression.mjs`, which serves the real `dist/` output, verifies screen-specific text is present, decodes each screenshot's PNG pixels, and compares a 9×12 grid of quantized color anchors against the reviewed `tests/visual-baseline.json`.

A capture without a committed baseline fails, prints `VISUAL_BASELINE_BEGIN` / `VISUAL_BASELINE_END` with proposed anchor data, and uploads screenshots under `artifacts/visual/`. Once captured screens are reviewed, the anchors must be committed as code. A later CI run fails when more than 12% of anchor cells differ by over three quantization levels per channel or when dimensions change. The gate does not silently accept a new baseline and cannot be bypassed by missing browser tooling. Chrome is available on the supported GitHub-hosted Ubuntu runner; no runtime dependencies or build settings are changed.

This protects broad layout/color regressions, but it does **not** claim pixel-identical snapshots, native iOS/Android screenshots, or device-level reduced-motion coverage. Those still require direct device validation.

## Native motion review laboratory

The development-only route `/motion-review` is registered in Expo Router but hidden from the tab bar; production builds redirect the path back to Home. In a development build, open `/motion-review` on each iOS/Android target device. Its original companion preview lets reviewers select all **13 named poses** for each of **three growth stages**, replay the same pose, and observe the current system Reduce Motion setting without requiring pet simulation, special permissions, or network access.

The 39-case matrix is maintained in `src/theme/motion-review.ts` with a deterministic completeness test. The screen reports viewport dimensions and font scale, so individual reports identify a reproducible environment. The preview uses the same `CompanionSprite`, image registry and OS accessibility observer as the Home screen; it does not fake motion or substitute web CSS animations.

For each iOS and Android platform, review representative narrow and large devices, default font scale and largest comfortable accessibility text size, with Reduce Motion both enabled and disabled. With the route open, change the OS setting and confirm animations stop/start without restarting the app. Select and replay all 39 cases, checking sprite clipping, transparent borders, expression readability, labels and hit areas. Include VoiceOver/TalkBack passes. Report each issue with `stage-pose`, device/OS, font scale, Reduce Motion state, reproduction steps and screenshots. No device pass is claimed until those reports exist.

The browser screenshot baselines still cover the four player-facing routes, not this developer-only inspection screen. Native validation is a release prerequisite and cannot be inferred from tests of the matrix or a web export.
