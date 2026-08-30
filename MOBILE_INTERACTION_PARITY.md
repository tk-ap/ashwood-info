# ASHWOOD Mobile Interaction Parity

Interactive behavior is part of the content system. A desktop interaction must not disappear simply because its trigger is hover, pointer proximity, or a large-screen spatial effect.

## Default rule

Every new interactive behavior must ship with an intentional mobile/touch equivalent when the desktop behavior cannot transfer seamlessly.

Do not treat `:hover` as a complete interaction contract.

For each interaction, define:

- **Desktop trigger** — hover, focus, pointer proximity, click, scroll, or earned state.
- **Mobile trigger** — tap, dwell, scroll/viewport entry, earned discovery, or an explicit touch control.
- **Persistent clue** — what remains after a transient reveal so the user can rediscover it.
- **Accessibility path** — keyboard/focus and reduced-motion behavior.
- **Copy safety** — deeper context must stay in normal document flow or a dedicated reading surface; it must never cover core hero, navigation, or entryway copy.

## Current homepage mappings

- Capability hotspots: pointer discovery on desktop → touch-friendly hotspot/dialog surfaces on mobile.
- Capability synthesis: spatial map on desktop → ordered vertical synthesis on mobile.
- IN ME: click/tap native on both.
- Becomings: hover/focus sequence on desktop → touch entrance/capability path on mobile; Doctor Bird can launch from touch.
- XAYMACA: masthead hover/focus on desktop → masthead dwell reveal on mobile, then a persistent compact clue that can be expanded by touch.
- Jamaican motto provenance: hover/focus after earned discovery on desktop → one-time automatic in-flow reveal when earned on mobile, then touch re-open.
- 06 · 08 · 1962: field proximity/focus after earned discovery on desktop → one-time automatic in-flow reveal when earned on mobile, then touch re-open.

## Design principle

Mobile should not be a reduced desktop experience. It should preserve the same meaning and reward structure using interaction mechanics that make sense on touch devices.
