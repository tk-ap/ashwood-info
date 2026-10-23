# Self — Daily Philosophy, Affirmations, and Natal Reflection

Status: implemented on task branch for owner review, not asserted deployed. Source request: 2026-10-20.

## Why this belongs in Self
The existing six-section private Workspace already includes MeOS, current-season Saturn framing, the owner model, and a chart/source-lens disclosure. This addition makes daily practice the first interaction in Self. It is not a new app, tracker, canonical Context store, database, agent, or scheduled notification.

## Doctrine / provenance
Owner-supplied video: https://youtu.be/F4r3TPl0SkM — “4 HOURS SLEEP MEDITATION TO ACTIVATE WEALTH CONSCIOUSNESS,” published by Shinn Manifestation, **inspired by** Florence Scovel Shinn. Draw from its constructive themes: language, expectation, gratitude, visualization, receptivity, releasing scarcity shame, and preparation. These are not Shinn quotations or evidence of supernatural causal mechanisms, proven sleep reprogramming, guaranteed income, or mandatory 21-day cycles.

Interpretive hierarchy: **owner values → reflective philosophy/affirmation → optional chart lens → actual situation and concrete choice → observed result → optional ALVIRA correction**. Never replace real financial conditions or safety needs with “manifestation” rhetoric. Do not frame poverty, hardship, or difficulty as a failure of mindset.

## Current bounded implementation
- Daily orientation rotates deterministically from the browser-local calendar day (seven authored micro-practices) without third-party API, poller, cost, cron, or personal profiling.
- Intention / Reflection is a reversible, accessible on-page toggle. It does **not** fabricate completion or persist journals.
- Chart lens matches only placements **already present** in the existing Self source-lens section: Libra Sun / Scorpio Moon / Cancer Rising. It does not store birth date/time/location in static assets, infer other placements, call it a verified forecast, or calculate transits.
- Morning prompt pairs affirmation with a specific, feasible action; evening asks what actually happened.
- Source link and interpretive limitations appear in the UI. Works when ALVIRA/Brain/Neon is offline.
- Rendering stays in existing `/workspace/#self`. No additional serverless functions, source-of-truth records, or public portfolio content.

## Next owner-reviewed seam (not implemented)
After the private ALVIRA → ASHWOOD Brain review-state and authorization contract is proven, allow optional **owner-approved** personal philosophy excerpts and corrections to replace default prompt copy. ALVIRA remains authoritative for Context; ASHWOOD projects it. Brain reflections may be saved only through the existing reviewed private notes contract, never silently. If the owner requests a current sky / transit comparison, obtain a documented ephemeris with time-zone and calculation provenance, distinguish natal fixed values from current transit positions, show the calculation date, and offer “unavailable” when data are missing. Do not conflate calculated transits with predictions.

## Acceptance
1. Daily prompt remains stable throughout one local day and changes deterministically across calendar days.
2. Only sourced existing natal placements surface. Missing data do not get invented.
3. Intention / Reflection toggle works by keyboard and touch, with visible state.
4. No new persistent storage, third-party tracking, API polling, or automatic publishing.
5. Workspace navigation, Today / Build / Work / Network / Evidence / Self, auth, and existing Self content stay intact.
6. Verify on desktop/mobile and reduced-motion settings in here.now, then independently review, then owner-gated merge and exact-production-SHA check. A branch or PR is **not** live deployment.

## Compatibility with the existing here.now staging PR / shell
The current Self change is based on the merged Workspace shell PR #280, not on the diverged `codex/here-now-staging-integration` branch. The staging artifact builder from that branch is already on canonical `main`. We register `#self-practice` in `workspace/views.mjs` (the router is fail-closed and would otherwise hide the new section), and include both Self assets as required files in `scripts/build-here-now-staging.mjs`. Static output stays a **complete** site and receives the existing read-only synthetic DEMO bootstrap. No separate here.now slug, no second app, no Vercel Preview, and no new credentials or private Context.

Do not claim this is visible on the stable here.now slug until the owner-connected publisher has built this exact branch's full artifact, updated the existing slug, verified source SHA and desktop/mobile route interactions, and recorded the actual provider version in `.agent-os/deployment.yaml`. Sandbox source/version recorded there currently predates #280 and this PR. An old version or a successful Vercel build does not prove here.now publication.

