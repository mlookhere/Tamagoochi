// Motion metadata is data, not coupled to the animation renderer.
export const companionMotion = {
  idle: { lift: 3, duration: 1250 },
  walk: { lift: 7, duration: 320 },
  eat: { lift: 5, duration: 260 },
  sleep: { lift: 1, duration: 2200 },
  clean: { lift: 6, duration: 400 },
  play: { lift: 12, duration: 380 },
  happy: { lift: 9, duration: 460 },
  sad: { lift: 1, duration: 1700 },
  curious: { lift: 4, duration: 850 },
  startled: { lift: 13, duration: 180 },
  pickup: { lift: 10, duration: 370 },
  return: { lift: 8, duration: 410 },
  evolution: { lift: 15, duration: 650 },
} as const;

export type CompanionPose = keyof typeof companionMotion;

export function motionFor(pose: CompanionPose, reduceMotion: boolean) {
  return reduceMotion ? { lift: 0, duration: 0 } : companionMotion[pose];
}

export const companionExpressions = {
  idle: 'neutral',
  walk: 'neutral',
  eat: 'neutral',
  sleep: 'asleep',
  clean: 'neutral',
  play: 'joyful',
  happy: 'joyful',
  sad: 'sad',
  curious: 'neutral',
  startled: 'surprised',
  pickup: 'neutral',
  return: 'neutral',
  evolution: 'joyful',
} as const satisfies Record<CompanionPose, string>;

export function expressionFor(pose: CompanionPose) {
  return companionExpressions[pose];
}
