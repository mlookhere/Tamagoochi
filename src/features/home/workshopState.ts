import {
  ITEM_CATALOG,
  RECIPES,
  craftItem,
  createInventory,
  giveItem,
  type Inventory,
  type ItemId,
  type RecipeId,
} from '../../domain/items/inventory.ts';
import {
  completeMiniGame,
  createWorkshopBond,
  placedItemReaction,
  sharePicnicSnack,
  type MiniGame,
  type WorkshopBond,
} from './companionResponse.ts';
import {
  pickUpRoomItem,
  placeRoomItem,
  type Room,
  type RoomItem,
  type RoomSlot,
} from './room.ts';
import { chooseEcho, type EchoSymbol } from '../minigames/echo.ts';
import {
  choosePair,
  closePair,
  newPairs,
  type PairsState,
} from '../minigames/pairs.ts';
import { chooseSkip, skipTarget, type Hop } from '../minigames/skips.ts';

export type WorkshopState = Readonly<{
  inventory: Inventory;
  bond: WorkshopBond;
  room: Room;
  selectedRoomItem: RoomItem | null;
  notice: string;
  echoRound: number;
  echoProgress: number;
  skipRound: number;
  skipDistance: number;
  skipHops: number;
  pairs: PairsState;
}>;

export type WorkshopAction =
  | Readonly<{ type: 'craft'; recipeId: RecipeId }>
  | Readonly<{ type: 'shareSnack' }>
  | Readonly<{ type: 'echo'; symbol: EchoSymbol }>
  | Readonly<{ type: 'skip'; hop: Hop }>
  | Readonly<{ type: 'pair'; card: number }>
  | Readonly<{ type: 'closePair' }>
  | Readonly<{ type: 'roomItem'; item: RoomItem }>
  | Readonly<{ type: 'roomSlot'; slot: RoomSlot }>;

export function newWorkshop(): WorkshopState {
  return {
    inventory: createInventory(),
    bond: createWorkshopBond(),
    room: {},
    selectedRoomItem: null,
    notice: 'Collect materials, then make something for your companion.',
    echoRound: 0,
    echoProgress: 0,
    skipRound: 0,
    skipDistance: 0,
    skipHops: 0,
    pairs: newPairs(),
  };
}

function rewardWorkshop(
  state: WorkshopState,
  item: ItemId,
  success: string,
  game: MiniGame,
): WorkshopState {
  const reward = giveItem(state.inventory, item);
  const bond = completeMiniGame(state.bond, game);
  const bondMessage = bond === state.bond ? '' : ' Your bond grew!';
  const itemName = ITEM_CATALOG[item].name.toLowerCase();
  return {
    ...state,
    inventory: reward.inventory,
    bond,
    notice: reward.ok
      ? `${success} Found one ${itemName}.${bondMessage}`
      : `${success} Your ${itemName} basket is full.${bondMessage}`,
  };
}

function reduceRoom(
  state: WorkshopState,
  action: Extract<WorkshopAction, { type: 'roomItem' | 'roomSlot' }>,
): WorkshopState {
  if (action.type === 'roomItem') {
    return {
      ...state,
      selectedRoomItem: action.item,
      notice:
        'Tap an empty room space to place your ' +
        ITEM_CATALOG[action.item].name.toLowerCase() +
        '.',
    };
  }

  const occupant = state.room[action.slot];
  if (occupant) {
    const result = pickUpRoomItem(state.inventory, state.room, action.slot);
    return {
      ...state,
      inventory: result.inventory,
      room: result.room,
      selectedRoomItem: null,
      notice: result.ok
        ? 'Picked up your ' + ITEM_CATALOG[occupant].name.toLowerCase() + '.'
        : 'Your basket is full. This object stays in the room.',
    };
  }
  const item = state.selectedRoomItem;
  if (!item) {
    return { ...state, notice: 'Select a crafted object before placing it.' };
  }
  const result = placeRoomItem(state.inventory, state.room, action.slot, item);
  return {
    ...state,
    inventory: result.inventory,
    room: result.room,
    selectedRoomItem: result.ok ? null : item,
    notice: result.ok
      ? placedItemReaction(item)
      : 'Craft this object before placing it.',
  };
}

