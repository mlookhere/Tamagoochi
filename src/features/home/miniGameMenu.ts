import {
  MINI_GAMES,
  type MiniGame,
  type WorkshopBond,
} from './companionResponse.ts';

const GAME_NAMES: Readonly<Record<MiniGame, string>> = {
  echo: 'Forest Echo',
  skip: 'Stone Skip',
  pairs: 'Meadow Pairs',
};

export type MiniGameOption = Readonly<{
  game: MiniGame;
  name: string;
  firstRewardEarned: boolean;
}>;

// Activity status comes from the existing bond ledger, not a second reward state.
export function miniGameOptions(bond: WorkshopBond): readonly MiniGameOption[] {
  return MINI_GAMES.map((game) => ({
    game,
    name: GAME_NAMES[game],
    firstRewardEarned: bond.completed.includes(game),
  }));
}
