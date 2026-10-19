# Signed-in Workspace in the here.now sandbox

Status: direction agreed by TK on 2026-10-19. Not built. Each phase below is a separate PR with its own review.

## Goal

Make the signed-in Workspace reviewable on the stable here.now sandbox (`mighty-yoga-pgph`), by TK and by agents (Codex, Claude), without TK's own login and without exposing private data. Agents can then verify signed-in views end to end themselves.

## Phase 1: realistic fake data (now)

- The sandbox bootstrap (`workspace/sandbox-bootstrap.js`, from #280) answers every Workspace data request with a realistic, made-up response instead of "unavailable in demo", so every signed-in screen renders.
- Fixtures live in the repo, are labeled DEMO, and contain no real records.
- No backend, no database and no cost. It is safe on a public link.

## Phase 2: cleaned sandbox database + agent sign-in

### Database: rebuilt from an allowlist, never a scrubbed copy

- **Never branch production with data and scrub it afterwards.** The copy holds real data from the moment it is created and stays recoverable through Neon's restore window.
- Create a schema-only Neon branch of ASHWOOD Dispatch (`silent-unit-88345966`), or a separate small project, and load it from a cleaned export.
- The cleaner rebuilds each table from an **allowlist of fields**. Private free text (career notes, context, names, emails, phone numbers, addresses) is replaced with realistic stand-ins. Unknown columns are dropped by default.
- **Excluded entirely:** ALVIRA Context snapshots (`workspace_context_snapshots`), Brain notes, sessions, tokens, credentials, and anything the Brain handoff says stays authoritative in ALVIRA.
- The load **fails** if automated checks find emails, tokens, phone numbers, known personal names or connection strings in the output. The check results are kept as evidence.
- Refreshes are manual and owner-triggered. There is no automatic sync from production.

### Backend: sandbox-only

- here.now serves static files only, so the sandbox needs its own small API deployment. That is a separate Vercel project, not Vercel Preview of `ashwood-info` (see `.agent-os/deployment.yaml`).
- Its only database connection is the sandbox database. Production never accepts sandbox credentials, and the sandbox never holds production's.
- The here.now site sends `/api/*` to that backend (here.now proxy routes, or CORS limited to the sandbox origin).

### Agent sign-in

- A dedicated sandbox principal, read-only by default, with its own secret held in the agents' runtime (never in the repository).
- Short-lived sessions, and a visible **SANDBOX DATA** banner on every page.
- Any decision control (approve or deny) goes to a LEDGATo **test tenant**, never TK's real LEDGATo.

### Access

- The here.now site is set to restricted (invite-only), because even cleaned data describes TK's work and life.

## Cost (Neon budget: $5 per month)

- The sandbox branch uses the same compute cap (0.25 CU) and scale-to-zero, so it costs only while in use.
- It is a second database to watch on the Neon spending alert ($4).
- The separate Vercel project gets its own 12-function limit.

## Review gates

- The allowlist cleaner and its checks get an independent review before the first load.
- The first loaded snapshot is inspected by TK before the site is shared with anyone else.
