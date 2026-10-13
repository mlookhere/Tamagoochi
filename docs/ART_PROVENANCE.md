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

## Companion pose accent provenance

`src/components/CompanionPoseAccent.tsx` uses simple original React Native oval, leaf, seed and petal shapes in the existing Tamagoochi palette to differentiate action states. The mapping is typed in `src/theme/pose-art.ts`; no external icon sets, emoji images, or third-party artwork are used. These lightweight decorative marks are not a substitute for final authored action sprites.

## Authored full-character action studies

Nine distinct transparent 256×256 RGBA character PNGs are now bundled for feeding, cleaning and playing across seedling, bud and bloom growth stages. Each frame retains the matching original character stage and adds a hand-authored illustration of the action (berry/feeding paw, bath bubbles/cleaning paw, or colorful play ball/raised paw). `src/assets/actions.ts` is the typed Metro registry, and `CompanionSprite` uses these frames for their three dedicated poses. Other motion poses still rely on their expression sprites and static botanical accents. All nine image exports are project-original compositions; they remain first-pass action studies pending native artwork approval.

## Extended stage-specific pose studies

Twelve additional original 256×256 RGBA character variants now cover walking, sleep, pickup and evolution at each of seedling, bud and bloom stages. They adapt the project's own original neutral, asleep and joyful artwork, with original stepping feet, cupped lift hands, pillow and crescent, and a blooming-petal transformation aura. Combined with eat, clean and play, seven of thirteen authored poses now have stage-specific full-character and prop compositions. No third-party character assets are used; these are first-pass illustrations pending native testing and creative signoff. Static Metro imports are in `src/assets/actions.ts`, and the pure action selection contract stays outside the native-only asset registry.

## Additional emotional full-character artwork

Nine further original transparent 256×256 character-frame illustrations cover happy, sad and curious poses for seedling, bud and bloom. Happy frames show uplifted companion paws and bright floating seed-confetti; sad frames use a lowered leaf canopy, raindrops and soft puddle; curious frames introduce a small leaf magnifying lens held by a paw. Each design retains its stage-specific original companion face and silhouette. These are project-authored procedural composites over existing original expressions, not imported third-party images. Native routing uses the existing typed Metro `ACTION_ART` registry; motion-review automatically displays the dedicated static illustration. Together with earlier work, the registry now has 30 distinct full-character action studies across 10 poses and three stages. Real iOS/Android evaluation and final designer sign-off remain mandatory.

## Startled and return frame provenance

Six additional original transparent 256×256 full-character artwork studies complete distinct non-idle pose imagery across the three creature stages. Startled uses the original surprised face with uplifted paws, amber radiating sparks and a bold warning glyph. Return uses the original neutral stage silhouette with a botanical homeward pennant, small glow lantern and dust-trail footprints. All are first-party procedural art based on the existing project character masters, not traced or downloaded media. The typed static Metro registry now contains **36 distinct action images for 12 non-idle poses × 3 stages**; idle deliberately uses the existing neutral base art rather than a redundant copy. This is **asset completeness, not device QA or final art approval**.
