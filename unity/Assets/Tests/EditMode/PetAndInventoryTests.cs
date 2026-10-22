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
            Assert.AreEqual(50, pet.health);
            Assert.AreEqual(100L * 3600000, pet.lastSimulatedAt);
            pet.Advance(100L * 3600000);
            Assert.AreEqual(34, pet.hunger);
        }

        [Test]
        public void CraftingIsAtomic()
        {
            var bag = Inventory.Starter();
            Assert.IsTrue(bag.Craft(ItemId.PicnicSnack));
            Assert.AreEqual(4, bag.Count(ItemId.WildBerry));
            Assert.AreEqual(5, bag.Count(ItemId.FlowerPetal));
            Assert.AreEqual(1, bag.Count(ItemId.PicnicSnack));
            Assert.IsFalse(bag.Craft(ItemId.FlowerCrown) && bag.Count(ItemId.FlowerPetal) < 0);
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
