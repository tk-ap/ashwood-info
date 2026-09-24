# ASHWOOD database identity and recovery note

Use this when the live Ashwood Workspace database is hard to identify across Neon accounts/projects.

## Canonical identity

- Neon organization: **ALVIRA**
- Neon project: **ASHWOOD Dispatch**
- Default branch: **main**
- Vercel team/project: **alvira2 / ashwood**
- Runtime variable: **ASHWOOD_DATABASE_URL**

Do not assume another Neon project is the live database just because it has similar tables. **Any time Neon needs to be revisited, check both `Vercel: ALVIRA` and `ALVIRA` in the Neon switcher first.** The correct project is **ASHWOOD Dispatch** under the **ALVIRA** Neon organization.

## Recovery rule

If `ASHWOOD_DATABASE_URL` is stored as a Sensitive Environment Variable in Vercel and cannot be copied:

1. Open Neon and check **both ALVIRA contexts shown in the account/organization switcher** before concluding a project is missing:
   - **Vercel: ALVIRA**
   - **ALVIRA**
2. Do not assume the currently selected context is authoritative; inspect both because projects may exist under either context.
3. The known live Ashwood database is under the **ALVIRA** context in project **ASHWOOD Dispatch**.
4. Use the **main** branch.
5. Get a current connection string from Neon and add it only to the intended Vercel environment as `ASHWOOD_DATABASE_URL`.

Do not use a full production environment pull just to recover this one variable, and do not copy unrelated production or AgentOS secrets into Preview.

When a Preview intentionally reads the live Workspace database, keep the branch-scoped read-only guard enabled with `WORKSPACE_PREVIEW_READONLY=1`.
