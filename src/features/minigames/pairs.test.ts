import assert from 'node:assert/strict';
import test from 'node:test';
import {
  choosePair,
  closePair,
  newPairs,
  pairBoard,
  type PairsState,
} from './pairs.ts';

test('every board contains exactly three pairs and rotates deterministically', () => {
  for (let round = 0; round < 16; round += 1) {
    const board = pairBoard(round);
    assert.equal(board.length, 6);
    for (const symbol of ['leaf', 'sun', 'stone']) {
      assert.equal(board.filter((item) => item === symbol).length, 2);
    }
  }
  assert.deepEqual(pairBoard(0), pairBoard(4));
});

test('mismatched tiles remain visible for untimed review and can be closed', () => {
  const first = choosePair(newPairs(), 0);
  assert.equal(first.result, 'reveal');
  const miss = choosePair(first.state, 1);
  assert.equal(miss.result, 'miss');
  assert.deepEqual(miss.state.revealed, [0, 1]);
  assert.deepEqual(choosePair(miss.state, 2), {
    state: miss.state,
    result: 'ignored',
  });
  const reset = closePair(miss.state);
  assert.deepEqual(reset.revealed, []);
  assert.deepEqual(reset.matched, []);
  assert.equal(closePair(reset), reset);
});

test('matches do not duplicate and a full board advances exactly once', () => {
  let state = newPairs();
  for (const [first, second] of [
    [0, 5],
    [1, 4],
    [2, 3],
  ]) {
    const one = choosePair(state, first);
    assert.equal(one.result, 'reveal');
    assert.equal(choosePair(one.state, first).result, 'ignored');
    const two = choosePair(one.state, second);
    state = two.state;
    assert.equal(two.result, second === 3 ? 'complete' : 'match');
  }
  assert.deepEqual(state, { round: 1, matched: [], revealed: [] });
  assert.deepEqual(newPairs(), { round: 0, matched: [], revealed: [] });
});

test('bad indices, rounds and duplicated/corrupted pair state are rejected', () => {
  for (const value of [-1, 0.5, NaN, Infinity]) {
    assert.throws(() => pairBoard(value));
    assert.throws(() => choosePair(newPairs(), value));
  }
  assert.throws(() => choosePair(newPairs(), 6));
  const broken: PairsState = { round: 0, matched: [0, 0], revealed: [] };
  assert.throws(() => choosePair(broken, 2));
  assert.throws(() => choosePair({ round: 0, matched: [], revealed: [7] }, 2));
});
