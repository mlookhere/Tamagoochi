# Tamagoochi visual quality and regression protocol

## Current automated coverage

- Companion original-art format checks: 256×256 transparent RGBA PNGs, visible central silhouette, clear corners, distinct sprite variants.
- UI semantics: typed tab/destination icons; scene and status illustration names and accessible descriptions.
- WCAG AA text-palette contracts and motion/reduced-motion specification contracts.
- CI must run `./scripts/bootstrap --ci`, `./ci/run fast`, `./ci/run pr`, `./ci/run audit` without modifying thresholds.

**These automated checks are not full screenshot-based regression tests.** The project must not claim that critical screens have been visually snapshot-tested until browser/device capture and pixel comparison exist.

## Critical capture matrix — remaining deliverable

Capture Home, Adventure, Memories, Friends, error recovery and onboarding, each at a compact phone viewport and a larger phone viewport. Record platform, OS, font scale, color theme, pixel ratio and screenshot revision. Confirm:

- Companions have transparent edges and remain on the room floor without clipping during vertical, scale and tilt animations.
- Tabs have comfortable hit targets and visible selected/unselected icons.
- Text remains readable at enlarged fonts, including the error retry button.
- Error artwork and all scene previews expose equivalent information to screen readers.
- All animations become static under the operating-system Reduce Motion setting; toggling it while the app runs takes effect.
- New artwork contains no copyrighted source-game visual elements.

## Approval rule

Maintain reviewable baseline images under a dedicated visual-fixture directory when screenshot capture is implemented. Store screenshots from the actual app renderer, compare per-screen captures with deterministic tolerances and fail CI on unexplained differences. Do not substitute file-hash checks or static source text assertions for rendered visual validation.

## Release boundary

The current PR can remain draft while scene content, onboarding and later-stage sprite sets are refined. Issue #9 cannot be closed without an actual render-based visual regression pass, platform review and five real green PR checks on the final commit.
