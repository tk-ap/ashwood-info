# Verified hosting decision — 2026-09-23

## here.now capability (official documentation)

here.now hosts **static files**, provides **server-enforced site access modes** (password, verified-email restricted access, owner-only, and workspace-members-only for workspace-owned sites), **write-only account variables**, and **proxy routes** with server-side variable injection. It does **not** execute custom application code, databases or compute on behalf of the site. Its proxy routes forward to a specified upstream API and are not an application backend.

**Conclusion:** Here.now can protect the entire independent Paper Lab site using `restricted` owner-only or workspace-member access. It cannot independently implement the previously proposed one-time Ashwood SSO ticket receiver with atomic redemption, replay protection and session issuance. That would require an external backend. Do not build or deploy the earlier proposed here.now-native receiver.

For the zero-dollar first release, choose a permanent authenticated here.now site with **restricted owner-only** access (or workspace `account_members` if its membership matches intended access). Keep Ashwood Workspace login separate for now; a Workspace menu link can navigate to the protected here.now site, which will enforce its own identity gate. Do not claim single sign-on. A password-only here.now gate is server-enforced but not equivalent to verified owner identity.

## Kalshi read-only feed

Official Kalshi market-data documentation describes unauthenticated `GET https://external-api.kalshi.com/trade-api/v2/markets?series_ticker=KXBTC15M&status=open`. Here.now can proxy a read-only GET via `.herenow/proxy.json` on an authenticated site if browser-to-Kalshi CORS fails; no secrets are required for public market data. Proxy routes require an authenticated here.now site. Test that the manifest is accepted by checking publish-finalize warnings and that the deployed `/api/kalshi-markets` returns expected JSON.

**Live verification is pending.** The existing PR has not been deployed to a here.now origin; no deployed-origin network request has been observed. A local runtime attempt to reach Kalshi was blocked by DNS/network isolation. Do not label the feed operational until the deployed-origin request succeeds and actual `KXBTC15M` open markets, quotes and countdowns are observed.

## Publication gate

- Provision permanent here.now site under existing authenticated account; configure `restricted` owner-only before adding sensitive data or publishing a private Workspace link.
- Test anonymous direct URL: denied. Test owner verified email: allowed. Test unrelated identity: denied.
- Publish `paper-lab/` including the proxy manifest. Inspect finalize `warnings`; reject disabled/invalid proxy configuration.
- Open on a physical mobile browser, check 390px layout and no horizontal scroll, load actual market rows, refresh, countdown and manual fallback.
- Run Node tests on exact checked-out branch and report the test runner output.
- Keep real trading and wallet connectivity disabled.

Official references: https://here.now/docs ; https://here.now/terms ; https://docs.kalshi.com/getting_started/quick_start_market_data
