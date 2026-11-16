# ASHWOOD Workspace consolidation — canonical integration review (2026-11-03)

## Source ownership and scope

- **Canonical application:** `tk-ap/ashwood-info` current `main`; **single implementation branch** `feat/workspace-consolidation-shell-brain-20261103` / PR #310.
- **Visual comparison:** current owner `https://mighty-yoga-pgph.here.now/workspace/`; its published static demo is not the production runtime.
- **Reference only:** `tk-ap/ashwood-command-center`; not a deployment authority, new website, or production dependency.
- **Owner release condition:** user reviews and approves the consolidated design before a separate production merge/deploy. This branch never auto-merges.
- **No database/schema/env/credentials changes and no automatic public or here.now publish.** No production files modified until a separately authorized merge.

## Consolidated visual components

| Surface | Canonical integration | Reality boundary |
|---|---|---|
| Workspace shell | V2-inspired desktop section rail, tablet tabs, existing mobile bottom navigation, same existing hash view ownership, ELITK and theme controls | Existing auth/router and backend are preserved; not a replacement TanStack app |
| Self / Brain | Native interactive conceptual canvas (2,879 point-cloud particles), selectable nodes, linked editorial readings, search/index, keyboard and touch | Source concepts are generic synthetic readings, **not** private user notes/ALVIRA |
| Self / Alignment Mirror | Prior draft #302 component consolidated into current Self; six selectable philosophical lenses; original paraphrases, affirmation, question, grounded next move | Chief Aim is read **only** after owner login from owner-approved production ALVIRA Context; otherwise unavailable, never hardcoded |
| Operator | Two in-shell perspectives, **Building the Team** and **Building the Build**, with responsive cards and an explicit six-stage evidence frame | Read-only from existing `/api/workspace-agentos`; board is a snapshot, not verified harness liveness; no fictional tasks or command authority |
| Operator command thread | Existing governed owner composer, command history and approval/runtime evidence preserved | Actual command/approval behavior remains gated by existing backend |
| Today / Build / Career / Funding / Content / Evidence | Existing production-compatible sections, routes and handlers preserved in same application, accessible via new shell | They are **not pixel-perfect imports** of the separate hosted synthetic pages |
| Physical Works Studio / full hosted Work creative archive | **Not consolidated in this PR**: prototype-only workflow without server persistence | Do not represent session-only draft or fake media as a functioning owner inventory |
| Original Saturn Return Companion / Perspective / personalized audio | **Not consolidated** | Original private source cannot be asserted fully inspected; private Context/Brain integration remains separately gated |

### Repairs made while integrating
- Fixed Funding's signed-out `location.replace('/workspace/')` loop. Its source now waits for the canonical auth event and never drives repeated navigation while locked.
- Fixed Brain's position mapping so its coordinate map is keyed by concept ID, eliminating canvas projection exceptions.
- Removed duplicate mobile top tabs and kept the actual bottom navigation; preserved deep links into the new Self/Operator sections.
- Made Self alignment surfaces use canonical theme tokens instead of white-on-white hardcoded borders.

## Automated evidence

- Node unit tests: use the latest passing `Unit Tests` run attached to PR #310 and verify the exact head SHA before merging.
- Non-deploying Chromium workflow: `.github/workflows/workspace-consolidation-browser.yml` launches a local copy of this exact branch, stubs protected APIs, and checks **signed-out Brain invisibility**, navigation, selectable Self reflection, Operator tabs, owner-command focus, responsive breakpoints, zero JS exceptions and nonblank Brain pixels.
- Screen captures are taken **after scrolling to the actual Brain**, including the canvas itself, and separately capture Operator. Theme runs cover warm-dark and paper-light at 390px/1440px with reduced motion.
- Synthetic intercepted API responses make the browser check repeatable; this does **not** prove server-side authenticated persistence or real AgentOS/ALVIRA data.

## Production release gates (do not bypass)

1. **Independent review:** exact PR head, privacy scan for pre-existing sensitive static owner copy, HTML/CSS accessibility, authenticated API boundary, no stale/no fake telemetry.
2. **Actual protected preview:** Vercel project `ashwood` uses SSO protection on non-custom deployment URLs; however this branch has **no scoped preview `ASHWOOD_DATABASE_URL`**, so an interactive real-owner-session test cannot be claimed. Do not reuse a production DB credential or enable preview login bypass. A protected preview may show the locked state only.
3. **Functional QA:** verify actual owner login/logout, existing protected Career/Funding/Operator routes and persistence without stubs, when a deliberately provisioned nonproduction environment is available.
4. **Visual acceptance:** user checks the consolidated native Self Brain/Alignment + Operator screenshots against the hosted here.now sandbox. Demo content is not the owner's personal Brain.
5. **Release authorization:** explicit owner approval to merge PR #310 to `main` and release to Vercel. Record rollback target; deploy only the tested approved code.

## Not covered by this consolidation / follow-on work

Full app parity with every page of the here.now synthetic prototype, a production Physical Works Studio/catalog, original Saturn Return Companion content, private Brain write API PR #300, real Jev/Herdr automatic dispatch, and audio-first Perspective require separately verified source/runtime and owner approvals. No simulated feature should silently replace a functioning production feature.

**Interpretation:** This branch is one production-compatible **UI consolidation of the prioritized shell, Self, and Operator components**, not proof that the entire hosted demonstration (or private Brain) has been fully migrated. The other existing production sections remain as canonical working sections rather than being overwritten with fictional fixture data.
