using System;
using System.IO;
using NUnit.Framework;
using UnityEngine;

namespace Tamagoochi.Tests
{
    public sealed class GameStoreTests
    {
        private string directory;

        [SetUp]
        public void Prepare() =>
            directory = Path.Combine(Path.GetTempPath(), "tamagoochi-" + Guid.NewGuid().ToString("N"));

        [TearDown]
        public void CleanUp()
        {
            if (Directory.Exists(directory)) Directory.Delete(directory, true);
        }

        [Test]
        public void CorruptPrimaryRecoversBackupWithoutOverwritingIt()
        {
            var session = GameSession.New(0);
            GameStore.SaveToDirectory(session, directory);
            session.Pet.Play();
            GameStore.SaveToDirectory(session, directory);
            string main = Path.Combine(directory, "game.json");
            Assert.IsTrue(File.Exists(main + ".bak"));
            Assert.AreEqual(80, GameStore.LoadFromDirectory(directory, 0).Pet.energy);
            File.WriteAllText(main, "{not-valid-json");
            var recovered = GameStore.LoadFromDirectory(directory, 0);
            Assert.AreEqual(90, recovered.Pet.energy);
            GameStore.SaveToDirectory(recovered, directory);
            Assert.AreEqual(90, GameStore.LoadFromDirectory(directory, 0).Pet.energy);
            Assert.IsTrue(GameSession.TryRestore(
                JsonUtility.FromJson<GameSnapshot>(File.ReadAllText(main + ".bak")), out _));
        }

        [Test]
        public void InterruptedFirstSaveRecoversValidatedTemporarySnapshot()
        {
            var game = GameSession.New(1000);
            game.Pet.Feed();
            Directory.CreateDirectory(directory);
            File.WriteAllText(Path.Combine(directory, "game.json.tmp"),
                JsonUtility.ToJson(game.Capture()));
            var restored = GameStore.LoadFromDirectory(directory, 1000);
            Assert.AreEqual(100, restored.Pet.hunger);
            Assert.AreEqual(0, restored.Expeditions.Completed);
            GameStore.SaveToDirectory(restored, directory);
            Assert.IsTrue(File.Exists(Path.Combine(directory, "game.json")));
        }

        [Test]
        public void CommittedBackupOutranksUncommittedTemporarySnapshot()
        {
            var game = GameSession.New(1000);
            GameStore.SaveToDirectory(game, directory);
            game.Pet.Feed();
            GameStore.SaveToDirectory(game, directory);
            File.WriteAllText(Path.Combine(directory, "game.json"), "{corrupt");
            game.Pet.Play();
            File.WriteAllText(Path.Combine(directory, "game.json.tmp"),
                JsonUtility.ToJson(game.Capture()));
            var restored = GameStore.LoadFromDirectory(directory, 1000);
            Assert.AreEqual(82, restored.Pet.hunger);
            Assert.AreEqual(90, restored.Pet.energy);
        }

        [Test]
        public void InvalidOrOversizedTemporarySaveNeverOverridesLegacyPet()
        {
            Directory.CreateDirectory(directory);
            var pet = Pet.Create(1000);
            pet.Feed();
            File.WriteAllText(Path.Combine(directory, "pet.json"),
                JsonUtility.ToJson(new LegacyPetSave { pet = pet }));
            string temp = Path.Combine(directory, "game.json.tmp");
            File.WriteAllText(temp, "{invalid");
            Assert.AreEqual(100, GameStore.LoadFromDirectory(directory, 1000).Pet.hunger);
            File.WriteAllText(temp, new string('X', 1024 * 1024 + 1));
            Assert.AreEqual(100, GameStore.LoadFromDirectory(directory, 1000).Pet.hunger);
        }

        [Test]
        public void MemoryBookPersistsOnDiskWithoutDuplicateFirsts()
        {
            var session = GameSession.New(0);
            Assert.IsTrue(session.Memories.Record(MemoryKind.FirstPlay, 100));
            GameStore.SaveToDirectory(session, directory);

            var loaded = GameStore.LoadFromDirectory(directory, 0);
            Assert.AreEqual(1, loaded.Memories.Entries.Count);
            Assert.IsFalse(loaded.Memories.Record(MemoryKind.FirstPlay, 200));
            Assert.IsTrue(loaded.Memories.Record(MemoryKind.FirstGrove, 300));
            GameStore.SaveToDirectory(loaded, directory);

            var reloaded = GameStore.LoadFromDirectory(directory, 0);
            Assert.AreEqual(2, reloaded.Memories.Entries.Count);
            Assert.AreEqual(100, reloaded.Memories.Entries[0].occurredAt);
            Assert.AreEqual(300, reloaded.Memories.Entries[1].occurredAt);
            Assert.IsTrue(File.Exists(Path.Combine(directory, "game.json.bak")));
        }

