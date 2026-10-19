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

function validCard(card: number, length: number): boolean {
  return Number.isSafeInteger(card) && card >= 0 && card < length;
}

function matchedSymbolsAgree(
  matched: readonly number[],
  board: readonly PairSymbol[],
): boolean {
  if (matched.length % 2 !== 0) return false;
  for (let i = 0; i < matched.length; i += 2) {
    if (board[matched[i]] !== board[matched[i + 1]]) return false;
  }
  return true;
}

function validatePairState(
  state: PairsState,
  board: readonly PairSymbol[],
): void {
  const indices = [...state.matched, ...state.revealed];
  if (
    indices.some((index) => !validCard(index, board.length)) ||
    new Set(indices).size !== indices.length ||
    state.revealed.length > 2 ||
    state.matched.length > board.length - 2 ||
    !matchedSymbolsAgree(state.matched, board) ||
    (state.revealed.length === 2 &&
      board[state.revealed[0]] === board[state.revealed[1]])
  ) {
    throw new Error('Invalid pair state');
  }
}

export function choosePair(state: PairsState, card: number): PairOutcome {
  const board = pairBoard(state.round);
  if (!validCard(card, board.length)) throw new Error('Invalid card');
  validatePairState(state, board);
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
  validatePairState(state, pairBoard(state.round));
  return state.revealed.length === 2 ? { ...state, revealed: [] } : state;
}
