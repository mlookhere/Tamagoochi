import assert from 'node:assert/strict';
import test from 'node:test';
import { ROOM_ITEMS } from './room.ts';
import {
  MINI_GAMES,
  ROOM_PREFERENCES,
  completeMiniGame,
  createWorkshopBond,
  placedItemReaction,
  roomMood,
  type MiniGame,
  type WorkshopBond,
} from './companionResponse.ts';

test('starter bond has neutral traits and is independent from care state', () => {
  assert.deepEqual(createWorkshopBond(), {
    bond: 40,
    personality: { curiosity: 0, courage: 0, focus: 0 },
    completed: [],
  });
});

test('each of the three optional games grows a distinct personality trait', () => {
  const start = createWorkshopBond();
  const echo = completeMiniGame(start, 'echo');
  const skip = completeMiniGame(echo, 'skip');
  const pairs = completeMiniGame(skip, 'pairs');
  assert.equal(pairs.bond, 64);
  assert.deepEqual(pairs.personality, {
    curiosity: 1,
    courage: 1,
    focus: 1,
  });
  assert.deepEqual(pairs.completed, [...MINI_GAMES]);
  assert.deepEqual(start.completed, []);
});

test('replay cannot farm bond or personality', () => {
  const earned = completeMiniGame(createWorkshopBond(), 'pairs');
  assert.equal(completeMiniGame(earned, 'pairs'), earned);
  assert.equal(earned.bond, 48);
  assert.equal(earned.personality.curiosity, 1);
  assert.throws(() => completeMiniGame(earned, 'unknown' as MiniGame));
});

test('bond is capped even when entering near maximum', () => {
  const high: WorkshopBond = {
    ...createWorkshopBond(),
    bond: 98,
  };
  assert.equal(completeMiniGame(high, 'echo').bond, 100);
});

test('every placeable room item has a preference and visible reaction', () => {
  assert.deepEqual(
    Object.keys(ROOM_PREFERENCES).sort(),
    [...ROOM_ITEMS].sort(),
  );
  for (const item of ROOM_ITEMS) {
    assert.ok(['favorite', 'wary', 'neutral'].includes(ROOM_PREFERENCES[item]));
    assert.ok(placedItemReaction(item).includes('Mochi'));
  }
  assert.throws(() => placedItemReaction('bad' as (typeof ROOM_ITEMS)[number]));
});

test('room mood reacts to favorites, cautious objects, and their mixture', () => {
  assert.match(roomMood({}), /discover/);
  assert.match(roomMood({ window: 'leafToy' }), /favorite/);
  assert.match(roomMood({ garden: 'starKeepsake' }), /space/);
  assert.match(roomMood({ nook: 'flowerCrown' }), /curious/);
  assert.match(roomMood({ window: 'leafToy', garden: 'starKeepsake' }), /cozy/);
});
