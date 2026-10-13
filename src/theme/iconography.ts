export const glyphLabels = {
  home: 'Companion home',
  adventure: 'World and walks',
  memories: 'Shared keepsakes',
  friends: 'Companion friends',
  seed: 'Growing seed',
  leaf: 'Nature discovery',
  bowl: 'Food and care',
} as const;

export type GlyphKind = keyof typeof glyphLabels;
