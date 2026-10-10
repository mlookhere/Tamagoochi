export const statusCopy = {
  welcome: {
    label: 'A sprouting seed and a small new friend',
    title: 'A new little story begins.',
    message: 'Your companion is ready to share the everyday with you.',
  },
  loading: {
    label: 'A glowing seed getting ready to sprout',
    title: 'A little moment, please.',
    message: 'Gathering your tiny world.',
  },
  empty: {
    label: 'A quiet empty keepsake bowl beside a leaf',
    title: 'There is room for a story.',
    message: 'Your discoveries will find a home here.',
  },
  error: {
    label: 'A little companion sheltering beneath a leaf',
    title: 'Your companion is still safe.',
    message: 'Try opening this screen again.',
  },
} as const;

export type StatusKind = keyof typeof statusCopy;
