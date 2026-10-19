import { useReducer } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Page } from '../components/Page';
import {
  ITEM_CATALOG,
  RECIPES,
  craftItem,
  createInventory,
  giveItem,
  itemCount,
  type Inventory,
  type ItemId,
  type RecipeId,
} from '../domain/items/inventory';
import {
  ECHO_SYMBOLS,
  chooseEcho,
  echoPattern,
  type EchoSymbol,
} from '../features/minigames/echo';
import {
  choosePair,
  closePair,
  newPairs,
  pairBoard,
  type PairsState,
} from '../features/minigames/pairs';
import {
  HOPS,
  chooseSkip,
  skipTarget,
  type Hop,
} from '../features/minigames/skips';

type WorkshopState = Readonly<{
  inventory: Inventory;
  notice: string;
  echoRound: number;
  echoProgress: number;
  skipRound: number;
  skipDistance: number;
  skipHops: number;
  pairs: PairsState;
}>;

type WorkshopAction =
  | Readonly<{ type: 'craft'; recipeId: RecipeId }>
  | Readonly<{ type: 'echo'; symbol: EchoSymbol }>
  | Readonly<{ type: 'skip'; hop: Hop }>
  | Readonly<{ type: 'pair'; card: number }>
  | Readonly<{ type: 'closePair' }>;

