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

## 2026-10-25 — ten sketchbook print studies captured

Owner explicitly requested all ten newly prepared pieces be represented in the existing showroom/catalog. Nine showroom entries added; existing `eatmore` / EAT MORE FOOD updated in place. The complete compositions are displayed using image-native ratios on desktop and mobile, rather than cover crops. Existing gallery identities and content remain intact.

The existing private seed at `tk-ap/ashwood-command-center` PR #1 now has ten attributed page records (commit `b5707e5b59355e71f53153da26c869a6f1722acd`), preserving the three earlier records. Each attaches its original photo reference, print artifact, exact pixels/inches, DPI/profile, hashes, preparation history and pending physical proof. Print specifications are recorded separately from unknown original measurements. New descriptive titles remain provisional. No asking prices, editions, creation dates or physical recto/verso pairings were inferred. Original photos and print masters remain outside public source; only metadata-stripped 1600px-max gallery JPEGs are added here.

| Showroom identity | Working label | Proposed print dimensions (in) |
| --- | --- | --- |
| is-it-really-suicide | Is It Really Suicide | 7.305 × 12 |
| heartbreaker | Heartbreaker | 12 × 7.245 |
| can-i-live | Can I Live | 7.405 × 12 |
| untitled-face-study | Untitled Face Study | 9 × 12 |
| double-face-study | Double Face Study | 7.315 × 12 |
| eatmore (existing) | EAT MORE FOOD | 12 × 7.245 |
| forest-season | Forest Season | 7.31 × 12 |
| last-chance | Last Chance | 7.29 × 12 |
| your-humanity | Your Humanity | 12 × 7.225 |
| death-and-decay | Death And Decay | 7.23 × 12 |

Verification: all ten preview JPEGs decode, strip source metadata and preserve print-file composition. DOM interaction checks open all ten detail dialogs with correct print specifications; room filters pass and EAT MORE FOOD is not duplicated. Browser review at desktop 1363px and in a 390px iframe (375px layout area after scrollbar) shows full images, usable detail sheet and no horizontal overflow. No real private catalog data was embedded in the disconnected Workspace demo.

**Release state:** source-only update to existing draft PRs #1 and #295. No source pin changed, no main merge, no Vercel promotion, and no here.now publication is claimed. Existing authenticated catalog persistence remains unimplemented, so private-seed durability in Git is not cross-device application persistence. The existing version-aware full-site publisher must include this public source head, preserve the current Workspace build and complete the usual readback before claiming the showroom live. The earlier redface/fathertime one-original reconciliation remains a separate recorded follow-up, not a new original count introduced by this intake.


## Owner authorization and flower-photo follow-up

Owner explicitly authorized publishing artwork previews, descriptions and print dimensions to public `tk-ap/ashwood-info` through existing draft PR #295. This authorizes the source update; it does not authorize main merge or production deployment. Prior approval-review block was resolved by that explicit owner message.

The additional owner photo is matched to the existing `flowers` / Two flowers / mirrored forms entry, not a new original. Updated with a room/easel-free, metadata-stripped preview and proposed 12 × 8.79 inch print study (2400 × 1758 pixels, 200 DPI sRGB). Original physical measurements/support remain unverified. Full-resolution print master, source photograph and private preparation references are excluded from the public repository. Existing private Studio intake carries the linked derivative and attributed preparation history.

## One sheet / two newly prepared sides — 2026-10-25

Owner supplied both sides of one sheet and explicitly confirmed the pairing. Added ONE showroom card, `care-faces`, linked to private Studio work `ash-pw-care-faces-01` (private intake commit `3a6348ac11aa3b281d5fd26d08348742b21ef1bf`). Side A/B are recording labels; “Don’t Care / Faces & Places” is a descriptive working title, not artist-confirmed. No original measurements, exact media, completion dates, prices or sale status are inferred.

Two independent print studies: Side A landscape 2400 × 1746 / 12 × 8.73 in; Side B portrait 1765 × 2400 / 8.825 × 12 in. Both are 200 DPI sRGB PNGs, full visible composition, no added margins, and conventional perspective correction/cropping only. Slight estimated ratios from the two photos do not imply different physical sheets. Floor/background excluded. Physical proof remains pending; public source contains JPEG previews only.

Existing detail dialog now provides native, keyboard-operable Side A / Side B buttons for multi-surface records; selected image, alt text, surface description and print size update together. One-sided entries hide/reset those controls. Desktop and 390px iframe browser checks verified both images, selection state, specifications, native Enter-key activation and no horizontal overflow. EAT MORE FOOD regression check passed. Source change remains on existing draft PR #295; no main merge or here.now/Vercel deployment claimed.
