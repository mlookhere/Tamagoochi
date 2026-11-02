import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompanion } from '../domain/pet/state.ts';
import {
  SAVE_VERSION,
  restoreCompanion,
  serializeCompanion,
} from './companion.ts';

const HOUR_MS = 60 * 60 * 1000;

test('versioned save round-trips and resumes simulated elapsed hours', () => {
  const pet = createCompanion('Pip', 0);
  const raw = serializeCompanion(pet);
  assert.equal(JSON.parse(raw).version, SAVE_VERSION);
  const restored = restoreCompanion(raw, 3 * HOUR_MS);
  assert.equal(restored.source, 'restored');
  assert.equal(restored.pet.name, 'Pip');
  assert.equal(restored.pet.hunger, 76);
  assert.equal(restored.pet.lastSimulatedAt, 3 * HOUR_MS);
  assert.deepEqual(restored.pet, restoreCompanion(raw, 3 * HOUR_MS).pet);
});

test('missing and corrupt saves return safe starter state', () => {
  const missing = restoreCompanion(null, 1200);
  assert.equal(missing.source, 'new');
  assert.equal(missing.pet.bornAt, 1200);
  for (const value of [
    '',
    'not json',
    '[]',
    '{}',
    '{"version":2,"pet":{"name":"Pip"}}',
  ]) {
    const restored = restoreCompanion(value, 4000);
    assert.equal(restored.source, 'recovered');
    assert.equal(restored.pet.lastSimulatedAt, 4000);
  }
});

test('legacy version 1 preserves original needs with new safe defaults', () => {
  const raw = JSON.stringify({
    version: 1,
    pet: {
      name: 'Old Pip',
      hunger: 35,
      happiness: 50,
      energy: 45,
      cleanliness: 60,
    },
  });
  const result = restoreCompanion(raw, 10_000);
  assert.equal(result.source, 'migrated');
  assert.equal(result.pet.hunger, 35);
  assert.equal(result.pet.mood, 80);
  assert.equal(result.pet.name, 'Old Pip');
  assert.equal(result.pet.bornAt, 10_000);
  assert.equal(
    restoreCompanion(serializeCompanion(result.pet), 10_000).source,
    'restored',
  );
});

test('invalid current and legacy fields never enter simulation', () => {
  const pet = createCompanion('Pip', 0);
  const invalid = [
    { ...pet, hunger: 101 },
    { ...pet, roomItemSlot: 'ceiling' },
    { ...pet, roomItemSlot: ['left'] },
    { ...pet, mood: Number.NaN },
    { ...pet, sleeping: 'sometimes' },
    { ...pet, lastSimulatedAt: -1 },
    { ...pet, lastSimulatedAt: 100, bornAt: 101 },
    { ...pet, bornAt: 1.5 },
    { ...pet, name: '' },
    { ...pet, name: 'n'.repeat(41) },
  ];
  for (const candidate of invalid) {
    const result = restoreCompanion(
      JSON.stringify({ version: SAVE_VERSION, pet: candidate }),
      1000,
    );
    assert.equal(result.source, 'recovered');
  }

  const brokenV1 = JSON.stringify({
    version: 1,
    pet: {
      name: 'Pip',
      hunger: -1,
      happiness: 50,
      energy: 50,
      cleanliness: 50,
    },
  });
  assert.equal(restoreCompanion(brokenV1, 1000).source, 'recovered');
});

test('serializer rejects malformed state before writing', () => {
  const pet = createCompanion('Pip', 0);
  assert.throws(() => serializeCompanion({ ...pet, hunger: -5 }));
  assert.throws(() => serializeCompanion({ ...pet, lastSimulatedAt: -10 }));
});

test('version 2 saves retain needs, timestamps and sleep when migrated to room v3', () => {
  const old = createCompanion('Old Pip', 1000);
  const { roomItemSlot, ...previousPet } = {
    ...old,
    hunger: 45,
    sleeping: true,
  };
  assert.equal(roomItemSlot, 'left');
  const restored = restoreCompanion(
    JSON.stringify({ version: 2, pet: previousPet }),
    1000 + 3 * HOUR_MS,
  );
  assert.equal(restored.source, 'migrated');
  assert.equal(restored.pet.name, old.name);
  assert.equal(restored.pet.sleeping, true);
  assert.equal(restored.pet.bornAt, old.bornAt);
  assert.equal(restored.pet.roomItemSlot, 'left');
  assert.equal(restored.pet.hunger, 39);
  assert.equal(restored.pet.lastSimulatedAt, 1000 + 3 * HOUR_MS);
  assert.equal(
    restoreCompanion(serializeCompanion(restored.pet), 1000 + 3 * HOUR_MS)
      .source,
    'restored',
  );
});

test('version 3 preserves moved item position after reload', () => {
  const pet = { ...createCompanion('Pip', 0), roomItemSlot: 'right' as const };
  const raw = serializeCompanion(pet);
  const result = restoreCompanion(raw, 0);
  assert.equal(result.source, 'restored');
  assert.equal(result.pet.roomItemSlot, 'right');
});

test('newer-version saves remain unsupported instead of being reset', () => {
  const future = JSON.stringify({
    version: SAVE_VERSION + 1,
    pet: { future: 'data that this app cannot interpret' },
  });
  const result = restoreCompanion(future, 1000);
  assert.equal(result.source, 'unsupported');
  assert.equal(result.pet.bornAt, 1000);
  assert.equal(
    restoreCompanion(JSON.stringify({ version: 100, pet: {} }), 1000).source,
    'unsupported',
  );
});

test('oversized saves are preserved rather than overwritten or parsed', () => {
  const oversizedFuture = JSON.stringify({
    version: SAVE_VERSION + 1,
    pet: { futureData: 'x'.repeat(17_000) },
  });
  assert.equal(restoreCompanion(oversizedFuture, 1000).source, 'unsupported');
  const oversizedUnknown = restoreCompanion('x'.repeat(17_000), 1000);
  assert.equal(oversizedUnknown.source, 'unsupported');
});
