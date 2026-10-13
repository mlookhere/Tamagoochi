import assert from 'node:assert/strict';
import test from 'node:test';
import { sceneCopy } from './scenes.ts';

test('secondary scenes use unique accessible illustrations', () => {
  const kinds = Object.keys(sceneCopy);
  const scenes = Object.values(sceneCopy);
  const labels = scenes.map((scene) => scene.accessibilityLabel);
  assert.deepEqual(kinds, ['adventure', 'memories', 'friends']);
  assert.equal(new Set(labels).size, labels.length);
  for (const scene of scenes) {
    assert.ok(scene.title.length > 15);
    assert.ok(scene.detail.length > 20);
    assert.match(scene.background, /^#[0-9A-Fa-f]{6}$/);
  }
});
