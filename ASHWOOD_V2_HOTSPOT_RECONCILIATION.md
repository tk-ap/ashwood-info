# ASHWOOD v2 — Live Hotspot Capability Reconciliation

Status: active v2 implementation decision  
Canonical repository: `tk-ap/tk-ap.github.io`  
Implementation branch: `ashwood-v2`  
Production project: Vercel `alvira2/ashwood`

## Decision

The existing six-hotspot homepage system remains the canonical discovery mechanic.

V2 does **not** replace SIGNAL / FRICTION / TRANSLATION / SYSTEMS / RESILIENCE / RANGE with SEE / LISTEN / READ / TRACE.

The two systems answer different questions:

- the **six hotspots** answer: `What capabilities keep recurring across the work?`
- the **v2 public surfaces** answer: `What is happening now, where can I enter, and how did the work happen?`

The v2 work therefore wraps and sharpens the live capability field rather than rebuilding it.

## Homepage hierarchy

### 1. Identity — explicit

The visitor meets TK / ASHWOOD first.

Preserve:

- `I follow ideas wherever they go.`
- `Out of One, Many Becomings.`
- Modeling, Music, Builds, and the broader creative/systemic range as distinct practices.

The capability field must not become the hero thesis.

### 2. Capability field — discovered

Preserve the six live capabilities:

- SIGNAL
- FRICTION
- TRANSLATION
- SYSTEMS
- RESILIENCE
- RANGE

These are recurring patterns of judgment and working style, not product categories.

Discovery should continue to move from curiosity → recognition → synthesis.

### 3. Capability synthesis — earned or directly accessible

The map explains:

- the recurring capability;
- what it means in professional language;
- when it is useful;
- where it currently shows up in real work.

The synthesis layer is allowed to reference products/practices, but must not imply that every capability equals one product or that every product belongs to one market.

### 4. CURRENT / SITREP — explicit, never hidden

Current state is not an easter egg.

The existing `NOW` surface evolves into `CURRENT / SITREP` and should ultimately carry an editorially approved snapshot of:

- current Modeling movement;
- released/current Music state;
- current Builds movement;
- latest Field Note / current authored signal where useful.

No fake realtime, presence tracking, agent counts, customer counts, or fabricated telemetry.

### 5. TRACE / BUILD PROVENANCE — cross-cutting consequence

TRACE is **not a seventh hotspot**.

It is a provenance layer attached to selected Builds / Journal evidence and optionally introduced from capability synthesis.

TRACE may expose:

- human direction / judgment / approval;
- agent-supported research, synthesis, implementation, testing, or documentation;
- enabling tools/platforms;
- collaborators / influences;
- public evidence / artifact / result;
- next proof point.

TRACE must never expose private prompts, credentials, permission graphs, raw agent conversations, unpublished task state, or private founder/customer context.

## agent-os / Workforce boundary

Locked architecture decision:

> agent-os / Workforce is shared enabling infrastructure beneath ASHWOOD, not a public ASHWOOD product or homepage destination.

Therefore the current SYSTEMS mapping should no longer present `Agent OS / Workforce · Infrastructure` as though it were a public offering.

SYSTEMS remains a capability.

Its public evidence should resolve through Builds / governed execution / systems architecture. Selected provenance may identify agent-supported execution when educationally useful.

Conceptually:

```text
SYSTEMS capability
      ↓
public build / decision / evidence
      ↓
TRACE / provenance when useful
      ↓
agent-os / Workforce beneath the work
```

## Reconciled live capability mapping

### SIGNAL

Meaning: prioritization, early risk detection, decision-ready signal.

Current evidence: `ailhat · Portfolio Intelligence`.

Keep.

### FRICTION

Meaning: identifying recurring drag, workarounds, and avoidable process burden.

Current evidence: ALVIRA should be framed as `Context Intelligence`, not the weaker `Context Experience` label.

### TRANSLATION

Meaning: converting complexity into shared understanding and action.

Current evidence: BUILD JOURNAL / Field Notes / public proof and product storytelling.

V2 strengthens this by making the Journal an evidence-bearing founder archive rather than marketing copy.

### SYSTEMS

Meaning: durable structures, controls, architecture, and repeatable ways of working.

Current evidence: `Builds · Governed execution systems`.

Do not make agent-os a public destination.

### RESILIENCE

Meaning: reliable adaptation and execution under changing conditions.

Current evidence: LEDGATo / operational reality where the public product evidence supports it.

### RANGE

Meaning: useful movement between disciplines without forcing them into one professional category.

Current evidence: ASHWOOD itself — Modeling + Music + Builds.

This is the capability most directly connected to `Out of One, Many Becomings.`

## What happens to SEE / LISTEN / READ / TRACE

They remain useful **interaction verbs**, not replacement capabilities.

- SEE → Modeling / visual work
- LISTEN → native Music
- READ → Field Notes / Builds
- TRACE → selected Build Provenance

They can appear contextually as consequences, route language, or editorial prompts.

Do not turn them into another equal four-item capability grid on top of the six-item field.

## Interaction safety

The live repo's existing interaction principles and mobile parity rules remain binding.

V2 additionally requires:

- static routes remain available regardless of hotspot state;
- capability discovery may never cover or block core navigation, current-state copy, or audio controls;
- mobile receives intentional tap/flow equivalents, not hover imitation;
- direct capability-map entry remains useful for visitors who do not want to solve the field;
- earned discovery should end in clearer understanding, not only a visual reward;
- reduced-motion preserves the information and consequence of discovery.

## V2 implementation sequence for Home

1. Preserve and visually audit the current six-hotspot field.
2. Reconcile synthesis copy and current-practice mappings.
3. Rename/evolve NOW → CURRENT / SITREP without hiding state in discovery.
4. Add latest Field Note/current authored signal only when the composition stays quiet.
5. Introduce TRACE/Build Provenance from synthesis once real provenance entries exist.
6. Integrate native Music consequences using the existing audio infrastructure rather than creating a second player system.
7. Render and verify desktop/mobile before adding new easter-egg behaviors.

## Release test

The reconciled homepage succeeds when a visitor can understand all of the following without contradiction:

1. who TK / ASHWOOD is;
2. the different forms of work available to enter;
3. the recurring capabilities beneath those forms;
4. what is actually current now;
5. how selected work happened when they choose to trace it.

The homepage should feel increasingly legible as it is explored — not increasingly complicated.
