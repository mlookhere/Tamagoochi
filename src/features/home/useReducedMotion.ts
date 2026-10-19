import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { createMotionPreferenceGuard } from './motionPreference';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const guard = createMotionPreferenceGuard(setReduced);
    // Subscribe before requesting the snapshot so a delayed read cannot win.
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      guard.onChange,
    );
    AccessibilityInfo.isReduceMotionEnabled()
      .then(guard.onInitial)
      .catch(() => guard.onInitial(true));
    return () => {
      guard.dispose();
      subscription.remove();
    };
  }, []);

  return reduced;
}
