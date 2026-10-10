# Tamagoochi

**Your life raises it.**

Tamagoochi is an original mobile companion game. The long-term vision combines a persistent virtual pet with real-world walking, exploration, memories, personality-driven evolution, and friendships. It is designed to be welcoming, not punishing, when people take time away.

## Current state

This repository is in active development. The first delivery slice provides an Expo/React Native TypeScript foundation, a starter companion demo, navigation, and deterministic state tests. The adventure, memory, friendship, artwork, and full simulation systems are planned, **not yet implemented**.

See [the nine-part master plan](docs/MASTER_PLAN.md) for the deliverable scope and acceptance criteria.

## Development

Requires Node.js 22.13 or later, npm, and the platform tools needed for an iOS or Android simulator.

```sh
npm ci
npm start
```

Choose iOS, Android, or web in Expo's development tools. Native device testing requires a compatible development build.

## Verification

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build:ci
```

The vendored CI control plane exposes `./scripts/bootstrap --ci`, `./ci/run fast`, `./ci/run pr`, and `./ci/run release`. CI must have real, passing checks; missing or skipped checks do not count.

## Architecture

- `src/app/`: Expo Router screens and navigation
- `src/components/`: small reusable visual components
- `src/domain/`: testable, platform-independent gameplay logic
- `scripts/`: local test tooling
- `assets/`: original art and audio, introduced in the visual identity slice

Future gameplay is designed to be offline-first. Precise location, photos, notifications, accounts, and social services will require explicit product reasons and permission controls. No live location service or backend is connected in the current scaffold.

## Delivery contract

Work goes to a single Issue-owned `work/<issue>-<slug>` branch based on `dev`, then into `dev` through a reviewed GitHub PR after all required checks succeed. `main` is the production branch. No secrets or third-party copyrighted creature art should be committed.
