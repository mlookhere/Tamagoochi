import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ECHO_SYMBOLS,
  chooseEcho,
  echoPattern,
  type EchoSymbol,
} from './echo.ts';

test('patterns are short deterministic authored sequences', () => {
  assert.deepEqual(echoPattern(0), ['leaf', 'sun', 'stone']);
  assert.deepEqual(echoPattern(4), echoPattern(0));
  assert.equal(echoPattern(1).length, 3);
  for (let round = 0; round < 12; round += 1) {
    assert.equal(echoPattern(round).length, 3);
    for (const symbol of echoPattern(round)) {
      assert.ok(ECHO_SYMBOLS.includes(symbol));
    }
  }
});

test('three correct taps complete an optional round', () => {
  let progress = 0;
  for (const symbol of echoPattern(0)) {
    const next = chooseEcho(0, progress, symbol);
    progress = next.progress;
    if (symbol !== 'stone') {
      assert.equal(next.result, 'correct');
    } else {
      assert.equal(next.result, 'complete');
    }
  }
  assert.equal(progress, 0);
});

test('an incorrect tap restarts a pattern without penalty', () => {
  assert.deepEqual(chooseEcho(0, 0, 'stone'), {
    progress: 0,
    result: 'miss',
  });
  assert.deepEqual(chooseEcho(0, 1, 'leaf'), {
    progress: 0,
    result: 'miss',
  });
  assert.deepEqual(chooseEcho(0, 0, 'leaf'), {
    progress: 1,
    result: 'correct',
  });
});

test('invalid rounds, progress and symbols are rejected', () => {
  for (const value of [-1, 0.5, NaN, Infinity]) {
    assert.throws(() => echoPattern(value));
  }
  for (const value of [-1, 3, NaN, Infinity]) {
    assert.throws(() => chooseEcho(0, value, 'leaf'));
  }
  assert.throws(() => chooseEcho(0, 0, 'river' as EchoSymbol));
});
