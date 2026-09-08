# ASHWOOD Workspace — Responsive Operating Environment

Status: owner-approved product direction.

## North star

ASHWOOD should feel less like a site containing information about TK's work and more like the interface through which the work is actually happening.

This is a responsiveness systems pass, not a generic visual redesign and not a mandate to imitate SaaS dashboard aesthetics.

Core interaction principle:

**context first → compression second → depth on demand**

Motion, state changes, panes, and live updates should exist to communicate real work, not decoration for its own sake.

## 1. Persistent Workspace shell

The private Workspace should behave as one operating environment across sub-surfaces rather than a collection of unrelated pages.

Target surfaces include:

- `/workspace/` — cockpit / owner command center
- `/workspace/cycle/` — operating cycle + balance
- `/workspace/v3-playtest/` or future `/workspace/review/` — production review
- `/workspace/music/` or equivalent music operating surface
- future `/workspace/share/` — Worth Sharing / Threads intelligence
- future `/workspace/agents/` — AgentOS / harness interaction surface

The shell may use a restrained persistent rail/header/bottom navigation depending on viewport. Navigation should make these surfaces feel like rooms inside one system.

Do not force all functionality onto `/workspace/` merely to avoid subpages. Multiple focused private sub-landings are expected and desirable when they reduce cognitive load.

## 2. Context panes instead of unnecessary navigation

Selecting a priority, workstream, cycle phase, review item, or agent state should reveal useful depth in place where possible.

Examples:

- select LEDGATo → show proof gates, AgentOS status, owner action, evidence freshness
- select VERIFY → show production changes awaiting review
- select CREATE/LIVE → show available music/modeling/writing/life evidence
- select an AgentOS row → show what is underway, next gate, provenance, and whether owner action is required

Prefer contextual side/detail panes over page reloads, modal proliferation, or duplicated explanatory cards.

## 3. Immediate interaction acknowledgement

Owner actions should feel responsive even when persistence or server work is still occurring.

Where safe, use optimistic UI patterns such as:

**Approve → Approved · syncing… → Approved · saved 8:54 AM**

Candidates include:

- approvals
- review checkmarks
- evidence adds
- notes
- uploads
- clearance/status changes
- owner decisions
- bounded AgentOS actions

Optimism must never fabricate success. If the write fails, revert clearly and show the error.

## 4. Live status over explanatory prose

Prefer compact state communication:

- status
- count
- timestamp/freshness
- direction/next gate
- one concise explanation

Example pattern:

**LEDGATo**  
AgentOS · working  
3 / 5 proof gates  
2 partner targets ready  
Updated 14m ago  
**NEXT:** Review fail-closed proof

Use progressive disclosure for rationale, history, and nuance.

## 5. Shared event/state layer

Longer-term Workspace responsiveness should converge on normalized events rather than independent polling and duplicated inference.

Candidate event vocabulary:

- `work.started`
- `work.completed`
- `work.blocked`
- `approval.required`
- `approval.completed`
- `deployment.ready`
- `deployment.review_started`
- `deployment.reviewed`
- `evidence.added`
- `decision.recorded`
- `music.uploaded`
- `creative.session.recorded`

One real event should be able to update multiple surfaces consistently: priorities, operating balance, Owner Signal, production checklist, constellation, workstreams, and What Changed.

Canonical truth remains in AgentOS, ailhat, owning product repos, and approved Workspace owner state. ASHWOOD is the human-facing operating projection, not a replacement for those sources of truth.

## 6. Behavior-aware Workspace

Workspace should increasingly understand what the owner is actually touching.

Examples:

- opening a review-linked page records review started
- explicit approval clears the corresponding review debt
- inspecting VERIFY can be reflected as active owner attention without claiming verification is complete
- after all relevant USE/VERIFY items clear, the operating cycle can recommend OBSERVE or DECIDE if those phases are now weakest
- an owner override should be recorded as an intentional decision, not treated as system failure

Visits are evidence of attention, not proof of completion unless the task is objectively satisfied by arrival alone.

## 7. Motion should communicate state

Prioritize informational motion:

- new AgentOS event entering the stream
- priority changing rank because evidence changed
- operating balance shifting from BUILD toward VERIFY
- stale workstream cooling/dimming
- completed review leaving the owner queue
- constellation relationship strengthening as evidence accumulates
- selected context pane opening around the current object

