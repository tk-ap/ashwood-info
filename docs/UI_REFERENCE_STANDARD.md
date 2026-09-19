# UI reference standard

ASHWOOD and the wider product ecosystem should use curated UI references before inventing common interaction patterns from scratch.

## Primary reference source

**21st.dev** is a standard visual/component reference for UI work.

Use it to study patterns for:
- editorial landing pages and heroes;
- evidence timelines and activity feeds;
- control surfaces and agent-state displays;
- onboarding and product walkthroughs;
- galleries, grids, navigation, and motion;
- data visualisation and portfolio views.

## Adoption rule

21st.dev is a reference library, not a mandatory implementation dependency.

Before adopting a pattern:
1. preserve the product's existing visual language and information architecture;
2. prefer adapting the interaction or composition over copying a component verbatim;
3. keep the current stack unless a framework change is independently justified;
4. verify accessibility, responsive behaviour, performance, and interaction states;
5. confirm any external component's licence/provenance before shipping copied source;
6. prefer zero-cost/open patterns where they satisfy the same requirement.

For ASHWOOD specifically, translate useful React/shadcn patterns into the existing HTML/CSS/JS surface when that is the simpler implementation.

## Product-fit map

- **ASHWOOD / Build Journal:** editorial compositions, evidence timelines, proof maps, progressive disclosure, visual archives.
- **ALVIRA:** context-flow demonstrations, onboarding, review/correction interactions, interview visualisations.
- **LEDGATo:** permission states, approval/resume flows, boundary diagrams, enforcement evidence.
- **ailhat:** portfolio maps, comparative views, data visualisation and signal surfaces.
- **AgentOS Workspace:** execution-state timelines, controls, activity streams, routing and evidence views.

## Quality bar

Do not add visuals only as decoration. A visual component should replace explanation, clarify system state, reveal hierarchy, or make an interaction easier to understand.

Generic "AI dashboard" styling is not the target. References should be adapted to each product's existing design direction.

## Execution roadmap

The durable rollout plan, ecosystem interaction grammar, pilot sequence, idea-intake model, and handoff criteria live in [IMMERSIVE_UI_ROADMAP.md](./IMMERSIVE_UI_ROADMAP.md).
