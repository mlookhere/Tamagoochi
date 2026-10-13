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

type WorkshopState = Readonly<{
  inventory: Inventory;
  notice: string;
  echoRound: number;
  echoProgress: number;
}>;

type WorkshopAction =
  | Readonly<{ type: 'craft'; recipeId: RecipeId }>
  | Readonly<{ type: 'echo'; symbol: EchoSymbol }>;

function newWorkshop(): WorkshopState {
  return {
    inventory: createInventory(),
    notice: 'Collect materials, then make something for your companion.',
    echoRound: 0,
    echoProgress: 0,
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
      const reward = giveItem(state.inventory, 'flowerPetal');
      return {
        ...state,
        inventory: reward.inventory,
        echoRound: state.echoRound + 1,
        echoProgress: 0,
        notice: reward.ok
          ? 'Forest Echo complete! Found one flower petal.'
          : 'Forest Echo complete! Your flower petal basket is full.',
      };
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
    inventory: result.inventory,
    notice: `Made a ${name.toLowerCase()}!`,
  };
}

export default function Workshop() {
  const [state, dispatch] = useReducer(reduceWorkshop, undefined, newWorkshop);

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
        Mini game 1 of 3. Repeat the three nature symbols in order. There is
        no timer or penalty.
      </Text>
      <Text style={styles.echoPattern}>
        {echoPattern(state.echoRound).join(' → ')}
      </Text>
      <Text style={styles.ingredients}>
        Step {state.echoProgress + 1} of 3
      </Text>
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
});
