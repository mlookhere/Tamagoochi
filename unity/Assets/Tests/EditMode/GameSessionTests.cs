using NUnit.Framework;
using UnityEngine;

namespace Tamagoochi.Tests
{
    public sealed class GameSessionTests
    {
        [Test]
        public void FullStateRoundTripsThroughUnityJson()
        {
            var session = GameSession.New(3600000);
            session.Pet.Feed();
            Assert.IsTrue(session.Inventory.Craft(ItemId.LeafToy));
            Assert.IsTrue(session.Room.Place(session.Inventory, RoomSlot.Garden, ItemId.LeafToy));
            Assert.AreEqual(EchoResult.Correct, session.Echo.Choose(EchoSymbol.Leaf));
            Assert.AreEqual(SkipResult.Progress, session.Skip.Choose(2));
            Assert.AreEqual(PairResult.Reveal, session.Pairs.Choose(0));
            Assert.IsTrue(session.Bond.Complete(MiniGame.Echo));
            var json = JsonUtility.ToJson(session.Capture());
            Assert.IsTrue(GameSession.TryRestore(JsonUtility.FromJson<GameSnapshot>(json), out var loaded));
            Assert.AreEqual(100, loaded.Pet.hunger);
            Assert.AreEqual(ItemId.LeafToy, loaded.Room.At(RoomSlot.Garden));
            Assert.AreEqual(0, loaded.Inventory.Count(ItemId.LeafToy));
            Assert.AreEqual(48, loaded.Bond.Bond);
            Assert.AreEqual(1, loaded.Bond.Focus);
            Assert.AreEqual(1, loaded.Echo.Progress);
            Assert.AreEqual(2, loaded.Skip.Distance);
            Assert.AreEqual(1, loaded.Pairs.Revealed.Count);
        }

        [Test]
        public void CorruptedInventoryIsRejectedWithoutHalfRestoring()
        {
            var snapshot = GameSession.New(0).Capture();
            snapshot.items[0] = 1000;
            Assert.IsFalse(GameSession.TryRestore(snapshot, out var result));
            Assert.IsNull(result);
        }

        [Test]
        public void InvalidPairOrBondLedgerIsRejected()
        {
            var snapshot = GameSession.New(0).Capture();
            snapshot.pairsMatched = new[] { 0, 1 };
            Assert.IsFalse(GameSession.TryRestore(snapshot, out _));
            snapshot = GameSession.New(0).Capture();
            snapshot.bond = 99;
            Assert.IsFalse(GameSession.TryRestore(snapshot, out _));
        }

        [Test]
        public void InvalidPetAndFutureSchemaAreRejected()
        {
            var snapshot = GameSession.New(0).Capture();
            snapshot.pet.health = float.NaN;
            Assert.IsFalse(GameSession.TryRestore(snapshot, out _));
            snapshot = GameSession.New(0).Capture();
            snapshot.version = 100;
            Assert.IsFalse(GameSession.TryRestore(snapshot, out _));
        }

        [Test]
        public void RestoredRewardsRemainOneTimeOnly()
        {
            var session = GameSession.New(0);
            session.Bond.Complete(MiniGame.Pairs);
            Assert.IsTrue(GameSession.TryRestore(session.Capture(), out var loaded));
            Assert.IsFalse(loaded.Bond.Complete(MiniGame.Pairs));
            Assert.AreEqual(48, loaded.Bond.Bond);
            Assert.AreEqual(1, loaded.Bond.Curiosity);
        }
    }
}
