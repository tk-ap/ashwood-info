# Canonical Funding

Load this contract before any Funding discovery, verification, ranking or UI work.
`/workspace/funding/` opens the existing `/workspace/#funding` view. There is one opportunity registry: `workspace/funding/opportunities.json`. Radar is a recurring agent capability feeding this file, never a separate destination, database, tracker or score.

## Inspected architecture (2026-10-05)

Base: `tk-ap/ashwood-info` main `3d057a5bd0f7b9162f0470a1c9252533f90b4b98`, aligned with the observed READY Vercel production deployment. Deployment topology remains `.agent-os/deployment.yaml`; ordinary review belongs to here.now, production promotion remains owner-gated.

| Existing concept | Inventory / extension |
| --- | --- |
| Opportunity types | emergency_cash, founder_cash, rd_funding, build_credits, creative_funding, noncash retained; training, scholarship and zero_interest added |
| Profile | Optional browser-local booleans under `ashwood.funding.profile.v1`; extended to unknown/confirmed yes/confirmed no and required program facts. No owner facts prepopulated in public source |
| Ranker | Previously profile tag count, deadline, status; replaced in-place by shared `model.mjs` evaluation. Tags now express affinity, not eligibility |
| Lifecycle | POSSIBLE_FIT, NEEDS_FACT, VERIFIED_FIT, READY_TO_APPLY, APPLIED, AWAITING_RESPONSE, AWARDED, DECLINED, NOT_ELIGIBLE, CLOSED retained. Candidate, submitted, in-progress, denied, expired, completed added |
| Disposition | APPLY / CONSULT / HOLD / SKIP separate from progress; source and eligibility gates precede ranking |
| Filters | Existing type + text filters retained; action/lifecycle/changed views derive from the same list |
| Recommendation surfaces | One Funding list and summary; no radar panel. Income/runway contains income experiments, not a funding registry or funding score |
| Persistence | Static Git-backed opportunity file; owner matching and lifecycle in localStorage. No Funding Neon table or scanner existed |
| Records | Original seven IDs retained: village-for-vets-efund, lacahsa-rphp, founders-first-tadlock-2026, nsf-sbir-26-510, aws-activate-founders, google-startups-cloud, microsoft-for-startups |
| Overlapping work | Open PR #203 is stale and unmergeable; its old dedicated-route HTML conflicts with the now-canonical redirect. Reuse relevant styling only after review; never merge its obsolete route wholesale |

## One record model

Existing names/semantics remain: `name` = program, `funder` = provider, `source_url/source_label` = official source, `type` = funding type, `value` = displayed value, `criteria` = requirements, `match_tags` = affinity, `unknowns`, `documents`, `effort`, `deadline`, `last_verified_at`, `next_action`, `status`.

Minimal additions in `model.mjs`: `program_key`, aliases, multi-category applicability, amount, repayable, interest_percent, fees, eligibility_rules, service/income/employment requirements, geography, application_window, time_to_funding_days, training_weeks, employment_ready_at, benefit_interactions, discovered_at, verification, evidence, confidence, disposition, reason, action_deadline and changes. Null means unknown or inapplicable; never infer a grant, $0 fees, duration or eligibility from a missing value.

Evidence carries URL, checked_at, authoritative, supports and a concise source-supported summary. Program verification requires current official evidence for availability, criteria and value. Housing evidence expires after seven days; other evidence after fourteen. A refreshed file or successful HTTP request is not verification. Program evidence is never proof of personal eligibility or funding capacity.

Owner action state extends the existing `ashwood.funding.status.v1` entries from status strings to objects with status, disposition (defer/skip only), reason, next_action, action_deadline, outcome, completed_at, updated_at and bounded history. String entries remain readable. No destructive localStorage migration; statuses remain ID-bound through future registry updates. Known private case facts stay in the owner's browser and never enter program source. The agent cannot read browser-local facts; unknown matches must remain unknown. Profile changes immediately re-evaluate all opportunities in the browser.

## Current decision policy

One shared evaluation function serves ranking and all views. Source freshness, provider eligibility, lifecycle and owner defer/skip gates constrain APPLY. Required fact rules use all clauses, with explicit any-of alternatives. Confirmed false facts can rule out a program; absent facts cannot. Unknown eligibility produces CONSULT only when official program evidence is current. Search-only discoveries and stale/changed programs stay HOLD.

