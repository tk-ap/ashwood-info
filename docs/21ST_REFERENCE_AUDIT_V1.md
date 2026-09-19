# 21st.dev Reference Audit — V1

Snapshot date: 2026-09-19

This is the first concrete reference audit under the immersive UI roadmap.

Important: this document is **not** a component shopping list. It records patterns that may be worth adapting after reviewing the current live surfaces. The goal is to identify interaction principles that can make the ecosystem more immersive, legible, and handoff-friendly without creating a generic "AI UI" layer.

## Live-surface baseline

### ASHWOOD Build Journal

Current live surface already includes:
- editorial hero;
- ecosystem orbit;
- AgentOS proof rail;
- IBM accountability artifact;
- discovery ledger;
- four-product system map;
- proof matrix;
- blocker → next-proof diagrams.

The next design problem is therefore **not** "add more graphics." It is:
- improve flow between these visual modules;
- make chronology feel more alive;
- make artifacts feel collected rather than inserted;
- support non-linear roaming;
- create stronger transitions between overview and deep evidence.

### ALVIRA

Current live landing page is being treated as a **moving target** because messaging/copy is under parallel review.

The live site currently presents:
- a split editorial hero;
- strong typography and a muted product visual language;
- a signed-out "Start here" route into the app;
- navigation around "How it helps," Context, organizations, pricing;
- a product story centered on choosing what matters before using AI capability.

Do **not** bind prototypes to the current headline/body copy.

For design work, use these semantic slots instead:
1. problem / orientation;
2. interview;
3. context noticed;
4. Context Mirror;
5. correction / approval;
6. portable Context;
7. Bridge handoff;
8. proof / trust;
9. CTA.

Before prototyping, inspect the live ALVIRA site again and reconcile with the latest copy initiative.

---

# ASHWOOD reference ledger

## A1 — Sticky vertical timeline / progress beam

**21st reference:** Timeline by Manu Arora, referenced in 21st.dev's timeline guide  
Reference: https://docs.21st.dev/blog/react-timeline-components

**User job:** Understand how discoveries, reversals, and proof accumulated over time without reading every card.

**Borrow:**
- persistent vertical rail;
- scroll-linked position;
- chronological anchor that remains visible while reading.

**Do not borrow:**
- generic startup/changelog styling;
- dense date labels on every minor update.

**Potential use:** Replace or extend the current discovery ledger with a stronger "where am I in the evidence trail?" experience.

**Stack fit:** Good. Can be adapted in HTML/CSS/JS without React.

**Status:** Prototype candidate.

---

## A2 — Orbital/system timeline

**21st reference:** Orbital timeline family in the timeline guide  
Reference: https://docs.21st.dev/blog/react-timeline-components

**User job:** Understand that ALVIRA, AgentOS, LEDGATo, ailhat and ASHWOOD are related but not a linear sequence.

**Borrow:**
- non-linear spatial relation;
- center + surrounding nodes;
- active relationship emphasis.

**Do not borrow:**
- treating product maturity as orbital distance;
- decorative rotation that suggests motion without meaning.

**Potential use:** Evolve the current ecosystem orbit into an interactive relationship map where selecting one product reveals role, proof, current question and adjacent dependencies.

**Stack fit:** Good with native CSS/JS.

**Status:** Prototype candidate.

---

## A3 — Scroll Choreography

**21st reference:** Scroll Choreography  
Reference collection: https://21st.dev/community/components

**User job:** Move through Build Journal sections without each section feeling like an isolated block.

**Borrow:**
- section-to-section visual continuity;
- scroll-triggered changes in scale/position;
- progressive reveal tied to narrative order.

**Do not borrow:**
- scroll hijacking;
- long locked sections;
- motion that delays access to evidence.

**Potential use:** Hero → active proof → prior art → discoveries transition.

**Stack fit:** Adaptation required. Prefer CSS + IntersectionObserver before adding animation dependencies.

**Status:** Observe / prototype selectively.

---

## A4 — Hero Gallery Scroll Animation

**21st reference:** Hero Gallery Scroll Animation by YoucefBnm  
Reference collection: https://21st.dev/community/components/explore/react-photo-gallery

