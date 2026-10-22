using System;

namespace Tamagoochi
{
    public enum RoomSlot { Window, Nook, Garden }
    public enum RoomMood { Resting, Delighted, Curious, Shy }

    public sealed class Room
    {
        private readonly ItemId?[] slots = new ItemId?[3];
        public ItemId? At(RoomSlot slot) => slots[CheckedSlot(slot)];

        public int[] Snapshot()
        {
            var result = new int[slots.Length];
            for (int i = 0; i < result.Length; i++)
                result[i] = slots[i].HasValue ? (int)slots[i].Value : -1;
            return result;
        }

        public static Room Restore(int[] values)
        {
            if (values == null || values.Length != 3)
                throw new ArgumentException("Invalid room dimensions");
            var room = new Room();
            for (int i = 0; i < values.Length; i++)
            {
                if (values[i] == -1) continue;
                var item = (ItemId)values[i];
                if (!IsRoomItem(item)) throw new ArgumentException("Invalid room decoration");
                room.slots[i] = item;
            }
            return room;
        }

        public bool Place(Inventory inventory, RoomSlot slot, ItemId item)
        {
            int index = CheckedSlot(slot);
            if (!IsRoomItem(item)) throw new ArgumentOutOfRangeException(nameof(item));
            if (slots[index].HasValue || !inventory.Take(item)) return false;
            slots[index] = item;
            return true;
        }

        public bool PickUp(Inventory inventory, RoomSlot slot)
        {
            int index = CheckedSlot(slot);
            ItemId? item = slots[index];
            if (!item.HasValue || !inventory.Give(item.Value)) return false;
            slots[index] = null;
            return true;
        }

        public (RoomSlot slot, RoomMood mood) CompanionPlacement()
        {
            for (int preference = 0; preference < 3; preference++)
                for (int i = 0; i < slots.Length; i++)
                {
                    if (!slots[i].HasValue || Preference(slots[i].Value) != preference) continue;
                    if (preference == 2)
                        return (i == 0 ? RoomSlot.Garden : RoomSlot.Window, RoomMood.Shy);
                    return ((RoomSlot)i, preference == 0 ? RoomMood.Delighted : RoomMood.Curious);
                }
            return (RoomSlot.Nook, RoomMood.Resting);
        }

        public string MoodDescription()
        {
            bool favorite = false, wary = false, neutral = false;
            foreach (var item in slots)
            {
                if (!item.HasValue) continue;
                int preference = Preference(item.Value);
                favorite |= preference == 0;
                wary |= preference == 2;
                neutral |= preference == 1;
            }
            if (favorite && wary) return "Mochi enjoys the cozy decor but keeps an eye on the shiny stone.";
            if (favorite) return "Mochi feels at home near a favorite object.";
            if (wary) return "Mochi gives the shiny stone a little space.";
            if (neutral) return "Mochi is curious about the new decor.";
            return "Mochi is ready to discover what you make next.";
        }

        private static int CheckedSlot(RoomSlot slot)
        {
            if ((int)slot < 0 || (int)slot > 2) throw new ArgumentOutOfRangeException(nameof(slot));
            return (int)slot;
        }

        private static bool IsRoomItem(ItemId item) =>
            item == ItemId.LeafToy || item == ItemId.MossCushion ||
            item == ItemId.StarKeepsake || item == ItemId.FlowerCrown;

        // Favorite, neutral, wary: exact preference order from the Expo prototype.
        private static int Preference(ItemId item) => item switch
        {
            ItemId.LeafToy or ItemId.MossCushion => 0,
            ItemId.FlowerCrown => 1,
            ItemId.StarKeepsake => 2,
            _ => throw new ArgumentOutOfRangeException(nameof(item))
        };
    }
}
