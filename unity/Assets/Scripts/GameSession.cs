using System;
using UnityEngine;

namespace Tamagoochi
{
    // One versioned transaction contains everything required to resume the care/workshop loop.
    [Serializable]
    public sealed class GameSnapshot
    {
        public int version = 4;
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
        public MemoryEntry[] memories;
    }

    // An early, reversible personality glimpse—not the final evolution system.
    public enum SoulprintNature { Budding, Tenderhearted, Curious, Trailblazer }

    // Twelve authored future silhouettes. This is a preview, not a committed evolution.
    public readonly struct EvolutionPreview
    {
        public string Name { get; }
        public string Description { get; }
        public Habitat Habitat { get; }
        public SoulprintNature Nature { get; }

        public EvolutionPreview(string name, string description, Habitat habitat,
            SoulprintNature nature)
        {
            Name = name;
            Description = description;
            Habitat = habitat;
            Nature = nature;
        }
    }

    public static class EvolutionPaths
    {
        private static readonly (string name, string description)[,] Forms =
        {
            {
                ("Mossveil", "A quiet keeper of ancient woodland roots."),
                ("Fernwhisper", "A sheltering spirit who listens to every leaf."),
                ("Lumenfern", "An inquisitive wanderer collecting forest light."),
                ("Briarstride", "A fearless guardian of winding green trails.")
            },
            {
                ("Cloudblossom", "A peaceful traveler among sunlit grasses."),
                ("Petalhush", "A gentle soul caring for forgotten flowers."),
                ("Pollenwink", "A bright explorer chasing unfamiliar colors."),
                ("Sunskip", "A swift dancer leaping over golden fields.")
            },
            {
                ("Stillwater", "A thoughtful spirit watching moonlit ripples."),
                ("Reedhymn", "A calming voice among the waterside reeds."),
                ("Pearlglint", "An adventurer drawn to luminous depths."),
                ("Rippledash", "A brave skimmer crossing silver-blue water.")
            }
        };

        public static EvolutionPreview Preview(Habitat habitat, SoulprintNature nature)
        {
            if (!Enum.IsDefined(typeof(Habitat), habitat))
                throw new ArgumentOutOfRangeException(nameof(habitat));
            if (!Enum.IsDefined(typeof(SoulprintNature), nature))
                throw new ArgumentOutOfRangeException(nameof(nature));
            var form = Forms[(int)habitat, (int)nature];
            return new EvolutionPreview(form.name, form.description, habitat, nature);
        }
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
        public MemoryBook Memories { get; }

        // Derived exclusively from persisted care and activity. No extra save fields,
        // randomness, location tracking, punitive decay or evolution commitment.
        public SoulprintNature Nature
        {
            get
            {
                int wonder = (int)Math.Max(0, Pet.curiosity - 50) +
                    Math.Min(12, Expeditions.Completed * 2) + Bond.Curiosity * 2;
                int kindness = (int)Math.Max(0, Pet.gentleness - 50) * 2 +
                    (Bond.SnackShared ? 2 : 0);
                int courage = Bond.Courage * 6;

                if (Math.Max(wonder, Math.Max(kindness, courage)) < 6)
                    return SoulprintNature.Budding;
                if (courage > wonder && courage > kindness)
                    return SoulprintNature.Trailblazer;
                return kindness > wonder ? SoulprintNature.Tenderhearted :
                    SoulprintNature.Curious;
            }
        }

        // The most visited recorded habitat informs a possible future form.
        // Ties remain stable; no location is recorded or inferred.
        public Habitat FamiliarHabitat
        {
            get
            {
                var visits = new int[3];
                foreach (var record in Expeditions.Journal) visits[record.habitat]++;
                int best = 0;
                for (int i = 1; i < visits.Length; i++)
                    if (visits[i] > visits[best]) best = i;
                return (Habitat)best;
            }
        }

        public EvolutionPreview FutureForm => EvolutionPaths.Preview(FamiliarHabitat, Nature);

        public string NatureDescription => Nature switch
        {
            SoulprintNature.Tenderhearted => "Gentle moments are shaping a caring spirit.",
            SoulprintNature.Curious => "Every game and discovery sparks new wonder.",
            SoulprintNature.Trailblazer => "Brave little leaps are becoming a habit.",
            _ => "Your shared moments are shaping a unique personality."
        };

        private GameSession(Pet pet, Inventory inventory, Room room, WorkshopBond bond,
            ForestEcho echo, StoneSkip skip, MeadowPairs pairs, Expeditions expeditions,
            MemoryBook memories)
        {
            Pet = pet;
            Inventory = inventory;
            Room = room;
            Bond = bond;
            Echo = echo;
            Skip = skip;
            Pairs = pairs;
            Expeditions = expeditions;
            Memories = memories;
        }

        public static GameSession New(long now, Pet existingPet = null) =>
            new(existingPet ?? Tamagoochi.Pet.Create(now), Tamagoochi.Inventory.Starter(), new Tamagoochi.Room(),
                new Tamagoochi.WorkshopBond(), new Tamagoochi.ForestEcho(), new Tamagoochi.StoneSkip(),
                new Tamagoochi.MeadowPairs(), new Tamagoochi.Expeditions(), new MemoryBook());

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
            expeditions = Expeditions.Snapshot(),
            memories = Memories.Snapshot()
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
            if (snapshot == null || (snapshot.version != 2 && snapshot.version != 3 && snapshot.version != 4) ||
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
                var memories = snapshot.version == 4
                    ? MemoryBook.Restore(snapshot.memories) : new MemoryBook();
                session = new GameSession(snapshot.pet.Copy(), inventory, room, bond,
                    echo, skip, pairs, expeditions, memories);
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
