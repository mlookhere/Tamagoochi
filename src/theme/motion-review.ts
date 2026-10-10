import type { CompanionStage } from '../assets/companions';
import type { CompanionPose } from './motion';

export const MOTION_REVIEW_STAGES = [
  'seedling',
  'bud',
  'bloom',
] as const satisfies readonly CompanionStage[];

export const MOTION_REVIEW_POSES = [
  'idle',
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

export function motionCaseId(stage: CompanionStage, pose: CompanionPose) {
  return `${stage}-${pose}`;
}