The owner supplied the full 2026-10-19 **Saturn Return Companion — Reverse-Engineering Handoff** directly in this conversation on 2026-10-20. The original Site responded HTTP **401** with **“Log in to access”** and **“Continue with ChatGPT”** on an unauthenticated live check. This is an authentication boundary, not evidence that the source is missing. The full owner handoff governs a **separate, private** faithful reconstruction: access → evidence inventory → source reconciliation → eight audit deliverables → owner approval → rebuild. Do not claim the original Site has been audited beyond its login gate. The eight-document private first-pass audit packet was prepared separately in the conversation and deliberately **not committed to this public repository**. `workspace/SATURN_SOURCE_NOTES.md` is a secondary source for ASHWOOD Self, never proof of original Site UI, routes, wording, or content. No import of the private companion into the public ASHWOOD site.

## Public here.now privacy correction
The complete-site DEMO builder must scrub the owner-specific natal / Human Design / numerology disclosure from the static Workspace HTML before publishing, substituting an unmistakable `DEMO Sun · DEMO Moon · DEMO Rising` profile. New Self reflection code uses generic Sun/Moon/Rising prompts and parses sign names from the existing authenticated profile rather than hardcoding the owner's real signs in the extra public JS asset. The builder fails closed if it cannot find/scrub the disclosure or detects recorded real chart strings in the output. This protects the Self-specific profile surface; broader complete-site sandbox privacy verification remains required before publisher release. This safeguard is not permission to publish the owner’s private Saturn Return Site.

## Agent sign-in status and currently published demo (2026-10-20 check)
The stable `https://mighty-yoga-pgph.here.now/workspace/#self` is reachable without a real account login (HTTP 200). Its published `/staging-manifest.json` says `DEMO_ONLY_NO_PRIVATE_API_OR_RECORDS`, source SHA `678c98ddc59edad14c5644791e3f75fb7700a76b`, generated 2026-10-20T01:50:19.700Z, before this PR. That demo simulates Workspace authentication by intercepting `/api/workspace-auth` and returns entirely synthetic operational data. It is **not** a dedicated authenticated agent user. The October 19 `docs/SANDBOX_SIGNED_IN_WORKSPACE.md` calls separate sandbox principals and read-only sign-in **Phase 2 (not built)**, requiring owner-reviewed synthetic/sanitized data, separate sandbox backend, isolation, and access control.

**Privacy finding:** The currently published public DEMO HTML was observed to contain the owner's real natal signs and related Human Design/numerology copy, copied from source. The new builder scrub is intended to prevent exposing the Self source-lens profile on subsequent complete-site staging builds; it is **not yet published**, and the older sandbox exposure remains until corrected by the authorized here.now owner publisher. Restrict the existing slug or replace the whole artifact after verification; publishing this PR to GitHub/Vercel alone does not update here.now. Additional privacy inspection of all static content/assets remains mandatory.

**Cost-conscious sequencing:** Complete Phase 1's synthetic read-only demo and sanitize static HTML before spending on Phase 2; separate agent login is only needed to test actual sandbox auth and database-backed workflows. Do not bootstrap a parallel auth/product/Neon project merely to let Codex/Claude inspect the non-sensitive demo interface.

## 2026-10-23 — Alignment mirror (draft)
Owner intent: Self is a private reflection and realignment surface. It should eventually show the approved complete Chief Aim, Saturn Return Companion context including astrology and numerology, thoughtful source-linked philosophy from known/new thinkers, helpful affirmations, and gentle prompts relevant to ecosystem work.

Current bounded implementation: first-position state selector with six original interpretive reflection lenses (Watts, Jung, Fromm, Musashi, Lorde, Freire). Each pairs an idea and named work with an affirmation, question, and one achievable next step. These are not verbatim quotations or empirically proven outcome methods. No mood log, database, streaks, tracking, AI API, or extra spending. Existing daily wisdom and chart/numerology source sections remain.

Crucial privacy boundary: the complete personalized Chief Aim is intentionally not embedded in GitHub, static HTML, or a public sandbox. Its UI disclosure explicitly says the protected source has not been connected. A later owner-reviewed ALVIRA Context -> Brain readback must supply an authenticated, versioned Chief Aim and approved private Saturn data. The original private Saturn Return Companion has not been independently inspected beyond its authentication gate; its source notes are secondary. Avoid claiming otherwise.

Future work: source-check original quotes before adding verbatim text, attach work/edition and link, distinguish philosophical interpretation from facts, and curate aligned newer thinkers through a reviewed library rather than auto-asserting authority. Provide optional reset modes for rest/uncertainty/ethical conflict without interpreting low mood as failure. Complete independent privacy review, full DEMO sanitization, existing here.now sandbox publication, desktop and 390px UI checks. Do not merge or deploy based only on this draft branch.
