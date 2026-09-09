# Returning to the ASHWOOD workspace

Open https://ashwood-info.vercel.app/workspace/ directly, or use **Workspace** in the homepage's bottom navigation after this change is released. Bookmark the permanent production URL rather than a preview deployment.

Use the passphrase chosen during initial setup. The one-time setup token is not used again. A session lasts up to 30 days in the same browser; a different browser, cleared cookies, or an expired session requires the passphrase again. **Lock workspace** ends the current session through the existing logout endpoint.

The entrance is discoverable; access to private state still requires server authentication. Search indexing remains disabled for the workspace.

## Changing the passphrase

**Change passphrase** in the workspace header rotates it from inside an authenticated session. It asks only for the new passphrase, not the current one — the case it exists for is a passphrase you no longer remember but a session that is still valid, and requiring the forgotten value would leave direct database access as the only way out. The live session cookie already authorizes every private read and write here, so it is the proof of ownership the rotation accepts.

Rotating ends every other signed-in browser and keeps the one that performed it. That is also the alarm: a rotation you did not perform shows up as an unexpected sign-out everywhere else.

There is still no recovery from a **forgotten passphrase with no valid session anywhere** — a different browser, cleared cookies, or a session past its 30 days. Recovering from that requires updating `workspace_auth` directly in the database. Rotate before the session lapses, not after.

## Visual overview

- Goal cards count dated evidence over 30 UTC calendar days, including today. Their long bars compare evidence volume between goals; small bars show daily distribution. Neither is goal completion.
- Connections show source-to-goal mappings for the same period. Secondary mappings can connect one item to several goals; an item is counted only once per goal. Inferred mappings remain inspectable in the evidence ledger.
- Activity shows the last 14 UTC calendar days. Select a goal to filter activity and open its evidence. Use **All goals** in the ledger to reset.
- Undated, invalid, old, and future-dated items do not populate the new visualizations. Missing evidence does not establish lack of real-world progress.
- Goal descriptions, success signals, project details, evidence, and attention notes remain available as expandable sections.

## Verification for this change

- JavaScript syntax checks and `node --test tests/workspace-overview.test.mjs` passed.
- Connected-browser visual inspection at 1440×900 and 390×844 using a localhost-only test server with visibly labeled fictional evidence.
- Verified a connection goal opens its filtered ledger, mobile connection labels and counts remain readable, Cancel closes the form without saving, and Lock returns to the passphrase gate with background controls inert.
- The fixture server and its sample evidence are outside the repository and are not deployed.
- Production persistence, real passphrase entry, and production release were not exercised. Existing API handlers and database schema are unchanged. Human visual acceptance and production merge remain pending.
