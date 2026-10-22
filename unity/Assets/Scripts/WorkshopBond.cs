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
