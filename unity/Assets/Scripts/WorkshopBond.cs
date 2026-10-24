using System;
using System.Collections.Generic;

namespace Tamagoochi
{
    public enum MiniGame { Echo, Skip, Pairs }

    public sealed class WorkshopBond
    {
        private readonly bool[] completed = new bool[3];
        public int Bond { get; private set; } = 40;
        public int Curiosity { get; private set; }
        public int Courage { get; private set; }
        public int Focus { get; private set; }
        public bool SnackShared { get; private set; }

        public bool Completed(MiniGame game) => completed[CheckedGame(game)];

        public int[] Snapshot() => new[] {
            completed[0] ? 1 : 0, completed[1] ? 1 : 0, completed[2] ? 1 : 0
        };

        public static WorkshopBond Restore(int[] flags, int bond, int curiosity,
            int courage, int focus, bool snackShared)
        {
            if (flags == null || flags.Length != 3)
                throw new ArgumentException("Invalid activity ledger");
            int total = 0;
            foreach (int flag in flags)
            {
                if (flag != 0 && flag != 1) throw new ArgumentException("Invalid completion");
                total += flag;
            }
            if (bond != 40 + total * 8 + (snackShared ? 4 : 0) ||
                focus != flags[0] || courage != flags[1] || curiosity != flags[2])
                throw new ArgumentException("Inconsistent activity rewards");
            var value = new WorkshopBond
            {
                Bond = bond, Focus = focus, Courage = courage,
                Curiosity = curiosity, SnackShared = snackShared
            };
            for (int i = 0; i < 3; i++) value.completed[i] = flags[i] == 1;
            return value;
        }

        public bool Complete(MiniGame game)
        {
            int index = CheckedGame(game);
            if (completed[index]) return false;
            completed[index] = true;
            Bond = Math.Min(100, Bond + 8);
            switch (game)
            {
                case MiniGame.Echo: Focus++; break;
                case MiniGame.Skip: Courage++; break;
                case MiniGame.Pairs: Curiosity++; break;
            }
            return true;
        }

        public bool ShareSnack(Inventory inventory)
        {
            if (!inventory.Take(ItemId.PicnicSnack)) return false;
            if (!SnackShared)
            {
                SnackShared = true;
                Bond = Math.Min(100, Bond + 4);
            }
            return true;
        }

        private static int CheckedGame(MiniGame game)
        {
            if ((int)game < 0 || (int)game > 2) throw new ArgumentOutOfRangeException(nameof(game));
            return (int)game;
        }
    }

    // Structured, local-only firsts. Durable save schema v4; one entry per kind.
    public enum MemoryKind
    {
        FirstFeed, FirstPlay, FirstClean, FirstComfort, FirstCraft, FirstSnack,
        FirstEcho, FirstSkip, FirstPairs, FirstRoom, FirstGrove, FirstMeadow, FirstPond
    }

    [Serializable]
    public sealed class MemoryEntry
    {
        public int kind;
        public long occurredAt;
    }

    public sealed class MemoryBook
    {
        public const int Limit = 13;
        private const long MaxTimestamp = 253402300799999L;
        private readonly List<MemoryEntry> entries = new();

        // Never leak mutable objects from the live save ledger.
        public IReadOnlyList<MemoryEntry> Entries => entries.ConvertAll(Copy).AsReadOnly();

        public bool Record(MemoryKind kind, long now)
        {
            if (!Enum.IsDefined(typeof(MemoryKind), kind) || now < 0 || now > MaxTimestamp)
                throw new ArgumentOutOfRangeException(nameof(kind));
            foreach (var entry in entries)
                if (entry.kind == (int)kind) return false;

            // A clock correction cannot invalidate chronology or remove memories.
            long time = entries.Count == 0 ? now :
                Math.Max(now, entries[entries.Count - 1].occurredAt);
            entries.Add(new MemoryEntry { kind = (int)kind, occurredAt = time });
            return true;
        }

        public MemoryEntry[] Snapshot() => entries.ConvertAll(Copy).ToArray();

        public static MemoryBook Restore(MemoryEntry[] saved)
        {
            if (saved == null || saved.Length > Limit)
                throw new ArgumentException("Invalid memory collection");
            var book = new MemoryBook();
            var seen = new HashSet<int>();
            long previous = 0;
            foreach (var entry in saved)
            {
                if (entry == null || entry.kind < 0 || entry.kind >= Limit ||
                    entry.occurredAt < previous || entry.occurredAt > MaxTimestamp ||
                    !seen.Add(entry.kind))
                    throw new ArgumentException("Invalid or duplicate memory");
                previous = entry.occurredAt;
                book.entries.Add(Copy(entry));
            }
            return book;
        }

        public static string Title(MemoryKind kind) => kind switch
        {
            MemoryKind.FirstFeed => "Our first treat",
            MemoryKind.FirstPlay => "A playful afternoon",
            MemoryKind.FirstClean => "Fresh as a daisy",
            MemoryKind.FirstComfort => "A quiet promise",
            MemoryKind.FirstCraft => "Made with care",
            MemoryKind.FirstSnack => "Our first picnic",
            MemoryKind.FirstEcho => "The forest melody",
            MemoryKind.FirstSkip => "Stones across the pond",
            MemoryKind.FirstPairs => "A meadow of pairs",
            MemoryKind.FirstRoom => "A home of our own",
            MemoryKind.FirstGrove => "Secrets of the grove",
            MemoryKind.FirstMeadow => "A meadow keepsake",
            MemoryKind.FirstPond => "A treasure by the pond",
            _ => throw new ArgumentOutOfRangeException(nameof(kind))
        };

        private static MemoryEntry Copy(MemoryEntry entry) => new()
        {
            kind = entry.kind,
            occurredAt = entry.occurredAt
        };
    }

}
