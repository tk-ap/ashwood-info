# ASHWOOD Interaction Principles

ASHWOOD should behave like a live system a visitor enters, not a static portfolio page decorated with motion.

## Core rule

Every interaction should do at least one of three things:

1. **Reveal structure** — expose a relationship, category, sequence, capability, source, or underlying system that was not immediately visible.
2. **Reward curiosity** — make exploration consequential by changing state, unlocking context, or leaving a useful trace of what the visitor discovered.
3. **Clarify the next relationship** — help the visitor understand how Modeling, Music, Builds, About, Connect, and the work beneath them relate without forcing conventional navigation furniture into every surface.

If an interaction does none of these, it is probably decoration and should be removed or simplified.

## Scroll is a core interaction primitive

Scroll-triggered behavior is a baseline ASHWOOD UI requirement, not optional polish. Pages should be designed as sequences that respond to reading position whenever scroll can reveal structure, chronology, relationship, state, or consequence.

This does **not** mean every section should animate. Scroll behavior should be purposeful and restrained:

- content may enter, resolve, connect, reframe, or change state as the visitor advances;
- long-form pages should use scroll to make chronology, evidence, and narrative progression legible;
- transitions between major ideas should feel spatially and behaviorally intentional rather than like stacked static sections;
- scroll position can influence ambient fields, connective rules, progress, focus, or contextual navigation when doing so improves understanding;
- completed or passed states may settle into calmer forms so the page visibly remembers where the visitor has been;
- no scroll effect should imply progress, funding, execution, evidence, or live system state that has not actually occurred;
- keyboard navigation, touch behavior, and `prefers-reduced-motion` must preserve equivalent access to the underlying information.

The implementation question is not “should this page have scroll effects?” but “what should the page reveal or clarify as the visitor moves through it?” A page may intentionally have very little motion, but that should be a design decision made against this requirement rather than the default caused by omission.

## Behavioral identity

The visual identity stays editorial, cinematic, restrained, and personal. The interaction model can be more system-like:

- proximity and hover should reveal meaning, not just animate type;
- discovery can change the interface after the visitor has learned something;
- state transitions should make progress or consequence legible;
- repeated exploration should expose relationships between practices rather than produce random novelty;
- controls should respond immediately and visibly;
- completed states should become calmer and more informative, not louder;
- `prefers-reduced-motion` remains a hard boundary.

## Home

Home is the strongest expression of this rule. The six hotspot field is not a game layer added on top of the portfolio; it is a way to discover the capabilities and practices underneath ASHWOOD. Completing the field should reorganize the space into a stable capability map so the visitor moves from curiosity to understanding.

Primary portals should reveal enough context to explain what entering Modeling, Music, or Builds means. `TAP IN →` signals entry into another ASHWOOD world rather than functioning as a generic button treatment.

## Modeling

Interaction should serve looking: image inspection, sequence, current-vs-archive context, campaign depth, booking clarity, and movement through the work. Avoid ornamental interface elements that compete with photography.

## Music

Interaction should serve listening: playback state, position, track identity, release/draft context, and continuity across ASHWOOD. The native player is part of the experience rather than a corner utility.

## Builds / Journal

Interaction should expose evidence, chronology, status, decision lineage, sponsorship lifecycle, or relationships between products and infrastructure. Scroll should be treated as part of the journal’s narrative engine: moving through the page should progressively clarify chronology, evidence, changing beliefs, product relationships, and what happened next. Avoid ambient movement that does not make the build record easier to understand.

## About

Interaction can reveal lineage, names, memories, and connective tissue between practices, but should preserve the dignity and clarity of the personal material. Scroll can gradually expose those relationships rather than presenting every layer simultaneously.

## Connect

Interaction should reduce distance between interest and action. Native paths, Dispatch interest capture, booking, collaboration, and sponsorship should collect or route the information required for the next step rather than sending visitors through unnecessary external hubs.

## Review test

Before shipping an interactive element, ask:

> What does the visitor understand after this interaction that they did not understand before?

For scroll-driven behavior, also ask:

> What becomes clearer because the visitor moved through this part of the page?

If the answer is only “it moved,” revise it.
