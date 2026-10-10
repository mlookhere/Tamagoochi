import type { OnboardingArtKey } from '../theme/onboarding';

// Static Metro imports: keep all three original exports bundled on iOS/Android.
export const ONBOARDING_ART = {
  welcome: require('../../assets/onboarding/welcome.png') as number,
  care: require('../../assets/onboarding/care.png') as number,
  explore: require('../../assets/onboarding/explore.png') as number,
} as const satisfies Record<OnboardingArtKey, number>;
