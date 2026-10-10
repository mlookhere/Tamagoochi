import assert from 'node:assert/strict';
import test from 'node:test';
import { sceneCopy } from './scenes.ts';

test('secondary scenes use unique accessible illustrations', () => {
  assert.deepEqual(Object.keys(sceneCopy), ['adventure', 'memories', 'friends']);
  const labels = Object.values(sceneCopy).map((scene) => scene.accessibilityLabel);
  assert.equal(new Set(labels).size, labels.length);
  for (const scene of Object.values(sceneCopy)) {
    assert.ok(scene.title.length > 15);
    assert.ok(scene.detail.length > 20);
    assert.match(scene.background, /^#[0-9A-Fa-f]{6}$/);
  }
});
