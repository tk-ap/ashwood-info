# ASHWOOD `/workspace` — Goal-to-Evidence Operating System

## Purpose

`/workspace` should be a living operating layer, not a dashboard that depends on manual upkeep.

Its job is to continuously reconcile three things:

1. the purpose and goals identified in the Saturn Return breakdown
2. the current reality of the user's live product ecosystem and creative/professional work
3. evidence of meaningful progress, accomplishment, neglect, contradiction, and next gaps

The core mental model is:

**Goal → active bets → current work → evidence → progress → next gap**

Manual logging should be optional. The primary model should be automatic discovery, classification, and synthesis where reliable evidence is available.

---

## Saturn Return goals as the top-level frame

The Saturn Return breakdown should act as the durable goal/purpose model for `/workspace`.

The system should maintain explicit goal buckets derived from that framework and evaluate current work against them rather than presenting activity as an undifferentiated task stream.

Each meaningful item of work should answer:

> Which stated purpose or goal does this advance, if any?

A single accomplishment may legitimately support more than one bucket when evidence supports that relationship.

The system should not inflate progress simply because work exists. Work that does not materially advance a stated goal should remain visible as activity, but should not automatically count as progress.

---

## Automatic ecosystem awareness

`/workspace` should automatically consider the live product ecosystem rather than requiring the user to manually enter products or progress updates.

At minimum, the system should be designed to ingest current evidence from active ecosystem offerings and infrastructure such as:

- ALVIRA / ALVIRA Context
- ailhat
- LEDGATo / any future renamed execution-intelligence surface
- agent-os / workforce infrastructure
- ASHWOOD itself
- active launches, product experiments, and customer-facing offerings

The exact set of active products must be discovered from current evidence rather than permanently hard-coded. Paused, renamed, merged, or archived projects should preserve history without remaining falsely active.

Product evidence may include:

- repository activity
- merged pull requests
- releases/deployments
- production URLs and live-state checks
- shipped features
- customer/launch milestones
- documented decisions
- revenue/client evidence when available
- blockers and unresolved issues

`/workspace` should consume product-level intelligence where available rather than recreating ailhat.

---

## Creative and professional evidence

The same goal-to-evidence model should include non-product work where it maps to stated goals.

Examples include:

- modeling bookings, campaigns, published work, portfolio updates
- music writing, recording, releases, performances, collaborations
- poetry, writing, newsletters, essays, and visual-art work
- auditions and professional opportunities
- collaborations and relationship-building
- learning milestones
- public publishing and visible leadership

The goal is not to turn all life activity into productivity metrics. The system should only surface evidence that is meaningfully connected to the user's stated direction.

---

## Evidence-backed progress states

Progress should be explainable and grounded.

Use states such as:

- `COMPLETED` — direct evidence confirms the accomplishment
- `IN_PROGRESS` — active execution evidence exists
- `PLANNED` — intent exists, but execution evidence does not yet exist
- `STALE` — the goal remains relevant but has little or no recent evidence
- `NEEDS_ATTENTION` — the area appears disproportionately neglected relative to stated priorities
- `BLOCKED` — meaningful progress is prevented by an identifiable blocker
- `CONTRADICTED` — recent behavior or decisions materially conflict with the stated goal

Every state change should preserve provenance, timestamp, and confidence where possible.

Do not silently convert inferred progress into confirmed accomplishment.

---

## Accomplishment synthesis

`/workspace` should automatically update accomplishments/progress in the relevant goal buckets as evidence appears.

Example experience:

> **This week moved 3 goals forward**
>
> ALVIRA entitlement work → Ownership / company-building
>
> BarelySain campaign published → Modeling / public presence
>
> New recording completed → Music / creative return
>
> **Still under-supported:** Relationship equity / collaboration

This should be generated from evidence, not maintained as a hand-authored status report.

---

## Contradiction and neglect detection

`/workspace` should not be a celebratory tracker only.

It should identify when observed behavior materially conflicts with stated priorities or when a goal is being neglected.

Example:

> You say being known for one valuable skill is a 12–18 month priority, but current public work is distributed across seven competing narratives.

Useful signals include:

- stated priority vs actual time/attention distribution
- repeated work that does not connect to declared goals
- long periods without evidence in a priority bucket
- excessive new-project creation relative to consolidation goals
- recurring blocked work
- abandoned commitments
- strong progress in one area that creates downside elsewhere

Conflict detection must remain evidence-backed and should present reasoning rather than opaque judgments.

---

## Relationship to ailhat

Keep the product scopes distinct.

**ailhat** asks:

> How are the products, portfolio, and agentic organization performing?

**ASHWOOD `/workspace`** asks:

> Is what I am doing actually moving the life, company, creative, and professional direction I said I wanted?

ailhat can provide product-level evidence and portfolio intelligence to `/workspace`, but ASHWOOD owns the human-level synthesis across work, creativity, professional development, relationships, and stated purpose.

`/workspace` should not recreate ailhat's product-health, launch-readiness, or portfolio-intelligence systems when those can be consumed as upstream evidence.

---

## Desired operating loop

The long-term loop should be:

**Purpose / goals → discover current reality → ingest evidence → classify against goal buckets → update progress → detect neglect/conflict → recommend highest-value next action → ingest new evidence**

The recommendation layer should optimize for stated purpose, not merely task completion.

A useful question for every recommended next action is:

> Which goal does this materially advance, and what evidence makes it the highest-value next move now?

---

## Product requirement

Treat the following as a core `/workspace` requirement:

> **ASHWOOD `/workspace` is a self-updating goal-to-evidence system. It should automatically discover and consider live ecosystem offerings, projects, creative work, professional activity, and meaningful outcomes against the purpose/goals defined in the Saturn Return framework. It should classify evidence into the appropriate goal buckets, update progress and accomplishments, surface neglected or contradictory areas, and recommend the highest-value next action. Manual logging should be optional, not the primary operating model.**

This is a product-direction/design constraint. It does not imply that all integrations or automatic evidence sources currently exist.

---

## Implementation guardrails

Before implementation:

1. inspect the current ASHWOOD information architecture and any existing `/workspace` concepts
2. identify where the Saturn Return goal model is currently stored and how it should be normalized
3. inventory available evidence sources and distinguish live integrations from future sources
4. preserve provenance and confidence for inferred mappings
5. allow users to correct goal/evidence classifications
6. avoid hard-coding the current product list as permanent truth
7. reuse ailhat product intelligence instead of duplicating it
8. keep manual entry available as a supplement for evidence that cannot be automatically discovered
9. do not expose private or sensitive source material on the public ASHWOOD surface
10. separate internal workspace state from public portfolio/journal presentation

The system should become more accurate as evidence accumulates, but should remain inspectable and correctable by the user.