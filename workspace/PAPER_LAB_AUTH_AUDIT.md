# Paper Lab authentication audit — 2026-09-23

## Verified current source (main)
- `api/workspace-auth.mjs`: owner passphrase login, logout, rotation and 30-day session issuance.
- `api/_workspace.mjs`: 32-byte random opaque session, only SHA-256 hash stored in Neon `workspace_sessions`. Cookie `ashwood_workspace_session` is HttpOnly, Secure, SameSite=Strict, Path=/ and host-only (no Domain attribute). `requireSession` checks database expiry on each authenticated request. `sameOrigin` rejects foreign-origin POSTs.
- `workspace/ACCESS.md` documents production Vercel Workspace; this does not prove that the separate here.now sandbox deploy has equivalent server-side auth.
- `tests/workspace-auth.test.mjs` exercises rotation and invalid sessions against PGlite, not cross-origin authentication.

## Conclusion
The existing cookie **cannot be shared directly** with a separate here.now hostname. Never copy the long-lived cookie, owner passphrase, bootstrap token or database credentials into the Paper Lab client, query string, or static deployment. A client-side token check would not protect a static here.now site. Merely linking from an authenticated Workspace is not access control.

## $0 implementation gate
1. Verify the currently deployed here.now Ashwood sandbox and its Workspace route separately from the repository's Vercel implementation.
2. Confirm whether the selected here.now permanent Paper Lab site has server-enforced private access, and whether it offers any verifiable identity handoff. If not, require separate server-enforced access for the independent site, or host the private app under Ashwood's existing authenticated origin using a real backend.
3. If seamless SSO is essential, design a backend-to-backend short-lived single-use exchange: authenticated Ashwood POST issues random one-time ticket stored hashed with audience, expiry and consumed timestamp; Paper Lab trusted backend redeems it atomically and creates its own secure host-only session. This **requires** a trusted backend on both sides; do not implement on static here.now alone.
4. Test direct anonymous access, expiry, replay, foreign origin, logout/rotation revocation, cross-domain browser behavior and deployed route parity before rollout.

## Independent Paper Lab
Separate repo and static mobile-first paper-trading UI. Browser IndexedDB ledger with explicit export/import; no real orders, Kalshi credentials or funds. Do not represent a locally stored ledger as securely private if the public site can load. Add Workspace quick-menu link only after site and access gate are tested.

## Release boundary
Audit only in this PR. No auth or production behavior changes; no deploy. Track implementation in issue #174.
