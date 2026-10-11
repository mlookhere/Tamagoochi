import type { CompanionPose } from './motion';

export type IllustratedAction = 'eat' | 'clean' | 'play';

export function isIllustratedAction(
  pose: CompanionPose,
): pose is IllustratedAction {
  return pose === 'eat' || pose === 'clean' || pose === 'play';
}
