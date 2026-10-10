import assert from 'node:assert/strict';
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
  const pathRegex = /companions\/([\w-]+)\.png'\s*,?\s*\)/g;
  const required = [...registry.matchAll(pathRegex)].map((match) => match[1]);
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

test('companion art maintains visible silhouettes and distinct expressions', () => {
  const decoded = new Map<string, Buffer>();

  for (const name of exported) {
    const file = readFileSync(`assets/companions/${name}.png`);
    const payloadLength = file.readUInt32BE(33);
    const pixels = inflateSync(file.subarray(41, 41 + payloadLength));
    assert.equal(pixels.length, 256 * 1025);

    function alphaAt(x: number, y: number) {
      return pixels[y * 1025 + 1 + x * 4 + 3];
    }

    assert.equal(alphaAt(0, 0), 0, 'Corners must be transparent');
    assert.ok(alphaAt(128, 150) > 200, 'Mascot body must be opaque');
    assert.equal(alphaAt(255, 255), 0, 'Opposite corner must be clear');
    decoded.set(name, pixels);
  }

  const reference = decoded.get('seedling-neutral');
  assert.ok(reference);
  for (const name of exported.slice(1)) {
    assert.notDeepEqual(
      decoded.get(name),
      reference,
      `Artwork should be visually distinct: ${name}`,
    );
  }
});
