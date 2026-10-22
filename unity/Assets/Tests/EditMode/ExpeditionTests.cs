using NUnit.Framework;

namespace Tamagoochi.Tests
{
    public sealed class ExpeditionTests
    {
        [Test]
        public void ExpeditionFinishesAcrossOfflineTimeWithoutBackgroundTimers()
        {
            var game = new Expeditions();
            var bag = Inventory.Starter();
            Assert.IsTrue(game.Start(Habitat.Grove, 1000));
            Assert.IsFalse(game.Start(Habitat.Meadow, 1100));
            Assert.AreEqual(ExpeditionClaim.NotReady,
                game.Claim(1000 + Expeditions.DurationMilliseconds - 1, bag));
            Assert.AreEqual(ExpeditionClaim.Claimed,
                game.Claim(1000 + Expeditions.DurationMilliseconds, bag));
            Assert.AreEqual(7, bag.Count(ItemId.WildBerry));
            Assert.AreEqual(1, game.Completed);
            Assert.AreEqual("Singing Leaf", game.LatestDiscovery());
            Assert.AreEqual(ExpeditionClaim.NotExploring,
                game.Claim(1000 + Expeditions.DurationMilliseconds, bag));
        }

        [Test]
        public void FullBasketDoesNotConsumePendingReward()
        {
            var full = Inventory.Starter().Snapshot();
            full[(int)ItemId.FlowerPetal] = 99;
            var bag = Inventory.Restore(full);
            var game = new Expeditions();
            game.Start(Habitat.Meadow, 0);
            Assert.AreEqual(ExpeditionClaim.BasketFull,
                game.Claim(Expeditions.DurationMilliseconds, bag));
            Assert.IsTrue(game.IsExploring);
            Assert.IsTrue(bag.Take(ItemId.FlowerPetal));
            Assert.AreEqual(ExpeditionClaim.Claimed,
                game.Claim(Expeditions.DurationMilliseconds, bag));
            Assert.AreEqual(99, bag.Count(ItemId.FlowerPetal));
        }

        [Test]
        public void EarlyReturnIsExplicitIdempotentAndNeverGrantsRewards()
        {
            var game = new Expeditions();
            var bag = Inventory.Starter();
            int original = bag.Count(ItemId.WildBerry);
            Assert.IsFalse(game.Cancel());
            Assert.IsTrue(game.Start(Habitat.Grove, 0));
            Assert.IsTrue(game.Cancel());
            Assert.IsFalse(game.Cancel());
            Assert.IsFalse(game.IsExploring);
            Assert.AreEqual(0, game.ReadyAt);
            Assert.AreEqual(0, game.Completed);
            Assert.AreEqual(0, game.Journal.Count);
            Assert.AreEqual(original, bag.Count(ItemId.WildBerry));
            Assert.AreEqual(ExpeditionClaim.NotExploring,
                game.Claim(Expeditions.DurationMilliseconds, bag));
            Assert.IsTrue(game.Start(Habitat.Meadow, 0));
            Assert.DoesNotThrow(() => Expeditions.Restore(game.Snapshot()));
        }

        [Test]
        public void EarlyReturnAfterCompletedTripPreservesJournalAndClaimSafety()
        {
            var game = new Expeditions();
            var bag = Inventory.Starter();
            Assert.IsTrue(game.Start(Habitat.Pond, 0));
            Assert.AreEqual(ExpeditionClaim.Claimed,
                game.Claim(Expeditions.DurationMilliseconds, bag));
            int stones = bag.Count(ItemId.RiverStone);
            Assert.IsTrue(game.Start(Habitat.Grove, Expeditions.DurationMilliseconds));
            Assert.IsTrue(game.Cancel());
            var restored = Expeditions.Restore(game.Snapshot());
            Assert.AreEqual(1, restored.Completed);
            Assert.AreEqual("River Pearl", restored.LatestDiscovery());
            Assert.AreEqual(1, restored.Journal.Count);
            Assert.AreEqual(stones, bag.Count(ItemId.RiverStone));
            Assert.AreEqual(ExpeditionClaim.NotExploring,
                restored.Claim(2 * Expeditions.DurationMilliseconds, bag));
        }

