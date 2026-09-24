# Paper Lab prototype

Static, mobile-first **paper trading only**. No real-money execution, no sign-in, no server-side protection.

## Scope

The lab should treat these as separate potential interfaces/sources in the research flow:

- **Kalshi** — prediction-market observation and paper simulation only at this stage.
- **Coinbase / Coinbase Wallet (Base app)** — observe available crypto/cash balances, transfer paths, fees, and settlement timing. No credentials stored in the client and no automatic trades or withdrawals.
- **Cash App** — observe BTC/cash transfer paths, fees, and settlement timing. No credentials stored in the client and no automatic trades or withdrawals.

The product should make the distinction between **market venue**, **funding/cash-out interface**, and **analysis source** explicit. Coinbase and Cash App are in scope as interfaces, not evidence that any specific trading strategy is profitable.

Manually record hypothetical BTC 15-minute positions and settle them as wins/losses. Uses browser localStorage, which is device/browser specific and may be cleared. Export JSON regularly. Starting balance $400. Price and fees are entered manually; break-even = total cost / number of contracts.

This is a prototype on a dedicated branch of Ashwood until a separate repository and protected permanent site are provisioned. **Do not publish this folder as a private application without server-enforced access.**

## Test
Serve this directory using any local static HTTP server, open it in a browser, create a paper trade, settle it, export JSON, and reset. No dependencies.
