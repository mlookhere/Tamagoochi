// Each pose has a movement signature, not just a different speed.
export const companionMotion = {
  idle: { lift: 3, tilt: 2, pulse: 0.02, duration: 1250 },
  walk: { lift: 7, tilt: 8, pulse: 0.01, duration: 320 },
  eat: { lift: 5, tilt: 3, pulse: 0.07, duration: 260 },
  sleep: { lift: 1, tilt: 2, pulse: -0.02, duration: 2200 },
  clean: { lift: 6, tilt: 8, pulse: 0.04, duration: 400 },
  play: { lift: 12, tilt: 12, pulse: 0.05, duration: 380 },
  happy: { lift: 9, tilt: 6, pulse: 0.07, duration: 460 },
  sad: { lift: 1, tilt: 3, pulse: -0.04, duration: 1700 },
  curious: { lift: 4, tilt: 13, pulse: 0.01, duration: 850 },
  startled: { lift: 13, tilt: 2, pulse: 0.12, duration: 180 },
  pickup: { lift: 10, tilt: 14, pulse: 0.04, duration: 370 },
  return: { lift: 8, tilt: 9, pulse: 0.02, duration: 410 },
  evolution: { lift: 15, tilt: 18, pulse: 0.16, duration: 650 },
} as const;

export type CompanionPose = keyof typeof companionMotion;

export function motionFor(pose: CompanionPose, reduceMotion: boolean) {
  if (reduceMotion) {
    return { lift: 0, tilt: 0, pulse: 0, duration: 0 };
  }
  return companionMotion[pose];
}

// Idle and sustained activities repeat; care gestures and reactions play once.
export const companionPlayback = {
  idle: 'loop',
  walk: 'loop',
  eat: 'once',
  sleep: 'loop',
  clean: 'once',
  play: 'once',
  happy: 'once',
  sad: 'loop',
  curious: 'loop',
  startled: 'once',
  pickup: 'once',
  return: 'once',
  evolution: 'once',
} as const satisfies Record<CompanionPose, 'loop' | 'once'>;

export function playbackFor(pose: CompanionPose): 'loop' | 'once' {
  return companionPlayback[pose];
}

// One-shot reactions use two equal animated halves; a short settle prevents
// Home from interrupting the last frame. Static reactions remain perceivable.
export function reactionResetDelay(pose: CompanionPose, reduced: boolean): number {
  if (playbackFor(pose) === 'loop') return 0;
  if (reduced) return 400;
  return companionMotion[pose].duration * 2 + 80;
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

export type CompanionExpression = (typeof companionExpressions)[CompanionPose];

export function expressionFor(pose: CompanionPose): CompanionExpression {
  return companionExpressions[pose];
}
