import type { Companion } from '../domain/pet/state.ts';
import { loadCompanion, saveCompanion } from './repository.ts';
import type { CompanionStorage } from './device';

// Keep reads and writes ordered across Home instances; a failed I/O does not
// poison later retries, but the caller still receives its original failure.
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
