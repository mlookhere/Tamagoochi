using System;
using System.IO;
using UnityEngine;

namespace Tamagoochi
{
    [Serializable]
    public sealed class LegacyPetSave
    {
        public int version = 1;
        public Pet pet;
    }

    public static class GameStore
    {
        private static string MainPath => Path.Combine(Application.persistentDataPath, "game.json");
        private static string BackupPath => MainPath + ".bak";
        private static string LegacyPath => Path.Combine(Application.persistentDataPath, "pet.json");
        public static long Now() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        public static GameSession Load()
        {
            if (ReadSnapshot(MainPath, out var session) ||
                ReadSnapshot(BackupPath, out session))
            {
                session.Pet.Advance(Now());
                return session;
            }

            if (ReadLegacy(out var pet))
            {
                pet.Advance(Now());
                return GameSession.New(Now(), pet);
            }
            return GameSession.New(Now());
        }

        public static void Save(GameSession session)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));
            var snapshot = session.Capture();
            if (!GameSession.TryRestore(snapshot, out _))
            {
                Debug.LogWarning("Game state failed validation and was not saved.");
                return;
            }

            var tempPath = MainPath + ".tmp";
            try
            {
                Directory.CreateDirectory(Application.persistentDataPath);
                using (var stream = new FileStream(tempPath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var writer = new StreamWriter(stream))
                {
                    writer.Write(JsonUtility.ToJson(snapshot));
                    writer.Flush();
                    stream.Flush(true);
                }

                if (!File.Exists(MainPath))
                {
                    File.Move(tempPath, MainPath);
                }
                else
                {
                    try
                    {
                        // On supported filesystems this replace is atomic.
                        File.Replace(tempPath, MainPath, BackupPath);
                    }
                    catch (PlatformNotSupportedException)
                    {
                        // Recoverable fallback for mobile filesystems without File.Replace.
                        File.Copy(MainPath, BackupPath, true);
                        File.Delete(MainPath);
                        File.Move(tempPath, MainPath);
                    }
                }
            }
            catch (Exception error) when (error is IOException || error is UnauthorizedAccessException ||
                                          error is NotSupportedException)
            {
                Debug.LogWarning($"Game save could not be committed: {error.Message}");
            }
        }

        private static bool ReadSnapshot(string path, out GameSession session)
        {
            session = null;
            try
            {
                if (!File.Exists(path)) return false;
                return GameSession.TryRestore(
                    JsonUtility.FromJson<GameSnapshot>(File.ReadAllText(path)), out session);
            }
            catch (Exception error) when (error is IOException || error is UnauthorizedAccessException ||
                                          error is ArgumentException)
            {
                Debug.LogWarning($"Saved game unavailable: {error.Message}");
                return false;
            }
        }

        private static bool ReadLegacy(out Pet pet)
        {
            pet = null;
            try
            {
                if (!File.Exists(LegacyPath)) return false;
                var save = JsonUtility.FromJson<LegacyPetSave>(File.ReadAllText(LegacyPath));
                if (save == null || save.version != 1 || !GameSession.IsValidPet(save.pet))
                    return false;
                pet = save.pet;
                return true;
            }
            catch (Exception error) when (error is IOException || error is UnauthorizedAccessException ||
                                          error is ArgumentException)
            {
                Debug.LogWarning($"Legacy save unavailable: {error.Message}");
                return false;
            }
        }
    }
}
