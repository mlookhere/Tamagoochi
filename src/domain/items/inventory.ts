export type ItemCategory =
  'food' | 'keepsake' | 'material' | 'toy' | 'furniture' | 'cosmetic';

export const ITEM_CATALOG = {
  wildBerry: { name: 'Wild berry', category: 'food', limit: 99 },
  flowerPetal: { name: 'Flower petal', category: 'material', limit: 99 },
  softFiber: { name: 'Soft fiber', category: 'material', limit: 99 },
  riverStone: { name: 'River stone', category: 'material', limit: 99 },
  picnicSnack: { name: 'Picnic snack', category: 'food', limit: 20 },
  leafToy: { name: 'Leaf spinner', category: 'toy', limit: 10 },
  mossCushion: { name: 'Moss cushion', category: 'furniture', limit: 5 },
  starKeepsake: { name: 'Lucky stone', category: 'keepsake', limit: 10 },
  flowerCrown: { name: 'Flower crown', category: 'cosmetic', limit: 10 },
} as const satisfies Record<
  string,
  Readonly<{ name: string; category: ItemCategory; limit: number }>
>;

export type ItemId = keyof typeof ITEM_CATALOG;
export type Inventory = Readonly<Partial<Record<ItemId, number>>>;
export type InventoryFailure = 'insufficient' | 'full';
export type InventoryResult =
  | Readonly<{ ok: true; inventory: Inventory }>
  | Readonly<{
      ok: false;
      reason: InventoryFailure;
      inventory: Inventory;
    }>;

function validQuantity(quantity: number): boolean {
  return Number.isSafeInteger(quantity) && quantity > 0;
}

function itemLimit(item: ItemId): number {
  const definition: { limit: number } | undefined = ITEM_CATALOG[item];
  if (!definition) throw new Error('Unknown item');
  return definition.limit;
}

function count(inventory: Inventory, item: ItemId): number {
  const quantity = inventory[item] ?? 0;
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error('Invalid inventory');
  }
  return quantity;
}

export function createInventory(): Inventory {
  return {
    wildBerry: 6,
    flowerPetal: 6,
    softFiber: 5,
    riverStone: 2,
  };
}

export function itemCount(inventory: Inventory, item: ItemId): number {
  itemLimit(item);
  return count(inventory, item);
}

export function giveItem(
  inventory: Inventory,
  item: ItemId,
  quantity = 1,
): InventoryResult {
  const limit = itemLimit(item);
  if (!validQuantity(quantity)) throw new Error('Invalid quantity');
  const next = count(inventory, item) + quantity;
  if (next > limit) return { ok: false, reason: 'full', inventory };
  return { ok: true, inventory: { ...inventory, [item]: next } };
}

export function takeItem(
  inventory: Inventory,
  item: ItemId,
  quantity = 1,
): InventoryResult {
  itemLimit(item);
  if (!validQuantity(quantity)) throw new Error('Invalid quantity');
  const next = count(inventory, item) - quantity;
  if (next < 0) return { ok: false, reason: 'insufficient', inventory };
  return { ok: true, inventory: { ...inventory, [item]: next } };
}

export const RECIPES = {
  picnicSnack: {
    name: 'Picnic snack',
    ingredients: { wildBerry: 2, flowerPetal: 1 },
    output: 'picnicSnack',
  },
  leafToy: {
    name: 'Leaf spinner',
    ingredients: { flowerPetal: 2, softFiber: 1 },
    output: 'leafToy',
  },
  mossCushion: {
    name: 'Moss cushion',
    ingredients: { flowerPetal: 2, softFiber: 2 },
    output: 'mossCushion',
  },
  starKeepsake: {
    name: 'Lucky stone',
    ingredients: { riverStone: 1, softFiber: 1 },
    output: 'starKeepsake',
  },
  flowerCrown: {
    name: 'Flower crown',
    ingredients: { flowerPetal: 3, softFiber: 1 },
    output: 'flowerCrown',
  },
} as const satisfies Record<
  string,
  Readonly<{ name: string; ingredients: Inventory; output: ItemId }>
>;

export type RecipeId = keyof typeof RECIPES;

export type RecipeAssessment = Readonly<{
  canCraft: boolean;
  outputFull: boolean;
  missing: Inventory;
}>;

// One shared availability check keeps button state and transactions consistent.
export function assessRecipe(
  inventory: Inventory,
  recipeId: RecipeId,
): RecipeAssessment {
  const recipe = RECIPES[recipeId];
  if (!recipe) throw new Error('Unknown recipe');
  const outputFull = count(inventory, recipe.output) >= itemLimit(recipe.output);
  const missing: Record<string, number> = {};
  for (const [id, amount] of Object.entries(recipe.ingredients)) {
    const shortage = amount - count(inventory, id as ItemId);
    if (shortage > 0) missing[id] = shortage;
  }
  return {
    canCraft: !outputFull && Object.keys(missing).length === 0,
    outputFull,
    missing,
  };
}

export function craftItem(
  inventory: Inventory,
  recipeId: RecipeId,
): InventoryResult {
  const assessment = assessRecipe(inventory, recipeId);
  if (!assessment.canCraft) {
    return {
      ok: false,
      reason: assessment.outputFull ? 'full' : 'insufficient',
      inventory,
    };
  }
  const recipe = RECIPES[recipeId];
  const next: Record<string, number> = { ...inventory };
  for (const [id, amount] of Object.entries(recipe.ingredients)) {
    next[id] = (next[id] ?? 0) - amount;
  }
  next[recipe.output] = (next[recipe.output] ?? 0) + 1;
  return { ok: true, inventory: next };
}
