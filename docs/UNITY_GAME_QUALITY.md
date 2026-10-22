# Tamagoochi — Unity 6 quality and production bar

This is an **original, pet-first location-aware mobile game**. Pokémon GO and Pikmin Bloom are reference points for polish, approachable exploration, performance, and a sense of discovery, **not** templates for mechanics, characters, assets, UI or maps.

## Experience pillars

1. **The pet matters.** Mochi visibly reacts to care, rooms, trips, relationships and memories; returning after an absence is positive, not punishing.
2. **The world rewards curiosity.** Optional walks and coarse places produce surprising finds, ecology, memories, evolution inputs and personal exploration stories. No real-time precision tracking is required to care for the pet.
3. **Every interaction feels premium.** Authored creature silhouette, readable staging, responsive animation, tactile placement, material/sound feedback, high-quality typography and transitions; no debug IMGUI in shipped builds.
4. **Player agency and privacy.** Step/location permissions are requested at point of use; manual or non-location activity offers accessible progression paths. Do not store raw continuous GPS trails by default.
5. **Play in short sessions.** Care in seconds, crafted decorations in a minute, optional replayable minigames, walking rewards without screen-on grinding.
6. **A world with a signature.** Original ecosystems and expressive creatures, not analogues of existing franchises; species/evolutions respond to player habits and the places they explore.

## Technical architecture

- **Unity 6 / C#** gameplay domain is deterministic, testable independently of animations, input or GPS.
- **Presentation:** premium rendered companion scene plus native mobile-friendly retained-mode UI; responsive portrait-first safe-area layout, readable at large text, touch/accessible alternatives.
- **Rendering:** choose URP for production mobile visual stack; use authored material palettes, controlled lighting, tight shader budgets, sprite/mesh atlases, LOD/culling where appropriate.
- **Input:** modern Input System, touch first; no gesture must be the only way to perform an essential action.
- **Movement and exploration:** platform activity/step bridge, sparse context/location reads on demand, offline-cached deterministic content tables; no continuous foreground GPS requirement for home gameplay.
- **State:** versioned offline-first snapshots, deterministic elapsed-time progression, corruption recovery, and optional later sync. A missed notification cannot punish progression.
- **Privacy and services:** permission wrappers isolate platform APIs; all discovery inputs are coarse and minimised; optional account/social sharing never publishes live position.

## Release acceptance budgets

| Area | Target and evidence |
| --- | --- |
| Frame pacing | Stable 60 FPS target on representative mid-range Android and iPhone; measured percentile frame times, no uncontrolled animation allocations |
| Battery | No home-screen background GPS loop; compare battery/CPU during idle, walking and returning |
| Memory | Profile startup peak, 30-minute session and repeated room/game transitions; no leaked assets or native handles |
| App startup | No unnecessary network dependency to enter home, care for pet, or resume save |
| Input | Immediate visual/aural/tactile acknowledgement; accessible touch targets and motion-reduced equivalents |
| Offline resilience | Safe resume after interruption, clock skew, airplane mode, save corruption and upgrade |
| Safety | No punitive streak/death, permission-denial fallback, deliberate sharing and clear location/data disclosures |
| Visual art | Cohesive production character, environment, items, VFX, animation and audio reviewed on real phones; no placeholder/debug panels |

These are **targets**, not claims of measured performance. Performance, accessibility and Android/iOS device evidence must be collected before merging the migration or publishing builds.

## Integration milestone sequence

| Milestone | Deliverable | Current state |
| --- | --- | --- |
| Foundation | Project layout, pure care/inventory rules, three minigames and room interaction | C# port authored; Unity Editor not yet executed |
| Continuity | Complete care+workshop snapshot, backup recovery, schema validation and old pet-save import | Code authored; editor/device verification pending |
| Signature look | Production creature rigs/sprites, room scene, animations, UI, sound and interaction FX | Pending |
| Outdoor loop | Step/activity-backed walks, coarse habitats, discoveries and expedition rewards with no-location path | Pending |
| Emotional depth | Soulprint, 12 authored evolution forms, memory book, NPC encounter continuity | Pending |
| Social + platform | Opt-in meetings, safe share cards, notifications/widgets, backup sync | Pending |
| Release | Unity Editor/CI tests, mobile device QA, store builds, accessibility/security/performance signoffs | Pending |

Keep historical Expo source PRs #20, #23 and #24 intact as feature parity references. Active work: [Issue #31](https://github.com/mlookhere/Tamagoochi/issues/31), [draft PR #32](https://github.com/mlookhere/Tamagoochi/pull/32). Never conflate historical Expo green checks with Unity compile/build success.