        [Test]
        public void Version3FileMigratesToEmptyMemoriesAndSavesAsV4()
        {
            var old = GameSession.New(0);
            old.Expeditions.Start(Habitat.Meadow, 200);
            var snapshot = old.Capture();
            snapshot.version = 3;
            snapshot.memories = null;
            Directory.CreateDirectory(directory);
            File.WriteAllText(Path.Combine(directory, "game.json"),
                JsonUtility.ToJson(snapshot));

            var loaded = GameStore.LoadFromDirectory(directory, 0);
            Assert.AreEqual(0, loaded.Memories.Entries.Count);
            Assert.AreEqual(Habitat.Meadow, loaded.Expeditions.ActiveHabitat);
            GameStore.SaveToDirectory(loaded, directory);
            var saved = JsonUtility.FromJson<GameSnapshot>(
                File.ReadAllText(Path.Combine(directory, "game.json")));
            Assert.AreEqual(4, saved.version);
            Assert.IsNotNull(saved.memories);
            Assert.AreEqual(0, saved.memories.Length);
        }

        [Test]
        public void PersonalizedNameSurvivesFileSaveAndLoad()
        {
            var session = GameSession.New(1000);
            Assert.IsTrue(session.Pet.TryRename("Fern"));
            GameStore.SaveToDirectory(session, directory);
            var restored = GameStore.LoadFromDirectory(directory, 1000);
            Assert.AreEqual("Fern", restored.Pet.name);
            Assert.AreEqual(4, restored.Capture().version);
        }

        [Test]
        public void OversizedLegacySaveIsSkippedWithoutReadingOrAllocatingIt()
        {
            Directory.CreateDirectory(directory);
            File.WriteAllText(Path.Combine(directory, "pet.json"),
                new string('X', 1024 * 1024 + 1));
            var session = GameStore.LoadFromDirectory(directory, 1000);
            Assert.AreEqual("Mochi", session.Pet.name);
            Assert.AreEqual(82, session.Pet.hunger);
            Assert.AreEqual(4, session.Capture().version);
        }

        [Test]
        public void MalformedOrEmptyLegacySaveFallsBackSafely()
        {
            Directory.CreateDirectory(directory);
            string legacy = Path.Combine(directory, "pet.json");
            foreach (string payload in new[] { "", "{malformed" })
            {
                File.WriteAllText(legacy, payload);
                var session = GameStore.LoadFromDirectory(directory, 1000);
                Assert.AreEqual(82, session.Pet.hunger);
            }
        }

        [Test]
        public void ValidCommittedGameAlwaysOutranksOversizedLegacySave()
        {
            var session = GameSession.New(1000);
            session.Pet.Feed();
            GameStore.SaveToDirectory(session, directory);
            File.WriteAllText(Path.Combine(directory, "pet.json"),
                new string('X', 1024 * 1024 + 1));
            var restored = GameStore.LoadFromDirectory(directory, 1000);
            Assert.AreEqual(100, restored.Pet.hunger);
        }

        [Test]
        public void PetOnlyV1FileIsMigratedWithoutResettingPet()
        {
            Directory.CreateDirectory(directory);
            var pet = Pet.Create(0);
            pet.Feed();
            File.WriteAllText(Path.Combine(directory, "pet.json"),
                JsonUtility.ToJson(new LegacyPetSave { pet = pet }));
            var session = GameStore.LoadFromDirectory(directory, 0);
            Assert.AreEqual(100, session.Pet.hunger);
            Assert.AreEqual(0, session.Expeditions.Completed);
            Assert.AreEqual(6, session.Inventory.Count(ItemId.WildBerry));
            GameStore.SaveToDirectory(session, directory);
            Assert.AreEqual(4,
                JsonUtility.FromJson<GameSnapshot>(
                    File.ReadAllText(Path.Combine(directory, "game.json"))).version);
        }
    }
}
