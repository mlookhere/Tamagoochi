import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { companionMotion } from './motion.ts';
import { companionPoseAccents, poseAccentFor } from './pose-art.ts';

test('all authored motions have intentional static accent assignments', () => {
  assert.deepEqual(
    Object.keys(companionPoseAccents),
    Object.keys(companionMotion),
  );
  assert.equal(poseAccentFor('idle'), null);
  for (const pose of Object.keys(companionMotion)) {
    if (pose !== 'idle') {
      assert.ok(
        poseAccentFor(pose as keyof typeof companionMotion),
        `Missing pose accent: ${pose}`,
      );
    }
  }
});

test('care and reaction accents convey distinct states without motion', () => {
  assert.equal(poseAccentFor('eat'), 'berries');
  assert.equal(poseAccentFor('clean'), 'bubbles');
  assert.equal(poseAccentFor('play'), 'petals');
  assert.equal(poseAccentFor('sleep'), 'moon');
  assert.equal(poseAccentFor('startled'), 'rays');
  assert.equal(poseAccentFor('sad'), 'raindrops');
  assert.notEqual(poseAccentFor('eat'), poseAccentFor('clean'));
});

test('pose marks remain decorative and cannot intercept player controls', () => {
  const source = readFileSync('src/components/CompanionPoseAccent.tsx', 'utf8');
  const sprite = readFileSync('src/components/CompanionSprite.tsx', 'utf8');
  assert.match(sprite, /<CompanionPoseAccent pose=\{pose\} \/>/);
  assert.match(source, /accessible=\{false\}/);
  assert.match(source, /pointerEvents="none"/);
  assert.match(source, /importantForAccessibility="no-hide-descendants"/);
});
