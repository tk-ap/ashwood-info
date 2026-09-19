# Immersive UI Roadmap

## Why this exists

The ecosystem is accumulating ideas faster than they can all be implemented at once. That is not a problem if the ideas have durable homes, clear status, and enough context that another person can understand them later without reconstructing the owner's thinking from scratch.

The goal is therefore larger than "better UI."

The ecosystem should become:

- easier to understand by watching rather than reading;
- more immersive without becoming decorative or vague;
- easier to explore non-linearly;
- easier to hand off to a stranger who is curious about any one part;
- easier to manage as ideas move from instinct → experiment → proof → product direction.

A person should be able to enter anywhere, roam at their own pace, understand what they are looking at, see what is proven versus aspirational, and follow a path deeper when something catches their attention.

## Core design thesis

Use **21st.dev as a standard UI reference source**, not as a design system to copy wholesale.

The operating loop is:

```
problem
  ↓
reference search
  ↓
shortlist 3 patterns
  ↓
extract the interaction principle
  ↓
adapt it to the product's existing visual language
  ↓
test
  ↓
ship only if it improves comprehension, state visibility, or immersion
```

The question is never "what cool component can we add?"

The question is "what should the interface make obvious without another paragraph?"

## Ecosystem-wide interaction grammar

The products should not look identical, but they should share a recognizable logic.

### Context / intelligence

Context should appear through **reveal, accumulation, connection, and refinement**.

Best fit:
- ALVIRA
- ailhat

### Execution

Execution should appear as **directional movement through a visible path**.

Best fit:
- AgentOS
- ASHWOOD Workspace

### Authority

Authority should create visible **friction, gates, pauses, locks, approvals, and scoped resumes**.

Best fit:
- LEDGATo
- AgentOS

### Evidence

Evidence should leave a **persistent trace**:
- timestamps;
- receipts;
- attempts;
- before/after states;
- verifier output;
- durable artifacts.

Best fit:
- Build Journal
- AgentOS
- LEDGATo
- ailhat

### Human decisions

Human decisions must be visually distinguishable from model output and autonomous system actions.

The user should be able to answer:
- what did the machine propose?
- what did the machine actually do?
- what did a person authorize?
- what evidence exists?
- what remains unresolved?

## Product opportunity map

### ASHWOOD / Build Journal

Purpose: turn the body of work into a living archive rather than a documentation page.

Reference areas:
- scroll-driven timelines;
- orbital/system maps;
- image and artifact stacks;
- progressive disclosure;
- editorial transitions;
- evidence ledgers;
- ambient motion used sparingly.

Desired result:
A visitor should be able to move from current work → discoveries → proofs → constraints → deeper product threads without reading the page linearly.

The journal should feel like a place where work is happening, not a static report.

### ALVIRA

Purpose: let people understand Context Intelligence by experiencing the product logic.

Reference areas:
- interview/onboarding steppers;
- product walkthroughs;
- staged state transitions;
- animated context formation;
- review/correction interactions;
- interactive demos.

Preferred narrative:

```
AI asks
  ↓
you answer
  ↓
ALVIRA notices context
  ↓
Context Mirror forms
  ↓
you correct / approve
  ↓
Context becomes portable
  ↓
Bridge sends it
```

Desired result:
The visitor understands the value proposition before signup because they watched context become useful.

### AgentOS Workspace

Purpose: make execution truth visible.

Reference areas:
- agent activity streams;
- execution timelines;
- plan/approval surfaces;
- tool-call state;
- command palettes;
- routing maps;
- stateful progress views.

Preferred execution model:

```
OBJECTIVE
  ↓
ROUTED
  ↓
ATTEMPT
  ↓
TOOL ACTION
  ↓
AUTHORITY CHECK
  ↓
EVIDENCE
  ↓
INDEPENDENT VERIFIER
  ↓
COMPLETE / BLOCKED
```

Desired result:
"Assigned" or "moving" can never visually masquerade as proven execution.

### LEDGATo

Purpose: make enforcement understandable through the interaction itself.

Reference areas:
- permission gates;
- request/approve/resume flows;
- boundary states;
- explicit scope;
- receipt/verification surfaces;
- state transition diagrams.

Preferred product proof:
An agent visibly approaches a boundary, gets denied, requests authority, receives a scoped grant, resumes, performs the action, and leaves a verifiable receipt.

Desired result:
The user understands enforcement without needing to read the architecture first.

### ailhat

Purpose: make portfolio intelligence spatial and explorable.

Reference areas:
- portfolio maps;
- comparative views;
- signal surfaces;
- data visualization;
- drill-down interactions;
- change-over-time views.

Desired result:
The interface reveals relationships and attention needs that would be hard to notice in a list of cards.

## Rollout strategy

Do not redesign the entire ecosystem at once.

### Phase 0 — Reference audit

Create a lightweight internal reference ledger.

For each candidate pattern record:

| Field | Meaning |
| --- | --- |
| Surface | Where it might be used |
| User job | What the person is trying to understand or do |
| 21st.dev reference | The pattern/component being studied |
| Borrow | The interaction/composition principle worth adapting |
| Do not borrow | Styling/dependencies/behavior that do not fit |
| Stack fit | Native fit, adaptation required, or reject |
| Status | Observe / prototype / test / adopt / reject |

The ledger is for design memory, not collection for its own sake.

### Phase 1 — ASHWOOD + ALVIRA pilot

Run the first serious 21st.dev reference pass against one editorial surface and one product surface.

#### ASHWOOD target

Use the Build Journal as the visual laboratory.

Explore:
- timeline systems;
- proof/evidence visualization;
- spatial ecosystem maps;
- artifact presentation;
- scroll choreography.

