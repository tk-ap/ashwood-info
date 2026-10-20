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
