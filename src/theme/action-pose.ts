import type { CompanionPose } from './motion';

export const illustratedActions = [
  'walk',
  'eat',
  'sleep',
  'clean',
  'play',
  'happy',
  'sad',
  'curious',
  'startled',
  'pickup',
  'return',
  'evolution',
] as const satisfies readonly CompanionPose[];

export type IllustratedAction = (typeof illustratedActions)[number];

const actionSet: ReadonlySet<CompanionPose> = new Set(illustratedActions);

export function isIllustratedAction(
  pose: CompanionPose,
): pose is IllustratedAction {
  return actionSet.has(pose);
}