Success test:
The page communicates more with fewer words and makes deeper exploration feel natural.

#### ALVIRA target

Rebuild the signed-out product story around an interactive interview-to-context journey.

Explore:
- interview progress;
- Context Mirror formation;
- correction/approval;
- Bridge handoff;
- first-value transitions.

Success test:
A new visitor can explain what ALVIRA does after interacting with the page, not after reading a long explanation.

### Phase 2 — Establish the motion grammar

After the pilot, extract what worked into a small ecosystem motion/state standard.

Document:
- reveal behavior;
- transitions between machine and human states;
- evidence appearance;
- approval/gating behavior;
- loading versus execution versus blocked states;
- reduced-motion fallbacks;
- mobile equivalents.

Do not create a generic animation library before the pilot proves which behaviors matter.

### Phase 3 — AgentOS + LEDGATo proof surfaces

Apply the proven grammar to state-heavy interfaces.

AgentOS focus:
- routing;
- attempts;
- active execution;
- evidence;
- verifier independence;
- blocked / stale / offline state.

LEDGATo focus:
- boundary encounter;
- deny;
- approval request;
- scoped authority;
- resume;
- post-action verification.

Success test:
A person can distinguish system claims from actual evidence at a glance.

### Phase 4 — ailhat

Use the visual grammar to turn portfolio intelligence into a relational surface.

Focus:
- what needs attention;
- what changed;
- what is connected;
- where evidence is weak;
- where another product or agent is blocked.

Do not default to dashboard density.

## Idea intake and handoff

This roadmap is also part of a broader owner-context problem: ideas need somewhere to land before they are fully formed.

A future-facing ecosystem should support these states:

```
IDEA
  ↓
DIRECTION
  ↓
EXPERIMENT
  ↓
EVIDENCE
  ↓
DECISION
  ↓
BUILD / DEFER / ARCHIVE
```

Every significant idea should eventually have:
- a home;
- a status;
- a reason it matters;
- links to related products or questions;
- evidence when evidence exists;
- a clear distinction between owner instinct and validated fact.

This is what makes the ecosystem handoff-friendly.

A stranger should not need to know the owner personally to understand:
- what exists;
- what is being tested;
- why it matters;
- what changed;
- where the proof is;
- what remains open;
- how to continue the thread.

## Zero-dollar constraint

The UI strategy must not create a paid design dependency by default.

Rules:
- browse widely, copy selectively;
- prefer adaptation over installing new packages;
- avoid dependency weight unless the interaction earns it;
- preserve the current stack when practical;
- use CSS and native browser capabilities where they are sufficient;
- treat any paid 21st.dev capability or third-party service as optional until a specific proof requires it.

## Adoption guardrails

Before shipping a referenced pattern:

1. It must solve a named communication or interaction problem.
2. It must fit the product's existing visual identity.
3. Accessibility and reduced-motion behavior must be considered.
4. Mobile behavior must be explicit.
5. Added dependencies must be justified.
6. External component licensing/provenance must be checked before copying source.
7. The resulting UI must make system state more truthful, not merely more impressive.
8. Product claims must remain bounded by evidence.
9. No visual treatment may imply execution, authority, or proof that does not exist.

## What not to do

Avoid:
- generic "AI dashboard" aesthetics;
- component soup;
- ornamental motion that adds cognitive load;
- replacing clear language with ambiguous visuals;
- introducing React/shadcn solely because a reference uses it;
- making every surface animated;
- hiding unresolved states behind polished UI;
- treating 21st.dev popularity as evidence that a pattern fits the product.

## Initial execution backlog

### Reference work
- [ ] Build the first ASHWOOD reference ledger with 10–15 candidate patterns.
- [ ] Shortlist 3–5 ASHWOOD patterns for prototype.
- [ ] Build the first ALVIRA reference ledger with 10–15 candidate patterns.
- [ ] Shortlist 3–5 ALVIRA patterns for prototype.
- [ ] Identify patterns that can become ecosystem-wide interaction grammar.

### ASHWOOD
- [ ] Audit the current Build Journal for places where visuals can replace explanation.
- [ ] Prototype chronology as a stronger visual timeline.
- [ ] Prototype ecosystem relationships as a spatial/system view.
- [ ] Improve artifact/evidence presentation.
- [ ] Test whether the page supports non-linear exploration.

### ALVIRA
- [ ] Storyboard the signed-out interview → Context Mirror → correction → Bridge flow.
- [ ] Identify the minimum interactive demo states.
- [ ] Prototype those states using references, not copied styling.
- [ ] Measure whether explanatory copy can be removed after interaction is added.

### Shared system
- [ ] Record motion/state patterns that survive the two pilots.
- [ ] Define machine / human / evidence / blocked visual semantics.
- [ ] Define reduced-motion and mobile fallbacks.

### Later
- [ ] Apply the proven grammar to AgentOS execution truth.
- [ ] Apply the proven grammar to LEDGATo enforcement proof.
- [ ] Apply relational/data patterns to ailhat.
- [ ] Investigate automated visual regression/design review only if it fits the zero-dollar operating constraint.

## Success criteria

This work is successful when:

- fewer paragraphs are required to explain the products;
- execution state is visually truthful;
- product boundaries are easier to understand;
- evidence is easier to find;
- visitors naturally discover adjacent parts of the ecosystem;
- the surfaces feel connected without becoming visually identical;
- another person can pick up a thread without needing a verbal download from the owner;
- the system makes it easier to preserve ideas without prematurely turning every idea into a commitment.

The target is not "make the ecosystem look like 21st.dev."

The target is:

> Make the ecosystem understandable by watching it work, and explorable enough that a stranger can roam it at their leisure.
