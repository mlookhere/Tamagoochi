export type OnboardingArtKey = 'welcome' | 'care' | 'explore';

export type OnboardingIllustration = Readonly<{
  key: OnboardingArtKey;
  title: string;
  caption: string;
  description: string;
}>;

export const ONBOARDING_ILLUSTRATIONS: readonly OnboardingIllustration[] = [
  {
    key: 'welcome',
    title: 'Meet a little friend',
    caption: 'A tiny beginning',
    description: 'A smiling sprout-eared companion beneath a warm sun',
  },
  {
    key: 'care',
    title: 'Grow together',
    caption: 'Little acts of kindness',
    description: 'A watering can, a blossoming flower, and a happy companion',
  },
  {
    key: 'explore',
    title: 'Find your own path',
    caption: 'A world waiting outside',
    description: 'A small companion on a winding sunny trail beside a pond',
  },
];
