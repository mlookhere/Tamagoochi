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
        public void CapturedAndRestoredPetNeverAliasLiveState()
        {
            var live = GameSession.New(1000);
            var snapshot = live.Capture();
            snapshot.pet.hunger = 1;
            Assert.AreEqual(82, live.Pet.hunger);
            Assert.IsTrue(GameSession.TryRestore(snapshot, out var restored));
            snapshot.pet.hunger = 99;
            Assert.AreEqual(1, restored.Pet.hunger);
            Assert.AreEqual(82, live.Pet.hunger);
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
        public void V2SaveMigratesWithoutLosingCareAndWorkshop()
        {
            var original = GameSession.New(1000);
            original.Inventory.Craft(ItemId.LeafToy);
            original.Bond.Complete(MiniGame.Echo);
            var old = original.Capture();
            old.version = 2;
            old.expeditions = null;
            Assert.IsTrue(GameSession.TryRestore(old, out var restored));
            Assert.AreEqual(1, restored.Inventory.Count(ItemId.LeafToy));
            Assert.AreEqual(48, restored.Bond.Bond);
            Assert.AreEqual(0, restored.Expeditions.Completed);
            Assert.AreEqual(3, restored.Capture().version);
        }

        [Test]
        public void ExpeditionRoundTripsThroughGameSave()
        {
            var original = GameSession.New(0);
            original.Expeditions.Start(Habitat.Grove, 100);
            var json = JsonUtility.ToJson(original.Capture());
            Assert.IsTrue(GameSession.TryRestore(JsonUtility.FromJson<GameSnapshot>(json), out var restored));
            Assert.AreEqual(Habitat.Grove, restored.Expeditions.ActiveHabitat);
            Assert.AreEqual(100 + Expeditions.DurationMilliseconds, restored.Expeditions.ReadyAt);
            Assert.AreEqual(ExpeditionClaim.Claimed,
                restored.Expeditions.Claim(restored.Expeditions.ReadyAt, restored.Inventory));
            Assert.AreEqual(1, restored.Expeditions.Completed);
        }

        [Test]
        public void MalformedExpeditionCannotCorruptRestoredSession()
        {
            var snapshot = GameSession.New(0).Capture();
            snapshot.expeditions.activeHabitat = 7;
            Assert.IsFalse(GameSession.TryRestore(snapshot, out var restored));
            Assert.IsNull(restored);
        }

        [Test]
        public void SoulprintRespondsToCarePlayAndAdventure()
        {
            var gentle = GameSession.New(0);
            Assert.AreEqual(SoulprintNature.Budding, gentle.Nature);
            for (int i = 0; i < 3; i++) gentle.Pet.Comfort();
            Assert.AreEqual(SoulprintNature.Tenderhearted, gentle.Nature);

            var curious = GameSession.New(0);
            for (int i = 0; i < 3; i++) curious.Pet.Play();
            Assert.AreEqual(SoulprintNature.Curious, curious.Nature);

            var brave = GameSession.New(0);
            Assert.IsTrue(brave.Bond.Complete(MiniGame.Skip));
            Assert.AreEqual(SoulprintNature.Trailblazer, brave.Nature);

            var explorer = GameSession.New(0);
            long now = 0;
            for (int i = 0; i < 3; i++)
            {
                Assert.IsTrue(explorer.Expeditions.Start(Habitat.Pond, now));
                now += Expeditions.DurationMilliseconds;
                Assert.AreEqual(ExpeditionClaim.Claimed,
                    explorer.Expeditions.Claim(now, explorer.Inventory));
            }
            Assert.AreEqual(SoulprintNature.Curious, explorer.Nature);
        }

        [Test]
        public void SoulprintRecomputesIdenticallyAfterRestoringOldAndNewSaves()
        {
            var original = GameSession.New(0);
            original.Pet.Comfort();
            original.Pet.Comfort();
            original.Pet.Comfort();
            Assert.AreEqual(SoulprintNature.Tenderhearted, original.Nature);

            foreach (int version in new[] { 2, 3 })
            {
                var snapshot = original.Capture();
                snapshot.version = version;
                if (version == 2) snapshot.expeditions = null;
                Assert.IsTrue(GameSession.TryRestore(snapshot, out var restored));
                Assert.AreEqual(original.Nature, restored.Nature);
                Assert.AreEqual(original.NatureDescription, restored.NatureDescription);
            }
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
