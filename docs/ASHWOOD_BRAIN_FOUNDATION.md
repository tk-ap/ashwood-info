# ASHWOOD Brain — private knowledge foundation

Owner decision: 2026-10-15. Status: storage project provisioned; app integration NOT activated.

## Confirmed infrastructure
- Dedicated Neon project: `ASHWOOD Brain`
- Project ID: `lingering-union-27877472`
- Region: `aws-us-east-1`; PostgreSQL 17; database requested: `ashwood_brain`
- Existing `ASHWOOD Dispatch`, career/funding/audition and other canonical stores are unchanged.
- Compute setting: 0.25 CU. Account disallows changing idle suspension; do not attempt to work around provider limits. Usage/billing should be rechecked independently before live onboarding.
- No credentials belong in GitHub, client JavaScript or publicly served `/workspace/` files.

## Product boundary
- Brain is a **private** section in the existing ASHWOOD Workspace, not a new app.
- Public creative site receives only selected, separately approved, sanitized published snapshots.
- ALVIRA Context interprets and links approved facts; it is not replaced with a second context/memory truth store.
- AgentOS manages bounded research/maintenance; LEDGATo governs consequential disclosure and publication, not routine note reading.
- Career, funding, auditions, runtime, approvals and financial records remain at their own authoritative sources. Brain entries may link to their IDs, not copy their state as authoritative.

## Bounded MVP
1. Add workspace navigation to a private Brain view within existing auth.
2. Server-authorized CRUD for Markdown-compatible notes, URLs, tags, links and original source provenance. No public reads; enforce ownership server-side on every request, not via hidden UI alone.
3. Search title/body and backlinks with plain PostgreSQL text indexes first. No embeddings or auto-ingest by default.
4. Quick-capture from manually submitted URL/text; retain source link, timestamp and explicit user input; AI summaries only when requested and reviewed.
5. Markdown export and restore test independent of Neon, including links and metadata.
6. Add optional cross-links to canonical existing records, with access checks per source; never duplicate operational truth.

## Security / cost acceptance
- No client-visible database connection string or credentials.
- Read tests for signed-out/other-user/private vs explicit published states; public site has no endpoint to raw Brain data.
- Publish as an explicit reviewed copy; original private note and backlinks remain private.
- No full-table polling, unbounded transcription, automatic embeddings, bulk scraping, hidden ingestion, or scheduled background calls.
- Query budgets, pagination and reasonable response-size limits; observe and remediate ASHWOOD Dispatch's historical excessive transfer separately.
- Verify dev schema/permissions and deployment before claiming live functionality; keep project export and restore independent.
- Track actual Neon transfer, compute and storage; verify allowance before expanding usage.

## Next step and stopping condition
Inspect the existing Workspace auth, serverless routes and database integration conventions. Implement one authenticated private note: create → fetch → search → export, with denied anonymous read verified and cost instrumentation. Stop at that proof before adding advanced graph/AI features.
