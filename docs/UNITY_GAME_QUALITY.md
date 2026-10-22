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
| Continuity | Complete care+workshop snapshot, backup recovery, schema validation and old pet-save import | Version-3 state, version-2/1 migration and backup recovery tests authored; editor/device verification pending |
| Signature look | Production creature rigs/sprites, room scene, animations, UI, sound and interaction FX | Pending |
| Outdoor loop | Step/activity-backed walks, coarse habitats, discoveries and expedition rewards with no-location path | No-GPS offline expeditions, three habitats and short discovery journal authored; real steps, habitats and sensor permission gates pending |
| Emotional depth | Soulprint, 12 authored evolution forms, memory book, NPC encounter continuity | Reversible Soulprint and v4 structured 13-firsts Book UI authored; evolution forms and relationships pending; Unity tests unexecuted |
| Social + platform | Opt-in meetings, safe share cards, notifications/widgets, backup sync | Pending |
| Release | Unity Editor/CI tests, mobile device QA, store builds, accessibility/security/performance signoffs | Pending |

Keep historical Expo source PRs #20, #23 and #24 intact as feature parity references. Active work: [Issue #31](https://github.com/mlookhere/Tamagoochi/issues/31), [draft PR #32](https://github.com/mlookhere/Tamagoochi/pull/32). Never conflate historical Expo green checks with Unity compile/build success.

### Structured memories (save v4)

First care/play/clean/comfort, first successful craft/snack/room placement, three initial minigame wins and first discoveries in each habitat create unique local-only moments. Duplicate moments are rejected; records are bounded, validated, saved with the full session and safely migrated from v2/v3 with no fabricated historical dates. This is an initial **Firsts** book, not yet the full moments/evolution/relationships system. Unity Editor and device verification are still outstanding.

### Authored evolution-path glimpse

The current Unity care UI previews one of twelve original, named **future** forms from four Soulprint natures and three discovery habitats (most frequently visited recorded habitat, deterministic ties). Each has a unique short description; the preview changes safely as habits change and round-trips existing v4 state without new fields or personal location data. These are *conceptual form routes*, **not unlocked evolutions, completed art, rigs, animations or permanent species changes**. The existing 12-form production acceptance requirement remains open until those systems are built and verified on mobile.

### Mobile interaction acceptance — navigation and names

The retained-mode Unity UI now uses two rows of three tabs rather than six compressed horizontal buttons. The name editor writes only trimmed 1–24-character values; malformed entries leave the current name/save valid, and existing v4/legacy names are preserved. NUnit tests cover rejection, international characters, JSON restoration and disk persistence; these tests are **authored, not run under Unity**. Before approving the build, verify safe-area/notch handling and readable/tappable three-column rows at representative 320/375/430-point portrait widths and large system text. Test keyboard overlap, repeated tab switching, invalid/whitespace entries, CJK names, pause/resume, persistence after relaunch and reduced-motion behavior. Track empirical findings and UI screenshots in the migration PR; do not mark production UX accepted from source inspection alone.

### Care readability slice

The six pet stats are now presented as two compact three-column rows of proportional meters with always-visible numeric labels, retaining exact values without relying on color alone. This is **authored retained-mode UI only**: inspect the bars for overflow at 320-point portrait widths, large accessibility text, and non-default font locales in Unity Editor and on Android/iOS before declaring acceptance. Care actions remain directly beneath the stat rows; avoid hiding interactions behind lengthy progression descriptions.

### Manual expedition return

An optional two-step “return home early” control is now authored in Explore, including a clear no-reward warning and a non-destructive “keep exploring” escape. The offline domain resets only the active trip timer; claimed materials, discovery journal, completed count, and memories are retained, with idempotency and no-extra-reward regression tests. This is particularly important for mistaken habitat selections and device-clock changes. As elsewhere, the interaction and EditMode tests remain **unverified on Unity devices and runners**.
