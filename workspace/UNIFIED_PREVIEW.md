# Unified ASHWOOD preview contract

Public branch: ops/herenow-gravity-sandbox (existing here.now site mighty-yoga-pgph).
Protected feature branch: feat/workspace-integrated-preview-ops, based on main. Do not merge the diverged 119-commit public sandbox branch into main wholesale. Reconcile the six newer main commits first.

## Two surfaces, one release batch
- /workspace-preview/ on the existing here.now site is **design-only**, without private files, credentials, personal data, live status or authenticated APIs. It links to the existing real private Workspace on Vercel.
- /workspace/ in the feature branch adds a live Ops Pulse composed from already authenticated Workspace board and command endpoints and clearly labeled static environment projection. It is NOT published by the here.now static publisher.
- Vercel preview builds from the protected feature branch are required for auth/session/API testing before merge; avoid extra production deployments.
- Promote only after review of visual parity, desktop/mobile navigation, degraded API behavior, backend session scope and independent governance boundaries.
- Freeze a reviewed source SHA, reconcile both PR and public branch against current main, then batch a single production release; the here.now pipeline remains owned-update only, not a new site.

## Operational semantics
- Board rows from /api/workspace-board are a synced projection, not proof that a host is online.
- Commands from /api/workspace-state?view=commands are owner intent; queued is not execution.
- /data/sandbox-environments.json is a dated static projection and must not be presented as current provider state.
- Existing AgentOS, ledgato, canonical state, auth, reviewer independence and approvals are unchanged.
- Missing responses are shown as unavailable, never as zero, done, or healthy.
- No public static copy of private Workspace internals. Only workspace-preview/ is allowlisted by the here.now publisher.

## First integrated acceptance
1. Node unit tests of Pulse classification and fail-closed semantics pass.
2. Here.now preview is publicly reachable and includes an explicit "design-only" banner.
3. Vercel feature preview must show protected Pulse after login and protect it when logged out.
4. Production deployment remains a separate owner-reviewed batch; neither here.now preview nor CI success is production approval.
