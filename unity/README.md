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
- Reused the existing project-original seedling expression/care illustrations and woodland marker studies from visual PR #20; a lightweight 2D stage displays character movement and care reactions. Stable tracked Unity .meta GUIDs preserve future asset references. Artwork is **first-pass**, not final creative/device approval.
- Three optional habitats (Grove, Meadow, Pond) now support a 10-minute offline expedition with original discoveries, a small journal, material rewards and full-basket recovery. This is a **no-GPS experience**, not yet step/location sensor integration.
- A version-3 complete care/workshop save containing inventory, room, bond ledger and all minigame progress; validation rejects inconsistent state. The previous save is retained as a backup on replacement. Version-1 pet-only saves can be imported as a fresh workshop.
- Unity scene setup menu and focused state parity tests.

## Production gaps

The rendered controls are temporary IMGUI layered over imported original seedling sprites. Finished character/environment art, motion, mobile-native input/UI, sound, outdoor loop, accessibility, profiling and Unity-native CI are **not implemented or verified**. See [Unity quality bar](../docs/UNITY_GAME_QUALITY.md). The Expo PRs remain unmerged source references.

**Do not merge the migration on Expo-only checks.** Unity editor/test runner, game save/device recovery tests, Android/iOS builds and actual device QA are separate requirements.

## Native verification (not yet executed)

Use the pinned Unity 6 editor and installed Android/iOS build modules. The following commands **must return success in Unity** before claiming native verification. They are entrypoints only, not passing test results:

```bash
Unity -batchmode -nographics -projectPath unity -quit -executeMethod Tamagoochi.Editor.HomeSceneSetup.VerifyEditorSetup -logFile unity-editor.log
Unity -batchmode -nographics -projectPath unity -runTests -testPlatform EditMode -testResults unity-tests.xml -quit -logFile unity-tests.log
Unity -batchmode -nographics -projectPath unity -quit -executeMethod Tamagoochi.Editor.HomeSceneSetup.BuildAndroidDevelopment -logFile unity-android.log
```

For an iOS player build, use a **macOS** runner with iOS Build Support and invoke `Tamagoochi.Editor.HomeSceneSetup.BuildIOSDevelopment`. That produces an Xcode project, **not** a signed App Store binary; Xcode compilation, signing and real-device testing remain additional gates. Command-line Unity requires suitable editor installation/licensing. No GitHub Actions job currently executes these commands; do not treat green Expo CI as Unity validation.
