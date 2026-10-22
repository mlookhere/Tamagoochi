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
        public void CompanionNamingIsTrimmedValidatedAndPreservedThroughRestore()
        {
            var session = GameSession.New(1000);
            Assert.IsTrue(session.Pet.TryRename("  Willow  "));
            Assert.AreEqual("Willow", session.Pet.name);
            foreach (string invalid in new[]
            {
                (string)null, "", "   ", "New\nLine", new string('X', 25)
            })
            {
                Assert.IsFalse(session.Pet.TryRename(invalid));
                Assert.AreEqual("Willow", session.Pet.name);
            }
            Assert.IsTrue(session.Pet.TryRename("모치"));
            var snapshot = UnityEngine.JsonUtility.FromJson<GameSnapshot>(
                UnityEngine.JsonUtility.ToJson(session.Capture()));
            Assert.IsTrue(GameSession.TryRestore(snapshot, out var restored));
            Assert.AreEqual("모치", restored.Pet.name);
        }

        [Test]
        public void ImportedPetIsCopiedBeforeEnteringNewSession()
        {
            var imported = Pet.Create(1000);
            Assert.IsTrue(imported.TryRename("Fern"));
            var session = GameSession.New(1000, imported);
            imported.Feed();
            imported.TryRename("Other");
            Assert.AreEqual(82, session.Pet.hunger);
            Assert.AreEqual("Fern", session.Pet.name);
            session.Pet.Play();
            Assert.AreEqual(76, imported.happiness);
        }

        [Test]
        public void LoadedControlCharacterNameIsRejectedWithoutAffectingValidNames()
        {
            var snapshot = GameSession.New(1000).Capture();
            snapshot.pet.name = "Bad\nName";
            Assert.IsFalse(GameSession.TryRestore(snapshot, out _));
            snapshot.pet.name = "모치";
            Assert.IsTrue(GameSession.TryRestore(snapshot, out var restored));
            Assert.AreEqual("모치", restored.Pet.name);
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
            Assert.AreEqual(4, restored.Capture().version);
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
        public void MemoriesPersistAcrossV4SaveRoundTripsAndRemainOneTime()
        {
            var original = GameSession.New(1000);
            Assert.IsTrue(original.Memories.Record(MemoryKind.FirstFeed, 1100));
            Assert.IsFalse(original.Memories.Record(MemoryKind.FirstFeed, 1200));
            Assert.IsTrue(original.Memories.Record(MemoryKind.FirstGrove, 900));
            Assert.AreEqual(1100, original.Memories.Entries[1].occurredAt);

            var snapshot = JsonUtility.FromJson<GameSnapshot>(
                JsonUtility.ToJson(original.Capture()));
            Assert.AreEqual(4, snapshot.version);
            Assert.IsTrue(GameSession.TryRestore(snapshot, out var restored));
            Assert.AreEqual(2, restored.Memories.Entries.Count);
            Assert.AreEqual("Our first treat", MemoryBook.Title(MemoryKind.FirstFeed));
            snapshot.memories[0].kind = 99;
            Assert.AreEqual(MemoryKind.FirstFeed, (MemoryKind)restored.Memories.Entries[0].kind);
            restored.Memories.Entries[0].kind = 88;
            Assert.AreEqual(MemoryKind.FirstFeed, (MemoryKind)restored.Memories.Entries[0].kind);
        }

        [Test]
        public void MemoriesRejectInvalidDuplicatesAndFutureData()
        {
            var snapshot = GameSession.New(0).Capture();
            snapshot.memories = new[]
            {
                new MemoryEntry { kind = 0, occurredAt = 100 },
                new MemoryEntry { kind = 0, occurredAt = 200 }
            };
            Assert.IsFalse(GameSession.TryRestore(snapshot, out _));

            snapshot.memories[1].kind = (int)MemoryKind.FirstPlay;
            snapshot.memories[1].occurredAt = 99;
            Assert.IsFalse(GameSession.TryRestore(snapshot, out _));

            snapshot.memories = null;
            Assert.IsFalse(GameSession.TryRestore(snapshot, out _));
        }

        [Test]
        public void OlderGameplaySavesMigrateToAnEmptyMemoryBook()
        {
            var game = GameSession.New(1000);
            game.Pet.Play();
            foreach (int version in new[] { 2, 3 })
            {
                var snapshot = game.Capture();
                snapshot.version = version;
                snapshot.memories = null;
                if (version == 2) snapshot.expeditions = null;
                Assert.IsTrue(GameSession.TryRestore(snapshot, out var migrated));
                Assert.AreEqual(0, migrated.Memories.Entries.Count);
                Assert.AreEqual(4, migrated.Capture().version);
                Assert.AreEqual(game.Pet.happiness, migrated.Pet.happiness);
            }
        }

        [Test]
        public void EveryMemoryKindCanBeCollectedOnceOnly()
        {
            var book = new MemoryBook();
            foreach (MemoryKind kind in System.Enum.GetValues(typeof(MemoryKind)))
            {
                Assert.IsTrue(book.Record(kind, 100));
                Assert.IsFalse(book.Record(kind, 100));
                Assert.IsNotEmpty(MemoryBook.Title(kind));
            }
            Assert.AreEqual(MemoryBook.Limit, book.Entries.Count);
            Assert.DoesNotThrow(() => MemoryBook.Restore(book.Snapshot()));
            Assert.Throws<System.ArgumentOutOfRangeException>(() =>
                book.Record((MemoryKind)99, 100));
        }

        [Test]
        public void AllTwelveFutureFormsHaveUniqueAuthoredDescriptions()
        {
            var names = new System.Collections.Generic.HashSet<string>();
            foreach (Habitat habitat in System.Enum.GetValues(typeof(Habitat)))
            foreach (SoulprintNature nature in System.Enum.GetValues(typeof(SoulprintNature)))
            {
                var form = EvolutionPaths.Preview(habitat, nature);
                Assert.IsTrue(names.Add(form.Name));
                Assert.IsNotEmpty(form.Description);
                Assert.AreEqual(habitat, form.Habitat);
                Assert.AreEqual(nature, form.Nature);
            }
            Assert.AreEqual(12, names.Count);
            Assert.Throws<System.ArgumentOutOfRangeException>(() =>
                EvolutionPaths.Preview((Habitat)999, SoulprintNature.Curious));
        }

        [Test]
        public void FamiliarHabitatPreviewSurvivesSaveAndDoesNotAlterState()
        {
            var session = GameSession.New(0);
            var bag = session.Inventory;
            long now = 0;
            foreach (var habitat in new[] { Habitat.Grove, Habitat.Pond, Habitat.Pond })
            {
                Assert.IsTrue(session.Expeditions.Start(habitat, now));
                now += Expeditions.DurationMilliseconds;
                Assert.AreEqual(ExpeditionClaim.Claimed,
                    session.Expeditions.Claim(now, bag));
            }

            var before = session.Capture();
            Assert.AreEqual(Habitat.Pond, session.FamiliarHabitat);
            var preview = session.FutureForm;
            Assert.AreEqual(Habitat.Pond, preview.Habitat);
            Assert.IsTrue(GameSession.TryRestore(before, out var restored));
            Assert.AreEqual(preview.Name, restored.FutureForm.Name);
            Assert.AreEqual(preview.Description, restored.FutureForm.Description);
            Assert.AreEqual(before.expeditions.completed, session.Expeditions.Completed);
            Assert.AreEqual(0, session.Memories.Entries.Count);
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
