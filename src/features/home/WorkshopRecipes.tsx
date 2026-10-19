import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ITEM_CATALOG,
  RECIPES,
  assessRecipe,
  type Inventory,
  type ItemId,
  type RecipeId,
} from '../../domain/items/inventory';

type Props = Readonly<{
  inventory: Inventory;
  onCraft: (recipeId: RecipeId) => void;
}>;

function ingredientsText(items: Inventory): string {
  return Object.entries(items)
    .map(
      ([id, amount]) =>
        `${amount} ${ITEM_CATALOG[id as ItemId].name.toLowerCase()}`,
    )
    .join(' + ');
}

export function WorkshopRecipes({ inventory, onCraft }: Props) {
  return (
    <View>
      <Text style={styles.heading}>Make something</Text>
      {(Object.keys(RECIPES) as RecipeId[]).map((recipeId) => {
        const recipe = RECIPES[recipeId];
        const assessment = assessRecipe(inventory, recipeId);
        const message = assessment.outputFull
          ? 'Storage full'
          : assessment.canCraft
            ? 'Ready to make'
            : `Need ${ingredientsText(assessment.missing)}`;
        return (
          <View key={recipeId} style={styles.recipe}>
            <View style={styles.info}>
              <Text style={styles.name}>{recipe.name}</Text>
              <Text style={styles.ingredients}>
                {ingredientsText(recipe.ingredients)}
              </Text>
              <Text style={styles.status}>{message}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Make ${recipe.name}`}
              accessibilityHint={message}
              accessibilityState={{ disabled: !assessment.canCraft }}
              disabled={!assessment.canCraft}
              onPress={() => onCraft(recipeId)}
              style={[
                styles.button,
                !assessment.canCraft && styles.unavailable,
              ]}
            >
              <Text style={styles.buttonText}>Make</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: '800',
    color: '#2D4A38',
  },
  recipe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#EFF2E7',
  },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 14, fontWeight: '700', color: '#324B38' },
  ingredients: { fontSize: 12, color: '#6B7A6D' },
  status: { fontSize: 12, fontWeight: '700', color: '#365742' },
  button: {
    minWidth: 72,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#345E46',
  },
  unavailable: { opacity: 0.45 },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
});
