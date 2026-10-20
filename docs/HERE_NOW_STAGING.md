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
`tk-ap/ashwood-command-center` commit `76644c0a1b8879bf0bbc7766cfd939108274d977`.
Build it first with `WORKSPACE_STATIC=1 bun run build`, then create a new artifact:

```sh
node scripts/build-here-now-staging.mjs /tmp/ashwood-here-now-stage \
  --workspace-static /absolute/path/to/.output/public \
  --workspace-source-ref 76644c0a1b8879bf0bbc7766cfd939108274d977
```

Publishing remains an explicit separate step. Reconcile the provider version
first, retain stale-base protection, never use `--overwrite`, and verify both
desktop and 390px views before recording a new sandbox version in
`.agent-os/deployment.yaml`.
