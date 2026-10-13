import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceCompanion,
  clean,
  comfort,
  companionAgeDays,
  createCompanion,
  feed,
  play,
  sleep,
  wake,
} from './state.ts';

const HOUR_MS = 60 * 60 * 1000;

test('starter companion has bounded needs, character inputs and timestamps', () => {
  const pet = createCompanion('Pip', 0);
  assert.equal(pet.name, 'Pip');
  assert.equal(pet.bornAt, 0);
  assert.equal(pet.lastSimulatedAt, 0);
  assert.equal(pet.sleeping, false);
  for (const value of [
    pet.hunger,
    pet.happiness,
    pet.energy,
    pet.cleanliness,
    pet.mood,
    pet.bond,
    pet.health,
    pet.curiosity,
    pet.gentleness,
  ]) {
    assert.ok(value >= 0 && value <= 100);
  }
  assert.equal(createCompanion('Pip', Number.NaN).bornAt, 0);
  assert.equal(createCompanion('Pip', -12).bornAt, 0);
});

test('care actions return immutable bounded state', () => {
  const start = createCompanion('Pip', 0);
  const fed = feed(start);
  const played = play(fed);
  const cleaned = clean(played);
  assert.notEqual(start, fed);
  assert.equal(start.hunger, 82);
  assert.equal(fed.hunger, 100);
  assert.equal(played.happiness, 90);
  assert.equal(played.energy, 80);
  assert.equal(cleaned.cleanliness, 100);
  assert.equal(cleaned.bond, 26);
  assert.equal(played.curiosity, 52);
  assert.equal(start.bond, 20);
});

test('repeated care actions clamp needs and personality at boundaries', () => {
  const maxed = {
    ...createCompanion('Pip', 0),
    hunger: 99,
    happiness: 99,
    cleanliness: 99,
    energy: 2,
    mood: 100,
    bond: 100,
    health: 100,
    curiosity: 100,
  };
  assert.equal(feed(maxed).hunger, 100);
  assert.equal(play(maxed).happiness, 100);
  assert.equal(play(maxed).energy, 0);
  assert.equal(clean(maxed).cleanliness, 100);
  assert.equal(clean(maxed).health, 100);
  assert.equal(play(maxed).curiosity, 100);
  assert.equal(feed(maxed).bond, 100);
  assert.equal(feed(maxed).mood, 100);
});

test('offline simulation advances whole hours deterministically', () => {
  const pet = createCompanion('Pip', 0);
  const advanced = advanceCompanion(pet, 6 * HOUR_MS + 20 * 60_000);
  assert.deepEqual(
    {
      hunger: advanced.hunger,
      happiness: advanced.happiness,
      cleanliness: advanced.cleanliness,
      energy: advanced.energy,
      mood: advanced.mood,
      health: advanced.health,
      lastSimulatedAt: advanced.lastSimulatedAt,
    },
    {
      hunger: 70,
      happiness: 70,
      cleanliness: 82,
      energy: 84,
      mood: 74,
      health: 94,
      lastSimulatedAt: 6 * HOUR_MS,
    },
  );
  assert.equal(pet.lastSimulatedAt, 0);
  assert.deepEqual(
    advanceCompanion(advanced, 6 * HOUR_MS + 20 * 60_000),
    advanced,
  );
});

test('small time increments and clock skew cannot double-advance', () => {
  const pet = createCompanion('Pip', 0);
  assert.equal(advanceCompanion(pet, 20 * 60_000), pet);
  assert.equal(advanceCompanion(pet, -HOUR_MS), pet);
  assert.equal(advanceCompanion(pet, Number.NaN), pet);
  assert.equal(advanceCompanion(pet, Number.POSITIVE_INFINITY), pet);
  const oneHour = advanceCompanion(pet, HOUR_MS);
  assert.equal(advanceCompanion(oneHour, HOUR_MS - 1), oneHour);
  assert.deepEqual(advanceCompanion(oneHour, 2 * HOUR_MS), {
    ...advanceCompanion(pet, 2 * HOUR_MS),
  });
});

test('long absences are recoverable and never accumulate unlimited decay', () => {
  const pet = createCompanion('Pip', 0);
  const returned = advanceCompanion(pet, 10_000 * HOUR_MS);
  assert.equal(returned.lastSimulatedAt, 10_000 * HOUR_MS);
  assert.equal(returned.hunger, 34);
  assert.equal(returned.health, 76);
  assert.equal(returned.energy, 66);
  assert.equal(advanceCompanion(returned, 10_000 * HOUR_MS), returned);
  const resumed = feed(returned);
  assert.ok(resumed.hunger > returned.hunger);
  const low = {
    ...createCompanion('Pip', 0),
    hunger: 0,
    happiness: 0,
    cleanliness: 0,
    health: 0,
    mood: 0,
  };
  const recoverable = advanceCompanion(low, 1000 * HOUR_MS);
  assert.equal(recoverable.health, 50);
  assert.equal(recoverable.hunger, 20);
  assert.equal(recoverable.happiness, 30);
  assert.equal(recoverable.cleanliness, 25);
  assert.equal(recoverable.mood, 35);
});

test('sleep changes energy restoration and play wakes the companion', () => {
  const initial = createCompanion('Pip', 0);
  const sleeping = sleep(initial);
  assert.equal(sleeping.sleeping, true);
  const rested = advanceCompanion(sleeping, 5 * HOUR_MS);
  assert.equal(rested.energy, 100);
  assert.equal(wake(rested).sleeping, false);
  assert.equal(play(rested).sleeping, false);
  assert.equal(sleep(initial).energy, initial.energy);
});

test('age is derived from elapsed wall time without mutating the pet', () => {
  const pet = createCompanion('Pip', 1000);
  assert.equal(companionAgeDays(pet, 1000), 0);
  assert.equal(companionAgeDays(pet, -3000), 0);
  assert.equal(companionAgeDays(pet, Number.NaN), 0);
  assert.equal(companionAgeDays(pet, 1000 + 47 * HOUR_MS), 1);
  assert.equal(companionAgeDays(pet, 1000 + 48 * HOUR_MS), 2);
  assert.equal(pet.bornAt, 1000);
});

test('direct companion comfort is bounded and preserves sleep', () => {
  const pet = { ...createCompanion('Pip', 0), sleeping: true };
  const touched = comfort(pet);
  assert.equal(pet.bond, 20);
  assert.equal(touched.bond, 24);
  assert.equal(touched.mood, 83);
  assert.equal(touched.gentleness, 51);
  assert.equal(touched.sleeping, true);
  const nearMax = {
    ...pet,
    bond: 99,
    mood: 99,
    gentleness: 99,
  };
  assert.equal(comfort(nearMax).bond, 100);
  assert.equal(comfort(nearMax).mood, 100);
  assert.equal(comfort(nearMax).gentleness, 100);
});
