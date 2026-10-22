using System;
using UnityEngine;

namespace Tamagoochi
{
    [Serializable]
    public sealed class Pet
    {
        public string name = "Mochi";
        public float hunger = 82;
        public float happiness = 76;
        public float energy = 90;
        public float cleanliness = 88;
        public float mood = 80;
        public float bond = 20;
        public float health = 100;
        public float curiosity = 50;
        public float gentleness = 50;
        public bool sleeping;
        public string roomItemSlot = "left";
        public long bornAt;
        public long lastSimulatedAt;

        public static Pet Create(long now, string name = "Mochi") => new()
        {
            name = name,
            bornAt = Math.Max(0, now),
            lastSimulatedAt = Math.Max(0, now)
        };

        public Pet Copy() => new()
        {
            name = name,
            hunger = hunger,
            happiness = happiness,
            energy = energy,
            cleanliness = cleanliness,
            mood = mood,
            bond = bond,
            health = health,
            curiosity = curiosity,
            gentleness = gentleness,
            sleeping = sleeping,
            roomItemSlot = roomItemSlot,
            bornAt = bornAt,
            lastSimulatedAt = lastSimulatedAt
        };

        public void Feed()
        {
            hunger = Cap(hunger + 18);
            mood = Cap(mood + 2);
            bond = Cap(bond + 2);
        }

        public void Play()
        {
            happiness = Cap(happiness + 14);
            energy = Cap(energy - 10);
            mood = Cap(mood + 4);
            bond = Cap(bond + 3);
            curiosity = Cap(curiosity + 2);
            sleeping = false;
        }

        public void Clean()
        {
            cleanliness = Cap(cleanliness + 24);
            health = Cap(health + 2);
            bond = Cap(bond + 1);
        }

        public void Comfort()
        {
            mood = Cap(mood + 3);
            bond = Cap(bond + 4);
            gentleness = Cap(gentleness + 1);
        }

        public void MoveRoomItem()
        {
            roomItemSlot = roomItemSlot == "left" ? "center" :
                roomItemSlot == "center" ? "right" : "left";
        }

        public int AgeDays(long now) => (int)Math.Max(0, (now - bornAt) / 86400000);

        // Matches the existing TypeScript rules; no running background timer.
        public void Advance(long now)
        {
            if (now <= lastSimulatedAt) return;
            long elapsed = (now - lastSimulatedAt) / 3600000;
            if (elapsed < 1) return;
            int hours = (int)Math.Min(24, elapsed);
            lastSimulatedAt = elapsed > 24 ? now : lastSimulatedAt + hours * 3600000;
            hunger = Math.Max(20, hunger - hours * 2);
            happiness = Math.Max(30, happiness - hours);
            cleanliness = Math.Max(25, cleanliness - hours);
            energy = Cap(energy + (sleeping ? hours * 3 : -hours));
            mood = Math.Max(35, mood - hours);
            health = Math.Max(50, health - hours);
        }

        private static float Cap(float value) => Mathf.Clamp(value, 0, 100);
    }
}
