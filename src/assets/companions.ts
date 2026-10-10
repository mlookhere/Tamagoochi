import type { CompanionExpression } from '../theme/motion';

export type CompanionStage = 'seedling' | 'bud' | 'bloom';

// Explicit Metro require() calls are needed for static native bundling.
export const COMPANION_ART = {
  seedling: {
    neutral: require('../../assets/companions/seedling-neutral.png') as number,
    joyful: require('../../assets/companions/seedling-joyful.png') as number,
    sad: require('../../assets/companions/seedling-sad.png') as number,
    asleep: require('../../assets/companions/seedling-asleep.png') as number,
    surprised:
      require('../../assets/companions/seedling-surprised.png') as number,
  },
  bud: {
    neutral: require('../../assets/companions/bud-neutral.png') as number,
    joyful: require('../../assets/companions/bud-joyful.png') as number,
    sad: require('../../assets/companions/bud-sad.png') as number,
    asleep: require('../../assets/companions/bud-asleep.png') as number,
    surprised: require('../../assets/companions/bud-surprised.png') as number,
  },
  bloom: {
    neutral: require('../../assets/companions/bloom-neutral.png') as number,
    joyful: require('../../assets/companions/bloom-joyful.png') as number,
    sad: require('../../assets/companions/bloom-sad.png') as number,
    asleep: require('../../assets/companions/bloom-asleep.png') as number,
    surprised: require('../../assets/companions/bloom-surprised.png') as number,
  },
} as const;

export function getCompanionArtwork(
  expression: CompanionExpression,
  stage: CompanionStage = 'seedling',
): number {
  return COMPANION_ART[stage][expression];
}
