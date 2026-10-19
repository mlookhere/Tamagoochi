export const ECHO_SYMBOLS = ['leaf', 'sun', 'stone'] as const;
export type EchoSymbol = (typeof ECHO_SYMBOLS)[number];

const PATTERNS: readonly (readonly EchoSymbol[])[] = [
  ['leaf', 'sun', 'stone'],
  ['stone', 'leaf', 'sun'],
  ['sun', 'stone', 'leaf'],
  ['leaf', 'stone', 'sun'],
];

export function echoPattern(round: number): readonly EchoSymbol[] {
  if (!Number.isSafeInteger(round) || round < 0) {
    throw new Error('Invalid round');
  }
  return PATTERNS[round % PATTERNS.length];
}

export type EchoOutcome = Readonly<{
  progress: number;
  result: 'correct' | 'miss' | 'complete';
}>;

// Wrong guesses simply restart this tiny optional pattern; there is no timer.
export function chooseEcho(
  round: number,
  progress: number,
  chosen: EchoSymbol,
): EchoOutcome {
  const pattern = echoPattern(round);
  if (
    !Number.isSafeInteger(progress) ||
    progress < 0 ||
    progress >= pattern.length
  ) {
    throw new Error('Invalid progress');
  }
  if (!ECHO_SYMBOLS.includes(chosen)) throw new Error('Invalid symbol');
  if (pattern[progress] !== chosen) return { progress: 0, result: 'miss' };
  if (progress + 1 === pattern.length) {
    return { progress: 0, result: 'complete' };
  }
  return { progress: progress + 1, result: 'correct' };
}
