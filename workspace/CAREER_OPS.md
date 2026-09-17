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
