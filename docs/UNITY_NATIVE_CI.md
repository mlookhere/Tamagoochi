# Unity-native validation gate — Issue #33

This is a **separate prerequisite** of Unity migration Issue #31 / draft PR #32, not a replacement for the existing five GitHub repository checks. The workflow is **manual-only while activation, mobile modules and approval are unverified**. A skipped/absent native run is **not** native acceptance.

## Setup and security

1. Have an authorized maintainer configure a GitHub environment named `unity-native` with required reviewer approval and access restricted to trusted branches. Store `UNITY_LICENSE`, `UNITY_EMAIL` and `UNITY_PASSWORD` only as **environment secrets**; never commit them or echo their values. A Unity Pro/serial or license-server workflow requires a separate reviewed change.
2. Use **GitHub-hosted** runners, pinned GameCI v4 Actions and Unity `6000.0.62f1`; do not execute public-fork PR code with secret-enabled self-hosted runners. The workflow rejects unrelated refs and missing activation.
3. Once this workflow exists on the repository's default branch and the migration branch contains it, manually dispatch the **exact reviewed** migration commit. A default-branch-only dispatch cannot validate a ref that lacks the workflow definition; reconcile branches only through a reviewed PR. Leave missing/pending runs unresolved, not green.
4. The Android build method creates and validates the Home scene, runtime panel/theme and 11 original sprite imports. The subsequent GameCI test runner executes NUnit EditMode in Unity. `ci/verify_unity_native.py` requires a real nonempty fully-passing NUnit3 XML and a nonempty structurally valid Android APK.
5. The validator's stdlib synthetic self-tests run in **Fast deterministic gates**. They prove only validation logic, **not** a native Unity run.

## Not yet satisfied

- This workflow has not run a Unity Editor, and GameCI activation / builder path behavior is not yet proven. No editor, NUnit, or Android artifacts are approved.
- An iOS Xcode project is **not** a signed binary. Run native iOS generation on macOS with iOS Build Support, then Xcode compilation/signing and physical-device QA separately.
- After real authorized activation and successful same-head native runs, review a follow-up change enabling mandatory automatic native checks for Unity-changing PRs and configure branch protection. Do not treat manual-only, skipped, missing or older-SHA results as passing native gates.
- Keep Unity migration PR #32 draft until both mobile platform builds and actual device/accessibility/performance/art acceptance are evidenced.
