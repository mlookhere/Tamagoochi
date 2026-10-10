export type WorldArtKey =
  | 'berry'
  | 'wateringCan'
  | 'lantern'
  | 'seedPouch'
  | 'meadow'
  | 'grove'
  | 'pond'
  | 'trail';

export type WorldArtCategory = 'item' | 'landmark';

export type WorldIllustration = Readonly<{
  key: WorldArtKey;
  label: string;
  detail: string;
  category: WorldArtCategory;
}>;

export const WORLD_ILLUSTRATIONS: readonly WorldIllustration[] = [
    {
    key: 'berry',
    label: 'Sunberries',
    detail: 'A bright trail snack',
    category: 'item',
  },
    {
    key: 'wateringCan',
    label: 'Watering can',
    detail: 'A gentle garden tool',
    category: 'item',
  },
    {
    key: 'lantern',
    label: 'Glow lantern',
    detail: 'Light for a quiet evening',
    category: 'item',
  },
    {
    key: 'seedPouch',
    label: 'Seed pouch',
    detail: 'A little beginning',
    category: 'item',
  },
    {
    key: 'meadow',
    label: 'Sunny meadow',
    detail: 'Wildflowers in the grass',
    category: 'landmark',
  },
    {
    key: 'grove',
    label: 'Whispering grove',
    detail: 'A shelter of green leaves',
    category: 'landmark',
  },
    {
    key: 'pond',
    label: 'Willow pond',
    detail: 'Reeds beside calm water',
    category: 'landmark',
  },
    {
    key: 'trail',
    label: 'Winding trail',
    detail: 'A path worth following',
    category: 'landmark',
  },
];
