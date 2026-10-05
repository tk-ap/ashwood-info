# Canonical desktop recommendation projection

`GET /api/workspace-career?view=recommendations` requires the existing Workspace session.
It returns `ashwood-canonical-recommendations`, schema version 1. It runs the same Career
loader, qualification/eligibility/fit/practicality gates, deduplication, tracked-application
exclusion, declined-record exclusion and `rankOpportunityQueues` as the Career screen.
It exports the ordered recommended queue before the screen's page rotation. No scoring
model is changed. The desktop may select an ordered two-record window; it may not rank it.

Only whitelisted display fields leave ASHWOOD. The result contains no résumé, posting
body, profile toggles, application materials/PII, legal documents, cookies or credentials.
Source observations older than six hours produce no job recommendations. The contract
expires after six hours, even when a client keeps a local copy. No public cache is used.
Canonical links preserve source + opportunity identity and open the existing Career Ops
card (or its already-tracked application) with its normal posting/material/application flow.

## Funding gate

This branch depends on the unified canonical Funding Registry work in PR #246.
`projectFunding` consumes `workspace/funding/model.mjs`'s already-ranked evaluations;
it preserves order and includes only fresh APPLY/CONSULT records whose action lifecycle
still supports acting. It does not evaluate a second model. It excludes submitted,
completed, declined, ruled-out and stale records. The same registry record ID opens the
existing Funding view; no cockpit list is stored.

**The endpoint deliberately returns an empty Funding list with
`UNAVAILABLE_CANONICAL_OWNER_STATE`.** The Funding profile and saved action state are
currently private browser localStorage. They are unavailable to a server producer.
Even verified public program criteria cannot establish the owner's current eligibility
or whether an action was already completed/dismissed in that browser. Exporting the
static program seeds as recurrent desktop recommendations would misrepresent that state.

The remaining architectural decision is where the *same* canonical private Funding
profile/action state will persist for authenticated producer access. Any approved
migration must preserve the local keys/history, avoid divergent browser/server truth,
and keep private facts out of this contract. This PR does not invent that migration.
Funding Radar maintenance and its first unattended evidence-backed refresh also remain
unproven until the registry PR and its recurring process are activated and observed.

## Consumer boundary

AgentOS uses a separate bounded sync process to authenticate, fetch this endpoint and
write only the sanitized contract to `/var/lib/agent-os-cockpit/recommendations.json`.
Its existing projection incorporates the result in `cockpit.json`. Omarchy gets neither
Workspace authentication nor raw Career/Funding state. Sync is read-only with respect to
applications, financing and opportunity action state.

## Verification

`node --test tests/desktop-recommendations.test.mjs` exercises the canonical Career and
Funding models, ordering, duplicate/exclusion gates, source freshness, private-field
omission and canonical record URLs. The full suite passed (217 tests) in the author
environment. Production authentication, desktop/mobile click-through, live Omarchy,
and an unattended Funding Radar pass are not yet verified.

Concurrent work: PR #137 also touches `career-ops.mjs`; keep its Gmail sync lineage and
review these small navigation additions when integrating. PR #197 and stale PR #203
touch the Funding redirect; preserve the unified `/workspace/#funding` architecture
and query identity rather than replacing this with another Funding destination.
