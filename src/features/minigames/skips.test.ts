import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseSkip, skipTarget, type Hop } from './skips.ts';

test('all authored banks can be reached with exactly three safe hops', () => {
  const solutions: Hop[][] = [
    [2, 2, 2],
    [2, 2, 3],
    [3, 3, 2],
    [3, 3, 3],
  ];
  for (let round = 0; round < 16; round += 1) {
    let distance = 0;
    let hops = 0;
    assert.equal(skipTarget(round), 6 + (round % 4));
    for (const hop of solutions[round % 4]) {
      const outcome = chooseSkip(round, distance, hops, hop);
      distance = outcome.distance;
      hops = outcome.hops;
      if (hops !== 0) assert.equal(outcome.result, 'progress');
      else assert.equal(outcome.result, 'complete');
    }
    assert.equal(distance, 0);
    assert.equal(hops, 0);
  }
});

test('an impossible hop restarts without consuming materials or a turn', () => {
  assert.deepEqual(chooseSkip(3, 0, 0, 1), {
    distance: 0,
    hops: 0,
    result: 'miss',
  });
  assert.deepEqual(chooseSkip(0, 0, 0, 2), {
    distance: 2,
    hops: 1,
    result: 'progress',
  });
  assert.deepEqual(chooseSkip(0, 2, 1, 1), {
    distance: 3,
    hops: 2,
    result: 'progress',
  });
  assert.deepEqual(chooseSkip(0, 3, 2, 2), {
    distance: 0,
    hops: 0,
    result: 'miss',
  });
});

test('invalid progress, hops and round fail closed', () => {
  for (const value of [-1, NaN, Infinity, 1.5]) {
    assert.throws(() => skipTarget(value));
    assert.throws(() => chooseSkip(0, value, 0, 1));
    assert.throws(() => chooseSkip(0, 0, value, 1));
  }
  assert.throws(() => chooseSkip(0, 6, 0, 1));
  assert.throws(() => chooseSkip(0, 0, 3, 1));
  assert.throws(() => chooseSkip(0, 0, 0, 4 as Hop));
});
