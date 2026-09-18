# ASHWOOD `/workspace` — Build Effort Ledger

## Purpose

The Build Effort Ledger is the private source of truth for how much human and agent effort has gone into each build since inception.

It exists to answer two different questions without conflating them:

1. **How much founder time has this build consumed?**
2. **How much agent execution has been used to advance it?**

The ledger should support active capture going forward and evidence-backed reconstruction for historical work. It must never present reconstructed or estimated history as directly measured time.

---

## Ownership boundary

`/workspace` owns the complete ledger, provenance, confidence, private source references, and attention-allocation analysis.

BUILD JOURNAL receives only sanitized aggregates suitable for public display.

Private source material, raw conversation content, account identifiers, local paths, tokens, internal URLs, or sensitive evidence must not be exposed through the public Journal projection.

---

## Product attribution

Initial canonical product buckets:

- `ALVIRA`
- `ailhat`
- `LEDGATo`
- `ASHWOOD`
- `AI_FROM_ZERO`
- `AGENT_OS_SHARED`

These are not permanent hard-coded truth. The model must support renamed, merged, paused, archived, or newly created builds while preserving historical attribution.

Shared infrastructure should remain in `AGENT_OS_SHARED` unless there is clear evidence that the work belongs primarily to one product.

---

## Human time vs agent execution

Do not combine founder time and agent execution into one undifferentiated total.

### Founder time

Founder time is direct human attention spent on a build. Categories:

- `STRATEGY`
- `DESIGN`
- `IMPLEMENTATION_OVERSIGHT`
- `TESTING`
- `RESEARCH`
- `REVIEW_QA`
- `CUSTOMER_USER_WORK`
- `OPERATIONS`
- `OTHER`

### Agent execution

Agent execution is time attributable to agentic or automated work, including where available:

- Codex
- Claude
- Hermes
- cto.new
- CI / automated test runs
- agent-os workflows
- other approved execution harnesses

Agent execution should preserve the harness/provider, task or run identifier where available, and source evidence.

---

## Provenance states

Every duration record must carry one of three provenance states:

### `RECORDED`
Directly measured or explicitly logged duration.

Examples:

- timer-based workspace session
- agent run with reliable start/end timestamps
- explicit user-entered duration

### `RECONSTRUCTED`
Duration inferred from timestamped evidence with a bounded methodology.

Examples:

- coherent commit/PR/review session
- deployment + review window
- build conversation with clear start/end activity
- agent session timestamps where exact run duration is unavailable

### `ESTIMATED`
Weaker approximation used only when the historical record cannot support a tighter reconstruction.

Estimated records must have lower confidence than recorded or well-supported reconstructed records and should be clearly labeled in both private analysis and any public aggregate derived from them.

---

## Confidence

Each record should include `confidence` from `0.0` to `1.0`.

Suggested interpretation:

- `0.90–1.00` direct recorded evidence
- `0.70–0.89` strong reconstruction
- `0.50–0.69` moderate reconstruction
- `<0.50` weak estimate; do not use for precise-looking public claims

Aggregate confidence should be duration-weighted and should expose the proportion of total time coming from Recorded / Reconstructed / Estimated evidence.

---

## Evidence sources

Historical backfill and ongoing capture may use:

- GitHub commits
- pull requests and review timestamps
- issue activity
- Vercel deployments and deployment review
- build conversations
- agent sessions and run metadata
- workspace actions
- approved manual corrections
- other timestamped build evidence

The system should deduplicate overlapping evidence. A PR, deployment, and conversation covering the same work window must not automatically become three separate time blocks.

---

## Session model

A ledger entry should minimally support:

```json
{
  "id": "effort_...",
  "product_id": "ALVIRA",
  "actor_type": "FOUNDER",
  "actor": "TK",
  "category": "TESTING",
  "started_at": "2026-09-08T14:00:00-07:00",
  "ended_at": "2026-09-08T15:12:00-07:00",
  "duration_minutes": 72,
  "provenance": "RECORDED",
  "confidence": 1.0,
  "source_refs": [],
  "summary": "Founding beta access regression review",
  "public_safe": true
}
```

Agent example:

```json
{
  "id": "effort_...",
  "product_id": "LEDGATo",
  "actor_type": "AGENT",
  "actor": "Claude",
  "category": "IMPLEMENTATION",
  "duration_minutes": 38,
  "provenance": "RECORDED",
  "confidence": 0.98,
  "source_refs": ["agent_run:..."],
  "summary": "Runtime enforcement remediation",
  "public_safe": true
}
```

---

## Automatic capture loop

Going forward, the workspace should prefer automatic capture over manual timesheets.

### Start signals

Potential start signals include:

- owner opens a build workspace and begins an action
- agent run starts
- review/test session begins
- explicit timer start

### Stop / boundary signals

Potential boundaries include:

