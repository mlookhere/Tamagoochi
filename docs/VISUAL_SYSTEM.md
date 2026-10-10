# Tamagoochi visual system — first implementation

## Creative direction

**A pocket-sized world that remembers where you have been.** The visual identity combines a gentle, hand-made storybook room with a lively, original companion. The app is not a replica of any existing monster-collection game or virtual-pet hardware. A single companion is the protagonist; travel and discoveries become room keepsakes.

## Rules

- Put the pet first. A room is a setting, not a dashboard; the companion remains the largest focal point.
- Use rounded organic shapes, subtle borders, cream surfaces, woodland-green lettering, and one warm sunlight accent. Never use competitive-game gradients or glossy loot-box framing.
- Use the same visual tokens across Home, Adventure, Memories, and Friends. Source of truth: `src/theme/index.ts`.
- Use `src/components/CompanionSprite.tsx` for the starter silhouette. It is an original in-app vector-style prototype, not final production character art.
- Keep four top-level destinations. Each screen must show a readable state even when its full gameplay is not implemented.
- No real geographic coordinates, personal photos, or identity details appear on an exported card without explicit preview and consent.

## Companion anatomy

The starter companion has two outward-leaning ears, a rounded cream body, dark eyes, short mouth, and subtle cheeks. Expressions are primarily communicated by posture and movement, not walls of text. When production illustration replaces this view-based sprite, preserve the distinctive silhouette and keep animation state names stable.

## Motion language

`src/theme/motion.ts` defines **idle, walk, eat, sleep, clean, play, happy, sad, curious, startled, pickup, return, evolution**. Each has a controlled vertical movement amplitude and cadence; care actions trigger temporary reactions. There are no unrelated continuous particle effects. The app respects the operating system's Reduce Motion preference by rendering a static presentation with identical controls and information.

Motion here is a base interface, not a claim that every final animation is finished. Production animated artwork and full visual regression coverage remain part of Issue #9.

## Art delivery requirements

Final exported sprites must have transparent backgrounds, consistent baselines and scale across poses, and unambiguous licensing/source records. Design a starter creature family, a room, inventory items, ecology markers, first-moment keepsakes, empty/error states, and onboarding illustrations. Prefer a typed asset registry to dynamic filename interpolation, so missing resources fail at build time. Never vendor third-party protected game graphics.

## Accessibility

All important actions are native labeled controls. Text and background combinations must pass WCAG contrast checks before final approval. Animation cannot carry the only meaning of pet state. Touch areas must meet platform guidelines. System reduced-motion preferences are honored even when changed while the app is open.
