import assert from 'node:assert/strict';
import test from 'node:test';
import { clean, createCompanion, feed, play } from './state.ts';

test('starter companion has valid bounded needs', () => {
  const pet = createCompanion('Pip');
  assert.equal(pet.name, 'Pip');
  for (const value of [pet.hunger, pet.happiness, pet.energy, pet.cleanliness]) {
    assert.ok(value >= 0 && value <= 100);
  }
});

test('care actions return new state and never mutate the original', () => {
  const start = createCompanion();
  const fed = feed(start);
  const played = play(fed);
  const cleaned = clean(played);
  assert.notEqual(start, fed);
  assert.equal(start.hunger, 82);
  assert.equal(fed.hunger, 100);
  assert.equal(played.happiness, 90);
  assert.equal(played.energy, 80);
  assert.equal(cleaned.cleanliness, 100);
});

test('repeated care actions clamp needs at boundaries', () => {
  const maxed = { ...createCompanion(), hunger: 99, happiness: 99, cleanliness: 99, energy: 2 };
  assert.equal(feed(maxed).hunger, 100);
  assert.equal(play(maxed).happiness, 100);
  assert.equal(play(maxed).energy, 0);
  assert.equal(clean(maxed).cleanliness, 100);
});
