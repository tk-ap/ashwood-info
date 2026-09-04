# ASHWOOD Content Architecture

Status: approved backend framework; not a live-site implementation.

This document defines the editorial and information-architecture boundaries for ASHWOOD before any public route, navigation, copy, component, or styling changes are made.

## Core model

ASHWOOD should make three different questions visibly and structurally distinct:

1. **Creative Practice — What do I make?**
2. **Writing / Ideas — What do I think, notice, question, or believe?**
3. **Build Journal — What did I build, why did I make that decision, what changed, and what evidence came out of it?**

These areas can reference one another, but they should not collapse into one feed or archive.

## 1. Creative Practice

Creative Practice is the home for authored creative work and creative identity.

Current disciplines:

- Modeling
- Music
- Poetry
- Visual Art

### Poetry

Poetry is a first-class creative discipline. It is not a subsection of FIELD NOTES and should not be treated as generic writing content.

Future presentation should be literary/editorial rather than card-based: restrained interface, typography-led layouts, substantial negative space, and enough room for individual poems to stand alone.

Do not invent poem titles, dates, texts, publication history, or archive completeness. Public content should only be populated from work the owner explicitly provides or approves.

### Visual Art

Visual Art is also a legitimate creative discipline, but its current public record is incomplete. Until a fuller body of work is assembled, public presentation should use language such as **selected works**, **archive**, or **legacy work** rather than implying a comprehensive current art portfolio.

Some legacy work may be recoverable from prior social-media highlights, but source location should not become part of the public framing unless intentionally chosen later.

## 2. Writing / Ideas

Writing / Ideas contains thinking, observation, argument, reflection, and correspondence.

Formats may include:

- Essays
- FIELD NOTES
- Letters / newsletter issues
- Observations

A useful test is:

> Could this piece still exist even if no product, experiment, or build had happened?

If yes, it likely belongs in Writing / Ideas.

Writing may discuss a build or product. That does not automatically make it a Build Journal entry.

## 3. Build Journal

The Build Journal is the documented record of turning ideas into working things.

A Build Journal entry should be attached to at least one of the following:

- an actual build
- an experiment
- a product
- a material implementation or product decision

The journal should preserve the reasoning/evidence chain when relevant:

**what I thought → what I built → what happened → what changed my mind → what I believe now**

Useful entry anatomy can include:

- what was believed or assumed
- what was attempted
- what changed
- the decision made
- evidence or provenance
- current state / unresolved questions

The Build Journal is not the default home for standalone essays, cultural commentary, general observations, poetry, or visual art.

## Writing / Ideas vs. Build Journal

This boundary is intentionally explicit.

**Writing / Ideas asks:**

> What do I think, notice, question, or believe?

**Build Journal asks:**

> What did I build, why did I make that decision, what changed, and what evidence came out of it?

If a piece can exist without something being built, it probably belongs in Writing / Ideas.

If it documents a real build, experiment, product, or material decision and preserves what happened, it belongs in Build Journal.

## Cross-linking without overlap

The sections should be able to inform each other without duplicating content.

Example:

- an essay about AI, anti-intellectualism, or human context lives in Writing / Ideas;
- an ALVIRA Build Journal entry may link to that essay as philosophical context;
- the essay may link back to ALVIRA as an example of a belief influencing a concrete build.

The relationship is **idea ↔ implementation evidence**, not duplicate publication.

## Public-language direction

Future implementation may use simple descriptors such as:

**Writing / Ideas** — Essays, observations, letters, and thinking in public.

**Build Journal** — The documented record of turning ideas into working things.

These are directional descriptors, not authorization to change the live navigation or copy yet.

## Release boundary

This framework is backend/editorial guidance only.

Until a separate implementation task is explicitly approved, do not change:

- live navigation
- public routes
- homepage structure
- Portfolio rendering
- Build Journal rendering
- public copy
- visual styling
- production behavior

Any future public implementation should start from current `main`, preserve the established ASHWOOD visual identity, and receive desktop/mobile verification before merge or production promotion.
