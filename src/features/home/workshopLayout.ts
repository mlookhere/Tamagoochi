export type RoomColumns = 1 | 2 | 3;

// Keep touch targets readable on narrow displays and at larger system font sizes.
export function roomColumns(width: number, fontScale: number): RoomColumns {
  if (
    !Number.isFinite(width) ||
    width <= 0 ||
    !Number.isFinite(fontScale) ||
    fontScale <= 0
  ) {
    throw new Error('Invalid screen metrics');
  }
  if (width < 360 || fontScale >= 1.5) return 1;
  if (width < 700 || fontScale >= 1.2) return 2;
  return 3;
}

export type ColumnWidth = '100%' | '48%' | '31%';

export function columnWidth(columns: RoomColumns): ColumnWidth {
  if (columns === 1) return '100%';
  if (columns === 2) return '48%';
  if (columns === 3) return '31%';
  throw new Error('Invalid column count');
}
