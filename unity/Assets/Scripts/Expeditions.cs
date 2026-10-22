using System;
using System.Collections.Generic;

namespace Tamagoochi
{
    public enum Habitat { Grove, Meadow, Pond }
    public enum ExpeditionClaim { Claimed, NotExploring, NotReady, BasketFull }

    [Serializable]
    public sealed class DiscoveryRecord
    {
        public int habitat;
        public int variation;
        public long discoveredAt;
    }

    [Serializable]
    public sealed class ExpeditionSave
    {
        public int activeHabitat = -1;
        public long startedAt;
        public long readyAt;
        public int completed;
        public DiscoveryRecord[] journal = Array.Empty<DiscoveryRecord>();
    }

    // Offline-first: no GPS coordinates, background timer, or permission dependencies.
    // On return, completion is derived from UTC timestamps.
    public sealed class Expeditions
    {
        public const long DurationMilliseconds = 10 * 60 * 1000;
        public const int JournalLimit = 24;
        public const int MaxCompleted = 1000000;
        private static readonly string[][] Finds =
        {
            new[] { "Singing Leaf", "Amber Bark", "Glimmer Seed" },
            new[] { "Dew Bell", "Blush Petal", "Cloud Feather" },
            new[] { "River Pearl", "Moon Pebble", "Reed Lantern" }
        };

        private readonly List<DiscoveryRecord> journal = new();
        private Habitat? active;
        private long startedAt;
        private long readyAt;
        private int completed;

        public bool IsExploring => active.HasValue;
        public Habitat? ActiveHabitat => active;
        public long ReadyAt => readyAt;
        public int Completed => completed;
        // Never expose mutable save records owned by the live expedition state.
        public IReadOnlyList<DiscoveryRecord> Journal => journal.ConvertAll(CopyRecord).AsReadOnly();

        public static ItemId RewardFor(Habitat habitat) => habitat switch
        {
            Habitat.Grove => ItemId.WildBerry,
            Habitat.Meadow => ItemId.FlowerPetal,
            Habitat.Pond => ItemId.RiverStone,
            _ => throw new ArgumentOutOfRangeException(nameof(habitat))
        };

        public bool Start(Habitat habitat, long now)
        {
            if (!Enum.IsDefined(typeof(Habitat), habitat))
                throw new ArgumentOutOfRangeException(nameof(habitat));
            if (now < 0 || now > long.MaxValue - DurationMilliseconds)
                throw new ArgumentOutOfRangeException(nameof(now));
            if (IsExploring || completed >= MaxCompleted) return false;
            active = habitat;
            startedAt = now;
            readyAt = now + DurationMilliseconds;
            return true;
        }

        // Completed discoveries cannot be abandoned through the early-return action.
        // Recheck the clock at execution, not just when the button was drawn.
        public bool Cancel(long now)
        {
            if (now < 0) throw new ArgumentOutOfRangeException(nameof(now));
            if (!active.HasValue || now >= readyAt) return false;
            active = null;
            startedAt = 0;
            readyAt = 0;
            return true;
        }

        public long Remaining(long now) =>
            IsExploring ? Math.Max(0, readyAt - Math.Max(0, now)) : 0;

        public ExpeditionClaim Claim(long now, Inventory inventory)
        {
            if (inventory == null) throw new ArgumentNullException(nameof(inventory));
            if (!active.HasValue) return ExpeditionClaim.NotExploring;
            if (now < readyAt) return ExpeditionClaim.NotReady;
            var habitat = active.Value;
            var item = RewardFor(habitat);
            // Never consume a finished expedition if its reward cannot be stored.
            if (!inventory.Give(item)) return ExpeditionClaim.BasketFull;
            long previousDiscovery = journal.Count == 0 ? 0 : journal[journal.Count - 1].discoveredAt;
            var record = new DiscoveryRecord
            {
                habitat = (int)habitat,
                variation = completed % Finds[(int)habitat].Length,
                discoveredAt = Math.Max(now, previousDiscovery)
            };
            completed++;
            journal.Add(record);
            if (journal.Count > JournalLimit) journal.RemoveAt(0);
            active = null;
            startedAt = 0;
            readyAt = 0;
            return ExpeditionClaim.Claimed;
        }

        public string LatestDiscovery() =>
            journal.Count == 0 ? "No discoveries yet" : DiscoveryName(journal[journal.Count - 1]);

        public static string DiscoveryName(DiscoveryRecord record)
        {
            if (record == null || record.habitat < 0 || record.habitat >= Finds.Length ||
                record.variation < 0 || record.variation >= Finds[record.habitat].Length)
                throw new ArgumentException("Invalid discovery record", nameof(record));
            return Finds[record.habitat][record.variation];
        }

        private static DiscoveryRecord CopyRecord(DiscoveryRecord record) => new()
        {
            habitat = record.habitat,
            variation = record.variation,
            discoveredAt = record.discoveredAt
        };

        public ExpeditionSave Snapshot() => new()
        {
            activeHabitat = active.HasValue ? (int)active.Value : -1,
            startedAt = startedAt,
            readyAt = readyAt,
            completed = completed,
            journal = journal.ConvertAll(CopyRecord).ToArray()
        };

        public static Expeditions Restore(ExpeditionSave save)
        {
            if (save == null || save.completed < 0 || save.completed > MaxCompleted ||
                save.journal == null || save.journal.Length > JournalLimit ||
                save.completed < save.journal.Length)
                throw new ArgumentException("Invalid expedition history");
            bool exploring = save.activeHabitat >= 0 && save.activeHabitat <= 2;
            if (!exploring && save.activeHabitat != -1)
                throw new ArgumentException("Invalid expedition habitat");
            if (exploring && (save.completed == MaxCompleted || save.startedAt < 0 ||
                save.readyAt < save.startedAt ||
                save.readyAt - save.startedAt != DurationMilliseconds))
                throw new ArgumentException("Invalid expedition timer");
            if (!exploring && (save.startedAt != 0 || save.readyAt != 0))
                throw new ArgumentException("Idle expedition has active timer");
            var result = new Expeditions
            {
                active = exploring ? (Habitat?)save.activeHabitat : null,
                startedAt = save.startedAt,
                readyAt = save.readyAt,
                completed = save.completed
            };
            long previousAt = 0;
            foreach (var record in save.journal)
            {
                if (record == null || record.habitat < 0 || record.habitat > 2 ||
                    record.variation < 0 || record.variation >= Finds[record.habitat].Length ||
                    record.discoveredAt < previousAt)
                    throw new ArgumentException("Invalid discovery record");
                previousAt = record.discoveredAt;
                result.journal.Add(CopyRecord(record));
            }
            return result;
        }
    }
}
