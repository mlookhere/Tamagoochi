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
