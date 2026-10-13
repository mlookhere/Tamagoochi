import type { Companion } from '../domain/pet/state.ts';
import { companionStorage, type CompanionStorage } from './device';
import { loadCompanion, saveCompanion } from './repository.ts';

// Serialize reads and writes across Home remounts without blocking retries on errors.
export function createCompanionSession(storage: CompanionStorage) {
  let pending: Promise<void> = Promise.resolve();

  function schedule<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation);
    pending = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  return {
    load: (now: number) => schedule(() => loadCompanion(storage, now)),
    save: (pet: Companion) => schedule(() => saveCompanion(storage, pet)),
  };
}

export const companionSession = createCompanionSession(companionStorage);
