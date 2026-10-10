import assert from 'node:assert/strict';
import test from 'node:test';
import { motionDisabled, reduceMotionDescription } from './accessibility.ts';

test('unknown Reduce Motion state is safe and remains static', () => {
  assert.equal(motionDisabled(null), true);
  assert.equal(motionDisabled(true), true);
  assert.equal(motionDisabled(false), false);
});

test('native inspection reports explicit OS preference state', () => {
  assert.equal(reduceMotionDescription(null), 'not available');
  assert.equal(reduceMotionDescription(true), 'enabled');
  assert.equal(reduceMotionDescription(false), 'disabled');
});
