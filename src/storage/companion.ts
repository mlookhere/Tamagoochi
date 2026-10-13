import {
  advanceCompanion,
  createCompanion,
  type Companion,
} from '../domain/pet/state.ts';

export const SAVE_VERSION = 3;
const MAX_SAVE_LENGTH = 16_384;
const stats = [
  'hunger',
  'happiness',
  'energy',
  'cleanliness',
  'mood',
  'bond',
  'health',
  'curiosity',
  'gentleness',
] as const;

type RestoreSource = 'new' | 'restored' | 'migrated' | 'recovered';
export type RestoredCompanion = Readonly<{
  pet: Companion;
  source: RestoreSource;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNeed(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function isCompanion(value: unknown): value is Companion {
  if (!isRecord(value)) return false;
  const name = value.name;
  if (typeof name !== 'string' || !name.trim() || name.length > 40) {
    return false;
  }
  if (typeof value.sleeping !== 'boolean') return false;
  if (!['left', 'center', 'right'].includes(String(value.roomItemSlot))) {
    return false;
  }
  if (!stats.every((key) => isNeed(value[key]))) {
    return false;
  }
  return (
    typeof value.bornAt === 'number' &&
    Number.isSafeInteger(value.bornAt) &&
    value.bornAt >= 0 &&
    typeof value.lastSimulatedAt === 'number' &&
    Number.isSafeInteger(value.lastSimulatedAt) &&
    value.lastSimulatedAt >= value.bornAt
  );
}

function migrateV2(value: unknown): Companion | null {
  if (!isRecord(value)) return null;
  const migrated = { ...value, roomItemSlot: 'left' };
  return isCompanion(migrated) ? migrated : null;
}

function migrateV1(value: unknown, now: number): Companion | null {
  if (!isRecord(value)) return null;
  const priorStats = ['hunger', 'happiness', 'energy', 'cleanliness'] as const;
  if (
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name.length > 40 ||
    !priorStats.every((key) => isNeed(value[key]))
  ) {
    return null;
  }
  return {
    ...createCompanion(value.name, now),
    hunger: value.hunger as number,
    happiness: value.happiness as number,
    energy: value.energy as number,
    cleanliness: value.cleanliness as number,
  };
}

export function serializeCompanion(pet: Companion): string {
  if (!isCompanion(pet)) {
    throw new Error('Cannot persist invalid companion state');
  }
  return JSON.stringify({ version: SAVE_VERSION, pet });
}

export function restoreCompanion(
  raw: string | null,
  now: number,
): RestoredCompanion {
  const fallback = (): RestoredCompanion => ({
    pet: createCompanion(undefined, now),
    source: raw === null ? 'new' : 'recovered',
  });
  if (raw === null || raw.length > MAX_SAVE_LENGTH) return fallback();

  try {
    const stored: unknown = JSON.parse(raw);
    if (!isRecord(stored)) return fallback();
    if (stored.version === SAVE_VERSION && isCompanion(stored.pet)) {
      return { pet: advanceCompanion(stored.pet, now), source: 'restored' };
    }
    if (stored.version === 1 || stored.version === 2) {
      const migrated =
        stored.version === 1
          ? migrateV1(stored.pet, now)
          : migrateV2(stored.pet);
      if (migrated) {
        return { pet: advanceCompanion(migrated, now), source: 'migrated' };
      }
    }
  } catch {
    return fallback();
  }
  return fallback();
}
