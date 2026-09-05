# AI from Zero — ecosystem curriculum spine

AI from Zero should teach the whole ASHWOOD product ecosystem as one connected learning model, not use ALVIRA as the only product example.

## Teaching sequence

A useful progression for someone learning to build with AI / agentic workforces is:

1. **Context / ALVIRA** — What does the system need to understand about the person, project, goals, constraints, history, and preferences? Why is continuity better than repeatedly rebuilding this from scratch? When someone wants to build, how can that maintained understanding become a portable **Build Brief** rather than another underspecified one-off prompt?
2. **Attention / ailhat** — Across everything the person or organization is responsible for, what actually deserves attention? How do opportunity, risk, drift, and work become signals rather than noise? How does an evidence-backed **work brief** differ from a generic prompt?
3. **Execution / Agent OS + Workforce** — Once work is identified, how is it expressed as a task, workflow, harness, host, handoff, loop, and evidence contract? How does work move without pretending that a prompt by itself is an operating system?
4. **Authority + operational reality / LEDGATo** — What is an agent allowed to do? Where must it stop for approval? How are delegated authority, revocation, evidence, cost, and post-action verification handled so execution can be inspected and governed?
5. **Human acceptance** — What counts as done? The system can preserve context, surface work, execute steps, and record evidence; a person still defines meaning, appropriateness, quality, and acceptance.

## Product boundary rule

**Agent OS / Workforce is foundational infrastructure, not a standalone public product offering.**

AI from Zero may expose Agent OS concepts because task contracts, workflows, harnesses, hosts, routing, evidence, and bounded execution are important to understand. But public education must label Agent OS as infrastructure and must not present it beside ALVIRA, ailhat, and LEDGATo as though it is currently another customer-facing product.

The current public-product distinction is:

- **ALVIRA** — Context Intelligence
- **ailhat** — Portfolio Intelligence
- **LEDGATo** — execution authority / operational evidence
- **Agent OS + Workforce** — shared execution/control-plane infrastructure beneath the ecosystem

## Prompts are adapters, not the category

ALVIRA and ailhat may both produce excellent prompts, but neither should be taught as a prompt-engineering generator.

### ALVIRA

The useful transformation is:

**maintained context → clarified intent → canonical Build Brief → builder-specific adapter prompt/export**

A Build Brief can capture the goal, problem, target user, desired experience, relevant context, existing assets, constraints, non-goals, requirements, references, acceptance criteria, and open questions. It should remain portable across cto.new, Base44, Codex, Claude Code, Replit, Lovable, or future builders.

The prompt is disposable. The user's maintained context and canonical specification are the durable assets.

### ailhat

The useful transformation is:

**signals → interpretation → evidence → priority → work brief → execution adapter**

The work brief should explain what deserves attention, why now, what evidence supports it, what outcome is needed, what constraints apply, and how the result will be accepted.

The prompt is an adapter. Portfolio judgment is the intelligence.

## Core educational argument

Markdown, prompt libraries, reusable context files, Build Briefs, work briefs, workflows, harnesses, permissions, and evidence are not separate tricks. They are layers in the same progression from a one-off conversation to dependable, governed machine-assisted work.

The products should appear as concrete examples of why those layers exist, while the education remains portable and vendor-neutral. Someone should be able to learn the practices without adopting any ASHWOOD product, then understand exactly which product is attempting to solve which harder version of the problem.

## Curriculum rule

Whenever AI from Zero introduces a concept, add a **Where this shows up in the builds** connection when there is a real example:

- context / memory / portability / Build Brief → ALVIRA
- signals / prioritization / portfolio judgment / work brief → ailhat
- task contracts / workflows / harnesses / hosts / evidence → Agent OS + Workforce **(infrastructure, not standalone product)**
- authorization / approval / revocation / runtime evidence / verification → LEDGATo
- acceptance criteria / final judgment → human acceptance and Build Journal evidence

Do not turn the learning surface into product marketing. The products are worked examples and proof of the questions, not prerequisites for learning the concepts.
