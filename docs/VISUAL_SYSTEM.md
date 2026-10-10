# Tamagoochi visual system — first implementation

## Creative direction

**A pocket-sized world that remembers where you have been.** The visual identity combines a gentle, hand-made storybook room with a lively, original companion. The app is not a replica of any existing monster-collection game or virtual-pet hardware. A single companion is the protagonist; travel and discoveries become room keepsakes.

## Rules

- Put the pet first. A room is a setting, not a dashboard; the companion remains the largest focal point.
- Use rounded organic shapes, subtle borders, cream surfaces, woodland-green lettering, and one warm sunlight accent. Never use competitive-game gradients or glossy loot-box framing.
- Use the same visual tokens across Home, Adventure, Memories, and Friends. Source of truth: `src/theme/index.ts`.
- Use `src/components/CompanionSprite.tsx` and the explicit PNG registry for original creature art. The starter exports are a first production-intent asset pass, subject to device review and iteration.
- Keep four top-level destinations. Each screen must show a readable state even when its full gameplay is not implemented.
- No real geographic coordinates, personal photos, or identity details appear on an exported card without explicit preview and consent.

## Implemented scene

`RoomScene` composes native platform views into a shelf, seed keepsake, arched landscape window, rug, feeding bowl, and houseplant behind the companion. Decorations are hidden from screen readers, but the character and feedback text stay readable. All scene art is an original, dependency-free first pass; the creature and environment art still require production illustration before this Issue can close.

The palette has automated WCAG AA contrast tests for the combinations used by critical text. Room feedback uses dark ink against the light floor to avoid low contrast. This is a design-system regression check, not a replacement for visual screenshot comparisons on devices.

## Companion anatomy

The starter companion has two outward-leaning ears, a rounded cream body, dark eyes, short mouth, and subtle cheeks. Expressions are primarily communicated by posture and movement, not walls of text. The native component now renders original transparent PNG artwork. Preserve its silhouette and the stable animation-state names as future art replaces the current exports.

## Motion language

`src/theme/motion.ts` defines **idle, walk, eat, sleep, clean, play, happy, sad, curious, startled, pickup, return, evolution**. Each has a controlled vertical movement amplitude and cadence; care actions trigger temporary reactions. There are no unrelated continuous particle effects. The app respects the operating system's Reduce Motion preference by rendering a static presentation with identical controls and information.

Motion here is a base interface, not a claim that every final animation is finished. Production animated artwork and full visual regression coverage remain part of Issue #9.

## Art delivery requirements

Final exported sprites must have transparent backgrounds, consistent baselines and scale across poses, and unambiguous licensing/source records. Design a starter creature family, a room, inventory items, ecology markers, first-moment keepsakes, empty/error states, and onboarding illustrations. Prefer a typed asset registry to dynamic filename interpolation, so missing resources fail at build time. Never vendor third-party protected game graphics.

## Accessibility

All important actions are native labeled controls. Text and background combinations must pass WCAG contrast checks before final approval. Animation cannot carry the only meaning of pet state. Touch areas must meet platform guidelines. System reduced-motion preferences are honored even when changed while the app is open.

## Exported original creature artwork

Fifteen original alpha-channel RGBA PNG assets (256×256) are stored in `assets/companions/`: five expressions (neutral, joyful, sad, asleep, surprised) for each seedling, bud, and bloom stage. The app resolves images through fixed Metro-compatible imports in `src/assets/companions.ts`; `CompanionSprite` now uses these assets rather than assembling the mascot exclusively from platform shapes. No additional rendering dependencies were added.

The artwork was authored procedurally for this repository from original ellipse, line, gradient and palette primitives; it is not copied or traced from another game. It includes an original botanical three-seed body mark and sprout/bud/flower growth motif. Asset format and static linkage are covered by `src/assets/companions.test.ts`.

All three stages now have a corresponding illustration for each core expression, but **stages are not yet wired into gameplay evolution**. The images are a first-pass original art family; additional full-body pose frames, story illustrations, and real-device rendering review remain within Issue #9.

## Motion differentiation

Every named pose has an authored combination of vertical travel, tilt, scale pulse and cadence. The components interpolate these values through the built-in React Native native animation driver without adding a runtime package. Motion is automatically suppressed when Reduce Motion is enabled, even when the system preference changes during use. Expression and animation are independent so more complete art sets can be introduced without changing care-domain state.

## Brand implementation

The original lowercase Tamagoochi wordmark is implemented in `src/components/BrandMark.tsx` as native typography with a sprouting-seed emblem. The shared `Page` frame renders it across all four destinations. It requires no icon font, remote image, or network request, and scales with the platform's font rendering. An editable sprouting-mark vector reference exists in `assets/source/sprouting-mark.svg`; final typography, exported platform icons, and visual approval remain open.

## Original illustrated app states

`StatusIllustration` provides a shared original motif for welcome, loading, empty, and error states, with distinct descriptive screen-reader labels from `src/theme/status.ts`. The error boundary now renders the error illustration. These assets are deliberately static, providing a reduced-motion-safe baseline. The welcome/loading/empty variants are reusable in future onboarding and asynchronous screens rather than triggering artificial loading behavior today.

## Original iconography

The shared native `WorldGlyph` component creates original home, compass, keepsake, friends, seed, nature and bowl marks using small platform views rather than fetching icon fonts or referencing third-party game assets. The first four glyphs now appear in the main tab bar, retaining platform-native press targets and labels. `src/theme/iconography.ts` provides typed semantic keys with contract tests.

## Original world and item illustrations

Eight original 128×128 transparent RGBA illustrations now live in `assets/world/`: sunberries, watering can, lantern, seed pouch, meadow, grove, pond and winding trail. `src/assets/world.ts` is their typed static Metro registry and `src/theme/world.ts` is the platform-independent descriptive content source; `src/components/WorldDiscoveryPreview.tsx` shows the sketches on the Adventure destination. These are not currently collectible, and the UI explicitly says so. The visual language is deliberately botanical, with paper medallions, rounded silhouettes and the signature three-seed motif. Automated checks verify transparent image formats, names, uniqueness and declared imports.

This is a foundation for Item #9 art acceptance, not a claim that the full inventory or exploration gameplay is built. Final production illustration sign-off and native-device visual review remain outstanding.

## Motion playback and adaptable room height

Ambient motions (idle, walk, sleep, sad and curious) repeat; interactions and one-time responses (eat, clean, play, happy, startled, pickup, return and evolution) complete a single authored cycle. Replaying a pose resets the cycle, and changing the OS Reduce Motion preference stops its native animations and returns the sprite to a still state. This distinction is enforced in `src/theme/motion.test.ts`, alongside the 13-pose and 39-stage review coverage.

The home room uses a minimum height rather than a fixed height, so large-font character names and feedback can expand the scene vertically instead of being clipped within a 315-point frame. Device-native inspection is still required at supported accessibility font sizes.

## First-moment illustrations

Three original 320×240 RGBA artwork concepts — meeting the seedling, caring for its garden, and exploring a small world — are bundled in `assets/onboarding/`. Their typed native registry and platform-independent metadata are in `src/assets/onboarding.ts` and `src/theme/onboarding.ts`. `OnboardingStoryboard` gives artists an accessible native preview on the developer-only review screen; the first-run user journey, persistence and onboarding interactions belong to later gameplay slices.
