# Lovable prototype → ASHWOOD Workspace adoption map

Status: direction agreed by TK on 2026-10-19. Docs only.

**Scope: the private Workspace (`/workspace/…`) only.** The Lovable "Ashwood Command Center" prototype is a design source for the owner's Workspace, not for the public site. Public-site changes (navigation, `/career`, `/guide/`; ashwood-info #281) are a separate track and are not justified by this prototype.

We port the **design and behaviour** into the existing vanilla Workspace modules. Lovable's React/TanStack/Tailwind code is not imported.

## Decisions (TK, 2026-10-19)

- **Studio is nested**, not a main section. It sits under Work as a tool, next to Career, Funding and Auditions. This keeps ashwood-info #180, which took Music Intelligence and Rights & Splits out of primary Workspace navigation.
- **Dark by default**, plus **paper light** and **phosphor cyber**: the same three modes as the public site, for continuity.
- **Tokyo Night** as an additional Workspace theme, if it can be added without breaking anything (see Themes).

## Section map

The six main sections are already in place from ashwood-info #280 (`workspace/views.mjs`).

| Lovable section | Workspace home | Data it uses (no new API routes) | Port notes |
|---|---|---|---|
| **Today**: owner signal, What matters (top 3), What agents are doing, Needs you (≤4), What changed, Attention budget | `#today` (#280) | AgentOS board mirror, priorities, operator actions | Mostly done in #280. Add: a detail drawer per priority. "Needs you" decision cards stay read-only, with a LEDGATo link (approving from ASHWOOD is a separate, LEDGATo-reviewed PR). Leave out "Simulate +24h". |
| **Build**: dependency map, release integrity (repo / staged / live), product drilldown, agent task detail | `#build` + existing tools (Environments, AgentOS Health, Queue, Design, History, Build logs) | Board rows, deployment ledger, sandbox environment registry | New: the **dependency map** across ALVIRA, AgentOS, LEDGATo, ailhat and ASHWOOD, and the **release-integrity strip** (main SHA vs staged runtime vs live production). The data already exists in the board, deployment budget and environment registry. |
| **Work**: Career Ops, Funding, Auditions | `#work`, `#funding`, `#runway` | Career API, funding registry | Keep ASHWOOD's career contract (`TARGET → APPLIED → SCREENING → RECRUITER → ASSESSMENT → INTERVIEW → OFFER`, plus DECLINED/DEFERRED/REJECTED), not the prototype's stages. Career Desk inheritance is in #284. Auditions keep the prep split: **AGENT** vs **YOU**. |
| **Studio** (nested under Work): music creative and review modes, performance archive | A Work tool, not a main nav item | Existing music pages | Review mode's 4-dimension readiness (≥80%) is a candidate. Creative mode stays non-judgmental. |
| **Network**: directory, relationship context | `#network` | **ALVIRA Context** (via the Bridge), not a new contact store | Relationship context is read from ALVIRA. ASHWOOD does not keep a second copy of people data (Brain handoff rule). Search and filter are client-side. |
| **Evidence**: effort vs progress, goal → bet → work → evidence → learning, Build Journal workflow | `#evidence`, Sources, Build logs | Sources registry, build logs, goals | New: the **goal-to-evidence trail**, and the Journal workflow staging to a **private** draft. Publishing stays with the Marlo routine's approval path. |
| **Self**: Second Brain, Rhythm | `#self` | Brain API (ashwood-info #273 + #287) | Untracked rhythm metrics show "—". **Prerequisite before the Self slice:** the Brain API stores only title, body, source URL and source key/fingerprint. It has no approval, epistemic-status or provenance fields, so it cannot show "Pending owner verification" yet. That state needs a reviewed data contract first (see below). |

## Prerequisite: Brain review-state contract (before the Self slice)

The prototype shows ALVIRA-drafted notes as "Pending owner verification". The current Brain API (#273 + #287) cannot support that, and the Self slice must not imply it does. Before building it, add and review:
- **Fields:** a per-note `review_state` (`pending` / `approved` / `rejected`), `epistemic_status` (`KNOWN` / `INFERRED` / `UNKNOWN`), and provenance (source system, actor, delegated or not, source fingerprint), as required by the #277 directive.
- **Migration:** additive and `IF NOT EXISTS`, like #287. Existing notes default to owner-created and approved.
- **Owner review model:** only the owner session changes `review_state`. Imports always land as `pending` unless the owner already approved them in the staging review. The API returns these fields so the UI can render them honestly.

## Components to port as small vanilla modules

| Component | Use |
|---|---|
| Provenance chip (`SOURCE · KNOWN/INFERRED/AWAITING VERIFICATION · age`) | Exists in #280 (`provenance-chip.mjs`); use it everywhere. |
| Status label (good / watch / blocker colours) | Today, Build, Work |
| Freshness label | Workspace freshness rules (live ≤75 min, aging ≤3 h, per ashwood-info #283) |
| Empty state / Disconnected state | Every data panel; honest when a source is down |
| Detail drawer | Priorities, applications, products |
| Dependency graph (SVG) | Build |
| Journal workflow (4 steps) | Evidence |

## Data contracts

The prototype assumes `GET /api/workspace/{today,build,work,network}`. **ashwood-info is at 12 of 12 Vercel Hobby functions**, so these are not new routes. Each snapshot is either:
- assembled in the browser from data the Workspace already loads, or
- if needed, a new `?view=` on the existing `api/workspace-agentos` router.

No new polling: reads follow `workspace/poll-gate.mjs`, because of the Neon budget.

## Themes

The Workspace already loads the shared `/theme.js`, which stores the choice in `localStorage["ashwood.theme"]` and sets `html[data-ashwood-theme]`. One choice applies across the site.

| Theme | id | Where |
|---|---|---|
| Warm dark (default) | `warm-dark` | Public + Workspace |
| Paper light | `paper-light` | Public + Workspace |
| Phosphor cyber | `phosphor-cyber` | Public + Workspace |
| **Tokyo Night** | `tokyo-night` | Public + Workspace |

Work needed:
1. **Coverage.** The Workspace CSS has `paper-light` overrides only in a few files and none for `phosphor-cyber`. Map the Workspace's own variables (`--paper`, `--ink`, `--muted`, `--rule`, `--panel`, `--workspace-accent`, …) from the shared `--ashwood-*` tokens per theme, in one new `workspace/themes.css`, so every theme covers every Workspace page. `career-ops/index.html` does not load `theme.js` yet; add it.
2. **Tokyo Night across ASHWOOD.** `theme.js` presents it as the fourth shared theme, using the same saved choice and token palette as Workspace.
   - Palette (the standard Tokyo Night colours), mapped to the shared tokens:

     | Token | Value | Tokyo Night role |
     |---|---|---|
     | `--ashwood-paper` | `#1a1b26` | background |
     | `--ashwood-ink` | `#c0caf5` | foreground |
     | `--ashwood-muted` | `rgba(192,202,245,.60)` | |
     | `--ashwood-rule` | `rgba(192,202,245,.18)` | |
     | `--ashwood-oxblood` | `#f7768e` | blockers |
     | `--ashwood-ochre` | `#ff9e64` | |
     | `--ashwood-gold` | `#e0af68` | |
     | `--ashwood-field-green` | `#9ece6a` | |
     | `--ashwood-accent-2` | `#7aa2f7` | |
     | glow | `rgba(122,162,247,.16)` | |

     `color-scheme: dark`; `meta theme-color` is `#1a1b26`.
3. **Checks:** contrast for body and muted text in all four themes; a screenshot check of each Workspace section in each theme at desktop and 390 px; a test that a public page never rewrites a saved Workspace-only theme.

## Order (after #280 merges)

1. Themes (coverage + Tokyo Night).
2. Build: dependency map + release integrity.
3. Evidence: goal-to-evidence trail + Journal workflow (private drafts).
4. Network from ALVIRA.
5. Studio under Work.

Each slice is its own PR, previewed on the here.now sandbox before merge.

## Needed from TK

The Lovable project is not connected to a `tk-ap` GitHub repository. Connecting it (Lovable's GitHub sync) would let agents read the real layouts, spacing and copy instead of the written summary.
