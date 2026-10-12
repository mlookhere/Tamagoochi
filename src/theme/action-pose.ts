import type { CompanionPose } from './motion';

export type IllustratedAction =
  | 'walk'
  | 'eat'
  | 'sleep'
  | 'clean'
  | 'play'
  | 'pickup'
  | 'evolution';

export function isIllustratedAction(
  pose: CompanionPose,
): pose is IllustratedAction {
  switch (pose) {
    case 'walk':
    case 'eat':
    case 'sleep':
    case 'clean':
    case 'play':
    case 'pickup':
    case 'evolution':
      return true;
    default:
      return false;
  }
}
