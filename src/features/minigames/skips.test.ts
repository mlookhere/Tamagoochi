import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseSkip, skipChoices, skipTarget, type Hop } from './skips.ts';

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

test('next-hop previews agree with actual outcomes on all rotating banks', () => {
  for (let round = 0; round < 16; round += 1) {
    const options = skipChoices(round, 0, 0);
    assert.deepEqual(options.map((choice) => choice.hop), [1, 2, 3]);
    for (const option of options) {
      assert.equal(
        option.result,
        chooseSkip(round, 0, 0, option.hop).result,
      );
    }
  }
});

test('dangerous hops are marked as free restarts rather than hidden', () => {
  assert.deepEqual(skipChoices(3, 0, 0), [
    { hop: 1, result: 'miss' },
    { hop: 2, result: 'miss' },
    { hop: 3, result: 'progress' },
  ]);
  assert.deepEqual(skipChoices(0, 4, 2), [
    { hop: 1, result: 'miss' },
    { hop: 2, result: 'complete' },
    { hop: 3, result: 'miss' },
  ]);
});

test('hop previews reject corrupted game progress without changing it', () => {
  assert.throws(() => skipChoices(-1, 0, 0));
  assert.throws(() => skipChoices(0, 6, 0));
  assert.throws(() => skipChoices(0, 0, 3));
  const before = { round: 0, distance: 2, hops: 1 };
  skipChoices(before.round, before.distance, before.hops);
  assert.deepEqual(before, { round: 0, distance: 2, hops: 1 });
});
