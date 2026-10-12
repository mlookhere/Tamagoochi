import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { inflateSync } from 'node:zlib';
import { isIllustratedAction } from '../theme/action-pose.ts';

const stages = ['seedling', 'bud', 'bloom'] as const;
const actions = [
  'walk',
  'eat',
  'sleep',
  'clean',
  'play',
  'pickup',
  'evolution',
] as const;

test('only authored full-character frames use the action registry', () => {
  for (const action of actions) {
    assert.equal(isIllustratedAction(action), true);
  }
  for (const pose of [
    'idle',
    'happy',
    'sad',
    'curious',
    'startled',
    'return',
  ] as const) {
    assert.equal(isIllustratedAction(pose), false);
  }
});

test('all 21 action frames are distinct, transparent and native-bundled', () => {
  const registry = readFileSync('src/assets/actions.ts', 'utf8');
  const sprite = readFileSync('src/components/CompanionSprite.tsx', 'utf8');
  assert.match(sprite, /isIllustratedAction\(pose\)/);
  assert.match(sprite, /actionArtwork\(stage, pose\)/);
  assert.match(sprite, /isIllustratedAction\(pose\) \? null/);
  const seen = new Set<string>();
  for (const stage of stages) {
    for (const action of actions) {
      const filename = `action-${stage}-${action}.png`;
      assert.ok(
        registry.includes(`require('../../assets/companions/${filename}')`),
      );
      const png = readFileSync(`assets/companions/${filename}`);
      assert.deepEqual(
        Array.from(png.subarray(0, 8)),
        [137, 80, 78, 71, 13, 10, 26, 10],
      );
      assert.equal(png.readUInt32BE(16), 256);
      assert.equal(png.readUInt32BE(20), 256);
      assert.equal(png[25], 6, 'Full-character frame must be RGBA');
      const payloadLength = png.readUInt32BE(33);
      const pixels = inflateSync(png.subarray(41, 41 + payloadLength));
      assert.equal(pixels.length, 256 * 1025);
      const alphaAt = (x: number, y: number) =>
        pixels[y * 1025 + 1 + x * 4 + 3];
      assert.equal(alphaAt(0, 0), 0, 'Top corner must be transparent');
      assert.equal(alphaAt(255, 255), 0, 'Bottom corner must be transparent');
      assert.ok(alphaAt(128, 145) > 200, 'Companion body must be opaque');
      seen.add(png.toString('base64'));
    }
  }
  assert.equal(seen.size, stages.length * actions.length);
});
