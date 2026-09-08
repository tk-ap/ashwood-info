# Public ASHWOOD Hero — Responsive Choreography

Status: owner-approved implementation direction.

## Goal

Borrow the *feeling* of Vivid Motion's responsive hero without copying its visual design and without replacing ASHWOOD's existing responsive UI infrastructure.

Public ASHWOOD should react to presence. Workspace should react to state.

## Implementation boundary

This is a progressive enhancement over the current V3 hero. Preserve:

- existing desktop/mobile breakpoints
- current hero grid and image/copy ordering
- existing living ASHWOOD / ASHW888D identity behavior
- current pointer-aware field/product interactions
- touch behavior
- reduced-motion handling
- navigation and audio behavior

Do not make hero responsiveness a prerequisite for understanding or using the page.

## Choreography

On fine-pointer devices only:

- pointer position may create subtle depth between hero copy and portrait
- the portrait may pan by a small bounded amount inside its existing crop
- hero copy can shift by a smaller amount than the image, creating layered depth rather than literal cursor following
- the copy-side light field may track presence softly
- entering/leaving the hero should settle smoothly back to rest
- no element should chase the cursor aggressively

On coarse-pointer/mobile devices:

- preserve the existing layout and touch behavior
- no pointer-parallax assumptions
- use the current responsive static composition

For `prefers-reduced-motion: reduce`:

- all choreography becomes static
- no loss of information or controls

## Acceptance criteria

- no layout shift caused by pointer movement
- no horizontal overflow
- no collision with existing hero links/audio/wordmark
- copy remains readable at every pointer position
- image crop stays intentional
- mobile hero remains unchanged in structure
- reduced-motion users receive a stable hero
- responsiveness feels editorial and restrained, not game-like

## Principle

**The public hero reacts to the visitor being there; it does not perform at them.**
