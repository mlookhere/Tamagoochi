import type { WorldArtKey } from '../theme/world';

// Every illustration is bundled statically so Metro can validate asset paths.
export const WORLD_ART = {
  berry: require('../../assets/world/berry.png') as number,
  wateringCan: require('../../assets/world/watering-can.png') as number,
  lantern: require('../../assets/world/lantern.png') as number,
  seedPouch: require('../../assets/world/seed-pouch.png') as number,
  meadow: require('../../assets/world/meadow.png') as number,
  grove: require('../../assets/world/grove.png') as number,
  pond: require('../../assets/world/pond.png') as number,
  trail: require('../../assets/world/trail.png') as number,
} as const satisfies Record<WorldArtKey, number>;