        [Test]
        public void RoundTripPreservesTimerAndJournal()
        {
            var game = new Expeditions();
            var bag = Inventory.Starter();
            game.Start(Habitat.Pond, 10);
            game.Claim(10 + Expeditions.DurationMilliseconds, bag);
            game.Start(Habitat.Meadow, 900000);
            var restored = Expeditions.Restore(game.Snapshot());
            Assert.AreEqual(1, restored.Completed);
            Assert.AreEqual(Habitat.Meadow, restored.ActiveHabitat);
            Assert.AreEqual(900000 + Expeditions.DurationMilliseconds, restored.ReadyAt);
            Assert.AreEqual("River Pearl", restored.LatestDiscovery());
        }

        [Test]
        public void BackwardClockDoesNotCorruptDiscoveryJournal()
        {
            var game = new Expeditions();
            var bag = Inventory.Starter();
            long initial = 5000000;
            game.Start(Habitat.Grove, initial);
            Assert.AreEqual(ExpeditionClaim.Claimed,
                game.Claim(initial + Expeditions.DurationMilliseconds, bag));
            // The device clock moves backward after the first discovery.
            game.Start(Habitat.Pond, 0);
            Assert.AreEqual(ExpeditionClaim.Claimed,
                game.Claim(Expeditions.DurationMilliseconds, bag));
            var saved = game.Snapshot();
            Assert.AreEqual(2, saved.completed);
            Assert.GreaterOrEqual(saved.journal[1].discoveredAt,
                saved.journal[0].discoveredAt);
            Assert.DoesNotThrow(() => Expeditions.Restore(saved));
        }

        [Test]
        public void FieldJournalNamesSurviveSaveAndRemainBounded()
        {
            var game = new Expeditions();
            var bag = Inventory.Starter();
            long now = 0;
            for (int i = 0; i < Expeditions.JournalLimit + 2; i++)
            {
                // Make room for habitat rewards so completed trips cannot be lost.
                if (bag.Count(ItemId.WildBerry) > 0)
                    bag.Take(ItemId.WildBerry);
                Assert.IsTrue(game.Start(Habitat.Grove, now));
                now += Expeditions.DurationMilliseconds;
                Assert.AreEqual(ExpeditionClaim.Claimed, game.Claim(now, bag));
            }

            var restored = Expeditions.Restore(game.Snapshot());
            Assert.AreEqual(Expeditions.JournalLimit, restored.Journal.Count);
            Assert.AreEqual(Expeditions.JournalLimit + 2, restored.Completed);
            Assert.AreEqual("Glimmer Seed", Expeditions.DiscoveryName(restored.Journal[0]));
            Assert.AreEqual("Amber Bark", restored.LatestDiscovery());
        }

        [Test]
        public void PublicJournalCannotMutateInternalRecords()
        {
            var game = new Expeditions();
            var bag = Inventory.Starter();
            game.Start(Habitat.Grove, 0);
            Assert.AreEqual(ExpeditionClaim.Claimed,
                game.Claim(Expeditions.DurationMilliseconds, bag));
            game.Journal[0].habitat = 99;
            Assert.AreEqual("Singing Leaf", game.LatestDiscovery());
            Assert.DoesNotThrow(() => Expeditions.Restore(game.Snapshot()));
        }

        [Test]
        public void DiscoveryNamesRejectMalformedData()
        {
            Assert.Throws<System.ArgumentException>(() => Expeditions.DiscoveryName(null));
            Assert.Throws<System.ArgumentException>(() =>
                Expeditions.DiscoveryName(new DiscoveryRecord { habitat = 10 }));
            Assert.Throws<System.ArgumentException>(() =>
                Expeditions.DiscoveryName(new DiscoveryRecord { habitat = 2, variation = -1 }));
        }

        [Test]
        public void InvalidRestorationIsRejected()
        {
            var data = new Expeditions().Snapshot();
            data.activeHabitat = 2;
            data.readyAt = 100;
            Assert.Throws<System.ArgumentException>(() => Expeditions.Restore(data));
            data = new Expeditions().Snapshot();
            data.completed = 1;
            data.journal = new[] { new DiscoveryRecord { habitat = 99 } };
            Assert.Throws<System.ArgumentException>(() => Expeditions.Restore(data));
        }
    }
}
