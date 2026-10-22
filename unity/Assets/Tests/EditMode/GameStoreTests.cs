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
            Assert.AreEqual(3,
                JsonUtility.FromJson<GameSnapshot>(
                    File.ReadAllText(Path.Combine(directory, "game.json"))).version);
        }
    }
}
