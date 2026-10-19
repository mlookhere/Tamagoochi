import assert from 'node:assert/strict';
import test from 'node:test';
import { roomColumns } from './workshopLayout.ts';

test('room targets become stacked on narrow phones', () => {
  assert.equal(roomColumns(320, 1), 1);
  assert.equal(roomColumns(359, 1), 1);
  assert.equal(roomColumns(360, 1), 2);
});

test('standard phones show two usable columns and wide layouts show three', () => {
  assert.equal(roomColumns(375, 1), 2);
  assert.equal(roomColumns(600, 1), 2);
  assert.equal(roomColumns(700, 1), 3);
  assert.equal(roomColumns(1024, 1), 3);
});

test('larger text progressively limits the number of room columns', () => {
  assert.equal(roomColumns(1024, 1.2), 2);
  assert.equal(roomColumns(1024, 1.5), 1);
  assert.equal(roomColumns(390, 1.5), 1);
  assert.equal(roomColumns(320, 2), 1);
  assert.equal(roomColumns(1024, 1.19), 3);
});

test('invalid screen metrics fail closed instead of returning fragile layouts', () => {
  for (const width of [0, -1, NaN, Infinity]) {
    assert.throws(() => roomColumns(width, 1));
  }
  for (const scale of [0, -1, NaN, Infinity]) {
    assert.throws(() => roomColumns(375, scale));
  }
});
