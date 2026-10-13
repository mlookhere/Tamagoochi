import type { CompanionPose } from './motion';

export type PoseAccentKind =
  | 'trail'
  | 'berries'
  | 'moon'
  | 'bubbles'
  | 'petals'
  | 'sparkles'
  | 'raindrops'
  | 'leaf'
  | 'rays';

export const companionPoseAccents = {
  idle: null,
  walk: 'trail',
  eat: 'berries',
  sleep: 'moon',
  clean: 'bubbles',
  play: 'petals',
  happy: 'sparkles',
  sad: 'raindrops',
  curious: 'leaf',
  startled: 'rays',
  pickup: 'sparkles',
  return: 'trail',
  evolution: 'petals',
} as const satisfies Record<CompanionPose, PoseAccentKind | null>;

export function poseAccentFor(pose: CompanionPose): PoseAccentKind | null {
  return companionPoseAccents[pose];
}
