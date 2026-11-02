import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompanion } from '../domain/pet/state.ts';
import { loadCompanion, saveCompanion } from './repository.ts';

test('device storage round-trips the serialized companion', async () => {
  let stored: string | null = null;
  const port = {
    async read() {
      return stored;
    },
    async write(raw: string) {
      stored = raw;
    },
  };
  assert.equal((await loadCompanion(port, 0)).source, 'new');
  await saveCompanion(port, createCompanion('Pip', 0));
  assert.equal((await loadCompanion(port, 3_600_000)).pet.hunger, 80);
});

test('device read and write failures are not silently treated as new saves', async () => {
  const port = {
    async read(): Promise<string | null> {
      throw new Error('Storage unavailable');
    },
    async write(_raw: string): Promise<void> {
      throw new Error('Disk full');
    },
  };
  await assert.rejects(loadCompanion(port, 0), /Storage unavailable/);
  await assert.rejects(
    saveCompanion(port, createCompanion('Pip', 0)),
    /Disk full/,
  );
});

test('corrupt device payload returns recoverable state', async () => {
  const port = {
    async read() {
      return '{broken';
    },
    async write() {},
  };
  const recovered = await loadCompanion(port, 9_000);
  assert.equal(recovered.source, 'recovered');
  assert.equal(recovered.pet.lastSimulatedAt, 9_000);
});

test('future-version saved data is not rewritten during a load', async () => {
  const original = JSON.stringify({ version: 4, pet: { newField: true } });
  let current = original;
  let writes = 0;
  const port = {
    async read() {
      return current;
    },
    async write(data: string) {
      writes += 1;
      current = data;
    },
  };
  const result = await loadCompanion(port, 9_000);
  assert.equal(result.source, 'unsupported');
  assert.equal(writes, 0);
  assert.equal(current, original);
});
