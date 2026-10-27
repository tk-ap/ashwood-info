# Rule pack: tk-ap/ashwood-info

Owner decisions the reviewer applies in addition to the repository's own `AGENTS.md`. Each is a policy finding when a PR breaks it.

1. **Merging to `main` is a production deploy** (Vercel deploys `main`). A PR aimed at `main` must contain only changes meant for production.
2. **The Lovable / Workspace V2 UI is sandbox-only** until the owner explicitly says ship. Workspace redesign or Lovable-derived UI work belongs on the here.now sandbox, not in a PR that will merge to `main`.
3. **Vercel Hobby function budget is full (12 of 12).** A new top-level `api/*.mjs` or `api/*.js` file that is not prefixed with `_` adds a function and is a blocker; new endpoints must be rewrites onto an existing function in `vercel.json`.
4. **Public route changes need owner agreement.** Retiring, redirecting, or merging a public page is in scope only when the PR states it; anything retired that the PR does not name is a scope finding.
5. **Records must match what ships.** `.agent-os/deployment.yaml` pins and any generated manifest must name the commit actually built.
6. **Career Ops backend and job-search feed are canonical** and must not change without the owner.
7. **Brain imports** go only through the authenticated Brain API, one owner-approved note at a time; no bulk import or direct SQL.
8. **The here.now sandbox** is the stable slug in `.agent-os/deployment.yaml`; publishes pass a base version and never `--overwrite`. No private data in sandbox artifacts.