function reduceMiniGame(
  state: WorkshopState,
  action: Extract<
    WorkshopAction,
    { type: 'echo' | 'skip' | 'pair' | 'closePair' }
  >,
): WorkshopState {
  if (action.type === 'echo') {
    const outcome = chooseEcho(
      state.echoRound,
      state.echoProgress,
      action.symbol,
    );
    if (outcome.result === 'complete') {
      return rewardWorkshop(
        { ...state, echoRound: state.echoRound + 1, echoProgress: 0 },
        'flowerPetal',
        'Forest Echo complete!',
        'echo',
      );
    }
    return {
      ...state,
      echoProgress: outcome.progress,
      notice:
        outcome.result === 'miss'
          ? 'Try the pattern again. No penalty.'
          : 'Good match! Keep going.',
    };
  }

  if (action.type === 'skip') {
    const outcome = chooseSkip(
      state.skipRound,
      state.skipDistance,
      state.skipHops,
      action.hop,
    );
    if (outcome.result === 'complete') {
      return rewardWorkshop(
        {
          ...state,
          skipRound: state.skipRound + 1,
          skipDistance: 0,
          skipHops: 0,
        },
        'riverStone',
        'Stone Skip complete!',
        'skip',
      );
    }
    const remaining = skipTarget(state.skipRound) - outcome.distance;
    return {
      ...state,
      skipDistance: outcome.distance,
      skipHops: outcome.hops,
      notice:
        outcome.result === 'miss'
          ? 'That route cannot reach the shore in three hops. Try again!'
          : `Nice hop! ${remaining} spaces left.`,
    };
  }

  if (action.type === 'pair') {
    const outcome = choosePair(state.pairs, action.card);
    if (outcome.result === 'complete') {
      return rewardWorkshop(
        { ...state, pairs: outcome.state },
        'softFiber',
        'Meadow Pairs complete!',
        'pairs',
      );
    }
    const notices = {
      reveal: 'One card revealed. Find its matching symbol.',
      match: 'A matching pair! Keep going.',
      miss: 'Look at both cards, then choose Try another pair.',
      ignored: state.notice,
    } as const;
    return { ...state, pairs: outcome.state, notice: notices[outcome.result] };
  }

  if (action.type === 'closePair') {
    return {
      ...state,
      pairs: closePair(state.pairs),
      notice: 'Cards turned over. Try another pair!',
    };
  }

  throw new Error('Unknown minigame action');
}

export function reduceWorkshop(
  state: WorkshopState,
  action: WorkshopAction,
): WorkshopState {
  if (action.type === 'shareSnack') {
    const result = sharePicnicSnack(state.inventory, state.bond);
    return {
      ...state,
      inventory: result.inventory,
      bond: result.bond,
      notice: !result.ok
        ? 'Craft a picnic snack before sharing.'
        : result.bond === state.bond
          ? 'Mochi enjoyed sharing another snack!'
          : 'Mochi loved the picnic snack. Your bond grew!',
    };
  }

  if (action.type === 'roomItem' || action.type === 'roomSlot') {
    return reduceRoom(state, action);
  }

  if (
    action.type === 'echo' ||
    action.type === 'skip' ||
    action.type === 'pair' ||
    action.type === 'closePair'
  ) {
    return reduceMiniGame(state, action);
  }

  const result = craftItem(state.inventory, action.recipeId);
  const name = RECIPES[action.recipeId].name;
  if (!result.ok) {
    return {
      ...state,
      notice:
        result.reason === 'full'
          ? `No room to store another ${name.toLowerCase()}.`
          : `More materials are needed for ${name.toLowerCase()}.`,
    };
  }
  return {
    ...state,
    inventory: result.inventory,
    notice: `Made a ${name.toLowerCase()}!`,
  };
}