**User job:** Encounter actual artifacts as part of the narrative rather than as static inline screenshots.

**Borrow:**
- media arrangement changing with scroll;
- artifact hierarchy;
- transition from hero statement into evidence objects.

**Do not borrow:**
- gallery-first framing that makes Build Journal look like a photography site;
- motion that makes screenshots hard to inspect.

**Potential use:** Evidence receipts, screenshots, quotes, diagrams and build artifacts entering the page as a curated evidence stack.

**Stack fit:** Adaptation required; can likely be simplified substantially.

**Status:** Prototype candidate.

---

## A5 — Vertical Image Stack

**21st reference:** Vertical Image Stack by Jatin Yadav  
Reference collection: https://21st.dev/community/components/explore/react-photo-gallery

**User job:** Browse a small cluster of receipts around one build question.

**Borrow:**
- stacked artifact composition;
- clear front/back hierarchy;
- reveal one receipt at a time.

**Do not borrow:**
- treating evidence as decorative photography;
- hiding provenance/captions.

**Potential use:** "Receipts" blocks inside product journal threads.

**Stack fit:** Good with CSS/JS.

**Status:** Prototype candidate.

---

## A6 — Interactive Bento Gallery

**21st reference:** Interactive Bento Gallery by Anurag Mishra  
Reference: https://docs.21st.dev/blog/react-image-gallery-components

**User job:** See a curated set of important artifacts with hierarchy.

**Borrow:**
- one dominant item plus supporting items;
- mixed media/content types;
- deliberate hierarchy.

**Do not borrow:**
- arbitrary bento layout;
- using large tiles because they look good rather than because they matter.

**Potential use:** A single "proof bundle" containing screenshot, quote, metric, decision and unresolved question.

**Stack fit:** Good.

**Status:** Prototype candidate with strict editorial ranking.

---

## A7 — Interactive Folder Gallery

**21st reference:** Interactive Folder Gallery by Alex Reino  
Reference collection: https://21st.dev/community/components/explore/react-gallery

**User job:** Roam the archive without knowing the site's taxonomy in advance.

**Borrow:**
- browse-first metaphor;
- expandable grouped collections;
- invitation to explore.

**Do not borrow:**
- literal desktop-folder skeuomorphism if it weakens the editorial feel;
- hiding navigation behind novelty.

**Potential use:** Build Journal archive / product-thread exploration.

**Stack fit:** Adaptation required.

**Status:** Observe.

---

## A8 — Link Preview

**21st reference:** Link Preview by Manu Arora  
Reference collection: https://21st.dev/community/components/explore/ai-website-templates

**User job:** Decide whether a deeper product thread is worth opening without losing place.

**Borrow:**
- lightweight preview on hover/focus;
- summary + evidence state before navigation.

**Do not borrow:**
- generic webpage thumbnail behavior;
- hover-only access without keyboard/mobile equivalent.

**Potential use:** Product-thread links in archive and ecosystem map.

**Stack fit:** Good.

**Status:** Prototype candidate.

---

## A9 — Spatial Product Showcase

**21st reference:** Spatial Product Showcase by daiv09  
Reference collection: https://21st.dev/community/components/explore/website-hero-section

**User job:** Understand multiple related products as one ecosystem.

**Borrow:**
- spatial hierarchy;
- layered depth;
- product relationships revealed through positioning.

**Do not borrow:**
- SaaS feature-showcase styling;
- fake 3D complexity.

**Potential use:** Future ecosystem overview / Build Journal navigation.

**Stack fit:** Adaptation required.

**Status:** Observe / prototype after orbit test.

---

## A10 — Scroll Cards

**21st reference:** Scroll Cards by Shamsudheen  
Reference collection: https://21st.dev/community/components/explore/react-gallery

**User job:** Move through a sequence of discoveries or decisions one at a time.

**Borrow:**
- progressive focus;
- controlled card overlap;
- clear previous/current/next rhythm.

**Do not borrow:**
- card stack as a default UI pattern;
- trapping long copy in cards.

**Potential use:** "Changed belief" sequence or major build moments only.

**Stack fit:** Good.

