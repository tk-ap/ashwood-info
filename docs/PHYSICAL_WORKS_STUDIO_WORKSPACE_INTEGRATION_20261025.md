# ASHWOOD · Physical Works Studio integration handoff
2026-10-25 · **Record and integration work only**; not publication approval.

## Existing delivery path (do not make another app)
- Public site: `tk-ap/ashwood-info` `/physical-works/` and `/work/`.
- Full-site sandbox assembly: existing draft PR #295 (`codex/here-now-current-staging`), stacked on #294, deployed only to existing `mighty-yoga-pgph` after explicit tests and provider version gate.
- Private Workspace V2 demo source: `tk-ap/ashwood-command-center` draft PR #1 `codex/workspace-v2-sandbox-safe`, `/work/studio`. It now contains a **session-only Physical Works Studio interface**, data model, import/export, redacted preview and tests. **This is not authenticated or persisted.**
- Private repo contains `docs/PHYSICAL_WORKS_STUDIO_CATALOG_CONTRACT_20261025.md` and `docs/physical-works/OWNER_PRIVATE_SEED_20261025.json`. Owner-specific notes and private price floors must **never** be pulled into static bundles, this public repository, public assets, sitemap, or OG metadata.

## Required code integration after QA

1. Verify newer Workspace PR #1 head with TypeScript, unit and static-build tests. Preserve disconnected demo labels.
2. Only then update `scripts/build-here-now-staging.mjs` to pin the tested immutable Workspace source SHA; don't change current pin blindly. Build complete public+Workspace artifact and verify all routes, no sensitive assets, and responsive rendering. Publish to **same** here.now slug with expected baseVersionId; record version and browser readback. Production stays untouched.
3. Implement actual catalog persistence in the existing authenticated ASHWOOD Workspace backend, with owner-only CRUD, revision + session event ledger, agent identity, media permissions and immutable publication projection.
4. Backfill approved facts through owner review, not by exposing the private static seed automatically. Source IDs must remain stable.
5. Render showroom from approved projection. In the current `/physical-works/`, `redface` and `fathertime` currently display as independent cards. Correct the entity model: they are recto and verso of one physical original on **22×30 inch** Canson XL Mixed Media paper, 98lb/160gsm. May remain separate *print derivatives*, not separate originals. Do not quote a public selling price without explicit approval.
6. `What Will Be, Will Be` is **single-sided 9×12 inch** MOFUNY Mixed Media 160gsm. Original print file, rights and public caption still require owner review.
7. Gallery: one original card with accessible front/back viewer and optional photographed turnover; no invented mockup; print derivative selector if proofed; public/private narration separated; avoid static high-resolution master exports or private notes.

## Publication/release gate

- Real private draft persists across authenticated sessions and devices.
- Front/back stay attached to ONE original record; no double counting inventory.
- Import/export retained, evidence links attributed by agent/session, conflict-safe revisions and rollback.
- Publication always whitelists reviewed fields and approved photos; closed/private, unpublished poems, confidential working notes and owner reserve excluded server-side.
- Real print master/proof, photographer/source image quality, Octavia Lab resale permission, and conservation display claims are confirmed before advertising.
- Staging package includes exact source SHAs; tests pass; desktop/mobile browser readback and one sandbox URL verified. Only then seek explicit production approval.

**Status as of 2026-10-25:** Workspace source/UI and initial private seed committed to draft PR #1; no authenticated catalog API, no database integration, no pin update, no here.now publish, and no production change were proven in this work session.
