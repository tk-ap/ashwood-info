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

The current Workspace source is the demo-only draft at
`tk-ap/ashwood-command-center` commit `135a33c9d2cb7b190a1b80ac36db4399ec74e5c2`.
Build it first with `WORKSPACE_STATIC=1 bun run build`, then create a new artifact:

```sh
node scripts/build-here-now-staging.mjs /tmp/ashwood-here-now-stage \
  --workspace-static /absolute/path/to/.output/public \
  --workspace-source-ref 135a33c9d2cb7b190a1b80ac36db4399ec74e5c2
```

Publishing remains an explicit separate step. Reconcile the provider version
first, retain stale-base protection, never use `--overwrite`, and verify both
desktop and 390px views before recording a new sandbox version in
`.agent-os/deployment.yaml`.

## 2026-10-23 Brain atlas integration (Workspace V2 source PR #1)

The existing Workspace V2 source PR (tk-ap/ashwood-command-center#1) now embeds the conceptual Brain atlas inside the Self route. The atlas reads **existing fictional Self notes** from the already-reviewed demo adapter and adds attributed public philosophical reading references. It neither uses the old private ashwood-info Workspace source nor imports the full owner Brain.

The staging builder remains attached to this same here.now PR (#295) and stable slug; it must receive the **exact pinned source SHA above** from a successful WORKSPACE_STATIC=1 build. Do not substitute an old workspace build, or update the live provider until all source and privacy checks pass. OmniChat remains a separate stacked draft PR in the command-center repository and is not implicitly included by this pin.

The new assembly check requires the Brain section and its disconnected/demo status on /workspace/self/. CI test success and an authorized version-aware here.now publish/readback are separate.
