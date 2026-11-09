# Private Brain API — consolidated mainline release plan

**Status: review-only; not deployed or imported.** This branch consolidates
ASHWOOD #273 (private Brain API) and #287 (idempotent source imports) on the
canonical current `main`. It does not supersede #277's privacy directive.

## Contract
- `GET /api/workspace-brain`: list/search, `?id=`: read, `?action=export&id=`: Markdown export.
- `POST /api/workspace-brain`: owner-session-only same-origin create.
- Reuse `/api/workspace-auth?view=brain` to stay below the Hobby 12-function budget.
- Session verification uses existing **ASHWOOD Dispatch** and fails closed.
- Brain notes use the **separate** `ASHWOOD_BRAIN_DATABASE_URL`, never Dispatch's URL.
- Identifiers, source keys and URLs are validated; owner key always server-assigned.
- Source-key repeat imports do not overwrite owner changes or duplicate notes.
- Never commit raw Context or approved private note bodies.

## Required manual release gates
1. Human-review this PR and rerun the full test suite on current main.
2. Confirm Workspace authentication is healthy on canonical Dispatch. Do not
   recover it by repointing production sessions to the Brain project.
3. Run `migrations/20261021_brain_source_keys.sql` **explicitly** on the verified
   Neon project `lingering-union-27877472`, database `ashwood_brain`, once reviewed.
   Web/API runtime must never perform DDL.
4. Add **server-only** `ASHWOOD_BRAIN_DATABASE_URL` on intended production runtime
   after verifying a restricted database role. Never log its value or place it in public assets.
5. Validate signed-in, signed-out, cross-origin and duplicate requests in an authorized
   real environment. Review the here.now sandbox; Vercel Preview is not the ASHWOOD sandbox.
6. Only after owner-gated release, submit the one already-approved private note through
   the existing authenticated API, never with direct SQL; verify create, list, search,
   read, exact Markdown export and independently observed persisted body hash.
7. Verify source-key idempotence, owner-edited note preservation and no changes to
   ALVIRA Context, Career, Funding, Auditions or AgentOS canonical data.

Source-specific owner approval (2026-10-21) covers only the note titled
`How I evaluate AI collaboration` and no other note. Approved payload remains private,
outside GitHub. The original Herdr/agent-export provenance is **not independently verified**.
