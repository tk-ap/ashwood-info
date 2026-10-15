# Private Brain API staging

This branch adds `GET /api/workspace-brain` (list/search), `GET ?id=...` (read), `GET ?action=export&id=...` (Markdown download), and `POST /api/workspace-brain` (create).

Every route requires the existing server-verified ASHWOOD owner session. Owner keys are server-owned, all SQL selects are owner-scoped, writes require same-origin and there is no public anonymous fallback. Existing Workspace auth still requires its own database, so this API is **not a replacement for the down Workspace**; an isolated preview can be used only after separately verified session availability. Do not claim standalone authenticated preview access until proven.

Deployment requires server-only `ASHWOOD_BRAIN_DATABASE_URL` in Vercel, restricted to this new Neon project's role/database. It must never be exposed with `NEXT_PUBLIC_`, `VITE_` or any client bundle. The connection string was deliberately not fetched or committed.

The new Neon schema `brain.notes` already exists with full-text index and row-level security enabled. Its owner role is privileged; application-scope and auth enforcement are critical. This first endpoint offers create/search/read/export only, no sharing, graph auto-traversal, publishing, deletion, or mutable link endpoints.

Tests: `node --test tests/workspace-brain.test.mjs`. Tests check anonymous denial, origin rejection, invalid identifier and fail-closed missing database. **A passing unit test is not a live session or cross-user security proof.** Before deployment, verify:
- production and preview session/auth boundary works, including outage handling;
- read and export of private notes cannot be accessed without the owner session;
- no credentials in frontend source;
- original ASHWOOD Dispatch records and environment bindings unchanged;
- integration smoke create → retrieve → search → export on an authorized environment;
- query costs and independent Markdown recovery.
