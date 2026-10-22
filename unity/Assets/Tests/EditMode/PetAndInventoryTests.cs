using NUnit.Framework;

namespace Tamagoochi.Tests
{
    public sealed class PetAndInventoryTests
    {
        [Test]
        public void PetCareMatchesOriginalRules()
        {
            var pet = Pet.Create(0);
            pet.Feed();
            Assert.AreEqual(100, pet.hunger);
            Assert.AreEqual(22, pet.bond);
            pet.Play();
            Assert.AreEqual(90, pet.happiness);
            Assert.AreEqual(80, pet.energy);
            Assert.AreEqual(25, pet.bond);
        }

        [Test]
        public void LongAbsenceIsCappedAndNonPunitive()
        {
            var pet = Pet.Create(0);
            pet.Advance(100L * 3600000);
            Assert.AreEqual(34, pet.hunger);
            Assert.AreEqual(52, pet.happiness);
            Assert.AreEqual(76, pet.health);
            Assert.AreEqual(100L * 3600000, pet.lastSimulatedAt);
            pet.Advance(100L * 3600000);
            Assert.AreEqual(34, pet.hunger);
        }

        [Test]
        public void ClockSkewAndPartialHourDoNotAdvance()
        {
            var pet = Pet.Create(3600000);
            pet.Advance(0);
            pet.Advance(7199999);
            Assert.AreEqual(82, pet.hunger);
            Assert.AreEqual(3600000, pet.lastSimulatedAt);
        }

        [Test]
        public void CraftingIsAtomic()
        {
            var bag = Inventory.Starter();
            Assert.IsTrue(bag.Craft(ItemId.PicnicSnack));
            Assert.AreEqual(4, bag.Count(ItemId.WildBerry));
            Assert.AreEqual(5, bag.Count(ItemId.FlowerPetal));
            Assert.AreEqual(1, bag.Count(ItemId.PicnicSnack));
            Assert.IsTrue(bag.Craft(ItemId.FlowerCrown));
            Assert.AreEqual(2, bag.Count(ItemId.FlowerPetal));
            Assert.IsFalse(bag.Craft(ItemId.FlowerCrown));
            Assert.AreEqual(2, bag.Count(ItemId.FlowerPetal));
        }

        [Test]
        public void CraftPreviewAndActualCraftShareRequirementsAndCapacity()
        {
            foreach (ItemId item in new[] { ItemId.PicnicSnack, ItemId.LeafToy,
                ItemId.MossCushion, ItemId.StarKeepsake, ItemId.FlowerCrown })
            {
                var bag = Inventory.Starter();
                var recipe = Inventory.RecipeFor(item);
                var before = bag.Snapshot();
                Assert.IsTrue(bag.CanCraft(item));
                Assert.IsTrue(bag.Craft(item));
                Assert.AreEqual(1, bag.Count(item));
                foreach (var (ingredient, amount) in recipe)
                    Assert.AreEqual(before[(int)ingredient] - amount, bag.Count(ingredient));
                var restored = Inventory.Restore(bag.Snapshot());
                Assert.AreEqual(bag.CanCraft(item), restored.CanCraft(item));
            }
            var recipeCopy = Inventory.RecipeFor(ItemId.PicnicSnack);
            recipeCopy[0] = (ItemId.RiverStone, 99);
            Assert.AreEqual(ItemId.WildBerry, Inventory.RecipeFor(ItemId.PicnicSnack)[0].item);
            Assert.Throws<System.ArgumentOutOfRangeException>(() =>
                Inventory.Starter().CanCraft(ItemId.WildBerry));
        }

        [Test]
        public void FullOutputStackBlocksCraftWithoutUsingMaterials()
        {
            var values = Inventory.Starter().Snapshot();
            values[(int)ItemId.PicnicSnack] = 20;
            var bag = Inventory.Restore(values);
            var before = bag.Snapshot();
            Assert.IsFalse(bag.CanCraft(ItemId.PicnicSnack));
            Assert.IsFalse(bag.Craft(ItemId.PicnicSnack));
            CollectionAssert.AreEqual(before, bag.Snapshot());
        }

        [Test]
        public void RemainingCapacityMatchesAtomicGiveAndRestoredLimits()
        {
            var bag = Inventory.Starter();
            Assert.AreEqual(93, bag.RemainingCapacity(ItemId.WildBerry));
            Assert.IsFalse(bag.Give(ItemId.WildBerry, 94));
            Assert.AreEqual(6, bag.Count(ItemId.WildBerry));
            Assert.IsTrue(bag.Give(ItemId.WildBerry, 93));
            Assert.AreEqual(0, bag.RemainingCapacity(ItemId.WildBerry));
            Assert.IsFalse(bag.Give(ItemId.WildBerry));
            Assert.IsTrue(bag.Take(ItemId.WildBerry));
            Assert.AreEqual(1, Inventory.Restore(bag.Snapshot()).RemainingCapacity(ItemId.WildBerry));
            Assert.Throws<System.ArgumentOutOfRangeException>(() =>
                bag.RemainingCapacity((ItemId)99));
        }

        [Test]
        public void ForestEchoRewardsOnlyOnCompletedPattern()
        {
            var game = new ForestEcho();
            Assert.AreEqual(EchoResult.Correct, game.Choose(EchoSymbol.Leaf));
            Assert.AreEqual(EchoResult.Miss, game.Choose(EchoSymbol.Leaf));
            foreach (var symbol in game.Pattern)
            {
                var result = game.Choose(symbol);
                if (symbol == EchoSymbol.Stone) Assert.AreEqual(EchoResult.Complete, result);
            }
            Assert.AreEqual(1, game.Round);
        }
    }
}
