# Tamagoochi — Unity 6 conversion

Unity project root: **this directory**, not the repository root.

Open `unity/` in Unity Hub with **Unity 6 6000.0.62f1**, install Android/iOS build support as needed, then create and open an empty scene and press Play. The bootstrap creates the first playable UI automatically. This is a temporary gameplay parity harness, not the target art/UI.

## Migrated now

- Original Pet care actions and capped non-punitive offline hourly progression ported from `work/10-pet-simulation-persistence`.
- Nine-item starter inventory, five transactional recipes, and Forest Echo deterministic replay ported from `work/11-home-gameplay`.
- Unity editor tests, minimal local pet save with schema version and atomic temp-file move.

## Still pending

- Unity editor execution and mobile build **have not been performed**; CI for the pre-existing Expo app does not validate Unity.
- Existing Item 2 artwork/motion, Item 3 robust save migration/corruption defenses, remaining Item 4 room placements, pet object affinity, Stone Skip, Meadow Pairs, reward ledger and responsive accessibility.
- Complete content from Items 5–9, real Unity touch-first UI, art, input/audio, performance and native QA.
- Save format currently only supports the pet; inventory/minigame session state are not persistent. This is NOT a production save implementation.

Historical React Native source branches and PRs remain untouched. See [Issue #31](https://github.com/mlookhere/Tamagoochi/issues/31) for migration tracking.
