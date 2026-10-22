# Tamagoochi — Unity 6 conversion

Open **unity/** (not the repository root) in Unity Hub. Pinned editor: **Unity 6 6000.0.62f1**.

## First run

1. Open the project, let the Unity Package Manager import packages, and fix any project-specific compilation errors before committing a scene.
2. Select **Tamagoochi → Create or Open Home Scene** to generate `Assets/Scenes/Home.unity` and register it in the enabled scene list.
3. Press Play. The current editor **prototype** provides Care, Workshop, Games and Room. All three original minigames are ported.
4. Run NUnit EditMode tests from **Window → General → Test Runner**. These tests are committed but **have not been executed in Unity**. No Unity player build has yet been verified.

## Current capabilities

- Non-punitive offline care simulation, age, sleep, bounded inventory, five recipes and safe room placement.
- Three deterministic minigames, pet room affinities, optional one-time bond rewards and snack sharing.
- Reused the existing project-original seedling expression/care illustrations and woodland marker studies from visual PR #20; a lightweight 2D stage displays character movement and care reactions. Artwork is **first-pass**, not final creative/device approval.
- A version-2 complete care/workshop save containing inventory, room, bond ledger and all minigame progress; validation rejects inconsistent state. The previous save is retained as a backup on replacement. Version-1 pet-only saves can be imported as a fresh workshop.
- Unity scene setup menu and focused state parity tests.

## Production gaps

The rendered controls are temporary IMGUI layered over the imported original seedling art. Finished character/environment art, motion, mobile-native input/UI, sound, outdoor loop, accessibility, profiling and Unity-native CI are **not implemented or verified**. See [Unity quality bar](../docs/UNITY_GAME_QUALITY.md). The Expo PRs remain unmerged source references.

**Do not merge the migration on Expo-only checks.** Unity editor/test runner, game save/device recovery tests, Android/iOS builds and actual device QA are separate requirements.
