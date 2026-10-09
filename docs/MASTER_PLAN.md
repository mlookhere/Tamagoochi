# Tamagoochi Master Plan

## Product target

Build a production-ready iOS and Android companion game where a persistent virtual pet is shaped by the player's real life. The emotional core is a Tamagotchi-style relationship; walking, location-aware exploration, memories, evolution, social relationships, and shareable milestones create the real-world layer. The implementation must remain simple to use while supporting deep simulation underneath.

### Product principles

- Original IP, characters, environments, names, art, audio, and animations. Do not copy Bandai, Pokémon, Pikmin, or other protected assets.
- The companion is the center of the product. Map/exploration systems support the relationship rather than replace it.
- Complex simulation stays hidden behind simple controls and readable emotional feedback.
- No punitive death/streak mechanics for normal absence. Returning players are welcomed back.
- Core progression is earned through play and life activity; monetization, if added later, must not gate pet wellbeing or power.
- Location, motion, camera, notifications, and social data use least-privilege permissions with clear user benefit.
- Offline-first where practical; deterministic simulation and migrations make saves testable and durable.
- Every slice must pass the repository CI contract before merge.

## Delivery plan

### 1. Project scaffold, architecture, and CI green

**Acceptance criteria**
- Expo + React Native + TypeScript app boots on iOS, Android, and web development targets.
- App uses a small feature-oriented architecture with typed domain boundaries and no premature service layers.
- Deterministic package lock, formatting, linting, type checking, unit tests, coverage, and CI production export/build checks are wired through `./scripts/bootstrap --ci` and `./ci/run <stage>`.
- Fast and PR gates pass on a real pull request with non-zero checks.
- Baseline navigation, error boundary, test harness, asset loading, and environment/config handling exist.
- No secrets or environment-specific credentials are committed.

**Areas touched**
- `package.json`, `package-lock.json`, Expo/app config, TypeScript config
- `src/`, test setup, app entry points
- CI/bootstrap/workflows where required for the Node toolchain

**Required gates**
- PR metadata
- Fast deterministic gates
- PR test/build gates
- Dependency audit
- Workflow policy

**Risk labels**
- `risk:ci`
- `risk:dependencies`

---

### 2. Original visual identity, art system, and motion foundation

**Acceptance criteria**
- Establish the app's original visual language: logo, typography, palette, iconography, room/world UI, creature silhouette language, and motion rules.
- Create production-ready original artwork for the starter creature family, room, core items, environment markers, UI icons, empty/error/loading states, and onboarding.
- Assets are cut/exported at correct resolutions with transparent backgrounds where appropriate and organized through a typed asset registry.
- Define animation states for idle, walk, eat, sleep, clean, play, happy, sad, curious, startled, pickup, return, and evolution.
- Implement a reusable animation/state presentation layer with reduced-motion fallbacks.
- Visual regression/snapshot coverage exists for critical screens and no copyrighted third-party game art is included.

**Areas touched**
- `assets/`
- `src/ui/`, `src/components/`, `src/theme/`
- animation and asset tooling

**Required gates**
- Fast deterministic gates
- PR test/build gates
- Dependency audit
- Workflow policy

**Risk labels**
- `risk:dependencies` only if new rendering/animation packages are introduced

---

### 3. Core pet simulation, care loop, persistence, and offline progression

**Acceptance criteria**
- Implement hunger, energy, cleanliness, mood, bond, health, age, personality inputs, sleep, feeding, cleaning, play, and care reactions.
- Simulation is deterministic from state + elapsed time and can replay missed time without requiring background execution.
- Pet state persists locally with schema versioning, migrations, corruption recovery, and safe defaults.
- Absence is non-punitive: the pet remains recoverable and return flows are emotionally positive.
- Home room supports direct pet interaction, item placement hooks, and visible state changes.
- Unit/property-style tests cover time jumps, clock skew, boundaries, migration paths, and care actions.

**Areas touched**
- `src/domain/pet/`
- `src/storage/`
- home/room state and UI
- simulation tests

**Required gates**
- Fast deterministic gates
- PR test/build gates
- Dependency audit
- Workflow policy

**Risk labels**
- `risk:security` for persisted personal/game data handling

---

### 4. Home gameplay, inventory, crafting, minigames, and tactile physics

**Acceptance criteria**
- Add a small inventory and item taxonomy for food, keepsakes, materials, toys, furniture, and cosmetics.
- Room interactions support pickup/drop/placement with simple tactile physics where it materially improves feel.
- Implement at least three polished short minigames that influence bond/personality without becoming required grind.
- Add crafting/combination rules for a constrained initial content set.
- Pet behaviors react to nearby room objects and favorite/disliked items.
- Performance remains smooth on representative mid-range devices; physics and animation loops pause/clean up correctly.

**Areas touched**
- `src/domain/items/`
- `src/features/home/`
- `src/features/minigames/`
- animation/physics helpers
- asset catalog

**Required gates**
- Fast deterministic gates
- PR test/build gates
- Dependency audit
- Workflow policy

**Risk labels**
- `risk:dependencies` if physics/gameplay libraries are added

---

### 5. Adventure layer: steps, location, ecology, discoveries, and expeditions

**Acceptance criteria**
- Motion/step integration supports foreground and platform-supported historical activity reads without requiring constant screen-on GPS.
- Location permissions are requested only when the player enters a feature that needs them, with clear denial/degraded-mode handling.
- Build a privacy-preserving environment classifier for coarse habitat categories such as park, coast/water, urban, food, retail, arts, transit, and residential.
- Adventure mode records walks, grants exploration progress, generates deterministic discoveries, and creates expedition opportunities.
- Expeditions can complete while the app is closed by comparing timestamps on return.
- The game remains playable without precise location; alternate discovery paths prevent geography from permanently locking content.
- Tests cover permission denial, unavailable sensors, fake/invalid timestamps, low-connectivity/offline use, and location data minimization.

