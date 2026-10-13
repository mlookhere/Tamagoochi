import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Shared by the companion and the development-only motion review screen.
export function useSystemReduceMotion(): boolean | null {
  const [preference, setPreference] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    let observedChange = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        observedChange = true;
        if (active) setPreference(enabled);
      },
    );

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active && !observedChange) setPreference(enabled);
      })
      .catch(() => {
        if (active && !observedChange) setPreference(null);
      });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return preference;
}
