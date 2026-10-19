import assert from 'node:assert/strict';
import test from 'node:test';
import { ROOM_ITEMS } from './room.ts';
import {
  MINI_GAMES,
  ROOM_PREFERENCES,
  companionPlacement,
  completeMiniGame,
  createWorkshopBond,
  placedItemReaction,
  roomMood,
  sharePicnicSnack,
  type MiniGame,
  type WorkshopBond,
} from './companionResponse.ts';

test('starter bond has neutral traits and is independent from care state', () => {
  assert.deepEqual(createWorkshopBond(), {
    bond: 40,
    personality: { curiosity: 0, courage: 0, focus: 0 },
    completed: [],
    snackShared: false,
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

test('visual companion rests in the empty room and approaches favorites', () => {
  assert.deepEqual(companionPlacement({}), { slot: 'nook', mood: 'resting' });
  assert.deepEqual(companionPlacement({ garden: 'leafToy' }), {
    slot: 'garden',
    mood: 'delighted',
  });
  assert.deepEqual(companionPlacement({ nook: 'flowerCrown' }), {
    slot: 'nook',
    mood: 'curious',
  });
});

test('wary decorations send Mochi away unless a favorite is available', () => {
  assert.deepEqual(companionPlacement({ window: 'starKeepsake' }), {
    slot: 'garden',
    mood: 'shy',
  });
  assert.deepEqual(companionPlacement({ garden: 'starKeepsake' }), {
    slot: 'window',
    mood: 'shy',
  });
  assert.deepEqual(
    companionPlacement({ window: 'starKeepsake', nook: 'mossCushion' }),
    { slot: 'nook', mood: 'delighted' },
  );
});

test('companion placement is deterministic and never mutates the room', () => {
  const room = { window: 'leafToy', garden: 'mossCushion' } as const;
  const before = { ...room };
  assert.deepEqual(companionPlacement(room), {
    slot: 'window',
    mood: 'delighted',
  });
  assert.deepEqual(room, before);
});

test('sharing a crafted snack spends exactly one item and rewards bond once', () => {
  const bond = createWorkshopBond();
  const inventory = { picnicSnack: 2 };
  const first = sharePicnicSnack(inventory, bond);
  assert.equal(first.ok, true);
  assert.equal(first.inventory.picnicSnack, 1);
  assert.equal(first.bond.bond, 44);
  assert.equal(first.bond.snackShared, true);
  assert.deepEqual(inventory, { picnicSnack: 2 });
  assert.equal(bond.snackShared, false);

  const replay = sharePicnicSnack(first.inventory, first.bond);
  assert.equal(replay.ok, true);
  assert.equal(replay.inventory.picnicSnack, 0);
  assert.equal(replay.bond, first.bond);
  assert.equal(replay.bond.bond, 44);
});

test('no snack and invalid inventory never grant free bond', () => {
  const bond = createWorkshopBond();
  const missing = sharePicnicSnack({}, bond);
  assert.deepEqual(missing, { ok: false, inventory: {}, bond });
  const out = sharePicnicSnack({ picnicSnack: 0 }, bond);
  assert.equal(out.ok, false);
  assert.equal(out.bond, bond);
  assert.throws(() => sharePicnicSnack({ picnicSnack: -1 }, bond));
});

test('first snack bonus clamps to the maximum bond', () => {
  const bond = { ...createWorkshopBond(), bond: 99 };
  const result = sharePicnicSnack({ picnicSnack: 1 }, bond);
  assert.equal(result.ok, true);
  assert.equal(result.bond.bond, 100);
  assert.equal(result.bond.snackShared, true);
  assert.equal(bond.bond, 99);
});

test('snack completion does not change distinct minigame rewards', () => {
  const initial = createWorkshopBond();
  const shared = sharePicnicSnack({ picnicSnack: 1 }, initial);
  const played = completeMiniGame(shared.bond, 'echo');
  assert.equal(played.bond, 52);
  assert.equal(played.personality.focus, 1);
  assert.equal(played.snackShared, true);
  assert.equal(completeMiniGame(played, 'echo'), played);
});
