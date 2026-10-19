import {
  giveItem,
  takeItem,
  type Inventory,
} from '../../domain/items/inventory.ts';

export const ROOM_SLOTS = {
  window: 'Sunny window',
  nook: 'Cozy nook',
  garden: 'Garden ledge',
} as const;

export const ROOM_ITEMS = [
  'leafToy',
  'mossCushion',
  'starKeepsake',
  'flowerCrown',
] as const;

export type RoomSlot = keyof typeof ROOM_SLOTS;
export type RoomItem = (typeof ROOM_ITEMS)[number];
export type Room = Readonly<Partial<Record<RoomSlot, RoomItem>>>;
export type RoomResult = Readonly<{
  ok: boolean;
  inventory: Inventory;
  room: Room;
  reason?: 'occupied' | 'empty' | 'insufficient' | 'full';
}>;

export function placeRoomItem(
  inventory: Inventory,
  room: Room,
  slot: RoomSlot,
  item: RoomItem,
): RoomResult {
  if (!(slot in ROOM_SLOTS) || !ROOM_ITEMS.includes(item)) {
    throw new Error('Invalid room placement');
  }
  if (room[slot]) {
    return { ok: false, reason: 'occupied', inventory, room };
  }
  const spent = takeItem(inventory, item);
  if (!spent.ok) {
    return { ok: false, reason: 'insufficient', inventory, room };
  }
  return {
    ok: true,
    inventory: spent.inventory,
    room: { ...room, [slot]: item },
  };
}

export function pickUpRoomItem(
  inventory: Inventory,
  room: Room,
  slot: RoomSlot,
): RoomResult {
  if (!(slot in ROOM_SLOTS)) throw new Error('Invalid room slot');
  const item = room[slot];
  if (!item) return { ok: false, reason: 'empty', inventory, room };
  const returned = giveItem(inventory, item);
  if (!returned.ok) {
    return { ok: false, reason: 'full', inventory, room };
  }
  const next = { ...room };
  delete next[slot];
  return { ok: true, inventory: returned.inventory, room: next };
}
