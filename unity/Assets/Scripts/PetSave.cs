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
        public static long Now() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        public static GameSession Load() =>
            LoadFromDirectory(Application.persistentDataPath, Now());

        public static GameSession LoadFromDirectory(string directory, long now)
        {
            string main = Path.Combine(directory, "game.json");
            // Prefer committed state, then its backup; recover an interrupted
            // first commit only when neither committed snapshot is valid.
            if (ReadSnapshot(main, out var session) ||
                ReadSnapshot(main + ".bak", out session) ||
                ReadSnapshot(main + ".tmp", out session))
            {
                session.Pet.Advance(now);
                return session;
            }

            if (ReadLegacy(Path.Combine(directory, "pet.json"), out var pet))
            {
                pet.Advance(now);
                return GameSession.New(now, pet);
            }
            return GameSession.New(now);
        }

        public static void Save(GameSession session) =>
            SaveToDirectory(session, Application.persistentDataPath);

        public static void SaveToDirectory(GameSession session, string directory)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));
            var snapshot = session.Capture();
            if (!GameSession.TryRestore(snapshot, out _))
            {
                Debug.LogWarning("Game state failed validation and was not saved.");
                return;
            }

            string main = Path.Combine(directory, "game.json");
            string backup = main + ".bak";
            string temp = main + ".tmp";
            try
            {
                Directory.CreateDirectory(directory);
                using (var stream = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var writer = new StreamWriter(stream))
                {
                    writer.Write(JsonUtility.ToJson(snapshot));
                    writer.Flush();
                    stream.Flush(true);
                }

                if (!File.Exists(main))
                {
                    File.Move(temp, main);
                }
                else if (!ReadSnapshot(main, out _))
                {
                    // Preserve a good .bak rather than copying corrupted data over it.
                    File.Delete(main);
                    File.Move(temp, main);
                }
                else
                {
                    try
                    {
                        File.Replace(temp, main, backup);
                    }
                    catch (PlatformNotSupportedException)
                    {
                        // Backup stays readable if the platform lacks atomic replace.
                        File.Copy(main, backup, true);
                        File.Delete(main);
                        File.Move(temp, main);
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
                // Limit untrusted/corrupted disk input before materializing JSON.
                if (new FileInfo(path).Length > 1024 * 1024) return false;
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

        private static bool ReadLegacy(string path, out Pet pet)
        {
            pet = null;
            try
            {
                if (!File.Exists(path)) return false;
                var save = JsonUtility.FromJson<LegacyPetSave>(File.ReadAllText(path));
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
