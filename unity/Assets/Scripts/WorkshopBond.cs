using System;

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
}
