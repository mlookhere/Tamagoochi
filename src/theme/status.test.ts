import assert from 'node:assert/strict';
import test from 'node:test';
import { statusCopy } from './status.ts';

test('welcome, loading, empty, and error have clear readable labels', () => {
  const variants = ['welcome', 'loading', 'empty', 'error'];
  assert.deepEqual(Object.keys(statusCopy), variants);
  const labels = Object.values(statusCopy).map((value) => value.label);
  assert.equal(new Set(labels).size, labels.length);
  for (const value of Object.values(statusCopy)) {
    assert.ok(value.title.length >= 12);
    assert.ok(value.message.length >= 20);
    assert.ok(value.label.length >= 25);
  }
});
