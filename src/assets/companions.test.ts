import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const registry = readFileSync('src/assets/companions.ts', 'utf8');
const exported = [
  'seedling-neutral',
  'seedling-joyful',
  'seedling-sad',
  'seedling-asleep',
  'seedling-surprised',
  'bud-neutral',
  'bloom-neutral',
];

test('every companion sprite is registered as a static Metro image', () => {
  const required = Array.from(
    registry.matchAll(/require\('..\/..\/assets\/companions\/([\w-]+)\.png'\)/g),
    (match) => match[1],
  );
  assert.deepEqual(required, exported);
});

test('companion assets have a transparent high-resolution PNG format', () => {
  for (const name of exported) {
    const file = readFileSync(`assets/companions/${name}.png`);
    assert.deepEqual(
      Array.from(file.subarray(0, 8)),
      [137, 80, 78, 71, 13, 10, 26, 10],
    );
    assert.equal(file.toString('ascii', 12, 16), 'IHDR');
    assert.equal(file.readUInt32BE(16), 256);
    assert.equal(file.readUInt32BE(20), 256);
    assert.equal(file[25], 6, 'PNG color type must be RGBA');
  }
});
