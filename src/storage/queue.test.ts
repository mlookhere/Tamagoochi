import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompanion } from '../domain/pet/state.ts';
import { createCompanionSession } from './queue.ts';

test('a new Home load waits for pending writes from the previous Home', async () => {
  const calls: string[] = [];
  let stored: string | null = null;
  let unblock!: () => void;
  const gate = new Promise<void>((resolve) => {
    unblock = resolve;
  });
  let first = true;
  const storage = {
    async read() {
      calls.push('read');
      return stored;
    },
    async write(data: string) {
      const name = JSON.parse(data).pet.name as string;
      calls.push(`write:${name}`);
      if (first) {
        first = false;
        await gate;
      }
      stored = data;
    },
  };
  const session = createCompanionSession(storage);
  const firstWrite = session.save(createCompanion('First', 0));
  const lastWrite = session.save(createCompanion('Latest', 0));
  const remountedLoad = session.load(0);
  await Promise.resolve();
  assert.deepEqual(calls, ['write:First']);
  unblock();
  await Promise.all([firstWrite, lastWrite]);
  const restored = await remountedLoad;
  assert.equal(restored.source, 'restored');
  assert.equal(restored.pet.name, 'Latest');
  assert.deepEqual(calls, ['write:First', 'write:Latest', 'read']);
});

test('failed writes reject their callers without blocking later retry', async () => {
  let attempts = 0;
  let stored: string | null = null;
  const storage = {
    async read() {
      return stored;
    },
    async write(data: string) {
      attempts += 1;
      if (attempts === 1) throw new Error('Disk full');
      stored = data;
    },
  };
  const session = createCompanionSession(storage);
  await assert.rejects(session.save(createCompanion('First', 0)), /Disk full/);
  await session.save(createCompanion('Recovered', 0));
  assert.equal((await session.load(0)).pet.name, 'Recovered');
  assert.equal(attempts, 2);
});

test('failed reads reject their callers and do not poison the session', async () => {
  let attempts = 0;
  let stored: string | null = null;
  const storage = {
    async read() {
      attempts += 1;
      if (attempts === 1) throw new Error('Permission denied');
      return stored;
    },
    async write(data: string) {
      stored = data;
    },
  };
  const session = createCompanionSession(storage);
  await assert.rejects(session.load(0), /Permission denied/);
  await session.save(createCompanion('Pip', 0));
  assert.equal((await session.load(0)).source, 'restored');
});

test('failed save survives Home remount in memory until a successful retry', async () => {
  const original = createCompanion('Pip', 0);
  let stored = JSON.stringify({ version: 3, pet: original });
  let failWrite = true;
  const storage = {
    async read() {
      return stored;
    },
    async write(data: string) {
      if (failWrite) throw new Error('Disk full');
      stored = data;
    },
  };
  const session = createCompanionSession(storage);
  assert.equal((await session.load(0)).unsaved, false);
  const changed = { ...original, bond: 88, roomItemSlot: 'right' as const };
  await assert.rejects(session.save(changed), /Disk full/);

  const remounted = await session.load(0);
  assert.equal(remounted.source, 'restored');
  assert.equal(remounted.unsaved, true);
  assert.equal(remounted.pet.bond, 88);
  assert.equal(remounted.pet.roomItemSlot, 'right');
  assert.equal(JSON.parse(stored).pet.bond, original.bond);

  failWrite = false;
  await session.save(remounted.pet);
  const saved = await session.load(0);
  assert.equal(saved.unsaved, false);
  assert.equal(saved.pet.bond, 88);
  assert.equal(JSON.parse(stored).pet.roomItemSlot, 'right');
});

test('unsupported disk save blocks a stale failed-write snapshot', async () => {
  let stored = JSON.stringify({ version: 3, pet: createCompanion('Pip', 0) });
  const storage = {
    async read() {
      return stored;
    },
    async write(_data: string): Promise<void> {
      throw new Error('Disk full');
    },
  };
  const session = createCompanionSession(storage);
  await session.load(0);
  await assert.rejects(session.save(createCompanion('Unsaved', 0)), /Disk full/);
  stored = JSON.stringify({ version: 4, pet: { futureData: true } });
  const remounted = await session.load(0);
  assert.equal(remounted.source, 'unsupported');
  assert.equal(remounted.unsaved, false);
  assert.equal(JSON.parse(stored).version, 4);
});
