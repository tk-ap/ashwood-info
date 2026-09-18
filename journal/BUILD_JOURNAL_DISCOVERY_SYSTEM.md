# Build Journal → Discovery System

Status: product direction
Date: 2026-09-18
Scope: ASHWOOD Build Journal + private Workspace + future AgentOS integration

## Direction

The Build Journal should not function only as an archive people inspect after discovering ASHWOOD. It should become the canonical evidence layer behind a distribution system that helps relevant people discover the work.

The operating loop is:

```
build → observe → identify meaningful discovery → package → owner approval → distribute → route interest back to evidence
```

This must not create a second content job for the owner. Actual product work remains the source material. ASHWOOD/AgentOS should eventually identify candidate discoveries from real evidence and prepare them for review. Nothing publishes automatically without explicit approval.

## What qualifies as a publishable discovery

Prioritize evidence-backed events such as:

- a working proof or meaningful milestone;
- a surprising failure;
- a changed belief;
- a consequential product or architecture decision;
- an unresolved technical/product question;
- a constraint preventing the next meaningful proof.

Do not treat routine commits, generic progress updates, or unsupported claims as content.

## Canonical Build Event

Meaningful Journal entries should make four things immediately legible:

1. What was I trying to do?
2. What actually happened?
3. What did I learn?
4. What changed because of it?

Where possible, attach receipts: commits, PRs, tests, screenshots, deployment evidence, agent execution records, or other verifiable artifacts.

The Journal is the durable source of truth. Social posts are derived artifacts, not replacements for the record.

## Workspace: "From the work"

Add a lightweight private queue that surfaces candidate discoveries from actual work.

Each candidate should contain:

- source product/workstream;
- source evidence and timestamp;
- concise statement of why it may matter;
- draft Journal framing;
- draft channel-specific public artifact(s);
- actions: Preview, Journal entry, Approve/publish, Dismiss.

The system should avoid repeatedly surfacing dismissed or materially identical observations.

Future AgentOS integration should populate this queue from execution evidence rather than requiring manual content entry.

## Distribution

Approved Build Events can be atomized into channel-appropriate artifacts, initially Threads and LinkedIn where useful. They should lead with the interesting problem, proof, failure, decision, or learning rather than product marketing.

Distribution should route interested people back to the canonical Journal evidence.

No generic "build in public" posting quota. Quality and consequence matter more than frequency.

## Discovery paths

A Build Journal entry should make sensible next actions available without turning the Journal into a sales page. Depending on the entry and maturity of the work, these may include:

- follow the build;
- inspect the related project;
- see related Build Events;
- test / early access;
- collaborate;
- contact;
- view a current proof constraint or funding/sponsorship opportunity.

Only show paths that actually exist.

## Build Journal landing-page direction

Evolve the Journal from a flat catalogue of builds toward an unfolding investigation. Candidate hierarchy:

1. **Now** — what is actively being tested/proven.
2. **Recent discoveries** — the strongest 3–5 consequential Build Events.
3. **Open questions** — genuine unresolved questions.
4. **Builds** — ALVIRA, AgentOS, ledgato, ailhat, and other active work.
5. **Constraints** — concrete blockers to the next meaningful proof, including zero-dollar constraints where relevant.
6. **Archive** — older records.

The page should be understandable to someone with no prior knowledge of the ecosystem.

## Guardrails

- Build first; distribution follows the evidence.
- Do not invent progress, lessons, failures, or evidence.
- Do not publish private owner context or secrets.
- Do not automatically expose internal agent traces, credentials, customer/user data, or sensitive implementation details.
- Preserve explicit owner approval before public publication.
- Avoid generic founder-content language and product-marketing filler.
- A status report is not evidence of execution.
- Keep Field Notes distinct: Build Journal is product/build evidence; Field Notes remains the broader writing/creative archive.

## Success condition

The system is working when the owner can focus on building while meaningful, evidence-backed discoveries reliably surface for approval; approved artifacts reach external channels; and interested people can trace those artifacts back to a coherent, verifiable record of the work.
