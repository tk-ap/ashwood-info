# ASHWOOD Career Ops

Career Ops is the private operating layer for job-search continuity. It is intentionally separate from the public portfolio and Build Journal.

## Purpose

Preserve enough context that an application can be reconstructed months later even if the employer removes the posting. Each record should retain:

- company, exact title, requisition/job ID, location, and work arrangement
- posting URL and a durable snapshot of responsibilities, requirements, preferred qualifications, and interview notes
- posted compensation and the salary requested by the owner
- résumé/version, projects, work samples, and other materials actually submitted
- application status, submission date, next action, and deadlines
- event history from confirmations, recruiters, assessments, interviews, offers, rejections, and owner decisions

## Status contract

`TARGET → APPLIED → SCREENING → RECRUITER → ASSESSMENT → INTERVIEW → OFFER`

Terminal or owner-controlled states: `REJECTED`, `DECLINED`, `CLOSED`, `DEFERRED`.

Do not convert an owner decision to skip a role into an application failure. `DECLINED` means the owner chose not to proceed because fit, character, compensation, location, or another constraint did not justify the application.

## Private data boundary

Application records live in the private ASHWOOD workspace database. The public repository contains only the tracker implementation and schema, never the owner's live application records, recruiter correspondence, or private job-search inbox content.

The UI route is `/workspace/career-ops/`. It uses the same 30-day private workspace session as `/workspace/`.

## Fresh opportunity discovery

Career Ops also includes a private `What should I apply to next?` section. It should surface 5–10 current options that overlap the owner's demonstrated lanes: business execution, operational risk and controls, compliance, business analysis, PMO/program operations, process improvement, resiliency, financial operations, and adjacent governance work.

The first live source is the Remotive public jobs API. Its listings are remote and the source requires attribution and a link back to Remotive. The endpoint is cached for six hours so repeated presses of `Refresh options` rotate through additional ranked matches without hammering the upstream feed. A source refresh can happen after the cache expires; the UI always reports when the source was last checked.

Discovery rules:

1. exclude applications already tracked by exact posting URL or company/title pair;
2. exclude clearly non-US-only location restrictions and obviously unrelated technical, clinical, sales, or creative roles;
3. rank by title match first, then relevant posting language and recency;
4. show eight options at a time, while permitting a 5–10 result range when the pool is smaller;
5. never auto-apply or silently add a job to the pipeline;
6. `Track target` creates a private `TARGET` application record with the source URL and a posting summary so the owner can review it before applying;
7. keep source attribution visible on every surfaced role.

The discovery feed is a sourcing aid, not a claim that every surfaced job is a fit. Final eligibility and application decisions remain owner-controlled.

## Inbox continuity

The data model supports Gmail-originated events through `workspace_career_events`:

- `source = gmail`
- `source_ref = Gmail message ID` for de-duplication
- `event_type` such as `CONFIRMATION`, `RECRUITER`, `ASSESSMENT`, `INTERVIEW`, `STATUS_CHANGE`, `OFFER`, or `REJECTION`
- `payload` may hold non-sensitive structured metadata required for matching and prep

The dedicated job-search Gmail account should be connected through an authorized connector. Do not store the Gmail password or OAuth refresh token in this repository or the Career Ops tables.

When inbox monitoring is connected, the automation should:

1. inspect new job-search mail;
2. match the message to an existing application by company, role, requisition ID, or prior thread;
3. append one de-duplicated career event;
4. advance status only when the message supports the transition;
5. surface deadlines and unanswered recruiter messages as `next_action`;
6. never infer a rejection, offer, or interview from ambiguous language;
7. preserve the exact posting snapshot and submitted materials for interview preparation.

## Interview packet

When an application reaches `RECRUITER`, `ASSESSMENT`, or `INTERVIEW`, Career Ops should be able to reconstruct a prep packet from:

- the preserved posting snapshot;
- the résumé and portfolio materials used in that application;
- the salary requested;
- known gaps or caveats identified at application time;
- all recruiter/status events;
- the next scheduled action or interview.

This is an owner tool, not a public-facing career feature.


### Delegated Gmail implementation

