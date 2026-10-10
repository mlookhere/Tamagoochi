import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { inflateSync } from 'node:zlib';
import { ONBOARDING_ILLUSTRATIONS } from '../theme/onboarding.ts';

const names = ['welcome', 'care', 'explore'] as const;
const width = 320;
const height = 240;

test('three onboarding studies are unique and explicitly descriptive', () => {
  assert.deepEqual(
    ONBOARDING_ILLUSTRATIONS.map((scene) => scene.key),
    names,
  );
  for (const scene of ONBOARDING_ILLUSTRATIONS) {
    assert.ok(scene.title.length > 10);
    assert.ok(scene.caption.length > 10);
    assert.ok(scene.description.length > 30);
  }
});

test('onboarding art has static native imports and RGBA pixels', () => {
  const registry = readFileSync('src/assets/onboarding.ts', 'utf8');
  const seen = new Set<string>();
  for (const name of names) {
    assert.ok(
      registry.includes(`${name}: require('../../assets/onboarding/${name}.png')`),
    );
    const file = readFileSync(`assets/onboarding/${name}.png`);
    assert.deepEqual(
      Array.from(file.subarray(0, 8)),
      [137, 80, 78, 71, 13, 10, 26, 10],
    );
    assert.equal(file.readUInt32BE(16), width);
    assert.equal(file.readUInt32BE(20), height);
    assert.equal(file[25], 6, 'Artwork must use RGBA PNG color');
    let offset = 8;
    const chunks: Buffer[] = [];
    while (offset < file.length) {
      const length = file.readUInt32BE(offset);
      const kind = file.toString('ascii', offset + 4, offset + 8);
      if (kind === 'IDAT') {
        chunks.push(file.subarray(offset + 8, offset + 8 + length));
      }
      offset += length + 12;
      if (kind === 'IEND') break;
    }
    const scanlines = inflateSync(Buffer.concat(chunks));
    assert.equal(scanlines.length, height * (width * 4 + 1));
    const pixel = (x: number, y: number) =>
      scanlines[y * (width * 4 + 1) + 1 + x * 4 + 3];
    assert.equal(pixel(0, 0), 0, 'Transparent corners must stay clear');
    assert.equal(pixel(width - 1, height - 1), 0);
    assert.ok(pixel(160, 120) > 220, 'Main illustration must be visible');
    seen.add(file.toString('base64'));
  }
  assert.equal(seen.size, names.length, 'Every storyboard image must differ');
});

test('onboarding art stays in the developer-only review', () => {
  const review = readFileSync('src/app/motion-review.tsx', 'utf8');
  const storyboard = readFileSync(
    'src/components/OnboardingStoryboard.tsx',
    'utf8',
  );
  assert.match(review, /<OnboardingStoryboard \/>/);
  assert.match(review, /if \(!__DEV__\)/);
  assert.match(storyboard, /ONBOARDING_ILLUSTRATIONS\.map/);
  assert.match(storyboard, /accessibilityLabel=\{scene\.description\}/);
  assert.match(storyboard, /not an interactive onboarding flow/);
});
