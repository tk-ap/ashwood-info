# Funding Intelligence

Funding Intelligence is a private ASHWOOD Workspace surface for finding and tracking non-dilutive money and support.

## Scope

The registry spans emergency financial assistance, veteran programs, founder grants, R&D funding, startup credits, creative funding, and non-cash leverage.

It is intentionally separate from Career Ops:
- Career Ops tracks income through employment.
- Funding Intelligence tracks money/resources available through programs, grants, credits, subsidies, competitions, and support systems.

## Privacy boundary

The repository may define eligibility categories, but it must never contain the owner's sensitive matching profile.

The UI exposes optional local-only eligibility toggles. Their values are stored in browser localStorage under `ashwood.funding.profile.v1`. No identity selections are pre-populated in source. Do not send those selections to analytics or persist them in the public repository.

## Evidence contract

Every surfaced opportunity must retain:
- authoritative source URL
- last verified date
- current availability state
- source-supported eligibility criteria
- explicit unknowns
- next action
- application effort

`VERIFIED_FIT` is reserved for cases where current source evidence and the required owner/business facts have actually been checked. A seed opportunity should normally begin as `POSSIBLE_FIT` or `NEEDS_FACT`.

## Current implementation

The first release uses a source-verified seed registry in `workspace/funding/opportunities.json`, browser-private matching and status tracking, and a dedicated route at `/workspace/funding/`.

The Refresh Registry button reloads the registry file. It does **not** claim to re-crawl or re-verify upstream sources. A later scanner can replace the seed-refresh step only when it has a real authoritative-source verification pipeline and freshness evidence.

## Next scanner phase

The scanner should:
1. query authoritative funder/program sources;
2. detect new, changed, closed, or deadline-shifted opportunities;
3. preserve source and verification timestamps;
4. match against private eligibility facts without exporting those facts into public source;
5. suppress duplicates and stale programs;
6. explain why an opportunity was excluded or remains uncertain;
7. attach housing support to the housing-support context, founder/R&D money to the relevant build, and application deadlines to the appropriate private workflow.

Issue: #193.