**Status:** Observe.

---

## A11 — Background Paper Shaders / small shader surfaces

**21st reference:** Background Paper Shaders by reuno-ui; Feature Shader Cards  
Reference: https://news.21st.dev/blog/react-shader-background-components

**User job:** Feel ambient depth without sacrificing readability.

**Borrow:**
- shader as a contained atmospheric surface;
- movement used to distinguish special moments.

**Do not borrow:**
- full-screen WebGL by default;
- using motion where a static gradient works;
- performance-heavy ambience on mobile.

**Potential use:** Small "live system" or "active proof" surfaces, not the entire journal.

**Stack fit:** High implementation cost relative to value. Requires justification.

**Status:** Defer unless a prototype clearly earns it.

---

## A12 — Bento hierarchy as an editorial principle

**21st reference:** Bento Grid guide  
Reference: https://docs.21st.dev/blog/react-bento-grid-components

**User job:** Understand which piece of evidence matters most without reading ranking copy.

**Borrow:**
- visual hierarchy communicates importance;
- mixed content types;
- limited, curated set.

**Do not borrow:**
- universal bento grids;
- layout shifts caused by volatile text.

**Potential use:** Evidence bundles and "what matters now," not the whole site.

**Stack fit:** Excellent.

**Status:** Adopt as principle, not component.

---

# ASHWOOD shortlist for first prototype round

1. **Sticky timeline/progress beam** — strongest candidate for chronology.
2. **Artifact stack / Hero Gallery Scroll principle** — strongest candidate for evidence immersion.
3. **Interactive ecosystem orbit** — strongest candidate for non-linear roaming.
4. **Link previews** — strongest low-cost way to make deeper exploration feel safer/easier.
5. **Bento hierarchy for proof bundles** — strongest way to reduce prose while preserving evidence hierarchy.

Do not prototype all five simultaneously. Start with the timeline + artifact treatment because they address the clearest current gap.

---

# ALVIRA reference ledger

## L1 — Registration Stepper

**21st reference:** Registration Stepper by Ravi Katiyar  
Reference collection: https://21st.dev/community/components/explore/react-stepper

**Semantic slot:** Interview.

**User job:** Know how much interview effort remains and feel forward momentum.

**Borrow:**
- explicit total/position;
- persistent progress;
- short, bounded steps.

**Do not borrow:**
- registration framing;
- generic numbered wizard styling;
- making the interview feel like paperwork.

**Potential use:** Signed-out interview progress.

**Stack fit:** Good in current React stack.

**Status:** Prototype candidate.

---

## L2 — Multi-step onboarding principle

**21st reference:** 21st.dev onboarding guide  
Reference: https://docs.21st.dev/blog/react-onboarding-stepper-components

**Semantic slots:** Interview, first value, CTA.

**User job:** Reach value before being asked for unnecessary setup.

**Borrow:**
- show total effort honestly;
- postpone optional setup;
- reveal product value before account friction.

**Do not borrow:**
- checklist-for-checklist's-sake;
- forced tutorial screens.

**Potential use:** Reinforces the existing signed-out ALVIRA path: interview → Context Mirror → value → signup/save.

**Stack fit:** Native to current product strategy.

**Status:** Adopt as principle.

---

## L3 — Onboarding Form

**21st reference:** Onboarding Form by Ravi Katiyar  
Reference collection: https://21st.dev/community/components/explore/react-form

**Semantic slot:** Interview.

**User job:** Answer reflective questions without feeling like they are filling a standard form.

**Borrow:**
- focused single-task composition;
- transitions between prompts;
- clear input state.

**Do not borrow:**
- standard SaaS account-onboarding aesthetic.

**Potential use:** Make ALVIRA's interview feel more like a conversation unfolding than a form stack.

**Stack fit:** Good.

**Status:** Prototype candidate.

---

## L4 — Stepper family / branching progress

**21st reference:** Stepper by Sean Hello / Origin UI family  
Reference collection: https://21st.dev/community/components/explore/react-stepper

**Semantic slots:** Interview → Mirror → correction → portability.

**User job:** Understand where they are in the larger experience, not just the current question.

