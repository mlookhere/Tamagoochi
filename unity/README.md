# Tamagoochi — Unity 6 conversion

The Unity project root is **unity/**, not the Git repository root. Editor version: **6000.0.62f1** (pinned so builds are reproducible). The historical Expo implementation remains as the source of truth for rules not yet migrated.

## Open and play

1. Add `unity/` to Unity Hub and open it with the pinned Unity 6 editor.
2. From the Unity menu select **Tamagoochi → Create or Open Home Scene**. This generates `Assets/Scenes/Home.unity` and registers it in the active Build Profile/Build Settings scene list. Commit the generated scene after validating it in the editor.
3. Press Play. Use the Care, Workshop, Games and Room tabs.
4. Run EditMode tests through **Window → General → Test Runner**. Unity's editor compilation and player builds **have not been run** in this repository's existing CI.

## Ported gameplay

- Pet care, sleep, age and deterministic offline progression (24-hour capped need decay), matching the existing Item 3 rules.
- Nine bounded inventory items, five atomic craft recipes, three room decoration slots, transfer-safe placement/pickup.
- Companion reacts to favorite/wary/neutral objects; favorite preference takes priority.
- Three original minigames: Forest Echo, Stone Skip, Meadow Pairs. Replays are optional and penalty-free.
- Workshop bond ledger: first completion of each minigame gives +8 bond and the associated personality trait; sharing a snack costs one item and gives a +4 bonus only once.
- First-pass pet-only local save, an editor scene setup command, and NUnit editor tests.

## Remaining before replacing Expo

- This is a **functional migration harness**, not the finished art-directed Unity game. The interface uses IMGUI and there are no finished scenes, character assets, touch accessibility tests, or Android/iOS build proofs yet.
- The saved file currently persists the **pet only**, not inventory, rooms, minigame state, or workshop bond. Do not treat it as a final save or migration path.
- Robust versioned save migrations, backup/corruption recovery, native UI, visuals, evolution, memories, exploration, social sharing, platform services, sound and release gates remain pending.
- Existing Expo draft PRs #20, #23 and #24 are untouched. Do not merge this Unity draft until engine-native verification and gameplay parity are proven.

Track work in [Issue #31](https://github.com/mlookhere/Tamagoochi/issues/31).
