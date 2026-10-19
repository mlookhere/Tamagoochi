import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ITEM_CATALOG,
  RECIPES,
  assessRecipe,
  craftItem,
  createInventory,
  giveItem,
  itemCount,
  takeItem,
  type ItemId,
  type RecipeId,
} from './inventory.ts';

test('starter inventory has an original item in each supported category', () => {
  const categories = new Set(
    Object.values(ITEM_CATALOG).map((item) => item.category),
  );
  assert.deepEqual([...categories].sort(), [
    'cosmetic',
    'food',
    'furniture',
    'keepsake',
    'material',
    'toy',
  ]);
  for (const [key, amount] of Object.entries(createInventory())) {
    const id = key as ItemId;
    assert.ok(itemCount(createInventory(), id) > 0);
    assert.ok(amount <= ITEM_CATALOG[id].limit);
  }
});

test('grant and spend change only the copy and obey stack and quantity limits', () => {
  const start = createInventory();
  const given = giveItem(start, 'wildBerry', 2);
  assert.equal(given.ok, true);
  if (!given.ok) return;
  assert.equal(itemCount(start, 'wildBerry'), 6);
  assert.equal(itemCount(given.inventory, 'wildBerry'), 8);
  const spent = takeItem(given.inventory, 'wildBerry', 2);
  assert.equal(spent.ok, true);
  if (!spent.ok) return;
  assert.equal(itemCount(spent.inventory, 'wildBerry'), 6);
  assert.deepEqual(spent.inventory, start);
  assert.equal(itemCount(start, 'flowerCrown'), 0);

  const full = giveItem({ wildBerry: 99 }, 'wildBerry');
  assert.deepEqual(full, {
    ok: false,
    reason: 'full',
    inventory: { wildBerry: 99 },
  });
  const insufficient = takeItem(start, 'riverStone', 3);
  assert.equal(insufficient.ok, false);
  assert.equal(insufficient.inventory, start);
  assert.equal(takeItem(start, 'riverStone', 2).ok, true);
  assert.equal(giveItem({}, 'flowerCrown').ok, true);
});

test('invalid item IDs, quantities, and inventory values fail closed', () => {
  const items = createInventory();
  for (const quantity of [0, -1, 0.5, NaN, Infinity, 2 ** 53]) {
    assert.throws(() => giveItem(items, 'wildBerry', quantity));
    assert.throws(() => takeItem(items, 'wildBerry', quantity));
  }
  const missing = 'badItem' as ItemId;
  assert.throws(() => itemCount(items, missing));
  assert.throws(() => giveItem(items, missing));
  assert.throws(() => takeItem(items, missing));
  assert.throws(() => itemCount({ wildBerry: -1 }, 'wildBerry'));
  assert.throws(() => takeItem({ wildBerry: 1.5 }, 'wildBerry'));
  assert.throws(() => giveItem({ wildBerry: NaN }, 'wildBerry'));
});

test('all five original crafting recipes consume materials transactionally', () => {
  for (const [name, recipe] of Object.entries(RECIPES)) {
    const supplies = Object.fromEntries(
      Object.entries(recipe.ingredients).map(([item, amount]) => [
        item,
        amount,
      ]),
    );
    const before = { ...supplies };
    const result = craftItem(supplies, name as RecipeId);
    assert.equal(result.ok, true);
    if (!result.ok) continue;
    assert.deepEqual(supplies, before);
    for (const [id, amount] of Object.entries(recipe.ingredients)) {
      assert.equal(result.inventory[id as ItemId], 0);
      assert.ok(amount > 0);
    }
    assert.equal(result.inventory[recipe.output], 1);
    const noMaterials = craftItem(result.inventory, name as RecipeId);
    assert.equal(noMaterials.ok, false);
    assert.equal(noMaterials.inventory, result.inventory);
  }
});

test('crafting refuses insufficient material or a full output without loss', () => {
  const start = createInventory();
  const noMaterial = craftItem({}, 'mossCushion');
  assert.equal(noMaterial.ok, false);
  assert.equal(noMaterial.inventory !== undefined, true);
  assert.equal(noMaterial.inventory === start, false);

  const alreadyFull = { ...start, mossCushion: 5 };
  const full = craftItem(alreadyFull, 'mossCushion');
  assert.deepEqual(full, { ok: false, reason: 'full', inventory: alreadyFull });
  assert.equal(itemCount(alreadyFull, 'softFiber'), 5);
  const crafted = craftItem(start, 'mossCushion');
  assert.equal(crafted.ok, true);
  if (!crafted.ok) return;
  assert.equal(itemCount(start, 'mossCushion'), 0);
  assert.equal(itemCount(crafted.inventory, 'mossCushion'), 1);
  assert.equal(itemCount(crafted.inventory, 'softFiber'), 3);
  assert.equal(itemCount(crafted.inventory, 'flowerPetal'), 4);
  assert.throws(() => craftItem(start, 'unknown' as RecipeId));
});

test('recipe readiness reports exact shortages and agrees with crafting', () => {
  const inventory = createInventory();
  for (const recipeId of Object.keys(RECIPES) as RecipeId[]) {
    const assessment = assessRecipe(inventory, recipeId);
    const crafted = craftItem(inventory, recipeId);
    assert.equal(assessment.canCraft, crafted.ok);
    assert.equal(assessment.outputFull, false);
    assert.deepEqual(assessment.missing, {});
  }

  const missing = assessRecipe({ wildBerry: 1 }, 'picnicSnack');
  assert.deepEqual(missing, {
    canCraft: false,
    outputFull: false,
    missing: { wildBerry: 1, flowerPetal: 1 },
  });
  assert.deepEqual(craftItem({ wildBerry: 1 }, 'picnicSnack'), {
    ok: false,
    reason: 'insufficient',
    inventory: { wildBerry: 1 },
  });
});

test('full output takes precedence over missing ingredients without consuming any', () => {
  const inventory = { mossCushion: 5, flowerPetal: 1 };
  const assessment = assessRecipe(inventory, 'mossCushion');
  assert.deepEqual(assessment, {
    canCraft: false,
    outputFull: true,
    missing: { flowerPetal: 1, softFiber: 2 },
  });
  const result = craftItem(inventory, 'mossCushion');
  assert.equal(result.ok, false);
  assert.equal(result.inventory, inventory);
  if (!result.ok) assert.equal(result.reason, 'full');
});

test('recipe readiness rejects unknown recipes and malformed inventory', () => {
  assert.throws(() => assessRecipe({}, 'unknown' as RecipeId));
  assert.throws(() => assessRecipe({ softFiber: -1 }, 'leafToy'));
  assert.throws(() => assessRecipe({ flowerPetal: NaN }, 'leafToy'));
  assert.throws(() => assessRecipe({ leafToy: 1.5 }, 'leafToy'));
  assert.throws(() => assessRecipe({ wildBerry: Infinity }, 'picnicSnack'));
});
