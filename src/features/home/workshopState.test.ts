import assert from 'node:assert/strict';
import test from 'node:test';
import { itemCount } from '../../domain/items/inventory.ts';
import { echoPattern } from '../minigames/echo.ts';
import { pairBoard } from '../minigames/pairs.ts';
import { newWorkshop, reduceWorkshop, type WorkshopState } from './workshopState.ts';

test('workshop preview initializes without saved state or side effects', () => {
  const first = newWorkshop();
  const second = newWorkshop();
  assert.notEqual(first, second);
  assert.notEqual(first.inventory, second.inventory);
  assert.equal(first.bond.bond, 40);
  assert.equal(first.bond.snackShared, false);
  assert.deepEqual(first.room, {});
  assert.equal(first.echoRound, 0);
  assert.equal(first.pairs.round, 0);
});

test('crafting then sharing a snack consumes exactly one and awards bond once', () => {
  const start = newWorkshop();
  const made = reduceWorkshop(start, { type: 'craft', recipeId: 'picnicSnack' });
  assert.equal(itemCount(start.inventory, 'wildBerry'), 6);
  assert.equal(itemCount(made.inventory, 'wildBerry'), 4);
  assert.equal(itemCount(made.inventory, 'picnicSnack'), 1);
  const shared = reduceWorkshop(made, { type: 'shareSnack' });
  assert.equal(itemCount(shared.inventory, 'picnicSnack'), 0);
  assert.equal(shared.bond.bond, 44);
  assert.equal(shared.bond.snackShared, true);
  const empty = reduceWorkshop(shared, { type: 'shareSnack' });
  assert.equal(empty.inventory, shared.inventory);
  assert.equal(empty.bond, shared.bond);
  const more = reduceWorkshop(empty, { type: 'craft', recipeId: 'picnicSnack' });
  const again = reduceWorkshop(more, { type: 'shareSnack' });
  assert.equal(again.bond, shared.bond);
  assert.equal(itemCount(again.inventory, 'picnicSnack'), 0);
});

test('room placement and pickup conserve crafted inventory across failed taps', () => {
  const start = newWorkshop();
  const made = reduceWorkshop(start, { type: 'craft', recipeId: 'leafToy' });
  const selected = reduceWorkshop(made, { type: 'roomItem', item: 'leafToy' });
  const placed = reduceWorkshop(selected, { type: 'roomSlot', slot: 'window' });
  assert.equal(placed.room.window, 'leafToy');
  assert.equal(itemCount(placed.inventory, 'leafToy'), 0);
  assert.equal(placed.selectedRoomItem, null);
  const empty = reduceWorkshop(placed, { type: 'roomSlot', slot: 'nook' });
  assert.equal(empty.inventory, placed.inventory);
  assert.equal(empty.room, placed.room);
  const picked = reduceWorkshop(empty, { type: 'roomSlot', slot: 'window' });
  assert.equal(itemCount(picked.inventory, 'leafToy'), 1);
  assert.deepEqual(picked.room, {});
  assert.deepEqual(picked.inventory, made.inventory);
  assert.deepEqual(made.room, {});
});

test('failed room pickup with a full basket cannot duplicate an object', () => {
  const start = newWorkshop();
  const full = {
    ...start,
    inventory: { ...start.inventory, leafToy: 10 },
    room: { window: 'leafToy' },
  } as const satisfies WorkshopState;
  const next = reduceWorkshop(full, { type: 'roomSlot', slot: 'window' });
  assert.equal(next.inventory, full.inventory);
  assert.equal(next.room, full.room);
  assert.equal(next.room.window, 'leafToy');
});

test('Forest Echo completes a round, preserves snack status and cannot farm bond', () => {
  const made = reduceWorkshop(newWorkshop(), {
    type: 'craft',
    recipeId: 'picnicSnack',
  });
  const shared = reduceWorkshop(made, { type: 'shareSnack' });
  const before = itemCount(shared.inventory, 'flowerPetal');
  const complete = (state: WorkshopState) =>
    echoPattern(state.echoRound).reduce(
      (current, symbol) => reduceWorkshop(current, { type: 'echo', symbol }),
      state,
    );
  const first = complete(shared);
  assert.equal(first.echoRound, 1);
  assert.equal(first.bond.bond, 52);
  assert.equal(first.bond.personality.focus, 1);
  assert.equal(first.bond.snackShared, true);
  assert.equal(itemCount(first.inventory, 'flowerPetal'), before + 1);
  const second = complete(first);
  assert.equal(second.echoRound, 2);
  assert.equal(second.bond, first.bond);
  assert.equal(itemCount(second.inventory, 'flowerPetal'), before + 2);
});

test('Stone Skip and Meadow Pairs grant rewards without repeated bond farming', () => {
  const start = newWorkshop();
  const skipped = [1, 2, 3].reduce(
    (state, hop) => reduceWorkshop(state, { type: 'skip', hop: hop as 1 | 2 | 3 }),
    start,
  );
  assert.equal(skipped.skipRound, 1);
  assert.equal(skipped.bond.personality.courage, 1);
  assert.equal(skipped.bond.bond, 48);
  const board = pairBoard(skipped.pairs.round);
  const pairIndices = board.map((value, index) => ({ value, index }));
  const completed = ['leaf', 'sun', 'stone'].reduce((state, symbol) => {
    const pair = pairIndices.filter((x) => x.value === symbol);
    const first = reduceWorkshop(state, { type: 'pair', card: pair[0].index });
    return reduceWorkshop(first, { type: 'pair', card: pair[1].index });
  }, skipped);
  assert.equal(completed.pairs.round, 1);
  assert.equal(completed.bond.personality.curiosity, 1);
  assert.equal(completed.bond.bond, 56);
  assert.equal(itemCount(completed.inventory, 'softFiber'), 6);
});

test('wrong guesses and mismatches are penalty-free, and ignored taps are safe', () => {
  const start = newWorkshop();
  const bad = reduceWorkshop(start, { type: 'echo', symbol: 'sun' });
  assert.equal(bad.echoProgress, 0);
  assert.equal(bad.bond, start.bond);
  const one = reduceWorkshop(start, { type: 'pair', card: 0 });
  const mismatch = reduceWorkshop(one, { type: 'pair', card: 1 });
  assert.equal(mismatch.pairs.revealed.length, 2);
  const ignored = reduceWorkshop(mismatch, { type: 'pair', card: 2 });
  assert.equal(ignored.pairs, mismatch.pairs);
  const reset = reduceWorkshop(mismatch, { type: 'closePair' });
  assert.deepEqual(reset.pairs.revealed, []);
  assert.equal(reset.bond, start.bond);
  const noOp = reduceWorkshop(start, { type: 'closePair' });
  assert.equal(noOp.bond, start.bond);
});
