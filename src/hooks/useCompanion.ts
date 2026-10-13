import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  advanceCompanion,
  createCompanion,
  type Companion,
} from '../domain/pet/state';
import { companionSession } from '../storage/session';

export type CompanionLoadState = 'loading' | 'ready' | 'error' | 'unsupported';

export function useCompanion() {
  const [pet, setPet] = useState(() => createCompanion());
  const [status, setStatus] = useState<CompanionLoadState>('loading');
  const [notice, setNotice] = useState(
    'A new little friend is waiting for you.',
  );
  const [saveError, setSaveError] = useState(false);
  const [observedAt, setObservedAt] = useState(() => Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const current = useRef(pet);
  const ready = useRef(false);
  const mounted = useRef(false);
  const saveRevision = useRef(0);

  const persist = useCallback((next: Companion) => {
    const revision = ++saveRevision.current;
    companionSession
      .save(next)
      .then(() => {
        if (mounted.current && revision === saveRevision.current) {
          setSaveError(false);
        }
      })
      .catch(() => {
        if (mounted.current && revision === saveRevision.current) {
          setSaveError(true);
        }
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
    const now = Date.now();
    companionSession
      .load(now)
      .then(({ pet: loaded, source, unsaved }) => {
        if (cancelled) return;
        if (source === 'unsupported') {
          // Preserve the newer save on disk; do not enable or persist gameplay.
          setStatus('unsupported');
          return;
        }
        setObservedAt(now);
        current.current = loaded;
        setPet(loaded);
        setStatus('ready');
        ready.current = true;
        setSaveError(unsaved);
        if (unsaved) {
          setNotice('Your latest care is still waiting to save on this device.');
        } else if (source === 'recovered') {
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
      const now = Date.now();
      setObservedAt(now);
      const next = advanceCompanion(current.current, now);
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

  return { pet, status, notice, saveError, care, retry, retrySave, observedAt };
}
