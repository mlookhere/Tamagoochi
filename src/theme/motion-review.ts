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

export const MOTION_REVIEW_CASES = MOTION_REVIEW_STAGES.flatMap((stage) =>
  MOTION_REVIEW_POSES.map((pose) => ({ stage, pose })),
);

export function motionReviewPosition(stage: CompanionStage, pose: CompanionPose) {
  return MOTION_REVIEW_CASES.findIndex(
    (candidate) => candidate.stage === stage && candidate.pose === pose,
  ) + 1;
}

export function nextMotionReviewCase(stage: CompanionStage, pose: CompanionPose) {
  return MOTION_REVIEW_CASES[
    motionReviewPosition(stage, pose) % MOTION_REVIEW_CASES.length
  ];
}
