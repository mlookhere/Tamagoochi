# Tamagoochi original artwork provenance

## Ownership and scope

The illustrations and assets in this project are original designs made for Tamagoochi. Do not import copyrighted Tamagotchi, Pikmin, Pokémon, or other game artwork. The three-dot seed mark, long soft ears, botanical crown, and woodland palette are core original design elements.

## Native exports

The files in `assets/companions/` are 256×256 transparent RGBA PNG exports. They were authored from procedural shape-and-shading primitives for this repository, not copied from third-party sources. Native builds load them from explicit static `require()` statements in `src/assets/companions.ts`. The runtime uses no third-party illustration CDN.

These fifteen transparent PNGs cover five core expressions across seedling, bud, and bloom stages as an original first-pass character family. The asset tests verify dimensions, transparency, static Metro registration, and visual distinctness between sprite variants. A separate rendered-screen screenshot baseline is still required before this slice is complete.

## Editable design references

`assets/source/seedling-design.svg` and `assets/source/sprouting-mark.svg` contain original editable vectors describing the mascot silhouette and sprout emblem. These are visual design references, not pixel-identical reproductions of the procedurally shaded PNGs. They are **not imported directly into React Native**; the native runtime uses bundled PNGs and the view-based wordmark.

## Future art pipeline

Before store release, review and expand authored pose frames for all three stages, item and ecology markers, onboarding illustrations, and platform icon/splash masters. Maintain vector masters and generated pixel assets together, export at platform-native densities, and review visual diffs on real iOS and Android devices.

## World art provenance

Eight original item and environment artworks (`assets/world/*.png`, 128×128 RGBA) were painted procedurally from novel shapes and the Tamagoochi woodland palette. The source concepts are sunberries, watering can, glow lantern, seed pouch, meadow, grove, pond and trail. They do not trace protected third-party game icons. The static registry is `src/assets/world.ts`; no remote asset service is used. These designs require final platform/store review before being described as release-ready.

## Onboarding artwork provenance

Three original transparent 320×240 RGBA PNG studies are stored in `assets/onboarding/`: welcome (a happy sprout companion), care (a watering-can/flower moment), and explore (a companion following a garden trail). They were generated from original geometric shapes and the existing woodland palette; no third-party characters, photographs, or copyrighted game compositions were used. `src/assets/onboarding.ts` registers the exact native PNG files through static Metro imports. `src/theme/onboarding.ts` stores the accessible descriptive copy and `src/components/OnboardingStoryboard.tsx` displays them only in the developer motion-review route. These are native illustration concepts, **not** a completed first-run onboarding flow or platform-approved release imagery. Review on real iOS/Android devices and obtain final artwork approval before shipping.