**Areas touched**
- `src/features/adventure/`
- `src/platform/location/`
- `src/platform/activity/`
- discovery/ecology domain code
- permission/privacy UI

**Required gates**
- Fast deterministic gates
- PR test/build gates
- Dependency audit
- Workflow policy

**Risk labels**
- `risk:security`
- `risk:dependencies`

---

### 6. Soulprint, evolution, memories, relationships, and content depth

**Acceptance criteria**
- Implement hidden Soulprint dimensions derived from care style, activity, time-of-day patterns, environments, discoveries, and social experiences.
- Ship an authored initial evolution system with at least 12 meaningfully distinct forms and testable deterministic requirements.
- Implement Firsts and Moments that create keepsakes and structured memories from meaningful events.
- Add a memory book and room keepsake callbacks; memories remain structured and inspectable rather than opaque generated chat history.
- NPC creatures can be encountered repeatedly and develop persistent acquaintance/friend/rival relationships.
- Content data is schema-validated and separated from engine logic so new evolutions/memories/encounters can be added without rewriting systems.
- Evolution and memory generation are covered by golden/deterministic tests.

**Areas touched**
- `src/domain/soulprint/`
- `src/domain/evolution/`
- `src/domain/memory/`
- `src/domain/relationships/`
- content definitions and artwork

**Required gates**
- Fast deterministic gates
- PR test/build gates
- Dependency audit
- Workflow policy

**Risk labels**
- none unless dependency or personal-data boundaries change

---

### 7. Social and viral loop: pet meetings, shared memories, share cards, and community systems

**Acceptance criteria**
- Players can intentionally connect pets without exposing precise live location.
- Pet-to-pet meetings create persistent relationship history and shared memories.
- Generate polished share cards for hatch, personality reveal, evolution, travel/memory milestones, and yearly-style recap data.
- Sharing is user-initiated and reveals only data explicitly previewed to the player.
- Implement a constrained community challenge/event framework that aggregates progress without exposing individual movement traces.
- Abuse-resistant identifiers, rate limits/server validation strategy, blocking/removal flows, and child-safety/privacy considerations are documented and implemented for shipped social features.
- Social features degrade cleanly offline or when account/cloud services are unavailable.

**Areas touched**
- `src/features/friends/`
- `src/features/sharing/`
- `src/features/community/`
- backend/client boundary if introduced
- privacy/safety controls

**Required gates**
- Fast deterministic gates
- PR test/build gates
- Dependency audit
- Workflow policy

**Risk labels**
- `risk:security`
- `risk:database` if cloud persistence is introduced
- `risk:dependencies` if backend/client packages are introduced

---

### 8. Platform presence: notifications, widgets, live activity, camera memories, and resilient sync

**Acceptance criteria**
- Contextual notifications are useful, rate-limited, opt-in where required, and never guilt-based.
- Home-screen widget shows current companion state with useful static/interactive affordances supported by platform APIs.
- iOS Live Activity/Dynamic Island support is included where technically appropriate, with Android equivalent ongoing-status treatment where feasible.
- Camera memory flow allows the player to create a photo memory with pet overlay without uploading photos by default.
- Optional account/cloud sync protects saves across devices with clear conflict resolution and local-first fallback.
- Permission prompts, background work, battery use, and sync failures have explicit tests and user-facing recovery states.

**Areas touched**
- `src/platform/notifications/`
- widget/native integration
- camera/media handling
- sync/account layer
- native Expo config/plugins

**Required gates**
- Fast deterministic gates
- PR test/build gates
- Dependency audit
- Workflow policy

**Risk labels**
- `risk:security`
- `risk:dependencies`
- `risk:deployment` where native build configuration changes

---

### 9. Production hardening, accessibility, balancing, release, and store-ready package

**Acceptance criteria**
- Full top-to-bottom gameplay pass removes dead ends, placeholder UI, debug artifacts, inaccessible controls, and unfinished content.
- Accessibility pass covers screen readers, dynamic text, contrast, reduced motion, touch targets, and non-visual alternatives for required interactions.
- Performance/battery profiling covers room animation, long sessions, location/adventure, memory lists, and low-memory conditions.
- Privacy disclosures, permission strings, data-retention behavior, account deletion (if accounts exist), and store metadata accurately match shipped behavior.
- Crash/error telemetry is privacy-conscious and can be disabled where required.
- End-to-end smoke tests cover hatch -> care -> walk/adventure -> discovery -> memory -> evolution -> social/share -> restore/sync.
- Production iOS and Android builds complete through the release gate; all required checks are green and non-zero.
- Release notes, support/runbook, known limitations, and rollback/recovery steps are documented.
- App contains complete production artwork/audio/content for the launch scope with no placeholder assets.

**Areas touched**
- entire app
- `docs/`
- release workflows/config
- store/build configuration
- tests and observability

**Required gates**
- Release metadata
- Full regression and production build
- Workflow policy
- plus all PR gates for any work PRs feeding the release

**Risk labels**
- `risk:deployment`
- `risk:security`
- `risk:dependencies`
- `risk:ci`

## Definition of complete

The project is complete only when all nine slices are merged through green CI, no required check is missing or pending, the full user journey is functional on production mobile builds, launch artwork/content is present, privacy/accessibility/reliability passes are complete, and the release branch path from `dev` to `main` passes the production gates.