Ambient/editorial motion may remain, but it should not compete with state communication.

## 8. Future `/workspace/agents/`

Do not implement immediately unless prioritized separately, but reserve the architecture for a human-facing agent/harness surface.

Directional model:

- ChatGPT
- Claude
- Hermes
- AgentOS

Potential state per resource:

- available / unavailable / working / idle
- current task
- recent output
- pending owner request
- last activity
- provenance / harness

Future interaction goal: the owner should be able to ask for work from ASHWOOD without remembering which terminal, chat, harness, or repo currently contains the relevant agent.

ASHWOOD should be the human interface; AgentOS remains the orchestration layer; model/harness providers remain execution resources.

### Agent communication interaction pattern

Use the visual reference of a **Chat / Agents split** as inspiration, but adapt it to ASHWOOD rather than copying a generic multi-agent dashboard.

The important pattern is:

**request → delegation → visible work → interruption only when needed → result**

The owner should be able to move between two complementary views:

- **Chat** — natural-language conversation and requests
- **Agents** — visible execution state, delegation, progress, blockers, tool use, and pending owner decisions

A future desktop composition may use three coordinated regions:

1. **Conversation / request rail** — the owner request, clarifying exchange, and concise synthesis.
2. **Active orchestration field** — which tasks AgentOS created, which harness owns each one, current progress, and next gate.
3. **Specialist detail pane** — deeper state for one selected resource or task, including subtasks, evidence, tools, blockers, and outputs.

Example state:

**YOU**  
Review LEDGATo #21 and tell me if it should merge.

**AgentOS**  
Routes Claude → code/security review  
Routes Hermes → execution evidence  
ChatGPT → owner-facing synthesis

**Claude**  
Review PR #21  
● Inspect authorization boundary  
● Check bypass paths  
○ Final recommendation

**Hermes**  
Stress evidence  
✓ Workflow replay  
✓ Failure path  
● Fresh external test

**ChatGPT**  
Owner synthesis  
Waiting on Claude + Hermes

### Truth and architecture boundary

Do not imply that ASHWOOD itself is the runtime or that agents are executing merely because a card is visible.

The intended architecture remains:

- **ASHWOOD** = human-facing operating interface
- **AgentOS** = router / orchestrator / canonical execution coordination layer
- **ChatGPT / Claude / Hermes / other harnesses** = execution resources
- **LEDGATo** = authority / enforcement layer where applicable

Every visible agent status should have provenance and freshness. Unknown or disconnected state should render as unavailable/unknown rather than simulated activity.

### Design constraints for `/workspace/agents/`

- Do not turn the surface into Slack or a generic team chat.
- Persistent conversation history is secondary to current task state and delegation clarity.
- Avoid equal-weight agent cards; emphasize the active request and the work actually moving.
- Show progress through meaningful state, not decorative percentages unless backed by a real task contract.
- Make blockers and **needs you** moments visually obvious.
- Keep deep logs available on demand, not in the default view.
- Preserve the broader ASHWOOD editorial language and responsiveness principles.
- Mobile should collapse gracefully into one selected conversation/task context at a time rather than shrinking a desktop multi-column board.

## Immediate implementation order

1. Persistent Workspace navigation shell across current private sub-surfaces.
2. Context-pane behavior for Actual Priorities and key workstreams.
3. Optimistic response states for owner actions where safe.
4. Replace explanatory copy with live status, counts, timestamps, and next gates where possible.
5. Consolidate existing signals into a shared event/state contract.
6. Make owner behavior update cycle/review recommendations without false completion claims.

## Non-goals

- no generic admin-dashboard redesign
- no removal of editorial identity
- no flattening of meaningful interaction
- no requirement that every Workspace feature live on one page
- no real-time claims without fresh evidence
- no motion for motion's sake
- no autonomous owner decisions

## Acceptance test

The Workspace should increasingly pass this test:

> When something meaningful changes in the work, does the environment visibly react in the right place, with minimal reading and without requiring TK to remember where that state lives?

If the answer is no, the interface is still behaving too much like a website and not enough like the operating environment it is intended to become.
