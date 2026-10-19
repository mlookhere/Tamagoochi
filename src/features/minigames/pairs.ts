export const PAIR_SYMBOLS = ['leaf', 'sun', 'stone'] as const;
export type PairSymbol = (typeof PAIR_SYMBOLS)[number];

const BOARDS: readonly (readonly PairSymbol[])[] = [
  ['leaf', 'sun', 'stone', 'stone', 'sun', 'leaf'],
  ['stone', 'leaf', 'sun', 'leaf', 'stone', 'sun'],
  ['sun', 'stone', 'leaf', 'sun', 'leaf', 'stone'],
  ['leaf', 'stone', 'sun', 'leaf', 'sun', 'stone'],
];

export type PairsState = Readonly<{
  round: number;
  matched: readonly number[];
  revealed: readonly number[];
}>;

export type PairOutcome = Readonly<{
  state: PairsState;
  result: 'reveal' | 'match' | 'miss' | 'complete' | 'ignored';
}>;

export function newPairs(): PairsState {
  return { round: 0, matched: [], revealed: [] };
}

export function pairBoard(round: number): readonly PairSymbol[] {
  if (!Number.isSafeInteger(round) || round < 0) {
    throw new Error('Invalid round');
  }
  return BOARDS[round % BOARDS.length];
}

export function choosePair(state: PairsState, card: number): PairOutcome {
  const board = pairBoard(state.round);
  if (!Number.isSafeInteger(card) || card < 0 || card >= board.length) {
    throw new Error('Invalid card');
  }
  if (
    state.matched.some(
      (index) =>
        !Number.isSafeInteger(index) || index < 0 || index >= board.length,
    ) ||
    state.revealed.some(
      (index) =>
        !Number.isSafeInteger(index) || index < 0 || index >= board.length,
    ) ||
    new Set([...state.matched, ...state.revealed]).size !==
      state.matched.length + state.revealed.length ||
    state.revealed.length > 2 ||
    state.matched.length > board.length - 2
  ) {
    throw new Error('Invalid pair state');
  }
  if (
    state.matched.includes(card) ||
    state.revealed.includes(card) ||
    state.revealed.length === 2
  ) {
    return { state, result: 'ignored' };
  }
  if (state.revealed.length === 0) {
    return { state: { ...state, revealed: [card] }, result: 'reveal' };
  }
  const first = state.revealed[0];
  if (board[first] !== board[card]) {
    return {
      state: { ...state, revealed: [first, card] },
      result: 'miss',
    };
  }
  const matched = [...state.matched, first, card];
  if (matched.length === board.length) {
    return {
      state: { round: state.round + 1, matched: [], revealed: [] },
      result: 'complete',
    };
  }
  return { state: { ...state, matched, revealed: [] }, result: 'match' };
}

// A mismatched pair stays visible until the player explicitly closes it.
export function closePair(state: PairsState): PairsState {
  return state.revealed.length === 2 ? { ...state, revealed: [] } : state;
}
