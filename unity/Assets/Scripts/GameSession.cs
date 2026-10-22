using System;
using UnityEngine;

namespace Tamagoochi
{
    // One versioned transaction contains everything required to resume the care/workshop loop.
    [Serializable]
    public sealed class GameSnapshot
    {
        public int version = 3;
        public Pet pet;
        public int[] items;
        public int[] room;
        public int[] completed;
        public int bond;
        public int curiosity;
        public int courage;
        public int focus;
        public bool snackShared;
        public int echoRound;
        public int echoProgress;
        public int skipRound;
        public int skipDistance;
        public int skipHops;
        public int pairsRound;
        public int[] pairsMatched;
        public int[] pairsRevealed;
        public ExpeditionSave expeditions;
    }

    public sealed class GameSession
    {
        public Pet Pet { get; }
        public Inventory Inventory { get; }
        public Room Room { get; }
        public WorkshopBond Bond { get; }
        public ForestEcho Echo { get; }
        public StoneSkip Skip { get; }
        public MeadowPairs Pairs { get; }
        public Expeditions Expeditions { get; }

        private GameSession(Pet pet, Inventory inventory, Room room, WorkshopBond bond,
            ForestEcho echo, StoneSkip skip, MeadowPairs pairs, Expeditions expeditions)
        {
            Pet = pet;
            Inventory = inventory;
            Room = room;
            Bond = bond;
            Echo = echo;
            Skip = skip;
            Pairs = pairs;
            Expeditions = expeditions;
        }

        public static GameSession New(long now, Pet existingPet = null) =>
            new(existingPet ?? Tamagoochi.Pet.Create(now), Tamagoochi.Inventory.Starter(), new Tamagoochi.Room(),
                new Tamagoochi.WorkshopBond(), new Tamagoochi.ForestEcho(), new Tamagoochi.StoneSkip(),
                new Tamagoochi.MeadowPairs(), new Tamagoochi.Expeditions());

        public GameSnapshot Capture() => new()
        {
            pet = Pet.Copy(),
            items = Inventory.Snapshot(),
            room = Room.Snapshot(),
            completed = Bond.Snapshot(),
            bond = Bond.Bond,
            curiosity = Bond.Curiosity,
            courage = Bond.Courage,
            focus = Bond.Focus,
            snackShared = Bond.SnackShared,
            echoRound = Echo.Round,
            echoProgress = Echo.Progress,
            skipRound = Skip.Round,
            skipDistance = Skip.Distance,
            skipHops = Skip.Hops,
            pairsRound = Pairs.Round,
            pairsMatched = Pairs.MatchedSnapshot(),
            pairsRevealed = Pairs.RevealedSnapshot(),
            expeditions = Expeditions.Snapshot()
        };

        public static bool IsValidPet(Pet pet)
        {
            if (pet == null || string.IsNullOrWhiteSpace(pet.name) || pet.name.Length > 48 ||
                pet.bornAt < 0 || pet.lastSimulatedAt < pet.bornAt ||
                (pet.roomItemSlot != "left" && pet.roomItemSlot != "center" &&
                 pet.roomItemSlot != "right")) return false;
            return ValidStat(pet.hunger) && ValidStat(pet.happiness) &&
                ValidStat(pet.energy) && ValidStat(pet.cleanliness) &&
                ValidStat(pet.mood) && ValidStat(pet.bond) &&
                ValidStat(pet.health) && ValidStat(pet.curiosity) &&
                ValidStat(pet.gentleness);
        }

        private static bool ValidStat(float value) =>
            !float.IsNaN(value) && !float.IsInfinity(value) && value >= 0 && value <= 100;

        public static bool TryRestore(GameSnapshot snapshot, out GameSession session)
        {
            session = null;
            if (snapshot == null || (snapshot.version != 2 && snapshot.version != 3) ||
                !IsValidPet(snapshot.pet))
                return false;
            try
            {
                var inventory = Tamagoochi.Inventory.Restore(snapshot.items);
                var room = Tamagoochi.Room.Restore(snapshot.room);
                var bond = Tamagoochi.WorkshopBond.Restore(snapshot.completed, snapshot.bond,
                    snapshot.curiosity, snapshot.courage, snapshot.focus, snapshot.snackShared);
                var echo = Tamagoochi.ForestEcho.Restore(snapshot.echoRound, snapshot.echoProgress);
                var skip = Tamagoochi.StoneSkip.Restore(snapshot.skipRound, snapshot.skipDistance,
                    snapshot.skipHops);
                var pairs = Tamagoochi.MeadowPairs.Restore(snapshot.pairsRound, snapshot.pairsMatched,
                    snapshot.pairsRevealed);
                // v2 saves predate expeditions. Preserve their workshop exactly.
                var expeditions = snapshot.version == 2 ? new Tamagoochi.Expeditions() :
                    Tamagoochi.Expeditions.Restore(snapshot.expeditions);
                session = new GameSession(snapshot.pet.Copy(), inventory, room, bond,
                    echo, skip, pairs, expeditions);
                return true;
            }
            catch (Exception error) when (error is ArgumentException ||
                                          error is InvalidOperationException)
            {
                return false;
            }
        }
    }
}
