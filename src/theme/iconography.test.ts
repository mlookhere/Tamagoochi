import assert from 'node:assert/strict';
import test from 'node:test';
import { glyphLabels } from './iconography.ts';

test('native iconography covers navigation and original world markers', () => {
  assert.deepEqual(Object.keys(glyphLabels), [
    'home',
    'adventure',
    'memories',
    'friends',
    'seed',
    'leaf',
    'bowl',
  ]);
  const descriptions = Object.values(glyphLabels);
  assert.equal(new Set(descriptions).size, descriptions.length);
  for (const description of descriptions) {
    assert.ok(description.length >= 10);
  }
});
