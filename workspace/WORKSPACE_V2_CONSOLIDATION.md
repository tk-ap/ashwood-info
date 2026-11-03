# Native Workspace V2 consolidation — Self/Brain and shell (2026-11-03)

## What this branch does

Port the **visual pattern** of the hosted ASHWOOD Workspace Self Brain into the canonical `tk-ap/ashwood-info` **main-based** application. It is an adaptation of the earlier native ASHWOOD Brain implementation in closed PR #304, informed by the interactive conceptual Brain at `https://mighty-yoga-pgph.here.now/workspace/self/` and by the separate V2 design reference. **It does not replace the Vercel app with the Command Center repository.**

- One native `#brain-explorer` section inside the established `#self` view.
- Preserves the existing section router, `#career`, `#content`, owner auth, sign-out, commands and evidence workflows.
- Procedural canvas (2,879 particles), pointer selection/rotation, keyboard arrows, concept index, source-linked editorial readings; no external graph library or iframe.
- Strong synthetic-demo labeling and **no real owner notes**; Brain only mounts after the existing authenticated session signals success; locked state remains locked.
- One adaptive, V2-inspired navigation *presentation layer*: desktop section rail at wide viewports, horizontal top navigation on tablets, and the existing mobile navigation. All underlying hash routes/handlers are unchanged.
- Independent static tests. No database modification, credentials, external fetch, serverless function, private note import, or production deployment.

## Review vs the hosted Self page

This is the **first production-compatible visual slice**, not a pixel-perfect copy of the entire TanStack V2 app. The source concepts are intentionally generic public-domain readings rather than the hosted fictional notes. The creative direction and interaction model are ported; compare desktop, 390px, keyboard, scrolling and themes before approving visual parity.

The hosted page currently uses synthetic data and says the real Brain is disconnected. This branch keeps the same honesty. It does **not** promise live ALVIRA Context, persistent Brain notes, the original Saturn Return Companion, the new Perspective page, or agent dispatch. Those are separate functional releases.

## Required acceptance gates

1. Full `npm test` and independent code/privacy review on the exact PR SHA.
2. Review a protected production-compatible preview or a private local build against current `main`; existing branch deploy rules may skip automatic Vercel previews. Never force a production deployment to get screenshots.
3. Verify that the existing auth lock, login, sign-out, Career, Funding, Operator, Content, Evidence, Today and Self continue to work.
4. Visual QA at 390px, tablet and desktop; inspect themes, reduced motion, navigation, keyboard and hover/click behavior.
5. Review no private author material added to static assets and no additional server/database permissions.
6. Owner approves **separately** before merging to `main` or deploying Vercel production; keep last known-good deployment for rollback.

## Non-destructive next slices

- Apply the broader V2 shell in small reviewed increments rather than wholesale replacement, with proof that existing features remain.
- Review and port desired Self alignment components (existing draft #302) only after this first slice passes, rather than merging its old parent.
- Treat private Brain API PR #300 and ALVIRA Context data binding as a separately gated backend integration. The static graph is not proof of a persisted note.