Priority weights: housing 1000, employment 400, nonrepayable assistance 150, verified 0%-no-fee capital 90, matched eligibility 80, known time-to-funding up to 60, low/medium/high effort +30/+10/-30, benefit coordination +10 or unknown -20, business value 15, affinity capped at 5. Training over eight weeks or employment readiness after December 1, 2026 has an -800 penalty and HOLD disposition under the current context. Unknown timing earns no speed points. These are policy weights, not probabilities or a promise of an award. Review this temporary employment target when circumstances change.

Existing submissions/in-progress actions remain visible and cannot be erased by re-verification. Awarded and terminal outcomes have their own views. Expired windows are watched for the next cycle; a closed provider grant competition must not be confused with closed household intake (especially SSVF).

## Recurring discovery and re-verification procedure

Use the connected capable research agent with the thinnest supported scheduling handoff. Do not add another crawler database or an LLM-backed scoring service.

1. Read the latest registry, this contract, model and open Funding PRs. Update the existing unmerged maintenance branch when appropriate; otherwise branch from current main. Check `.agent-os` coordination/topology; do not overwrite other actors.
2. Search every existing type plus grants; veteran/reservist assistance; housing stabilization; rental/utilities; workforce; transportation; training stipends; relevant scholarships; personal support; 0%/no-fee financing; founder/startup/small-business grants; company/product credits; creative funding and noncash support. Search official LA/California and nationwide sources applicable locally. Rotate broader source searches across runs while checking urgent existing records each pass.
3. Discoveries enter this same registry as CANDIDATE / UNVERIFIED first. Deduplicate by stable ID, program_key, alias/name and official-source identity. Shared provider or landing page alone is not identity. Ambiguous shared-source identity is a review conflict. Preserve existing IDs. Categories never create duplicate opportunities.
4. Read primary sources and current application/intake pages. Verify availability, authoritative eligibility, value, repayment and fees; capture source evidence and current unknowns. Search snippets, stale pages and summaries alone cannot qualify a record for action. Failure to retrieve evidence leaves it unverified/needs-review; never declare a program closed because a request failed.
5. Update existing records for reopened windows, closures, exhausted funds, deadlines, value, eligibility, benefit interactions and relevant circumstances. Use supported program facts only. Mark unresolved material change NEEDS_REVIEW, retain previous evidence date/history, and recheck. Never rewrite a submitted, awarded or terminal owner action because a public program changed.
6. Compare only actually available private facts; do not invent service activation, disability rating, income, employment, guarantors or legal-business eligibility. Do not export private facts into the public repo. Unknown requirements remain consultation questions. Dispositions and views use the same model; do not create another recommendation score.
7. Apply a transient public-program report to this registry with `node scripts/funding-registry.mjs --apply < report.json`. `records` is the only top-level input. Field allowlist prevents profile/status/outcome ingestion. New records must be inserted unverified before a separate verified update. Apply is atomic; malformed evidence aborts without partial updates. Transient reports are not another store.
8. Run `node scripts/funding-registry.mjs --validate`, targeted funding tests and relevant checks. Commit to a reviewable branch and update/create one Funding maintenance PR. No automatic merge or production promotion. Notify only for meaningful new evidence, deadlines, newly actionable programs or an owner decision. Report failure to persist instead of claiming registry update.

`node scripts/funding-registry.mjs --due` returns existing records needing source re-verification. Automation executes this procedure; it is not a separate opportunity system. Scheduling is external to the site; page Refresh only reloads the canonical file. Changes reach the live UI after the normal owner merge/release gate.

## Program relationships and privacy

Village for Vets EFund retains its existing ID; VSA is a distinct wraparound/referral program linked to EFund and SSVF. Do not count VSA referrals as another EFund award. SSVF is one program record; continue an existing case rather than soliciting a second enrollment. JVS VSTA/AJCC is one combined access pathway as requested; support-specific eligibility remains explicit.

Do not auto-apply, transmit PII, accept financing, create debt, or imply provider approval. No private case manager, rent, arrears, service documents or outcome state belongs in this public repository.

## Migration and release limits

No database migration is needed. Existing profile/status keys and original IDs are preserved. Program facts remain Git-backed and public; owner actions remain private to a single browser. Clearing browser data loses those private actions; cross-device sync is not implemented. Moving owner state to the existing authenticated Workspace database requires a separately reviewed additive migration, reconciliation and privacy plan; do not fabricate live cloud persistence here.

Desktop/mobile interaction verification and owner review are required before production promotion. Production completion requires exact main/deployed SHA and live-route evidence per AGENTS.md. A pushed branch, green tests or scheduled research is not a live Funding release.
