import type { Companion } from '../domain/pet/state.ts';
import { restoreCompanion, serializeCompanion } from './companion.ts';
import type { CompanionStorage } from './device';

export async function loadCompanion(
  storage: CompanionStorage,
  now: number,
) {
  return restoreCompanion(await storage.read(), now);
}

export async function saveCompanion(
  storage: CompanionStorage,
  pet: Companion,
): Promise<void> {
  await storage.write(serializeCompanion(pet));
}
