import type { IllustratedAction } from '../theme/action-pose';
import type { CompanionStage } from './companions';

type ActionImages = Record<IllustratedAction, number>;
type ActionArtworkRegistry = Record<CompanionStage, ActionImages>;

// Explicit Metro require calls bundle each transparent 256px native asset.
export const ACTION_ART = {
  seedling: {
    walk: require('../../assets/companions/action-seedling-walk.png') as number,
    eat: require('../../assets/companions/action-seedling-eat.png') as number,
    sleep:
      require('../../assets/companions/action-seedling-sleep.png') as number,
    clean:
      require('../../assets/companions/action-seedling-clean.png') as number,
    play: require('../../assets/companions/action-seedling-play.png') as number,
    pickup:
      require('../../assets/companions/action-seedling-pickup.png') as number,
    evolution:
      require('../../assets/companions/action-seedling-evolution.png') as number,
  },
  bud: {
    walk: require('../../assets/companions/action-bud-walk.png') as number,
    eat: require('../../assets/companions/action-bud-eat.png') as number,
    sleep: require('../../assets/companions/action-bud-sleep.png') as number,
    clean: require('../../assets/companions/action-bud-clean.png') as number,
    play: require('../../assets/companions/action-bud-play.png') as number,
    pickup: require('../../assets/companions/action-bud-pickup.png') as number,
    evolution:
      require('../../assets/companions/action-bud-evolution.png') as number,
  },
  bloom: {
    walk: require('../../assets/companions/action-bloom-walk.png') as number,
    eat: require('../../assets/companions/action-bloom-eat.png') as number,
    sleep: require('../../assets/companions/action-bloom-sleep.png') as number,
    clean: require('../../assets/companions/action-bloom-clean.png') as number,
    play: require('../../assets/companions/action-bloom-play.png') as number,
    pickup:
      require('../../assets/companions/action-bloom-pickup.png') as number,
    evolution:
      require('../../assets/companions/action-bloom-evolution.png') as number,
  },
} as const satisfies ActionArtworkRegistry;

export function actionArtwork(
  stage: CompanionStage,
  pose: IllustratedAction,
): number {
  return ACTION_ART[stage][pose];
}
