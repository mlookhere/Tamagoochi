import {
  advanceCompanion,
  type Companion,
} from '../domain/pet/state.ts';
import { loadCompanion, saveCompanion } from './repository.ts';
import type { CompanionStorage } from './device';

// A single app-wide queue preserves ordering across Home unmounts/remounts.
// Retain the newest failed write in memory so remount cannot silently restore
// older disk data. This cache does not survive process termination.
export function createCompanionSession(storage: CompanionStorage) {
  let pending: Promise<void> = Promise.resolve();
  let unsaved: Companion | null = null;

  function schedule<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation);
    pending = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  return {
    load: (now: number) =>
      schedule(async () => {
        const restored = await loadCompanion(storage, now);
        // A future-version save on disk must still block local writes.
        if (restored.source === 'unsupported' || unsaved === null) {
          return { ...restored, unsaved: false };
        }
        return {
          pet: advanceCompanion(unsaved, now),
          source: 'restored' as const,
          unsaved: true,
        };
      }),
    save: (pet: Companion) =>
      schedule(async () => {
        try {
          await saveCompanion(storage, pet);
          unsaved = null;
        } catch (error) {
          unsaved = pet;
          throw error;
        }
      }),
  };
}
