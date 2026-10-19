# Theranos Evaluation — Investment, Truth, and Drift

Status: active operating rule for major builds and feature-level decisions.

## Purpose

The Theranos Evaluation is a recurring decision framework, not a retrospective joke or a single blended score. It asks two independent questions:

1. **Is this worth building?** Does it create meaningful user/founder value for the time, cost, complexity, and maintenance it consumes? Could the outcome be achieved more efficiently by reusing an existing product, agent, integration, or workflow?
2. **Are we being truthful and staying on track?** Does the capability we describe actually exist at the level claimed? Is evidence moving toward the promised outcome, or are we experiencing drift?

Apply this to both project-level investment decisions and feature-level build gates. A valuable idea can be poorly executed; a well-built feature can be low-value. Never let one score conceal the other.

## Score dimensions

Score each dimension from 0–10 and attach evidence, not just a number.

### A. Value and investment (higher is better)

- **User/founder value:** Is the problem meaningful, recurring, and costly enough to solve?
- **Expected leverage / return:** Is the likely benefit worth build time, operating cost, and ongoing maintenance?
- **Strategic fit:** Does this advance a current priority and its proof milestone?
- **Efficiency / reuse:** Have we checked existing products, agents, APIs, and workflows before building new machinery?
- **Validation confidence:** Is there real user, operational, or measurable outcome evidence rather than enthusiasm alone?

### B. Truth, delivery, and drift (higher risk score is worse)

- **Claim–evidence gap:** How far do product descriptions, demos, and internal status claims exceed tested capability?
- **Proof velocity:** Are meaningful acceptance tests passing and outcomes improving?
- **Scope drift:** Is work expanding or changing without a justified value/evidence update?
- **Execution integrity:** Are dependencies, owners, current status, blockers, and next proof milestones explicit and fresh?
- **Operational reality:** Is the capability accessible, secure, reliable, and usable in its intended environment—not merely present in code?

Do not average all dimensions into one headline number. Report at least:
- Value/investment score (0–10, higher is better)
- Claim–evidence gap (0–10, higher is worse)
- Drift risk (0–10, higher is worse)
- Efficiency/reuse score (0–10, higher is better)
- Evidence confidence: low / medium / high

Scores without evidence are explicitly marked **provisional**.

## Decision rules

- **INVEST / CONTINUE:** Meaningful value hypothesis; reasonable efficiency; a bounded next proof milestone; no critical truth or safety gap.
- **SIMPLIFY / REUSE:** Outcome is worthwhile but implementation duplicates an existing system or adds unnecessary architecture.
- **VALIDATE FIRST:** Value may be high, but user need, technical feasibility, or return remains unproven. Fund only a time-boxed experiment.
- **PAUSE:** Evidence is stale, the next proof step is unclear, or the project is consuming resources without meaningful progress.
- **STOP / RE-SCOPE:** Core value assumption failed, cost outweighs likely value, or repeated proof failures invalidate the approach.

High claim–evidence gap or drift risk blocks promotion to a stronger product claim, even if value potential is high.

## Project-level investment review

For every major build, record:

1. Intended outcome and target user/problem.
2. Current phase and explicit exit/proof milestone.
3. Current implementation state: idea, designed, implemented, tested, or proven.
4. Value/investment score and evidence.
5. Claim–evidence gap and drift risk.
6. Simplest viable route, including reuse/competitor/build-vs-integrate assessment.
7. Spend to date and next bounded investment (time, money, complexity, maintenance).
8. Next proof milestone, acceptance criteria, owner, and review date.
9. Decision: invest, simplify, validate, pause, stop, or re-scope.

Do not treat a live website, code presence, or successful demo as proof of an entire product outcome.

## Feature-level build gate

Before a material feature receives build allocation, state:

- What user outcome changes if this feature works?
- Why is the outcome valuable now?
- What existing capability can be reused?
- What is the smallest experiment that proves value and feasibility?
- What observable acceptance test defines success?
- What is explicitly out of scope?
- What time/effort limit triggers reconsideration?
- What result would cause us to defer, simplify, or abandon it?

After implementation, label the result honestly: **idea → designed → implemented → tested → proven in intended environment**. Do not skip stages in claims.

## Drift signals

Flag potential drift when:
- activity repeatedly substitutes for passing proof tests;
- scope grows without an evidence-backed reason;
- multiple systems implement overlapping ownership;
- a feature has no named user outcome or acceptance test;
- status is stale or autonomous progress is assumed without fresh evidence;
- new product ideas divert capacity from the existing portfolio constraint;
- a demo is presented as production capability;
- the same blocker or failed proof recurs without a decision to change course.

Difficulty alone is not drift. Drift is sustained divergence from the intended outcome without an explicit, evidence-based replan.

## Review cadence

- **Weekly portfolio review:** Re-evaluate active major builds, decisions, proof milestones, resource use, claim accuracy, and drift.
- **Before each material feature:** Apply the feature-level build gate.
- **At each milestone or major scope change:** Re-score immediately; do not wait for the weekly review.
- **After a failed proof:** Decide whether to repair, simplify, test a revised assumption, pause, or stop.

## Initial portfolio coverage

Always include these current ecosystem workstreams when active:
- **ALVIRA:** Context + Reflect friction, onboarding/import leverage, measurable context value.
- **ailhat:** Real portfolio observation → grounded opportunity/risk/drift → routed action → tracked result.
- **Agent OS:** Bounded handoff without equivalent coordination burden; safe recovery; trustworthy status projection and human approval gates.
- **OmniChat:** Prove session discovery, transcript retrieval/search, and continuation of the same native session before investing in a new UI or standalone product.

Include other major builds when they receive active investment. Do not force inactive ideas into the active-build list; capture them as backlog hypotheses.

## Portfolio guardrail

Until explicitly changed by the owner:

> Do not start a new standalone product until at least one of the current top three priorities reaches its current proof milestone.

Prefer integration and reuse over another parallel implementation. The review must result in decisions and next proof steps, not just scores.
