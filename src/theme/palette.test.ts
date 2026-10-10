import assert from 'node:assert/strict';
import test from 'node:test';
import { colors } from './index.ts';

function linearChannel(hex: string, offset: number) {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  if (value <= 0.04045) return value / 12.92;
  return ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const red = linearChannel(hex, 1);
  const green = linearChannel(hex, 3);
  const blue = linearChannel(hex, 5);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
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
    const ratio = contrast(foreground, background);
    assert.ok(ratio >= 4.5, `Insufficient contrast: ${ratio}`);
  }
});
