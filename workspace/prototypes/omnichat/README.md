# OmniChat / AgentOS — interactive here.now prototype

**Status (2026-10-27):** Source implemented on this branch. **Not deployed to here.now and not connected to live harness telemetry.** No production release implied.

## Purpose

An owner-facing, headless-capable successor to the ASHWOOD Operator tab. The UI is one conversation with multiple visible agent / harness sessions. Jev proposes a session at prompt ingress; the existing AgentOS lifecycle, durable state, and LEDGATo authority boundary remain canonical. A harness can exhaust usage, checkpoint work, and be handed off to a successor without losing task ownership or falsely marking completion.

Standalone static prototype: `workspace/prototypes/omnichat/index.html`. CSS/JS are self-contained apart from optional fonts. It is safe to serve as a sandbox page; **the demo data is fictional and labeled as such.** Nothing in the default view calls a model, sends an owner command, or opens an approval gate.

### UI references from 21st.dev

- [Agent Elements](https://agent-elements.21st.dev/docs): message list, input bar, tool state, readable streaming components; future React componentization.
- [Agent Activity by Saurabh](https://preview.21st.dev/@starc007/components/agent-activity): collapsible tool activity/timeline pattern, MIT-licensed.
- [Dashboard UI Design](https://21st.dev/community/components/explore/dashboard-ui-design): compact dashboard and activity summary patterns.

The standalone prototype uses its own vanilla HTML/CSS/JS implementation (not copied third-party component source) so it can publish to static here.now without npm, a CDN runtime, or a database.

## Publish to here.now (owner-connected host)

Use the canonical owner-connected here.now publishing skill from an AgentOS/Herdr host with the provider credential already configured. Publish the **directory**, not its parent, so `index.html` is at the site root:

```bash
# From the checked-out ASHWOOD branch:
PUBLISH="/path/to/here-now/scripts/publish.sh"
bash "$PUBLISH" workspace/prototypes/omnichat --client codex
```

On first publish, claim an owner-controlled persistent site and store its separate stable slug. For updates use `--slug <omnichat-slug>`, with version-aware stale-base checks; **do not overwrite the existing ASHWOOD sandbox `mighty-yoga-pgph`**. Do not commit the API key or claim token. If published anonymously without authentication, the site expires in 24 hours. Validate returned URL and delivered HTML/CSS/JS before representing the deployment as live.

## Live read-only bridge contract (future backend)

A static here.now site is *not* permitted to read workstation files or privileged AgentOS services. Use a scoped, authenticated projection bridge with explicit CORS/origin policy if the remote sandbox must display private state. Until that is established, **Connect feed** calls `GET /api/omnichat/activity` on the same origin, fails closed, and reports unavailable/stale rather than inventing events.

Response example (schema version TBD; values below illustrative only):

```json
{
  "source_system": "agent-os",
  "observed_at": "2026-10-27T19:00:00Z",
  "commands_enabled": false,
  "lanes": [
    {
      "id": "execution-attempt-id",
      "task_id": "canonical-agentos-task-id",
      "agent": "Codex",
      "harness": "codex-cli",
      "title": "Implement lifecycle checkpoint",
      "status": "working",
      "last_heartbeat_at": "2026-10-27T18:59:50Z",
      "checkpoint": "canonical durable receipt identifier",
      "capacity": {"state": "available", "reset_at": null},
      "events": [
        {"kind": "check_in", "label": "Started", "occurred_at": "2026-10-27T18:57:00Z"}
      ]
    }
  ]
}
```

**Required correctness:**
- `source_system` must be `agent-os`; observed snapshot age must be <120s for this UI. A claimed *working harness* requires its own <=90-second heartbeat.
- A task `phase=running` alone may only prove **projected task state**, not a live session; never synthesize a heartbeat from a page refresh.
- Expose **wake, check-in, execute, checkpoint, A2A handoff, check-out** with durable event/attempt identity. If the producer cannot observe a step, mark `unknown`.
- Harness exhaustion should have a receipt with `provider/harness`, exhaustion reason (non-secret), next eligible time if known, and the persisted checkpoint. Jev may recommend a successor only; governed AgentOS dispatch and LEDGATo approval happen separately.
- Separate role identity, model/provider, harness process, and agent session. Do not equate a role with one persistent CLI process.
- Never serve access tokens, session cookies, chain-of-thought, confidential prompts, file paths, or sensitive personal context in public here.now assets.
- Keep per-user ingress/cookies off a publicly accessible static page. For a real rollout, use an authenticated Workspace-origin backend or equivalent scoped gateway; no static credential storage.
- Owner commands only through existing authenticated governed ingress. The UI's optional `POST /api/omnichat/command` is disabled until server explicitly sets `commands_enabled: true`; treat success only when a durable acceptance receipt is returned.

## Desktop cockpit integration

Companion branch in `tk-ap/agent-os`: `feat/cockpit-runtime-swimlanes-20261027`. Adds `runtime_swim_lanes` as a sanitized read-only field of the **existing** `cockpit.json` projection and draws six stage segments in the existing Quickshell/Omarchy `Panel.qml`. It does not introduce a new panel, daemon, state authority, task dispatcher, or approval route.

The first-stage projection consumes the *already sanitized* `all-up-board.json` and lifecycle evidence, and refuses live claims without a recent canonical heartbeat. Full process-level telemetry still requires producer instrumentation in AgentOS/Herdr. Install and verify on the actual Omarchy host before reporting the desktop surface as live.

## Acceptance gates

1. Visual QA at 1440px desktop, 768px tablet, and 390px mobile; keyboard and reduced-motion QA.
2. Example/demo labels stay visible while no producer is connected; offline input never claims dispatch.
3. Restricted bridge refuses stale, untrusted, cross-origin, or unauthenticated event access.
4. One task can hand off across harnesses while preserving the same canonical task/work lineage and fencing generation.
5. Simulate usage exhaustion, process death, resume from checkpoint, Jev candidate scoring, governed handoff, and duplicate event arrival without false task completion.
6. Host verifier and interactive widget acceptance, plus Python projection tests. No production merge without owner review.
