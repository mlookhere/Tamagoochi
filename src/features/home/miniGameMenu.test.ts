import assert from 'node:assert/strict';
import test from 'node:test';
import { completeMiniGame, createWorkshopBond } from './companionResponse.ts';
import { miniGameOptions } from './miniGameMenu.ts';

test('activity menu lists each optional minigame exactly once', () => {
  const options = miniGameOptions(createWorkshopBond());
  assert.deepEqual(
    options.map((option) => [
      option.game,
      option.name,
      option.firstRewardEarned,
    ]),
    [
      ['echo', 'Forest Echo', false],
      ['skip', 'Stone Skip', false],
      ['pairs', 'Meadow Pairs', false],
    ],
  );
});

test('reward status follows the existing bond ledger across activities', () => {
  const fresh = createWorkshopBond();
  const first = completeMiniGame(fresh, 'skip');
  const next = completeMiniGame(first, 'echo');
  assert.deepEqual(
    miniGameOptions(next).map((option) => option.firstRewardEarned),
    [true, true, false],
  );
  assert.deepEqual(
    miniGameOptions(fresh).map((option) => option.firstRewardEarned),
    [false, false, false],
  );
});

test('replaying a completed game cannot reset its earned indicator', () => {
  const earned = completeMiniGame(createWorkshopBond(), 'pairs');
  const replay = completeMiniGame(earned, 'pairs');
  assert.equal(replay, earned);
  assert.equal(
    miniGameOptions(replay).find((option) => option.game === 'pairs')
      ?.firstRewardEarned,
    true,
  );
});
