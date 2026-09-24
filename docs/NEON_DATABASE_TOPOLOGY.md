# Neon database topology and account-switching guide

## When agents must read this

**Read this file before any Neon-related work anywhere in the ecosystem.**

This includes:
- identifying a database or Neon project
- recovering or setting a `DATABASE_URL` / `ASHWOOD_DATABASE_URL`
- checking tables or data
- diagnosing an apparently missing database
- creating or changing a Neon branch
- wiring a Vercel Preview or Production environment to Neon
- reasoning about which Neon organization owns a project's database

The owner has **two ALVIRA-related Neon contexts in the same Neon switcher**. A project that appears missing in one context may exist in the other.

Always check both:

1. **Vercel: ALVIRA**
2. **ALVIRA**

Do not assume the currently selected Neon context is authoritative.

## Ecosystem database map

| Product / surface | Neon status | Neon context / organization | Neon project | Runtime variable | Confidence |
| --- | --- | --- | --- | --- | --- |
| ASHWOOD / Workspace / Dispatch | Active and verified | **ALVIRA** | **ASHWOOD Dispatch** | `ASHWOOD_DATABASE_URL` (fallback `DATABASE_URL`) | Verified against the live Workspace and repository |
| ALVIRA | Active Neon-backed application | **Unresolved — check both `Vercel: ALVIRA` and `ALVIRA`** | Unresolved | `DATABASE_URL` | Repo verifies Neon usage, but not the owning Neon context/project identity |
| ailhat | No verified Neon dependency recorded here | Unknown / not established | Unknown / not established | None established | Do not infer a Neon database without fresh evidence |
| ledgato | No verified Neon dependency recorded here | Unknown / not established | Unknown / not established | None established | Do not infer a Neon database without fresh evidence |
| AgentOS | No verified Neon dependency recorded here | Unknown / not established | Unknown / not established | None established | Do not infer a Neon database without fresh evidence |

Update this table whenever a product's Neon identity is verified. Record the organization/context and project name, but never commit credentials or connection strings.

## Verified ASHWOOD identity

- Neon context / organization: **ALVIRA**
- Neon project: **ASHWOOD Dispatch**
- Default branch: **main**
- Vercel team/project: **alvira2 / ashwood**
- Production runtime variable: **ASHWOOD_DATABASE_URL**
- Canonical source repo: **tk-ap/ashwood-info**

The live Ashwood Workspace has already been verified to reach populated database state. A different Neon project with similar or empty tables is not sufficient evidence that it is the live database.

Useful live-table indicators include:
- `workspace_auth`
- `workspace_sessions`
- `workspace_evidence`
- `workspace_commands`
- `workspace_career_applications`
- `dispatch_subscribers`

## ALVIRA evidence currently known

The ALVIRA repository directly uses `@neondatabase/serverless`, requires `DATABASE_URL`, contains Neon migration/verification tooling, and documents a Neon-backed production account system.

What is **not yet established** from repository evidence is which of the two Neon contexts owns that production project or the canonical Neon project name. Resolve that explicitly before any ALVIRA database operation and then update this file.

## Recovery / lookup procedure

When a Neon database cannot be found:

1. Open the Neon account/organization switcher.
2. Check **Vercel: ALVIRA**.
3. Check **ALVIRA**.
4. Search for the expected project in both contexts.
5. Verify against runtime evidence or populated canonical tables before deciding it is the correct database.
6. If Vercel stores the relevant database variable as Sensitive and will not reveal it, obtain a current connection string from the verified Neon project rather than pulling every production secret.
7. Add only the required database variable to the intended Vercel environment.

Do not use a full production environment pull merely to recover one database variable.

## Preview safety

When a Preview intentionally points at a production database, Preview must not silently gain production mutation authority.

For the current ASHWOOD Workspace visual Preview, pair the branch-scoped database variable with:

```
WORKSPACE_PREVIEW_READONLY=1
```

Do not copy AgentOS sync tokens or unrelated production secrets into Preview merely to make a UI render.

## Maintenance rule

Any time a Neon project/context is conclusively identified for an ecosystem product:

1. update the ecosystem database map above;
2. record the exact Neon switcher context (`Vercel: ALVIRA` vs `ALVIRA`);
3. record the Neon project name and canonical runtime variable;
4. add a pointer from that product's deployment topology / agent instructions when available;
5. never record passwords, tokens, or connection strings in Git.
