export const HOPS = [1, 2, 3] as const;
export type Hop = (typeof HOPS)[number];

const TARGETS = [6, 7, 8, 9] as const;
const MAX_HOPS = 3;

export function skipTarget(round: number): number {
  if (!Number.isSafeInteger(round) || round < 0) {
    throw new Error('Invalid round');
  }
  return TARGETS[round % TARGETS.length];
}

export type SkipOutcome = Readonly<{
  distance: number;
  hops: number;
  result: 'progress' | 'miss' | 'complete';
}>;

// Three deliberate hops must land exactly on the far bank; retries cost nothing.
export function chooseSkip(
  round: number,
  distance: number,
  hops: number,
  hop: Hop,
): SkipOutcome {
  const target = skipTarget(round);
  if (
    !Number.isSafeInteger(distance) ||
    distance < 0 ||
    distance >= target ||
    !Number.isSafeInteger(hops) ||
    hops < 0 ||
    hops >= MAX_HOPS ||
    !HOPS.includes(hop)
  ) {
    throw new Error('Invalid skip');
  }
  const landed = distance + hop;
  const left = MAX_HOPS - hops - 1;
  const remaining = target - landed;
  if (left === 0 && remaining === 0) {
    return { distance: 0, hops: 0, result: 'complete' };
  }
  if (remaining < left || remaining > left * HOPS[HOPS.length - 1]) {
    return { distance: 0, hops: 0, result: 'miss' };
  }
  return { distance: landed, hops: hops + 1, result: 'progress' };
}
