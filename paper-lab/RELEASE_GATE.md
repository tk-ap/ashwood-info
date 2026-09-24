# Paper Lab release gate — not yet deployed

## Completed in branch
- Paper-only trade entry, local ledger, export and sizing comparison.
- Read-only Kalshi KXBTC15M discovery through the public markets REST endpoint; no credentials, orders or withdrawals.
- Normalized dollar-string ask fields; no quote shown when ask is missing.
- Tests added for calculation and market parsing/error behavior.

## Required checks before publishing
1. Run `node --test tests/paper-lab-calculations.test.mjs tests/paper-lab-kalshi.test.mjs` from repo root. Tests have not been run in the GitHub-connected environment.
2. Serve `paper-lab/` over HTTP, confirm module loading, CORS/network behavior, open-market data, refresh, timer and manual fallback on mobile. No authenticated orderbook endpoint is used.
3. Verify exact Kalshi KXBTC15M contract rules, fee schedule and actual quote availability. Current fees are entered manually; not fetched or automatically estimated.
4. Review all UI labels: YES/NO correspond to the exact Kalshi market contract; generic UP/DOWN labels may be misleading if the contract rules differ.
5. Provision independent repository and private here.now site, or host behind an existing proven server-side Ashwood authentication boundary. Current static site is NOT access-controlled.
6. Verify anonymous direct-link rejection, expiry, replay and session rotation before linking in Ashwood Workspace.
7. No real orders, financial API credentials, private wallet information or production deployments in this branch.

## Deployment blocker
No here.now authenticated deployment action is currently available to this chat. Do not claim a live version ID or deployment until the authenticated here.now workflow returns a verifiable result.
