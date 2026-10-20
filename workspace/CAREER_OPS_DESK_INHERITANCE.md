# Career Ops Desk → ASHWOOD Career Ops

Status: TK decision on 2026-10-19. The Career Ops Desk (a private claude.ai artifact TK used for job-search work since 2026-10-16) is inherited into the ASHWOOD Career Ops view (`/workspace/career-ops/`). This note is the plan. Nothing is built or imported yet.

## Why this is mostly additive

The Desk was built to ASHWOOD's own contract. Its application records use the same fields (company, role, posting URL, location, work arrangement, salary min/max, requested salary, status, submitted date, next action, materials, notes, source) and the same status values (`APPLIED`, `REJECTED`, `DECLINED`, `DEFERRED`). Four Desk records were already marked for sync to ASHWOOD Career Ops (`canonical_sync.state: pending`), but that sync never happened.

What ASHWOOD already has: the tracker and event history; Remotive discovery with a 6-hour cache; the nine qualifying lanes; ATS résumé artifacts; Gmail sync; the employer verifier.

What the Desk adds:

| Desk feature | Where it goes in ASHWOOD |
|---|---|
| **Applications** (10 records, 4 marked pending sync) | One-time owner import into `workspace_career_applications` and `workspace_career_events`, deduplicated by posting URL, then company + role |
| **Posting scan queue** (paste a link and keep the full posting) | "Add a posting" on Career Ops that stores the posting text in `posting_snapshot`. This is the durable-snapshot goal already in `CAREER_OPS.md` |
| **Fit scoring + the 95-or-higher qualification gate** | A fit score, verdict, lane, matches and gaps on each record (in `posting_snapshot` / `fit_decision`), plus the gate as a filter and label: "qualifies (95+, qualifying lane)" |
| **Find-my-matches sourcing** (public Greenhouse, Lever and Ashby boards; strictly 95+) | More discovery sources next to Remotive, with the same 6-hour cache and attribution. Only gate-passing roles are surfaced as matches |
| **Match-run audit** (counts only) | A discovery run log: boards checked, postings seen, counts per score band, qualifiers |
| **Background baseline** (profile v4: tools, quantified outcomes, constraints, weak-fit patterns) | `workspace_career_resume_profiles`, the input for scoring and résumé drafting. It replaces the hand-maintained copy |
| **Résumé drafting per posting** | The existing résumé artifacts, now fed by the score's matches and positioning line |

## Who does the scoring

The Desk scored postings with the in-page Claude. ASHWOOD should not hold a model API key in Vercel. Scoring runs as an **AgentOS job** instead, the same way the `/find-matches` command already works:
- it reads public postings and the baseline;
- it applies the Desk's scoring prompt and gate unchanged;
- it returns results through the existing machine-sync path as proposals.

The owner reviews and keeps or dismisses each one in the Workspace. Nothing is applied for, and nothing is added to the pipeline without the owner.

## Import (phase 1)

- The career API accepts writes only from the owner's signed-in session on the same origin. That is correct for private data, so **the import is owner-run in the Workspace**: upload the Desk export (JSON), see a preview with duplicates marked, then confirm.
- No agent writes career records directly, and there is no SQL import.
- The export is kept outside every repository, in a private local folder.
- After import, the Desk is retired as the working copy and its share link is set to private.

## Boundaries

- No change to the job-search feed's or tracker's existing behaviour beyond what this note lists. Changes to canonical Career Ops semantics need TK.
- Never auto-apply, contact employers, or submit forms.
- Private application data stays in the private workspace database. Fixtures in the repository are synthetic.
- **Neon cost:** the data is tiny (tens of rows). Scoring and sourcing run outside Vercel and Neon. Discovery stays cached so page views don't trigger new fetches.

## Order

1. After ashwood-info #280 (Workspace shell) and #281 (public Career page) merge. Both touch the career views, so building on them avoids conflicts.
2. Phase 1: the import, plus "Add a posting" with snapshot storage.
3. Phase 2: the baseline profile in ASHWOOD, and fit score + gate fields in the UI.
4. Phase 3: AgentOS scoring job and the extra discovery sources (Greenhouse, Lever, Ashby), with the run log.