**Borrow:**
- macro-stage progress;
- completed/current/upcoming distinction.

**Do not borrow:**
- exposing internal implementation stages;
- turning adaptive interview length into a misleading fixed promise.

**Potential use:** A high-level four-stage rail while interview questions remain adaptive.

**Stack fit:** Good.

**Status:** Prototype candidate.

---

## L5 — Streaming Text

**21st reference:** Streaming Text  
Reference collection: https://21st.dev/community/components

**Semantic slot:** Context noticed / Context Mirror.

**User job:** See ALVIRA synthesize context rather than having a finished block suddenly appear.

**Borrow:**
- progressive formation;
- visible "thinking becomes artifact" transition.

**Do not borrow:**
- fake token streaming that pretends model work is occurring when it is not;
- long typewriter effects.

**Potential use:** Context Mirror assembling from accepted evidence with honest state transitions.

**Stack fit:** Good.

**Status:** Prototype candidate if tied to real state.

---

## L6 — Shining / animated emphasis text

**21st reference:** Shining Text  
Reference collection: https://21st.dev/community/components

**Semantic slot:** Context noticed.

**User job:** Notice what ALVIRA has identified as important.

**Borrow:**
- restrained emphasis to indicate newly surfaced context.

**Do not borrow:**
- continuous shimmer;
- decorative "AI magic" treatment.

**Potential use:** Momentary highlight on newly extracted context before it settles into the Mirror.

**Stack fit:** Easy.

**Status:** Observe.

---

## L7 — Interactive Selector

**21st reference:** Interactive Selector by Le Thanh  
Reference collection: https://21st.dev/community/components/explore/ai-website-templates

**Semantic slot:** Correction / approval.

**User job:** Correct or approve what ALVIRA inferred without editing a large text blob.

**Borrow:**
- direct selection;
- visible choice state;
- fast confirmation.

**Do not borrow:**
- reducing nuanced context to arbitrary chips if freeform correction is needed.

**Potential use:** Confirm/correct categories, priorities, confidence or "keep / change / not me" states.

**Stack fit:** Good.

**Status:** Prototype candidate.

---

## L8 — Experience Hero

**21st reference:** Experience Hero by Hardik Kasheeyanee  
Reference collections:
- https://21st.dev/community/components/explore/hero-section-design
- https://21st.dev/community/components/explore/ai-website-templates

**Semantic slots:** Problem / orientation, demo.

**User job:** Understand ALVIRA by seeing an experience rather than reading a proposition.

**Borrow:**
- product interaction as the visual anchor;
- hero that behaves more like a product moment than marketing art.

**Do not borrow:**
- current component copy/layout literally;
- dependency-heavy spectacle.

**Potential use:** Replace or augment the current right-side hero visual with a live-feeling interview / Context Mirror sequence.

**Stack fit:** Good conceptually.

**Status:** Prototype candidate.

---

## L9 — Hero with Mockup

**21st reference:** Hero with Mockup by Serafim  
Reference collection: https://21st.dev/community/components/explore/hero-section-design

**Semantic slots:** Problem / orientation, demo.

**User job:** Immediately connect the proposition to a concrete product surface.

**Borrow:**
- product-first hero composition;
- real interface above the fold.

**Do not borrow:**
- static laptop/browser mockup if it makes ALVIRA feel generic;
- exact marketing layout.

**Potential use:** A real animated interview window instead of a generic chart or illustration.

**Stack fit:** Excellent.

**Status:** Prototype candidate.

---

## L10 — Hero scroll animation

**21st reference:** Hero scroll animation by ui layout  
Reference collections:
- https://21st.dev/community/components/explore/hero-background-animation
- https://21st.dev/community/components/explore/hero-section-animation

**Semantic slots:** Problem → interview → Context Mirror.

**User job:** Move naturally from proposition into demonstration.

**Borrow:**
- hero transforms into the product story on scroll;
- spatial continuity between above-the-fold and demo.

**Do not borrow:**
- scroll lock;
- long cinematic delay before interaction.

**Potential use:** Current hero collapses or expands into the signed-out interview/demo sequence.

**Stack fit:** Good with Motion already if present; otherwise can be simplified.

