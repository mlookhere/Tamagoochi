import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type CompanionPose,
  companionMotion,
  companionPlayback,
  expressionFor,
  motionFor,
  playbackFor,
} from './motion.ts';

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
    assert.ok(normal.tilt >= 0 && normal.tilt <= 20);
    assert.ok(normal.pulse >= -0.1 && normal.pulse <= 0.2);
    assert.deepEqual(reduced, { lift: 0, tilt: 0, pulse: 0, duration: 0 });
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

test('sustained motions loop and interactions finish after one gesture', () => {
  assert.deepEqual(Object.keys(companionPlayback), Object.keys(companionMotion));
  const sustained = ['idle', 'walk', 'sleep', 'sad', 'curious'];
  const poses = Object.keys(companionMotion) as CompanionPose[];
  for (const pose of poses) {
    assert.equal(
      playbackFor(pose),
      sustained.includes(pose) ? 'loop' : 'once',
      `Incorrect playback mode for ${pose}`,
    );
  }
  const reactions = [
    'eat',
    'clean',
    'play',
    'startled',
    'pickup',
    'return',
    'evolution',
  ] as const;
  for (const pose of reactions) {
    assert.equal(playbackFor(pose), 'once');
  }
});
