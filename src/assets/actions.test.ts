import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { isIllustratedAction } from '../theme/action-pose.ts';

const stages = ['seedling', 'bud', 'bloom'];
const actions = ['eat', 'clean', 'play'] as const;

test('only authored actions use dedicated full-character frames', () => {
  for (const action of actions) {
    assert.equal(isIllustratedAction(action), true);
  }
  for (const pose of ['idle', 'sleep', 'walk', 'evolution', 'happy'] as const) {
    assert.equal(isIllustratedAction(pose), false);
  }
});

test('nine action PNGs are distinct, transparent and native-bundled', () => {
  const registry = readFileSync('src/assets/actions.ts', 'utf8');
  const sprite = readFileSync('src/components/CompanionSprite.tsx', 'utf8');
  assert.match(sprite, /isIllustratedAction\(pose\)/);
  assert.match(sprite, /actionArtwork\(stage, pose\)/);
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
      assert.equal(png[25], 6, 'Full character frame must be RGBA');
      seen.add(png.toString('base64'));
    }
  }
  assert.equal(seen.size, 9);
});