**Status:** Prototype candidate.

---

## L11 — Bento Product Features

**21st reference:** Bento Product Features, discussed in 21st.dev's bento guide  
Reference: https://docs.21st.dev/blog/react-bento-grid-components

**Semantic slots:** What ALVIRA can do / proof / portability.

**User job:** Scan multiple capabilities while understanding which one is primary.

**Borrow:**
- asymmetrical hierarchy;
- mixed content: demo, proof, quote, capability.

**Do not borrow:**
- lock layout to current copy;
- make every capability equally boxed.

**Potential use:** Only after landing copy stabilizes; could replace a prose-heavy capability section.

**Stack fit:** Good, but copy volatility makes timing important.

**Status:** Defer until messaging initiative settles.

---

## L12 — Small shader / ambient context surface

**21st reference:** Feature Shader Cards / Background Paper Shaders  
Reference: https://news.21st.dev/blog/react-shader-background-components

**Semantic slot:** Context Mirror / portable Context.

**User job:** Feel that context is live/connected rather than another text document.

**Borrow:**
- subtle ambient motion inside a bounded surface;
- depth around the Context artifact.

**Do not borrow:**
- full-page "AI nebula";
- WebGL as a substitute for demonstrating actual product state.

**Potential use:** Context Mirror background only if performance and accessibility are strong.

**Stack fit:** Higher cost.

**Status:** Defer; test static/CSS approaches first.

---

# ALVIRA shortlist for first prototype round

Because copy is under active review, the shortlist is deliberately **interaction-first**:

1. **Product-first / Experience Hero** — show the interview itself rather than explain it.
2. **Macro stepper + adaptive interview progress** — give orientation without falsely fixing question count.
3. **Context Mirror progressive formation** — make synthesis visible and state-truthful.
4. **Interactive correction/approval selector** — make user control tangible.
5. **Hero-to-demo scroll transition** — connect proposition to product experience without another explanatory section.

Copy should be injected into these structures only after the parallel messaging work is reconciled.

---

# First execution decision

## Prototype order

### 1. ASHWOOD: chronology + artifact immersion

Prototype:
- sticky discovery timeline/progress rail;
- one evidence/artifact stack treatment.

Why first:
- isolated from product functionality;
- directly tests whether 21st references can make the journal more immersive without adding noise;
- gives us reusable motion lessons before touching ALVIRA.

### 2. ALVIRA: interview → Context Mirror micro-prototype

Prototype only the interaction skeleton:
- entry prompt;
- one answer;
- context extraction appears;
- Context Mirror grows;
- user corrects/approves;
- Bridge/portable state is previewed.

Use placeholder/semantic copy slots until messaging review is complete.

Why second:
- tests whether the design system can communicate the product through behavior;
- avoids prematurely locking the current landing copy.

---

# Live-site recheck rule

For ALVIRA, the live site is part of the source of truth for design work.

Before each prototype or implementation pass:
1. fetch the live landing page;
2. identify material content/IA changes since the last audit;
3. compare them with the current prototype assumptions;
4. update the ledger if a semantic slot has changed;
5. only then proceed.

Do not assume a prior screenshot, repo state, or remembered headline is still current.

---

# Sources reviewed

- 21st.dev component catalogue: https://21st.dev/community/components
- Timeline guide: https://docs.21st.dev/blog/react-timeline-components
- Image gallery guide: https://docs.21st.dev/blog/react-image-gallery-components
- Bento guide: https://docs.21st.dev/blog/react-bento-grid-components
- Onboarding/stepper guide: https://docs.21st.dev/blog/react-onboarding-stepper-components
- React stepper collection: https://21st.dev/community/components/explore/react-stepper
- React form collection: https://21st.dev/community/components/explore/react-form
- Hero design collection: https://21st.dev/community/components/explore/hero-section-design
- Hero animation collection: https://21st.dev/community/components/explore/hero-section-animation
- Photo gallery collection: https://21st.dev/community/components/explore/react-photo-gallery
- General gallery collection: https://21st.dev/community/components/explore/react-gallery
- Shader guidance: https://news.21st.dev/blog/react-shader-background-components
