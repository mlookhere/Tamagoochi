using NUnit.Framework;

namespace Tamagoochi.Tests
{
    public sealed class GameplayParityTests
    {
        [Test]
        public void StoneSkipPreviewCannotMutateAndRetriesAreFree()
        {
            var game = new StoneSkip();
            Assert.AreEqual(6, game.Target);
            Assert.AreEqual(SkipResult.Progress, game.Preview(1));
            Assert.AreEqual(0, game.Hops);
            Assert.AreEqual(SkipResult.Progress, game.Choose(1));
            Assert.AreEqual(SkipResult.Miss, game.Choose(1));
            Assert.AreEqual(0, game.Distance);
            Assert.AreEqual(SkipResult.Progress, game.Choose(2));
            Assert.AreEqual(SkipResult.Progress, game.Choose(2));
            Assert.AreEqual(SkipResult.Complete, game.Choose(2));
            Assert.AreEqual(1, game.Round);
            Assert.AreEqual(7, game.Target);
        }

        [Test]
        public void MeadowPairsCompletesAndRotatesBoard()
        {
            var game = new MeadowPairs();
            Assert.AreEqual(PairResult.Reveal, game.Choose(0));
            Assert.AreEqual(PairResult.Miss, game.Choose(1));
            Assert.AreEqual(PairResult.Ignored, game.Choose(5));
            game.CloseMismatch();
            Assert.AreEqual(PairResult.Reveal, game.Choose(0));
            Assert.AreEqual(PairResult.Match, game.Choose(5));
            Assert.AreEqual(PairResult.Reveal, game.Choose(1));
            Assert.AreEqual(PairResult.Match, game.Choose(4));
            Assert.AreEqual(PairResult.Reveal, game.Choose(2));
            Assert.AreEqual(PairResult.Complete, game.Choose(3));
            Assert.AreEqual(1, game.Round);
            Assert.AreEqual(0, game.Matched.Count);
        }

        [Test]
        public void RoomPlacementPickupAndPreferencesAreConservative()
        {
            var bag = Inventory.Starter();
            var room = new Room();
            Assert.IsFalse(room.Place(bag, RoomSlot.Window, ItemId.LeafToy));
            Assert.IsTrue(bag.Craft(ItemId.LeafToy));
            Assert.IsTrue(room.Place(bag, RoomSlot.Window, ItemId.LeafToy));
            Assert.IsFalse(room.Place(bag, RoomSlot.Window, ItemId.LeafToy));
            Assert.AreEqual(0, bag.Count(ItemId.LeafToy));
            Assert.AreEqual(RoomSlot.Window, room.CompanionPlacement().slot);
            Assert.AreEqual(RoomMood.Delighted, room.CompanionPlacement().mood);
            Assert.IsTrue(room.PickUp(bag, RoomSlot.Window));
            Assert.AreEqual(1, bag.Count(ItemId.LeafToy));
            Assert.AreEqual(RoomMood.Resting, room.CompanionPlacement().mood);
        }

        [Test]
        public void RoomMoodDescriptionUsesCompanionNameWithoutChangingGameplay()
        {
            var bag = Inventory.Starter();
            var room = new Room();
            Assert.AreEqual("Fern is ready to discover what you make next.",
                room.MoodDescription("Fern"));
            Assert.IsTrue(bag.Craft(ItemId.LeafToy));
            Assert.IsTrue(room.Place(bag, RoomSlot.Window, ItemId.LeafToy));
            Assert.AreEqual("Fern feels at home near a favorite object.",
                room.MoodDescription("Fern"));
            Assert.AreEqual("Mochi feels at home near a favorite object.",
                room.MoodDescription());
            Assert.AreEqual(RoomMood.Delighted, room.CompanionPlacement().mood);
        }

        [Test]
        public void MiniGameAndSnackBondCannotBeFarmed()
        {
            var bond = new WorkshopBond();
            Assert.IsTrue(bond.Complete(MiniGame.Echo));
            Assert.IsFalse(bond.Complete(MiniGame.Echo));
            Assert.AreEqual(48, bond.Bond);
            Assert.AreEqual(1, bond.Focus);
            var bag = Inventory.Starter();
            Assert.IsFalse(bond.ShareSnack(bag));
            Assert.IsTrue(bag.Craft(ItemId.PicnicSnack));
            Assert.IsTrue(bond.ShareSnack(bag));
            Assert.AreEqual(52, bond.Bond);
            Assert.IsTrue(bag.Craft(ItemId.PicnicSnack));
            Assert.IsTrue(bond.ShareSnack(bag));
            Assert.AreEqual(52, bond.Bond);
        }
    }
}
