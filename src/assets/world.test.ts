import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { inflateSync } from 'node:zlib';
import { WORLD_ILLUSTRATIONS } from '../theme/world.ts';

const filenames = {
  berry: 'berry',
  wateringCan: 'watering-can',
  lantern: 'lantern',
  seedPouch: 'seed-pouch',
  meadow: 'meadow',
  grove: 'grove',
  pond: 'pond',
  trail: 'trail',
} as const;

test('original world art covers eight distinct items and landmarks', () => {
  assert.equal(WORLD_ILLUSTRATIONS.length, 8);
  const names = WORLD_ILLUSTRATIONS.map((entry) => entry.key);
  assert.equal(new Set(names).size, 8);
  assert.deepEqual(names, Object.keys(filenames));
  assert.equal(
    WORLD_ILLUSTRATIONS.filter((entry) => entry.category === 'item').length,
    4,
  );
  assert.equal(
    WORLD_ILLUSTRATIONS.filter((entry) => entry.category === 'landmark').length,
    4,
  );
});

test('world imagery has static Metro imports and transparent RGBA pixels', () => {
  const source = readFileSync('src/assets/world.ts', 'utf8');
  const images = new Set<string>();
  for (const [key, filename] of Object.entries(filenames)) {
    const file = readFileSync(`assets/world/${filename}.png`);
    assert.match(source, new RegExp(`\\b${key}: require\\(`));
    assert.ok(source.includes(`assets/world/${filename}.png`));
    assert.deepEqual(
      Array.from(file.subarray(0, 8)),
      [137, 80, 78, 71, 13, 10, 26, 10],
    );
    assert.equal(file.readUInt32BE(16), 128);
    assert.equal(file.readUInt32BE(20), 128);
    assert.equal(file[25], 6, 'Artwork must be RGBA');
    const idatBytes = file.readUInt32BE(33);
    assert.ok(idatBytes > 0);
    const pixels = inflateSync(file.subarray(41, 41 + idatBytes));
    assert.equal(pixels.length, 128 * 513);
    function alphaAt(x: number, y: number) {
      return pixels[y * 513 + 1 + x * 4 + 3];
    }
    assert.equal(alphaAt(0, 0), 0, 'Edges must remain transparent');
    assert.ok(alphaAt(64, 60) > 200, 'Artwork center must be visible');
    images.add(file.toString('base64'));
  }
  assert.equal(images.size, 8, 'Each artwork file must be visually distinct');
});
