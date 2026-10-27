# here.now staging artifact

The stable `mighty-yoga-pgph` URL is a public, static staging surface for the
current ASHWOOD public site. It is not Vercel production and must never read
from production APIs, Neon, AgentOS, ALVIRA, LEDGATo, Career Ops, or any private
Workspace file.

`scripts/build-here-now-staging.mjs` copies only public ASHWOOD files from the
checked-out branch, excludes all existing Workspace/runtime directories, then
replaces `/workspace/` with a separately reviewed static Workspace build. The
builder refuses an existing output directory, source files outside `/tmp`,
private/runtime paths, known prior fixture identifiers, and credential-like
content. It writes a non-secret `staging-manifest.json` describing both source
commits.

The current Workspace source for the next static build is the validated, demo-only OmniChat integration at
`tk-ap/ashwood-command-center` commit `6f1fdd9fad47420170766d1af1424bdbbce1a03b` (existing draft PR #2, reconciled with latest Workspace V2 PR #1).
Build it first with `WORKSPACE_STATIC=1 bun run build`, then create a new artifact:

```sh
node scripts/build-here-now-staging.mjs /tmp/ashwood-here-now-stage \
  --workspace-static /absolute/path/to/.output/public \
  --workspace-source-ref 6f1fdd9fad47420170766d1af1424bdbbce1a03b
```

Publishing remains an explicit separate step. Reconcile the provider version
first, retain stale-base protection, never use `--overwrite`, and verify both
desktop and 390px views before recording a new sandbox version in
`.agent-os/deployment.yaml`.

## 2026-10-23 Brain atlas integration (Workspace V2 source PR #1)

The existing Workspace V2 source PR (tk-ap/ashwood-command-center#1) now embeds the conceptual Brain atlas inside the Self route. The atlas reads **existing fictional Self notes** from the already-reviewed demo adapter and adds attributed public philosophical reading references. It neither uses the old private ashwood-info Workspace source nor imports the full owner Brain.

The staging builder remains attached to this same here.now PR (#295) and stable slug; it must receive the **exact pinned source SHA above** from a successful WORKSPACE_STATIC=1 build. Do not substitute an old workspace build, or update the live provider until all source and privacy checks pass. OmniChat has been reconciled onto the latest Workspace V2 tree in the existing stacked PR #2 and is **included** by this updated, immutable source pin. The existing Operator route and command-history disclosure are preserved.

The new assembly check requires the Brain section and its disconnected/demo status on /workspace/self/. CI test success and an authorized version-aware here.now publish/readback are separate.

## 2026-10-23 — second design reference evaluation

Reviewed the external public Command Center snapshot at https://queued-bridge-fxm7.here.now/ for interaction/product patterns only. **Do not republish, clone or ingest its personal statements or internal operating data.** Useful patterns now adapted in existing Workspace V2 Self Brain are: separate demo note links from editorial reading associations, draw them differently, show concise per-connection provenance, include counterpoints instead of uncritical agreement, and reserve promotion of personal principles to the owner. The snapshot is not a canonical or authenticated ALVIRA source.

All changes remain on the existing Workspace source PR #1 and this existing staging PR #295. The pinned SHA must be built and tested before an authorized here.now in-place update; there is no implied live publish.

## 2026-10-26 — rebuilt catalog and Studio source

Workspace PR #1 source is pinned above after 31 tests, TypeScript checks and all eight static routes passed. Public-source tests: 264 passed. The Studio importer and source-reading tests were corrected without relaxing privacy or approval boundaries. Real owner records remain excluded from the static demo. The public gallery has 21 entries and 13 prepared print surfaces, including the two-sided 22 × 30-inch sheet.

Publication is pending access to the existing owner here.now connection. No new provider version or successful live readback is claimed. Preserve the existing slug and reconcile currentVersionId immediately before any update. Production remains untouched.

Local browser review: desktop 1363px and 390px iframe (375px client area), zero horizontal overflow. Gallery has 21 cards; side controls update image, description and print dimensions. Studio starts empty, adding a reverse preserves one original with two surfaces. All verification is local; hosted readback is still pending.

## 2026-10-27 — OmniChat inheritance into Operator

The existing Workspace V2 /operator route now houses the unified OmniChat composer, sample sessions, responsive runtime swim lanes, event timeline, capacity/exhaustion markers, per-agent receipts, and an explicit unavailable live-mode state. The UI inherits ASHWOOD theme tokens (warm-dark, paper-light, Tokyo Night, phosphor) and existing navigation; no second app or tab. The original Operator controls stay available in a disclosure. **All displayed agent activity is fictional demo data; the static here.now sandbox has no authenticated AgentOS/Herdr/LEDGATo connection.**

Workspace source: `6f1fdd9fad47420170766d1af1424bdbbce1a03b` (tk-ap/ashwood-command-center PR #2). CI [run 40575138845](https://github.com/tk-ap/ashwood-command-center/actions/runs/40575138845) passed 36 tests, TypeScript and `WORKSPACE_STATIC=1 bun run build`. The staging assembler's full-source/privacy checks and the here.now in-place version-aware publish remain separate. No production deploy is authorized.


## 2026-10-27 — Live Operator requirement and safety hold

User explicitly rejected a static Operator/swim-lane simulation as a usable release. **Do not promote an inert sample view to the stable sandbox as if it were live.** The source pin above includes a real-data-first `OmniChatLive` view and a collapsed, expressly fictional layout study. Validated on the existing Workspace branch with:

- [React + TypeScript + tests](https://github.com/tk-ap/ashwood-command-center/actions/runs/40580751888) — pass.
- [Full public ASHWOOD + Workspace assembly](https://github.com/tk-ap/ashwood-command-center/actions/runs/40580751887) — pass, with an intentionally skipped publish absent provider ownership/version lease.
- Private authenticated read: existing `/api/workspace-auth`, `/api/workspace-agentos`, `/api/workspace-state?view=commands`; existing governed `submit_command` ingress. Public static here.now has none of these backend routes, so the UI **must** show disconnected there until a secure owner-authenticated bridge is verified. Do not embed bearer keys or Neon connection strings in JS or use a public here.now proxy that shares owner secrets with all visitors.
- Latest observed database mirror evidence (read-only, 2026-10-27): 313 rows, latest observed 2026-10-27 19:59:12Z; zero `recent_events.kind=heartbeat` projected. Full per-harness lifecycle emitter, durable exhaustion evidence, Jev handoff receipts, attempt/fencing and independent tests remain in `tk-ap/agent-os#451`.
- Existing canonical provider site version must be read from authenticated here.now API using owner key; checked with optimistic concurrency before changing `mighty-yoga-pgph`. Owner connection is unavailable in ChatGPT/GitHub Actions; do not overwrite or anonymously republish.

**Release gate**: (1) authenticated private telemetry and ingress work over the **actual stable here.now origin** without public access to owner data, (2) real worker session receipt wakes/check-ins/heartbeats/handoffs reach UI, (3) stale/unobserved are correctly labeled, (4) end-to-end command-to-attributed response/trace proven, (5) safe in-place version-aware publish and mobile/desktop route regression review. Static build passing does not meet these gates.


## 2026-10-27 — Jev/Herdr audit and corrected here.now deployment handoff

- Source pin above now includes the **routing, approval, and Herdr pane receipt viewer** in the Operator command thread. It displays actual AgentOS-synced receipts only, otherwise unrecorded. Companion source contract: `tk-ap/ashwood-command-center/docs/OMNICHAT_JEV_HERDR_PROTOCOL.md`.
- [Full source tests, TypeScript and static build passed](https://github.com/tk-ap/ashwood-command-center/actions/runs/40585547947); [full assembled ASHWOOD review artifact passed](https://github.com/tk-ap/ashwood-command-center/actions/runs/40585547901). No here.now publishing occurred in either run.
- Root deployment error fixed at private source `.github/workflows/ashwood-omnichat-staging.yml`: the here.now publisher **does not support** the `--base-version-id` flag. It loads optimistic concurrency from `.herenow/state.json`, keyed to the **absolute artifact directory**; workflow now explicitly reads owner-authenticated `currentVersionId`, checks it against the expected lease, writes proper state, then invokes `publish.sh ... --slug mighty-yoga-pgph` from the correct directory. Anonymous separate-site publishing is disabled.
- Existing owner connection reference `owner:provider:here-now` lives in AgentOS/deployment topology; it is **not** a credential available in the ChatGPT tool session or current private Workspace GitHub Actions repo. Do not confuse provider ownership with tool session permissions. No owner key or provider session was obtained by this build. Stable site remains unchanged until the connection is used from its actual authorized host, after the secure bridge and live Jev/Herdr end-to-end proof.
- The owner explicitly requires chat → Jev candidate → AgentOS/LEDGATo policy and approval receipt → verified existing Herdr pane handoff, with actual wake/check-in/out/heartbeat swim lanes. Static design demos are not acceptable as the primary release. AgentOS #427 and #451 track the host emitter/dispatcher. No fake liveness or completion claims.


## Owner-authenticated provider preflight (2026-10-27, after receipt UI CI)

Authoritative read-only here.now owner API check, [run 40586394913](https://github.com/tk-ap/ashwood-info/actions/runs/40586394913): `tk-ap/ashwood-info` Actions has a working `HERENOW_API_KEY`; actual `mighty-yoga-pgph` currentVersionId is **`01M5TC4FWHBHRRK8HMKEND93GN`**, source `publish-finalize`. No mutation. The version in `.agent-os/deployment.yaml` is **older**. Do NOT republish using that stale value or force an overwrite.

The historical publisher and key are in **ASHWOOD's** `ops/herenow-gravity-sandbox` Action. The new compiled Workspace code is in private `tk-ap/ashwood-command-center`. [Read-only permission probe 40586573685](https://github.com/tk-ap/ashwood-info/actions/runs/40586573685) proves ASHWOOD's Actions `GITHUB_TOKEN` cannot read that private repo (HTTP 404). This is why a CI job that has the provider key currently cannot also build the new complete Workspace; the separate private repo job has the inverse permissions. Do not use the old Gravity publisher on its old source: that would regress ASHWOOD.

Validated audited source in private Workspace PR #2 shows Jev/AgentOS/LEDGATo/Herdr decision and pane receipt fields only when actually persisted by the backend. This is **not** yet Jev runtime dispatch. The owner requires actual Jev→eligible existing Herdr pane delivery and real wake/check-in/check-out receipts with heartbeat, governed approval logs, and durable exhaustion A2A handoff before a dynamic Operator release. See [AgentOS #427](https://github.com/tk-ap/agent-os/issues/427), [#451](https://github.com/tk-ap/agent-os/issues/451) and `tk-ap/ashwood-command-center/docs/OMNICHAT_JEV_HERDR_PROTOCOL.md`. Do not label a task phase as a live harness.
