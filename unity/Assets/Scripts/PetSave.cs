using System;
using System.IO;
using UnityEngine;

namespace Tamagoochi
{
    [Serializable]
    public sealed class PetSave
    {
        public int version = 1;
        public Pet pet;
    }

    public static class PetStore
    {
        private static string SavePath => Path.Combine(Application.persistentDataPath, "pet.json");
        public static long Now() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        public static Pet Load()
        {
            try
            {
                if (File.Exists(SavePath))
                {
                    var save = JsonUtility.FromJson<PetSave>(File.ReadAllText(SavePath));
                    if (save != null && save.version == 1 && save.pet != null &&
                        !string.IsNullOrWhiteSpace(save.pet.name) &&
                        save.pet.bornAt >= 0 && save.pet.lastSimulatedAt >= save.pet.bornAt)
                    {
                        save.pet.Advance(Now());
                        return save.pet;
                    }
                }
            }
            catch (Exception e) when (e is IOException || e is ArgumentException || e is UnauthorizedAccessException)
            {
                Debug.LogWarning($"Save could not be read: {e.Message}");
            }
            return Pet.Create(Now());
        }

        public static void Save(Pet pet)
        {
            string temp = SavePath + ".tmp";
            try
            {
                File.WriteAllText(temp, JsonUtility.ToJson(new PetSave { pet = pet }));
                File.Move(temp, SavePath, true);
            }
            catch (IOException e)
            {
                Debug.LogWarning($"Save could not be written: {e.Message}");
            }
        }
    }
}
