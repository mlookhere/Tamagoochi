import assert from 'node:assert/strict';
import test from 'node:test';
import { companionMotion, expressionFor, motionFor } from './motion.ts';

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

test('expressions convey authored emotions without movement', () => {
  assert.equal(expressionFor('sleep'), 'asleep');
  assert.equal(expressionFor('sad'), 'sad');
  assert.equal(expressionFor('startled'), 'surprised');
  assert.equal(expressionFor('play'), 'joyful');
  assert.equal(expressionFor('happy'), 'joyful');
  assert.equal(expressionFor('idle'), 'neutral');
});