- explicit timer stop
- inactivity threshold
- switch to another build
- agent run completion
- session close
- accepted deployment / review completion

Automatic capture must allow correction. The owner should be able to merge, split, reclassify, delete, or reassign a session.

---

## Historical reconstruction

Backfill should begin at each product's earliest credible inception evidence.

The system should reconstruct sessions from timestamp clusters rather than summing every artifact independently.

Example:

> commits at 10:04, 10:19, 10:47 + PR at 11:02 + deployment review at 11:15

May reasonably become one reconstructed work session, not five separate sessions.

Historical reconstruction must preserve:

- source references
- method used
- confidence
- whether the result is Recorded / Reconstructed / Estimated

The UI should never display reconstructed history with false minute-level certainty. Prefer rounded display where precision is weak.

---

## Workspace visualization

The private workspace should provide, at minimum:

### Per-build effort since inception

- founder hours
- agent execution hours
- recorded session count
- earliest evidence date
- last active date
- aggregate confidence
- provenance mix

### Founder-time composition

Show founder time by category:

- strategy
- design
- implementation oversight
- testing
- research
- review / QA
- customer / user work
- operations

### Attention allocation

Show share of founder time by build for:

- last 7 days
- last 30 days
- quarter-to-date
- since inception

Example:

```text
LAST 30 DAYS

ALVIRA        41%
LEDGATo       27%
ASHWOOD       17%
ailhat        10%
AI from Zero   5%
```

---

## Priority-drift analysis

Attention allocation should be compared against the owner's declared product priorities.

The system should surface evidence-backed drift such as:

> ALVIRA is declared the highest-priority product, but received only 14% of founder build time over the last 30 days while ASHWOOD received 46%.

Do not label a difference as a problem automatically. Explain why the allocation may be rational or concerning based on current goals, deadlines, blockers, launches, and active evidence.

The workspace should support:

- `ON_TRACK`
- `WATCH`
- `DRIFT`
- `INTENTIONAL_EXCEPTION`

with reasoning and source evidence.

---

## BUILD JOURNAL projection

BUILD JOURNAL is a public projection, not the ledger.

It may expose sanitized aggregate fields such as:

```json
{
  "product_id": "ALVIRA",
  "since": "2026-08",
  "founder_hours": 143.3,
  "agent_hours": 38.2,
  "recorded_sessions": 96,
  "confidence": 0.82,
  "provenance_mix": {
    "recorded": 0.54,
    "reconstructed": 0.39,
    "estimated": 0.07
  },
  "founder_time_mix": {
    "strategy": 0.22,
    "building": 0.34,
    "testing": 0.27,
    "research": 0.09,
    "operations": 0.08
  }
}
```

Numbers above are schema examples only, not actual ASHWOOD measurements.

### Public per-build object

Each build thread may show:

**EFFORT SINCE INCEPTION**

- founder hours
- agent execution hours
- high-level founder-time composition
- recorded session count
- last active date
- confidence / provenance note where material

### Public cross-build visualization

The BUILD JOURNAL landing can show a comparative founder-attention visualization across active builds.

The public view should communicate where effort actually went, not imply that more hours automatically means more progress or value.

---

## Privacy / publication rules

A ledger record must not become public solely because `public_safe=true` at capture time.

Publication is aggregate-only by default.

Never publish:

- raw conversation text
- private customer/user details
- account identifiers
- unreleased product secrets
- tokens / credentials
- private repository references
- personal scheduling details
- exact local activity trails

Public Build Journal data should be regenerated from approved aggregate fields.

---

## Implementation phases

### Phase 1 — contract + storage

- define ledger schema
- add normalized product IDs
- store provenance/confidence/source refs
- support manual correction

### Phase 2 — automatic current capture

- capture workspace session boundaries
- ingest agent run duration where available
- capture product attribution
- deduplicate overlapping signals

### Phase 3 — historical reconstruction

- backfill from GitHub, deployments, build conversations, and agent sessions
- calculate confidence and provenance mix
- review low-confidence records before public use

### Phase 4 — private intelligence

- attention-allocation views
- priority-drift analysis
- founder vs agent effort views
- category composition

### Phase 5 — BUILD JOURNAL projection

- generate sanitized per-build aggregates
- add effort-since-inception object to build threads
- add comparative attention visualization to Journal landing

---

## Acceptance criteria

This capability is not complete until:

1. founder time and agent execution are stored separately
2. every duration has provenance and confidence
3. historical values are clearly distinguished from directly recorded time
4. overlapping evidence is deduplicated
5. product attribution can be corrected
6. attention allocation can be compared with declared priorities
7. private evidence never leaks into BUILD JOURNAL
8. public aggregates can be regenerated from the private ledger
9. the system supports future products without schema redesign
10. the UI never presents hours as equivalent to progress or quality
