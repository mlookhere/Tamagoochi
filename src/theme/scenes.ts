export const sceneCopy = {
  adventure: {
    accessibilityLabel: 'A winding green trail under a warm sun',
    title: 'The first trail starts nearby.',
    detail: 'Walking adventures and discoveries are in development.',
    background: '#CEE5D2',
  },
  memories: {
    accessibilityLabel: 'Two overlapping keepsake picture cards',
    title: 'Every little first matters.',
    detail: 'Your shared keepsakes will be collected here.',
    background: '#F0E2D7',
  },
  friends: {
    accessibilityLabel: 'Two small companions facing each other',
    title: 'Some meetings stay with you.',
    detail: 'Companion introductions are in development.',
    background: '#E2DDF0',
  },
} as const;

export type SceneKind = keyof typeof sceneCopy;
