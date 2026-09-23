# Paper Lab prototype

Static, mobile-first **paper trading only**. No Kalshi API integration, no real-money execution, no sign-in, no server-side protection. Manually record hypothetical BTC 15-minute positions and settle them as wins/losses. Uses browser localStorage, which is device/browser specific and may be cleared. Export JSON regularly. Starting balance $400. Price and fees are entered manually; break-even = total cost / number of contracts. This is a prototype on a dedicated branch of Ashwood until a separate repository and protected permanent site are provisioned. **Do not publish this folder as a private application without server-enforced access.**

## Test
Serve this directory using any local static HTTP server, open it in a browser, create a paper trade, settle it, export JSON, and reset. No dependencies.
