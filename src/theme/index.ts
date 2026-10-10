// Shared design tokens for the companion room and future exploration screens.
export const colors = {
  canvas: '#F7F6EC',
  paper: '#FFFDF5',
  ink: '#253E32',
  muted: '#5D7365',
  moss: '#345E46',
  fern: '#7CAC7C',
  meadow: '#DCEBCD',
  meadowFloor: '#C4DBB2',
  sun: '#FCEB9A',
  pet: '#FFF0C9',
  petEar: '#FAE8BC',
  petOutline: '#CFAF80',
  petFace: '#354537',
  blush: '#EFB7A4',
  border: '#DEE7D9',
  track: '#E5E9DC',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 24,
  pill: 999,
} as const;
