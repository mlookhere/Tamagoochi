# Companion local persistence: implementation and native QA

## Storage contract

Item 3 is local-first. `src/storage/companion.ts` validates JSON schema v3,
migrates supported v1 and v2 data and returns a safe new companion for
corrupt content. Newer unknown schema versions and oversized saves are **not overwritten**:
care and autosaves stay disabled, and Home asks the player to update the app. `src/storage/repository.ts` keeps that
serialization independent of device I/O.

The native adapter (`src/storage/device.native.ts`) stores one JSON file in
the app-scoped Expo FileSystem **documents** directory. The physical filename
`companion-v2.json` and browser key `tamagoochi.companion.v2` are
intentionally retained when migrating the JSON schema to v3 so existing saves
are found rather than abandoned. The web implementation
(`src/storage/device.ts`) uses browser localStorage for web-preview parity.
`expo-file-system@~57.0.7` was already present in the lockfile transitively;
it is now an explicit dependency. This does not request access to other apps'
files, photos, or external storage.

`src/hooks/useCompanion.ts` loads the saved pet before enabling care controls.
A shared storage session (`src/storage/queue.ts`) serializes reads and writes
across Home unmount/remount, so an old in-flight write completes before a new
Home instance can restore the saved state. Writes after failures remain retryable.
The companion hook saves after care and item placement and applies deterministic
elapsed-time simulation on foreground resume. A read exception blocks gameplay
and offers Retry loading to avoid overwriting an inaccessible existing save.
A failed write shows a warning and an explicit Retry saving action; no success is claimed until the write resolves.
A malformed save is recovered to a fresh, non-punitive companion with a notice.
A future-version save is blocked from writes, not treated as corrupt. Unsupported
room positions are also rejected rather than coerced into valid positions.
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
5. Load representative v1, v2, malformed v3, and **future-version v4** data.
   Verify migration retains original pet values, small corrupt data shows recoverable
   safe defaults, and v4 instead disables interactions and requests an app
   update **without changing the file contents**. Check no sensitive records
   leave device storage.
6. Move the starter room cushion from left to center to right to left.
   Force-close and reopen after moving it. Verify its position survives restart
   and older v2 saves migrate with a default left cushion without losing pet
   stats, age, sleep or elapsed time. This is only an Item 3 placement hook;
   inventory, furniture collection and crafting are Item 4.
7. Navigate away from Home immediately after repeated care taps, then return.
   Verify the most recent change survives; do not allow a pending write from
   the previous Home instance to overwrite or lag behind the fresh read.
   Repeat with a failed write followed by Retry saving to confirm that errors
   do not block later successful saves.
8. Confirm the app boots and the save file stays intact under iOS/Android
   process termination and repeated rapid taps. Review accessibility text,
   hit targets and offline behavior with a screen reader enabled.

Unit tests and Expo export are gates for code changes, but they cannot replace
physical-device storage and lifecycle verification. Keep PR #23 draft until
these checks and the remaining Item 3 acceptance work are completed.
