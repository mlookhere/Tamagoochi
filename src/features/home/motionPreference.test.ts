import assert from 'node:assert/strict';
import test from 'node:test';
import { createMotionPreferenceGuard } from './motionPreference.ts';

test('initial reduced-motion preference is applied before any change', () => {
  const updates: boolean[] = [];
  const guard = createMotionPreferenceGuard((value) => updates.push(value));
  guard.onInitial(false);
  assert.deepEqual(updates, [false]);
  guard.dispose();
});

test('newer OS change events win over delayed initial settings reads', () => {
  const updates: boolean[] = [];
  const guard = createMotionPreferenceGuard((value) => updates.push(value));
  guard.onChange(true);
  guard.onInitial(false);
  assert.deepEqual(updates, [true]);
  guard.onChange(false);
  guard.onInitial(true);
  assert.deepEqual(updates, [true, false]);
  guard.dispose();
});

test('rapid preference toggles preserve the final OS event', () => {
  const updates: boolean[] = [];
  const guard = createMotionPreferenceGuard((value) => updates.push(value));
  guard.onInitial(true);
  guard.onChange(false);
  guard.onChange(true);
  guard.onChange(false);
  assert.deepEqual(updates, [true, false, true, false]);
  guard.dispose();
});

test('disposed preference subscriptions reject late events and snapshots', () => {
  const updates: boolean[] = [];
  const guard = createMotionPreferenceGuard((value) => updates.push(value));
  guard.onChange(false);
  guard.dispose();
  guard.onChange(true);
  guard.onInitial(true);
  assert.deepEqual(updates, [false]);
});
