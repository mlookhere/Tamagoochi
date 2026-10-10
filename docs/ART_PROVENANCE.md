# Tamagoochi original artwork provenance

## Ownership and scope

The illustrations and assets in this project are original designs made for Tamagoochi. Do not import copyrighted Tamagotchi, Pikmin, Pokémon, or other game artwork. The three-dot seed mark, long soft ears, botanical crown, and woodland palette are core original design elements.

## Native exports

The files in `assets/companions/` are 256×256 transparent RGBA PNG exports. They were authored from procedural shape-and-shading primitives for this repository, not copied from third-party sources. Native builds load them from explicit static `require()` statements in `src/assets/companions.ts`. The runtime uses no third-party illustration CDN.

These seven exports currently serve as a baseline art pass. Later-stage variants are not yet fully authored. The asset tests verify dimensions, transparency, static Metro registration, and visual distinctness between sprite variants. A separate rendered-screen screenshot baseline is still required before this slice is complete.

## Editable design references

`assets/source/seedling-design.svg` and `assets/source/sprouting-mark.svg` contain original editable vectors describing the mascot silhouette and sprout emblem. These are visual design references, not pixel-identical reproductions of the procedurally shaded PNGs. They are **not imported directly into React Native**; the native runtime uses bundled PNGs and the view-based wordmark.

## Future art pipeline

Before store release, add the full expression/pose exports for the bud and bloom families, item and ecology markers, onboarding and error-state illustrations, and platform icon/splash masters. Maintain vector masters and generated pixel assets together, export at platform-native densities, and review visual diffs on real iOS and Android devices.
