import type { Room, RoomItem } from './room.ts';

export const MINI_GAMES = ['echo', 'skip', 'pairs'] as const;
export type MiniGame = (typeof MINI_GAMES)[number];

export type Personality = Readonly<{
  curiosity: number;
  courage: number;
  focus: number;
}>;

export type WorkshopBond = Readonly<{
  bond: number;
  personality: Personality;
  completed: readonly MiniGame[];
}>;

const GAME_TRAITS: Readonly<Record<MiniGame, keyof Personality>> = {
  echo: 'focus',
  skip: 'courage',
  pairs: 'curiosity',
};

export function createWorkshopBond(): WorkshopBond {
  return {
    bond: 40,
    personality: { curiosity: 0, courage: 0, focus: 0 },
    completed: [],
  };
}

// Each activity rewards connection once; replay remains optional and penalty-free.
export function completeMiniGame(
  state: WorkshopBond,
  game: MiniGame,
): WorkshopBond {
  if (!MINI_GAMES.includes(game)) throw new Error('Unknown minigame');
  if (state.completed.includes(game)) return state;
  const trait = GAME_TRAITS[game];
  return {
    bond: Math.min(100, state.bond + 8),
    personality: {
      ...state.personality,
      [trait]: state.personality[trait] + 1,
    },
    completed: [...state.completed, game],
  };
}

export type RoomPreference = 'favorite' | 'wary' | 'neutral';

export const ROOM_PREFERENCES: Readonly<Record<RoomItem, RoomPreference>> = {
  leafToy: 'favorite',
  mossCushion: 'favorite',
  starKeepsake: 'wary',
  flowerCrown: 'neutral',
};

const PLACEMENT_REACTIONS: Readonly<Record<RoomItem, string>> = {
  leafToy: 'Mochi perks up and follows the spinning leaf.',
  mossCushion: 'Mochi nestles close to the soft cushion.',
  starKeepsake: 'Mochi watches the shiny stone cautiously.',
  flowerCrown: 'Mochi tilts their head at the flower crown.',
};

export function placedItemReaction(item: RoomItem): string {
  const reaction = PLACEMENT_REACTIONS[item];
  if (!reaction) throw new Error('Unknown room item');
  return reaction;
}

export function roomMood(room: Room): string {
  const preferences = Object.values(room).map((item) => ROOM_PREFERENCES[item]);
  const favorite = preferences.includes('favorite');
  const wary = preferences.includes('wary');
  if (favorite && wary) {
    return 'Mochi enjoys the cozy decor but keeps an eye on the shiny stone.';
  }
  if (favorite) return 'Mochi feels at home near a favorite object.';
  if (wary) return 'Mochi gives the shiny stone a little space.';
  if (preferences.length) return 'Mochi is curious about the new decor.';
  return 'Mochi is ready to discover what you make next.';
}
