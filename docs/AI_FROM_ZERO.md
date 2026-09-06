# AI from Zero

_Status: curriculum direction / product-learning architecture_
_Last updated: 2026-09-06_

## Purpose

AI from Zero is not a glossary for people learning to code with AI. It is the beginner-facing mental model for understanding the new computing environment created by AI systems, agents, tools, and agentic workforces.

The goal is to explain concepts only when the learner has a reason to encounter them. Vocabulary should follow the mental model, not lead it.

## Core learning progression

1. **What is software?**
2. **What is an app?**
3. **What is an API?**
4. **What does an AI model actually do?**
5. **What is an agent?**
6. **How can an agent use other software?**
7. **Why do tools, APIs, MCP-style interfaces, permissions, and context matter?**
8. **What happens when AI becomes the interface?**
9. **What changes when one agent becomes a workflow or workforce?**
10. **Why do evidence, authorization, cost, verification, and accountability matter?**

## Early module: How Software Is Changing

Working lesson framing:

**Apps → tools/services → agents → intent-driven software**

The useful idea is not that "apps are dead." That framing is too absolute.

The more accurate beginner model is:

> An app can increasingly become a service an agent operates on your behalf, rather than a place you personally have to navigate for every action.

Example:

### Traditional interaction

`I want dinner → open delivery app → search → compare → choose → enter details → order`

### Agentic interaction

`"Find me Thai under $25 that can arrive before 7."`

The AI may then coordinate search, location, pricing, ordering, payment, and other systems underneath the user's request.

The interface does not necessarily disappear. The important shift is that the human is no longer required to manually operate every interface involved in accomplishing the goal.

### Supporting reference

Video discussed 2026-09-06: `https://youtu.be/Qj5I1glMy7E`

Use it as supporting material for the architectural transition, not as evidence that the app economy has literally ended.

## Teach jargon in context

Use a causal progression rather than dictionary-first education:

`You tell an agent what you want`

↓

`The agent needs context`

→ explain context, memory, preferences, goals, constraints, and selective context use

↓

`The agent needs tools`

→ explain tools, APIs, MCP-style interfaces, CLIs, and software access

↓

`The tool may change something in the world`

→ explain permissions, authorization, delegated authority, boundaries, approvals, and revocation

↓

`Multiple agents may collaborate`

→ explain agents, workflows, harnesses, roles, handoffs, and agent workforces

↓

`You need to know what actually happened`

→ explain logs, evidence, verification, cost, accountability, and failure recovery

This is the de-jargonification mechanism: define the term at the moment the learner has a concrete reason to understand it.

## Relationship to AI Harness Engineering

### AI from Zero

Teaches **how the new computing environment works**.

Audience: someone who may not know Markdown, APIs, CLIs, agents, harnesses, repositories, or orchestration yet.

Primary outcome: the learner can reason about the system without being blocked by terminology.

### AI Harness Engineering

Teaches **how to build reliable systems in that environment**.

It should begin where AI from Zero ends: once the learner understands the basic relationship between intent, model, context, tools, authorization, workflows, and evidence.

### ASHWOOD Builds / Build Journal

Shows **what building these systems actually looked like**: decisions, failures, changed beliefs, implementation evidence, launches, and outcomes.

AI from Zero is education. AI Harness Engineering is applied technical education. Build Journal is evidence from actual building.

## Build in public: document learning, not activity

Build in public should be treated as an evidence loop, not as a mandate to post constant progress updates.

Core principle:

> **Document learning, not activity.**

The useful public artifacts are:

- the problem or hypothesis being investigated;
- the smallest meaningful build used to test it;
- evidence from real usage or observed failure;
- decisions made in response to that evidence;
- changed beliefs and why they changed;
- meaningful milestones, launches, failures, and working demonstrations.

Avoid low-signal updates whose primary content is that work happened.

### AI-native build loop

Teach the beginner-facing loop as:

`hypothesis → small build → public evidence → feedback → revision → documented learning`

This is the preferred AI from Zero framing for build in public. It should help learners understand that faster software creation changes what becomes scarce: judgment, proof, trust, distribution, audience, and the ability to learn from evidence.

### Build in public ≠ perform in public

Public building should not require founders or builders to narrate every action. The goal is to expose enough of the reasoning and evidence that others can understand what was learned and why the product changed.

Examples of useful public evidence:

| Expose | Learn / gain |
| --- | --- |
| Problem being investigated | People who recognize the problem |
| Early prototype | Usability evidence |
| Product decision | Judgment and reasoning signal |
| Failure | Learning evidence |
| Changed belief | Intellectual honesty and adaptation |
| Metrics / result | Proof |
| Open question | Potential collaborators |
| Working product | Users and customers |

### Relationship to the ASHWOOD Build Journal

The ASHWOOD Build Journal / Founder Build Archive should implement this principle directly.

It should preserve high-signal artifacts such as:

- decisions;
- evidence;
- failures;
- changed beliefs;
- meaningful milestones;
- working demonstrations;
- outcomes.

It should not become a chronological feed of routine work or a conventional founder diary.

For abstract infrastructure products, the Build Journal also serves as market education. Public examples should show the underlying problem and evidence rather than merely announce features.

Examples:

- **ALVIRA** — show a repeated-context failure, what changed, and whether re-explanation decreased.
- **LEDGATo / khrystal direction** — show an agent attempting a disallowed action, how enforcement behaved, and what was learned.

The general concept must remain primary; ecosystem products are implementation evidence.

## Ecosystem examples, not product marketing

ASHWOOD ecosystem products can be used as concrete case studies, but AI from Zero should remain useful to someone who never uses any of them.

- **ALVIRA** — why AI systems need persistent, inspectable, selective context.
- **AgentOS** — why a single prompt can become workflows, roles, handoffs, hosts, and evidence contracts.
- **LEDGATo / khrystal direction** — why capable agents need enforceable authorization boundaries, approvals, revocation, and post-action verification.
- **ailhat** — why a growing agent workforce may need portfolio-level intelligence about opportunity, risk, drift, and work.

Do not turn lessons into disguised product pages. Lead with the general concept; use ecosystem products as optional implementation examples.

## Foundational transition question

A core bridge from AI from Zero into AI Harness Engineering should be:

> **If AI can operate software for you, what exactly are you building when you build with AI?**

This question introduces the learner to the idea that the important artifact may no longer be a conventional app UI. It may be a system of context, instructions, tools, permissions, workflows, agents, evidence, and interfaces assembled around a human intention.

## Curriculum principles

**Mental model first. Jargon second. Implementation third.**

**Document learning, not activity.**

The learner should understand why a concept exists before being expected to remember its name, and should learn to treat building as a cycle of hypothesis, evidence, revision, and documented learning.