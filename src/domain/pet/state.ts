export type RoomItemSlot = 'left' | 'center' | 'right';

export type Companion = Readonly<{
  name: string;
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
  mood: number;
  bond: number;
  health: number;
  curiosity: number;
  gentleness: number;
  sleeping: boolean;
  roomItemSlot: RoomItemSlot;
  bornAt: number;
  lastSimulatedAt: number;
}>;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_OFFLINE_HOURS = 24;

export function createCompanion(name = 'Mochi', now = Date.now()): Companion {
  const createdAt = Number.isFinite(now) ? Math.max(0, now) : 0;
  return {
    name,
    hunger: 82,
    happiness: 76,
    energy: 90,
    cleanliness: 88,
    mood: 80,
    bond: 20,
    health: 100,
    curiosity: 50,
    gentleness: 50,
    sleeping: false,
    roomItemSlot: 'left',
    bornAt: createdAt,
    lastSimulatedAt: createdAt,
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function feed(pet: Companion): Companion {
  return {
    ...pet,
    hunger: clamp(pet.hunger + 18),
    mood: clamp(pet.mood + 2),
    bond: clamp(pet.bond + 2),
  };
}

export function play(pet: Companion): Companion {
  return {
    ...pet,
    happiness: clamp(pet.happiness + 14),
    energy: clamp(pet.energy - 10),
    mood: clamp(pet.mood + 4),
    bond: clamp(pet.bond + 3),
    curiosity: clamp(pet.curiosity + 2),
    sleeping: false,
  };
}

export function clean(pet: Companion): Companion {
  return {
    ...pet,
    cleanliness: clamp(pet.cleanliness + 24),
    health: clamp(pet.health + 2),
    bond: clamp(pet.bond + 1),
  };
}

export function comfort(pet: Companion): Companion {
  return {
    ...pet,
    mood: clamp(pet.mood + 3),
    bond: clamp(pet.bond + 4),
    gentleness: clamp(pet.gentleness + 1),
  };
}

// The starter cushion is a placement hook; inventory remains Item 4's concern.
export function moveRoomItem(pet: Companion): Companion {
  const next: Record<RoomItemSlot, RoomItemSlot> = {
    left: 'center',
    center: 'right',
    right: 'left',
  };
  return { ...pet, roomItemSlot: next[pet.roomItemSlot] };
}

export function sleep(pet: Companion): Companion {
  return { ...pet, sleeping: true };
}

export function wake(pet: Companion): Companion {
  return { ...pet, sleeping: false };
}

export function companionAgeDays(pet: Companion, now: number): number {
  if (!Number.isFinite(now) || now <= pet.bornAt) return 0;
  return Math.floor((now - pet.bornAt) / DAY_MS);
}

// Time advances on app resume; no background timers, punitive death or streaks.
export function advanceCompanion(pet: Companion, now: number): Companion {
  if (!Number.isFinite(now) || now <= pet.lastSimulatedAt) return pet;
  const elapsed = Math.floor((now - pet.lastSimulatedAt) / HOUR_MS);
  if (elapsed < 1) return pet;

  // Long absences receive no more than one day of gradual needs changes.
  const hours = Math.min(MAX_OFFLINE_HOURS, elapsed);
  const lastSimulatedAt =
    elapsed > MAX_OFFLINE_HOURS ? now : pet.lastSimulatedAt + hours * HOUR_MS;

  return {
    ...pet,
    lastSimulatedAt,
    hunger: Math.max(20, pet.hunger - hours * 2),
    happiness: Math.max(30, pet.happiness - hours),
    cleanliness: Math.max(25, pet.cleanliness - hours),
    energy: clamp(pet.energy + (pet.sleeping ? hours * 3 : -hours)),
    mood: Math.max(35, pet.mood - hours),
    health: Math.max(50, pet.health - hours),
  };
}
