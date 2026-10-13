# Companion local persistence: implementation and native QA

## Storage contract

Item 3 is local-first. `src/storage/companion.ts` validates JSON schema v2,
migrates supported v1 data and returns a safe new companion when stored content
is corrupt or an unrecognized version. `src/storage/repository.ts` keeps that
serialization independent of device I/O.

The native adapter (`src/storage/device.native.ts`) stores one JSON file in
the app-scoped Expo FileSystem **documents** directory. The web implementation
(`src/storage/device.ts`) uses browser localStorage for web-preview parity.
`expo-file-system@~57.0.7` was already present in the lockfile transitively;
it is now an explicit dependency. This does not request access to other apps'
files, photos, or external storage.

`src/hooks/useCompanion.ts` loads the saved pet before enabling care controls,
queues writes in action order, saves after care, and applies the deterministic
elapsed-time simulation on foreground resume. A read exception blocks gameplay
and offers Retry loading to avoid overwriting an inaccessible existing save.
A failed write shows a warning; no success is claimed until the write resolves.
A malformed save is recovered to a fresh, non-punitive companion with a notice.
This storage layer does not implement cloud sync or multi-device conflict resolution.

## Native acceptance matrix (not automatically satisfied)

Test each item below separately on a physical iOS device and a physical Android
device, and attach dated device/OS/build-SHA evidence to Issue #10:

1. Open a clean install, feed/play/clean/rest, force close, reopen. Verify all
   needs, bond, health, mood, sleep state and companion name survive restart.
2. Background the app, advance the wall clock by more than an hour, foreground it.
   Verify deterministic elapsed-time needs and energy changes are applied once.
   Repeat with the wall clock moved backward, then restore the correct time.
3. Resume after a long absence (over 24 hours). Verify no pet death, no endless
   decay, and care actions remain available.
4. Simulate denied/unavailable storage or a full device. Verify read failures
   disable actions and offer retry, while write failures show the unsaved warning.
5. Load representative v1 data and malformed v2 data. Verify migration retains
   the four old need values; corrupt data shows the recovery notice and playable
   safe defaults. Check no sensitive records leave device storage.
6. Confirm the app boots and the save file stays intact under iOS/Android
   process termination and repeated rapid taps. Review accessibility text,
   hit targets and offline behavior with a screen reader enabled.

Unit tests and Expo export are gates for code changes, but they cannot replace
physical-device storage and lifecycle verification. Keep PR #23 draft until
these checks and the remaining Item 3 acceptance work are completed.
