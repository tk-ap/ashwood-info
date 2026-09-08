# ASHWOOD Workspace — Owner Command Center

Status: approved operating-model directive.

The Workspace should answer four questions immediately:

1. **What matters now?**
2. **What is AgentOS already handling?**
3. **What specifically needs the owner?**
4. **What changed since the last check?**

The goal is not to add another dashboard. The goal is to reduce founder memory load and prevent duplicate or unnecessary work.

## 1. Canonical execution truth

ASHWOOD is a human-facing projection, not the execution system of record.

AgentOS, ailhat, and the owning product repositories remain canonical for execution state. Workspace may display `underway`, `blocked`, `waiting approval`, `done`, or similar states only when those states are supported by a fresh synced projection.

Do not infer autonomous execution from a plan, an old assignment, or a static priority entry.

## 2. Freshness and staleness

Every AgentOS-backed workstream shown as active should expose a last-observed / last-activity timestamp.

Workspace should detect stale execution state. Directional defaults:

- under 24 hours: current
- 24–48 hours without meaningful state movement: watch
- over 48 hours: potentially stale / stalled unless an explicit waiting state or external dependency explains the gap

The UI should distinguish:

- **AgentOS · underway**
- **AgentOS · waiting**
- **AgentOS · needs you**
- **Possibly stalled**
- **Execution state stale**
- **No autonomous work confirmed**

A stale row must not continue to look confidently active.

## 3. Owner queue

Workspace should maintain a compact owner-only queue of the smallest set of actions that truly require founder judgment or action.

Target: **3–5 items maximum**.

Examples:

- approve / reject a decision
- review a PR or evidence boundary
- send / approve design-partner outreach
- make a product-positioning decision
- upload a required artifact
- resolve a blocker agents cannot resolve safely

This is not another backlog. If an item can be executed autonomously and safely, it should not be in the owner queue.

## 4. Leave-alone state

Workspace should explicitly protect work already moving autonomously.

Preferred language:

**LEAVE ALONE — AGENTOS WORKING**

This state exists to prevent the owner from duplicating work, starting a parallel implementation, or interrupting a deterministic task that is already progressing.

The state must disappear when the task becomes stale, blocked, complete, or requires owner input.

## 5. Definition of done by priority

Each ranked product priority needs a current-phase exit condition. Priorities should not remain permanently active because the product itself is ongoing.

### LEDGATo
Current phase is done when:
- remaining enforcement proof gates are completed or explicitly dispositioned;
- the product can make a narrow, evidence-supported enforcement claim;
- 10 qualified prospects have been researched;
- the top prospects are ranked;
- at least 3 design-partner conversations/outreach attempts have been initiated with owner approval.

### AgentOS
Current phase is done when:
- the owner can hand off bounded work without creating equivalent coordination work;
- deterministic failures reconcile without founder interruption where safe;
- Workspace receives trustworthy execution projection from AgentOS;
- blocked / approval-required / complete states surface clearly.

### ALVIRA
Current phase is done when:
- the Context + Reflect journey is materially frictionless for intended beta users;
- import / seed flows reduce repeated setup;
- at least one measurable context-value signal is being captured (for example Re-explanation Rate / Context Lift or equivalent user-value evidence);
- progress is judged by user value, not feature count.

### ASHWOOD
Current phase is done when:
- Workspace reliably answers what matters, what agents are doing, and what needs the owner;
- Build Journal preserves a clear evidence trail without becoming copy-heavy;
- ASHWOOD remains an operating/evidence surface rather than a new startup obligation.

### ailhat
Current phase is done when:
- real portfolio activity is observed;
- ailhat identifies a grounded opportunity / risk / drift / work item;
- it explains why the signal matters;
- recommended work routes into AgentOS or an owning system;
- the result of the intervention can be tracked.

Do not expand broad product surface before this loop is proven repeatedly.

### AI from Zero
Current phase is done when:
- real lessons from completed or active builds are captured as practical learning material;
- the education layer remains downstream of execution rather than creating independent delivery pressure.

## 6. Reprioritization rules

Priority order should change when evidence changes, not because a static list gets old.

Examples:

- LEDGATo proof complete → shift owner attention from engineering proof toward design partners and market learning.
- AgentOS integration/reliability milestone complete → reduce owner attention unless a reliability or approval issue appears.
- ALVIRA user-access or user-value friction appears → temporarily elevate ALVIRA.
- A blocked top-priority task that agents cannot resolve → elevate the required owner decision, not the whole product backlog.
- ailhat may move up only when the portfolio-intelligence loop has real evidence and there is a concrete next validation step.

Workspace should preserve the reason a priority moved.

## 7. Portfolio constraint

Until explicitly changed by the owner:

> **Do not start a new standalone product until at least one of the current top three priorities reaches its current proof milestone.**

New ideas may be captured in backlog/evidence form, but they should not receive active build allocation by default.

## 8. First-screen compression

The first useful Workspace view should converge toward:

**WHAT MATTERS → WHAT AGENTS ARE DOING → WHAT NEEDS YOU → WHAT CHANGED**

Existing deeper views — goals, evidence, pulse, workstreams, attention, rhythms — can remain available through progressive disclosure. Do not solve this directive by adding more equal-weight dashboard panels.
