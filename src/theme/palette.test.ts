import assert from 'node:assert/strict';
import test from 'node:test';
import { colors } from './index.ts';

function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (
    0.2126 * channels[0] +
    0.7152 * channels[1] +
    0.0722 * channels[2]
  );
}

function contrast(foreground: string, background: string) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('all theme colors are opaque hex swatches', () => {
  for (const value of Object.values(colors)) {
    assert.match(value, /^#[0-9A-Fa-f]{6}$/);
  }
});

test('essential text combinations maintain WCAG AA contrast', () => {
  const pairs = [
    [colors.ink, colors.canvas],
    [colors.muted, colors.canvas],
    [colors.ink, colors.paper],
    [colors.white, colors.moss],
    [colors.ink, colors.meadow],
    [colors.ink, colors.meadowFloor],
  ] as const;

  for (const [foreground, background] of pairs) {
    assert.ok(
      contrast(foreground, background) >= 4.5,
      `Insufficient contrast for ${foreground} on ${background}`,
    );
  }
});