Career Ops has a server-only Gmail sync endpoint at `/api/workspace-career-gmail-sync`. The browser never receives Gmail OAuth credentials or refresh/access tokens.

Required Vercel server environment variables:

- `CAREER_GMAIL_CLIENT_ID`
- `CAREER_GMAIL_CLIENT_SECRET`
- `CAREER_GMAIL_REFRESH_TOKEN`

The delegated grant must resolve to exactly `hire.tkashwood@gmail.com`; the endpoint rejects any other mailbox. Use the least-privilege Gmail read scope (`https://www.googleapis.com/auth/gmail.readonly`). The ChatGPT Gmail connector authorization is intentionally not copied or exported: ChatGPT connector tokens are not application credentials for ASHWOOD.

The sync scans recent non-promotional mail and runs each message through one pipeline (`api/_career-gmail-pipeline.mjs`):

1. **Career relevance.** Account and product notices (Neon, Google account security, billing) and mail without application-lifecycle language are ignored before any matching. The full message body is read for classification only; it is not stored.
2. **Lifecycle classification.** Rejection → `REJECTED`, offer, interview, assessment, recruiter contact, confirmation → `APPLIED`, under review → `SCREENING`. Employer decisions take precedence, and conditional language ("if selected, we will schedule an interview") is not evidence.
3. **Reconciliation.** An existing Gmail event or thread linkage wins; otherwise employer plus role, or a requisition ID, must identify exactly one application. Otherwise the message enters review. No application is created from a failed match.
4. **Transition.** Each application's history is replayed in occurrence order: owner-recorded status changes set the state, Gmail evidence may only advance it, and an employer rejection supersedes any open stage. Older evidence cannot regress a newer decision. `DECLINED`, `CLOSED`, and `DEFERRED` are owner decisions and are never changed by Gmail evidence.
5. **Idempotency.** One event per Gmail message ID. Re-syncing corrects a stale classification in place rather than inserting a second event.
6. **Verification.** A status write is re-read before it is reported. An unverified write returns `RECONCILIATION_FAILED` instead of success.

The sync response and UI report application-level outcomes: one line per application whose canonical status changed, and `No new application updates` only when none did. The funnel is computed from canonical applications and their events, never from separate counters.

### Reconciliation and review

The Gmail sync reconciles an email only when employer and role (or requisition) identify one canonical application. It does not attach a message to the highest-scoring candidate when there is a tie or insufficient evidence. Those messages are retained in the private Career Ops review state with their Gmail message ID and candidate IDs, so an owner can resolve them without losing the evidence. Review rows are never deleted: a later sync marks a row `resolution = reconciled:<application>` or `ignored:<reason>`, and only unresolved rows count as requiring review. A `DECLINED` application remains an owner decision and is never changed into an employer `REJECTED` outcome by the matcher.


## Closed-loop operating model

Career Ops is organized around five durable surfaces:

1. **Today** — the small set of application, inbox, or recommendation actions that can move the job search now.
2. **Recommended** — a continuously replenished queue of qualified roles.
3. **Applications** — the canonical lifecycle record and preserved posting/material history.
4. **Inbox / Signals** — Gmail-derived evidence that reconciles into the canonical application rather than becoming a parallel tracker.
5. **History / Preferences** — durable disposition and lifecycle evidence used to improve subsequent recommendations.

The operational loop is:

`discover → qualify → recommend → act → observe inbox → reconcile → learn → replenish`

A recommendation decline is persisted server-side in `workspace_career_opportunity_dispositions`. Declined opportunity IDs are removed **before** ranking pages are returned, so handling the visible cards cannot create a false empty state while other qualified candidates remain. Client-side decline storage remains only as backward-compatible session evidence.

Recommendation qualification is title-first. Posting-body keyword accumulation cannot promote an unrelated occupation into Apply Next. Engineering and technical occupations are rejected at the gate; finance, business analysis, business/strategy operations, program/project management, governance/risk/control, and transferable non-technical product roles remain eligible.

Source expansion must not regress queue continuity. A preferred source may replace or supplement the current feed only when its ingestion path is proven. Do not disable the only working candidate source merely because a preferred provider requires browser/account ingestion; surface the source provenance honestly and keep the qualifying/replenishment contract intact.
