import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  advanceCompanion,
  createCompanion,
  type Companion,
} from '../domain/pet/state';
import { companionStorage } from '../storage/device';
import { loadCompanion, saveCompanion } from '../storage/repository';

export type CompanionLoadState = 'loading' | 'ready' | 'error';

export function useCompanion() {
  const [pet, setPet] = useState(() => createCompanion());
  const [status, setStatus] = useState<CompanionLoadState>('loading');
  const [notice, setNotice] = useState(
    'A new little friend is waiting for you.',
  );
  const [saveError, setSaveError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const current = useRef(pet);
  const ready = useRef(false);
  const mounted = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const persist = useCallback((next: Companion) => {
    queue.current = queue.current
      .catch(() => {})
      .then(() => saveCompanion(companionStorage, next))
      .then(() => {
        if (mounted.current) setSaveError(false);
      })
      .catch(() => {
        if (mounted.current) setSaveError(true);
      });
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    ready.current = false;
    loadCompanion(companionStorage, Date.now())
      .then(({ pet: loaded, source }) => {
        if (cancelled) return;
        current.current = loaded;
        setPet(loaded);
        setStatus('ready');
        ready.current = true;
        if (source === 'recovered') {
          setNotice(
            'Your save could not be read. Your companion has a fresh start.',
          );
        } else if (source === 'migrated') {
          setNotice('Welcome back! Your companion has been updated.');
        }
        persist(loaded);
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
      ready.current = false;
    };
  }, [persist, retryCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !ready.current) return;
      const next = advanceCompanion(current.current, Date.now());
      if (next === current.current) return;
      current.current = next;
      setPet(next);
      persist(next);
    });
    return () => subscription.remove();
  }, [persist]);

  const care = useCallback(
    (action: (companion: Companion) => Companion, message: string) => {
      if (!ready.current) return;
      const next = action(current.current);
      current.current = next;
      setPet(next);
      setNotice(message);
      persist(next);
    },
    [persist],
  );

  const retrySave = useCallback(() => {
    if (ready.current) persist(current.current);
  }, [persist]);

  const retry = useCallback(() => {
    setStatus('loading');
    setRetryCount((count) => count + 1);
  }, []);

  return { pet, status, notice, saveError, care, retry, retrySave };
}
