using System;

namespace Tamagoochi
{
    public enum ItemId
    {
        WildBerry, FlowerPetal, SoftFiber, RiverStone, PicnicSnack,
        LeafToy, MossCushion, StarKeepsake, FlowerCrown
    }

    public sealed class Inventory
    {
        private readonly int[] counts = new int[9];
        private static readonly int[] Limits = { 99, 99, 99, 99, 20, 10, 5, 10, 10 };

        private Inventory() { }

        public static Inventory Starter()
        {
            var inventory = new Inventory();
            inventory.counts[(int)ItemId.WildBerry] = 6;
            inventory.counts[(int)ItemId.FlowerPetal] = 6;
            inventory.counts[(int)ItemId.SoftFiber] = 5;
            inventory.counts[(int)ItemId.RiverStone] = 2;
            return inventory;
        }

        public int Count(ItemId item) => counts[CheckedIndex(item)];

        public int[] Snapshot() => (int[])counts.Clone();

        public static Inventory Restore(int[] values)
        {
            if (values == null || values.Length != Limits.Length)
                throw new ArgumentException("Invalid inventory dimensions");
            var bag = new Inventory();
            for (int i = 0; i < values.Length; i++)
            {
                if (values[i] < 0 || values[i] > Limits[i])
                    throw new ArgumentException("Invalid inventory count");
                bag.counts[i] = values[i];
            }
            return bag;
        }

        public bool Give(ItemId item, int quantity = 1)
        {
            int i = CheckedIndex(item);
            if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
            if (quantity > Limits[i] - counts[i]) return false;
            counts[i] += quantity;
            return true;
        }

        public bool Take(ItemId item, int quantity = 1)
        {
            int i = CheckedIndex(item);
            if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
            if (quantity > counts[i]) return false;
            counts[i] -= quantity;
            return true;
        }

        public bool Craft(ItemId output)
        {
            (ItemId, int)[] ingredients = output switch
            {
                ItemId.PicnicSnack => new[] { (ItemId.WildBerry, 2), (ItemId.FlowerPetal, 1) },
                ItemId.LeafToy => new[] { (ItemId.FlowerPetal, 2), (ItemId.SoftFiber, 1) },
                ItemId.MossCushion => new[] { (ItemId.FlowerPetal, 2), (ItemId.SoftFiber, 2) },
                ItemId.StarKeepsake => new[] { (ItemId.RiverStone, 1), (ItemId.SoftFiber, 1) },
                ItemId.FlowerCrown => new[] { (ItemId.FlowerPetal, 3), (ItemId.SoftFiber, 1) },
                _ => throw new ArgumentOutOfRangeException(nameof(output))
            };
            if (Count(output) >= Limits[(int)output]) return false;
            foreach (var (item, amount) in ingredients)
                if (Count(item) < amount) return false;
            foreach (var (item, amount) in ingredients) counts[(int)item] -= amount;
            counts[(int)output]++;
            return true;
        }

        private static int CheckedIndex(ItemId item)
        {
            int index = (int)item;
            if (index < 0 || index >= Limits.Length)
                throw new ArgumentOutOfRangeException(nameof(item));
            return index;
        }
    }
}
