import assert from 'node:assert/strict';
import test from 'node:test';
import { companionMotion, motionFor } from './motion.ts';

test('every authored companion pose has an animated and static presentation', () => {
  const poses = [
    'idle',
    'walk',
    'eat',
    'sleep',
    'clean',
    'play',
    'happy',
    'sad',
    'curious',
    'startled',
    'pickup',
    'return',
    'evolution',
  ] as const;

  assert.deepEqual(Object.keys(companionMotion), poses);
  for (const pose of poses) {
    const normal = motionFor(pose, false);
    const reduced = motionFor(pose, true);
    assert.ok(normal.lift > 0 && normal.duration > 0);
    assert.ok(normal.lift <= 16 && normal.duration <= 2400);
    assert.deepEqual(reduced, { lift: 0, duration: 0 });
  }
});
