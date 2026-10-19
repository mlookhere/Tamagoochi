import assert from 'node:assert/strict';
import test from 'node:test';
import { createInventory, itemCount } from '../../domain/items/inventory.ts';
import {
  ROOM_ITEMS,
  ROOM_SLOTS,
  pickUpRoomItem,
  placeRoomItem,
  type RoomItem,
  type RoomSlot,
} from './room.ts';

test('room catalog provides three slots and four crafted objects', () => {
  assert.equal(Object.keys(ROOM_SLOTS).length, 3);
  assert.equal(ROOM_ITEMS.length, 4);
});

test('placing and picking up a toy conserves inventory', () => {
  const inventory = { ...createInventory(), leafToy: 1 };
  const placed = placeRoomItem(inventory, {}, 'window', 'leafToy');
  assert.equal(placed.ok, true);
  assert.equal(itemCount(inventory, 'leafToy'), 1);
  assert.equal(itemCount(placed.inventory, 'leafToy'), 0);
  assert.deepEqual(placed.room, { window: 'leafToy' });
  const picked = pickUpRoomItem(placed.inventory, placed.room, 'window');
  assert.equal(picked.ok, true);
  assert.deepEqual(picked.inventory, inventory);
  assert.deepEqual(picked.room, {});
  assert.deepEqual(placed.room, { window: 'leafToy' });
});

test('occupied, empty and insufficient interactions remain atomic', () => {
  const inventory = { ...createInventory(), leafToy: 1 };
  const placed = placeRoomItem(inventory, {}, 'nook', 'leafToy');
  const occupied = placeRoomItem(
    inventory,
    { nook: 'mossCushion' },
    'nook',
    'leafToy',
  );
  assert.equal(occupied.ok, false);
  assert.equal(occupied.reason, 'occupied');
  assert.equal(occupied.inventory, inventory);
  assert.equal(placeRoomItem(inventory, {}, 'nook', 'flowerCrown').reason, 'insufficient');
  assert.equal(pickUpRoomItem(inventory, {}, 'nook').reason, 'empty');
  assert.equal(placed.ok, true);
});

test('full baskets cannot duplicate objects and invalid inputs are rejected', () => {
  const inventory = { leafToy: 10 };
  const room = { window: 'leafToy' } as const;
  const full = pickUpRoomItem(inventory, room, 'window');
  assert.deepEqual(full, { ok: false, reason: 'full', inventory, room });
  assert.throws(() => placeRoomItem(inventory, {}, 'bad' as RoomSlot, 'leafToy'));
  assert.throws(() =>
    placeRoomItem(inventory, {}, 'window', 'bad' as RoomItem),
  );
  assert.throws(() => pickUpRoomItem(inventory, room, 'bad' as RoomSlot));
});
