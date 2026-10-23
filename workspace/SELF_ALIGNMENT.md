# ASHWOOD Self — Alignment Mirror (October 23, 2026)

## Status
Draft implementation based on the **current** main after its deliberate revert of Workspace shell PR #280 by PR #291. Do **not** merge the older Self PR #288 wholesale: that branch contains the reverted shell and incompatible sandbox builder. This branch is an independent port of the small Self component only.

No merge, here.now publish, or production deployment is represented by this commit.

## Owner intent
Self is the private inner compass, not a productivity scorecard or an extra app. It should help the owner reconnect with a personally authored Chief Aim, philosophical thinking, values, creative expression, practical agency, and existing Saturn Return Companion lenses (astrology, numerology, philosophy, season, and interpretation).

## Implemented — public-source-safe portion
- One editorial, mobile-responsive 'What do you need to remember?' surface as the first element of the existing Self view.
- Six intentional choices: overwhelmed, self-doubt, wealth/values, unable to begin, creative distance, and seeking purpose.
- Each shows an original interpretation, named thinker and work, affirmation, a question, and a bounded next action.
- Thinkers: Alan Watts, Carl Jung, Erich Fromm, Miyamoto Musashi, Audre Lorde, and Paulo Freire. These are **original paraphrases**, not verified direct quotations.
- Existing Self sections preserved: Saturn season, decision compass, chart/numerology source lenses, operating model, and check-in.
- Zero external API requests, telemetry, mood tracking, saved reflections, new database, automation, payment, or background jobs.

## Deliberately NOT implemented
- The owner's **full Chief Aim** is sensitive private authored context. The static view contains no hardcoded statement. The current read implementation listens for confirmed Workspace sign-in, then requests the existing session-protected `/api/workspace-context` endpoint and projects only a record with `source=alvira`, `environment=production`, exact `topic=My Definite Chief Aim`, and `goal_spec.fields.goal.basis=owner`. Missing or unauthorized data remain explicitly unavailable. The only supported edit path is the existing owner-reviewed ALVIRA Context/Brain release; there is no independent editor or datastore in Self. Public here.now DEMO mode must not perform this read.
- The private Saturn Return Companion is access-gated. Existing SATURN_SOURCE_NOTES.md are owner-supplied *secondary* source notes, not proof of inspecting its current private routes, readings, or designs. Do not invent additional natal placements, numerological cycles, or transits.
- Direct quotations, new aligned-thinker recommendations, and alignment scoring need source verification and owner review before surfacing as authored quotes or conclusions.
- No claim that affirmations or astrology can guarantee income, predict events, or treat depression.

## Privacy and deployment blockers
- Existing main still contains some owner-specific interpretive profile copy in static Workspace HTML, pre-dating this branch. A protected view's login alone does not eliminate exposure through source or a public static demo. Do not take this branch's narrow privacy guard as full-site sanitization.
- The previous public here.now demo was documented as older than the draft PR and not comprehensively privacy-audited. It has not been inspected live in this task. Do not republish the reverted complete-site builder or claim a new version.
- Current browser inspection cannot access deployed sites from this session; use an authorized browser/publisher to verify actual 390px/desktop presentation, real asset loading, Self route ownership, no hidden section leakage, no private data exposure, and provider version readback before publishing.
- Follow normal independent review and owner-controlled merge/publish gates.

## Private source integration acceptance contract (later phase)
1. Review/correct the full Chief Aim in the existing private ALVIRA Context or Brain system of record and release it as the exact owner-approved `My Definite Chief Aim` production goal-spec record. The read-only projection code is implemented, but no qualifying owner record has been verified as available.
2. Verify signed-in owner authorization server side; forbid public sandbox, unauthenticated static exposure, and debug leakage. Avoid alternate Neon instances or duplicate context stores.
3. Display both the canonical statement and declared provenance, with a private owner-edit workflow, not a GitHub-edited hardcoded string.
4. Read Saturn Return / astrology / numerology from approved private context with source metadata, and separate interpretive reading from evidence or predictions.
5. Present cited philosopher works, historical direct quotations only when exact attribution verified, and explicitly distinguish the model's interpretation from author text.
6. Affirmations remain optional, varied, non-prescriptive, and not a substitute for care or action.
7. Test accessibility (keyboard, screen reader, reduced motion), layout (390px, desktop), privacy (published payload and source), fallback, authentication, and no new recurring cost.

Design north star: A private, kind mirror that helps the owner reconnect with purpose — not a system that judges whether they are sufficiently aligned.
