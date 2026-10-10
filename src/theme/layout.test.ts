import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { stackCareActions, tabBarHeight } from './layout.ts';

test('tab bar preserves its baseline and expands for large text', () => {
  assert.equal(tabBarHeight(1), 76);
  assert.equal(tabBarHeight(1.5), 94);
  assert.equal(tabBarHeight(2), 111);
  assert.equal(tabBarHeight(3), 146);
  assert.equal(tabBarHeight(Number.NaN), 76);
  assert.equal(tabBarHeight(Number.POSITIVE_INFINITY), 76);
  assert.equal(tabBarHeight(10), 181);
});

test('care actions become vertical before large labels can collide', () => {
  assert.equal(stackCareActions(1), false);
  assert.equal(stackCareActions(1.5), false);
  assert.equal(stackCareActions(1.6), true);
  assert.equal(stackCareActions(2.5), true);
  assert.equal(stackCareActions(Number.NaN), false);
});

test('native tab navigation and Home actually use responsive layout policy', () => {
  const tabs = readFileSync('src/app/_layout.tsx', 'utf8');
  const home = readFileSync('src/app/index.tsx', 'utf8');
  assert.match(tabs, /tabBarHeight\(fontScale\)/);
  assert.match(home, /stackCareActions\(fontScale\)/);
  assert.match(home, /styles\.actionsStacked/);
  assert.match(home, /styles\.actionStacked/);
});
