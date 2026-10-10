import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { inflateSync } from 'node:zlib';

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

test('pixel-art baselines retain their authored content and alpha', () => {
  const baselines = {
    'seedling-neutral': 'd3806c9e9e6184b87500b36f81d4d251641390b1',
    'seedling-joyful': 'bf7c5882712fb13a69307f9fe96b8f2a5fb13892',
    'seedling-sad': '83ff44b7236e8c04f11d5c08ec78f61b9bdc604d',
    'seedling-asleep': '05669d157e0b34abcd015ceef2a692f5557b436f',
    'seedling-surprised': 'a297d0c9504af2fb4632ababbadb7ca9bcdfb4ec',
    'bud-neutral': 'eb52e2364d600c8edbf6397dabf7395013a92226',
    'bloom-neutral': '5a56a2ffb99afe7bc75dde213a887fa5bfd4443c',
  };

  for (const [name, expected] of Object.entries(baselines)) {
    const file = readFileSync(`assets/companions/${name}.png`);
    const actual = createHash('sha1')
      .update(`blob ${file.length}\0`)
      .update(file)
      .digest('hex');
    assert.equal(actual, expected, `Visual asset changed: ${name}`);

    const payloadLength = file.readUInt32BE(33);
    const pixels = inflateSync(file.subarray(41, 41 + payloadLength));
    assert.equal(pixels.length, 256 * 1025);
    const alphaAt = (x: number, y: number) => pixels[y * 1025 + 1 + x * 4 + 3];
    assert.equal(alphaAt(0, 0), 0, 'Corners must be transparent');
    assert.ok(alphaAt(128, 150) > 200, 'Mascot body must be opaque');
  }
});