function newWorkshop(): WorkshopState {
  return {
    inventory: createInventory(),
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
): WorkshopState {
  const reward = giveItem(state.inventory, item);
  return {
    ...state,
    inventory: reward.inventory,
    notice: reward.ok
      ? `${success} Found one ${ITEM_CATALOG[item].name.toLowerCase()}.`
      : `${success} Your ${ITEM_CATALOG[item].name.toLowerCase()} basket is full.`,
  };
}

function reduceWorkshop(
  state: WorkshopState,
  action: WorkshopAction,
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
      );
    }
    return {
      ...state,
      skipDistance: outcome.distance,
      skipHops: outcome.hops,
      notice:
        outcome.result === 'miss'
          ? 'That route cannot reach the shore in three hops. Try again!'
          : `Nice hop! ${skipTarget(state.skipRound) - outcome.distance} spaces left.`,
    };
  }

  if (action.type === 'pair') {
    const outcome = choosePair(state.pairs, action.card);
    if (outcome.result === 'complete') {
      return rewardWorkshop(
        { ...state, pairs: outcome.state },
        'softFiber',
        'Meadow Pairs complete!',
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

export default function Workshop() {
  const [state, dispatch] = useReducer(reduceWorkshop, undefined, newWorkshop);
  const board = pairBoard(state.pairs.round);
  const reviewing = state.pairs.revealed.length === 2;

  return (
    <Page
      eyebrow="Your tiny workshop"
      title="Make a little something."
      description="Combine simple discoveries into treats, toys, keepsakes, and room decor."
    >
      <Text style={styles.preview}>
        Preview inventory. Saving your crafted items will be added after native
        persistence approval.
      </Text>
      <Text accessibilityRole="summary" style={styles.notice}>
        {state.notice}
      </Text>
      <Text style={styles.heading}>Your basket</Text>
      <View style={styles.inventory}>
        {(Object.keys(ITEM_CATALOG) as ItemId[]).map((item) => (
          <View key={item} style={styles.inventoryRow}>
            <View>
              <Text style={styles.itemName}>{ITEM_CATALOG[item].name}</Text>
              <Text style={styles.category}>{ITEM_CATALOG[item].category}</Text>
            </View>
            <Text style={styles.quantity}>
              {itemCount(state.inventory, item)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.heading}>Make something</Text>
      {(Object.keys(RECIPES) as RecipeId[]).map((recipeId) => {
        const recipe = RECIPES[recipeId];
        const requirements = Object.entries(recipe.ingredients)
          .map(
            ([id, amount]) =>
              `${amount} ${ITEM_CATALOG[id as ItemId].name.toLowerCase()}`,
          )
          .join(' + ');
        return (
          <View key={recipeId} style={styles.recipe}>
            <View style={styles.recipeInfo}>
              <Text style={styles.itemName}>{recipe.name}</Text>
              <Text style={styles.ingredients}>{requirements}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Make ${recipe.name}`}
              onPress={() => dispatch({ type: 'craft', recipeId })}
              style={styles.makeButton}
            >
              <Text style={styles.makeText}>Make</Text>
            </Pressable>
          </View>
        );
      })}
      <Text style={styles.heading}>Forest Echo</Text>
      <Text style={styles.ingredients}>
        Mini game 1 of 3. Repeat the three nature symbols in order. There is no
        timer or penalty.
      </Text>
      <Text style={styles.echoPattern}>
        {echoPattern(state.echoRound).join(' → ')}
      </Text>
      <Text style={styles.ingredients}>Step {state.echoProgress + 1} of 3</Text>
      <View style={styles.echoChoices}>
        {ECHO_SYMBOLS.map((symbol) => (
          <Pressable
            key={symbol}
            accessibilityRole="button"
            accessibilityLabel={`Choose ${symbol} in Forest Echo`}
            style={styles.echoButton}
            onPress={() => dispatch({ type: 'echo', symbol })}
          >
            <Text style={styles.makeText}>{symbol}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.heading}>Stone Skip</Text>
      <Text style={styles.ingredients}>
        Mini game 2 of 3. Cross the river in exactly three hops. Choose 1, 2,
        or 3 spaces per hop. An impossible route restarts without penalty.
      </Text>
      <Text style={styles.echoPattern}>
        {state.skipDistance} / {skipTarget(state.skipRound)} spaces
      </Text>
      <Text style={styles.ingredients}>Hop {state.skipHops + 1} of 3</Text>
      <View style={styles.echoChoices}>
        {HOPS.map((hop) => (
          <Pressable
            key={hop}
            accessibilityRole="button"
            accessibilityLabel={`Hop ${hop} spaces in Stone Skip`}
            style={styles.echoButton}
            onPress={() => dispatch({ type: 'skip', hop })}
          >
            <Text style={styles.makeText}>{hop} spaces</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.heading}>Meadow Pairs</Text>
      <Text style={styles.ingredients}>
        Mini game 3 of 3. Find the three matching symbol pairs. Unmatched cards
        stay visible until you turn them over. No timer or penalty.
      </Text>
      <Text style={styles.echoPattern}>
        {state.pairs.matched.length / 2} of 3 pairs found
      </Text>
      <View style={styles.pairGrid}>
        {board.map((symbol, card) => {
          const matched = state.pairs.matched.includes(card);
          const visible = matched || state.pairs.revealed.includes(card);
          return (
            <Pressable
              key={card}
              accessibilityRole="button"
              accessibilityLabel={`Card ${card + 1}, ${visible ? symbol : 'hidden'}`}
              accessibilityState={{ disabled: matched || reviewing }}
              disabled={matched || reviewing}
              style={[styles.pairCard, matched && styles.matchedCard]}
              onPress={() => dispatch({ type: 'pair', card })}
            >
              <Text style={styles.makeText}>{visible ? symbol : '?'}</Text>
            </Pressable>
          );
        })}
      </View>
      {reviewing && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Turn over unmatched cards and try again"
          style={styles.closeButton}
          onPress={() => dispatch({ type: 'closePair' })}
        >
          <Text style={styles.makeText}>Try another pair</Text>
        </Pressable>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  preview: { color: '#755F42', fontSize: 13, lineHeight: 19 },
  notice: {
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    color: '#355944',
    backgroundColor: '#E3EDD9',
    fontWeight: '600',
  },
  heading: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: '800',
    color: '#2D4A38',
  },
  inventory: { gap: 8 },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EFF2E7',
  },
  itemName: { fontSize: 14, fontWeight: '700', color: '#324B38' },
  category: { marginTop: 3, fontSize: 11, color: '#6B7A6D' },
  quantity: { fontSize: 15, fontWeight: '800', color: '#3E694A' },
  recipe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#EFF2E7',
  },
  recipeInfo: { flex: 1, gap: 5 },
  ingredients: { fontSize: 12, color: '#6B7A6D' },
  makeButton: {
    minWidth: 72,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#345E46',
  },
  makeText: { color: '#FFFFFF', fontWeight: '800' },
  echoPattern: {
    marginVertical: 12,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    color: '#345E46',
  },
  echoChoices: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 28,
  },
  echoButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#345E46',
  },
  pairGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pairCard: {
    width: '31%',
    minHeight: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#345E46',
  },
  matchedCard: { backgroundColor: '#627F5D' },
  closeButton: {
    minHeight: 48,
    marginTop: 12,
    marginBottom: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#345E46',
  },
});
