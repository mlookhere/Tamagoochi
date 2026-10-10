export type Companion = Readonly<{
  name: string;
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
}>;

export function createCompanion(name = 'Mochi'): Companion {
  return { name, hunger: 82, happiness: 76, energy: 90, cleanliness: 88 };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function feed(pet: Companion): Companion {
  return { ...pet, hunger: clamp(pet.hunger + 18) };
}

export function play(pet: Companion): Companion {
  return {
    ...pet,
    happiness: clamp(pet.happiness + 14),
    energy: clamp(pet.energy - 10),
  };
}

export function clean(pet: Companion): Companion {
  return { ...pet, cleanliness: clamp(pet.cleanliness + 24) };
}
