import type { CompanionStage } from './companions';
import type { CompanionPose } from '../theme/motion';

export type IllustratedAction = 'eat' | 'clean' | 'play';

// Exact native Metro imports, with new transparent 256px action artwork.
export const ACTION_ART = {
  seedling: {
    eat: require('../../assets/companions/action-seedling-eat.png') as number,
    clean: require('../../assets/companions/action-seedling-clean.png') as number,
    play: require('../../assets/companions/action-seedling-play.png') as number,
  },
  bud: {
    eat: require('../../assets/companions/action-bud-eat.png') as number,
    clean: require('../../assets/companions/action-bud-clean.png') as number,
    play: require('../../assets/companions/action-bud-play.png') as number,
  },
  bloom: {
    eat: require('../../assets/companions/action-bloom-eat.png') as number,
    clean: require('../../assets/companions/action-bloom-clean.png') as number,
    play: require('../../assets/companions/action-bloom-play.png') as number,
  },
} as const satisfies Record<CompanionStage, Record<IllustratedAction, number>>;

export function isIllustratedAction(pose: CompanionPose): pose is IllustratedAction {
  return pose === 'eat' || pose === 'clean' || pose === 'play';
}

export function actionArtwork(
  stage: CompanionStage,
  pose: IllustratedAction,
): number {
  return ACTION_ART[stage][pose];
}
