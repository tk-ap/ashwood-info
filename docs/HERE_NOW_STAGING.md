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
`tk-ap/ashwood-command-center` commit `0d5a67d47d2533d797388f9976675b67d449a6ba` (existing draft PR #2, reconciled with latest Workspace V2 PR #1).
Build it first with `WORKSPACE_STATIC=1 bun run build`, then create a new artifact:

```sh
node scripts/build-here-now-staging.mjs /tmp/ashwood-here-now-stage \
  --workspace-static /absolute/path/to/.output/public \
  --workspace-source-ref 0d5a67d47d2533d797388f9976675b67d449a6ba
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

Workspace source: `0d5a67d47d2533d797388f9976675b67d449a6ba` (tk-ap/ashwood-command-center PR #2). CI [run 40575138845](https://github.com/tk-ap/ashwood-command-center/actions/runs/40575138845) passed 36 tests, TypeScript and `WORKSPACE_STATIC=1 bun run build`. The staging assembler's full-source/privacy checks and the here.now in-place version-aware publish remain separate. No production deploy is authorized.
