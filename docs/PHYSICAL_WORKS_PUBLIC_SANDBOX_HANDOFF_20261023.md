# ASHWOOD Physical Works — public-sandbox intake and reconciliation
**Captured:** 2026-10-23. **State:** REFERENCE REVIEWED; ROUTE/ASSETS/QA NOT IMPLEMENTED OR PUBLISHED.
**Reference:** https://sentient-citrus-rf4k.here.now/ (separately shared, static, public-copy snapshot)
**Existing public sandbox:** https://mighty-yoga-pgph.here.now/
**Existing intended entry:** /work/ → Physical Works (currently a non-link `<section class="practice practice--physical">`, labelled "Objects / studies / archive forming")
**Production:** https://ashwood-info.vercel.app/ — do not update until an explicit production release gate.
**GitHub change location:** tk-ap/ashwood-info existing **draft PR #295** (`codex/here-now-current-staging`), stacked on #294. Do not create another site, PR, inventory, or database for this.

## Assessment and boundaries

The new link is **not** the canonical ASHWOOD site and is **not** the 3D Brain. It is a separate *Physical Works Showroom — Share Reference* describing 12 original physical works, 23 photographs, their material/process context, and a behind-the-scenes record. Its page explicitly calls itself a **static share reference** and says the underlying **studio inventory remains source of truth**. It also notes an internal private layer *excluded* from the share copy. Treat this reference as a versioned snapshot to reconcile with the actual studio inventory, not as authority to publish additional private notes or price/sale information.

The existing ASHWOOD public /work/ page already enumerates the creative practices including Physical Works, but that section is not clickable and no corresponding asset directory exists under canonical `assets/` on this staging branch. The public site currently provides no visitor-facing Physical Works gallery from that route.

**Decision for staging:** Preserve the existing public site and complete Physical Works as **a route under its Work creative practice**, not a link to a permanently separate here.now destination. For example, `/physical-works/` if no already canonical art URL exists; check current links before choosing. Keep the current modeling, music, performance, words, and professional-evidence separation. In the sandbox, use the same shared header, palette, typographic hierarchy, mobile behavior, and existing accessibility conventions. Do not reproduce the share-copy's "About this copy" disclosure on the visitor-facing site.

## Reference inventory — 12 entries

These are **transcribed reference claims only**, with their source photograph basename (relative to the share reference). They require artist/studio reconciliation for inventory status, exact mediums, dimensions, authorship/rights, naming, and permissions.

| # | Display/working title | Source image filename | Reference state / publication issue |
|---|---|---|---|
| 01 | Love Is Not Poison | love-is-not-poison.jpg | Finished; prints in preparation, original decision unresolved. Clay low-relief head on black canvas with pastel and handwriting. Artist earlier clarified sculpted clay colored with oil and soft pastels, adhered to canvas; crayon lettering. Do not flatten this to a drawing. |
| 02 | Love Thy Self As Thou Love Thy Neighbor | love-thy-self-wall.jpg | Finished/hanging; begun April 2024; modeling paste, shaved soft/oil pastel, sand. Approx. 30 × 30 in **artist estimate**, confirm before listing. |
| 03 | A collection of me — the heart | heart-front.jpg | Concept/anchor; gifted anatomical heart vase, visibly repaired/damaged. Not for sale per reference. |
| 04 | Bottle Cap Collector | collector-adhocracy.jpg | In progress, still accumulating caps/corks; constructed double-sided clear frames; original/assemblage. |
| 05 | Yellow totem face † | yellow-totem.jpg | Finished; original and print candidate; size suggested from intake photograph, **unverified**. |
| 06 | Possessions † | possessions.jpg | Finished; heavy impasto, 22 × 30 in dual-sided board; reverse pairing uncertain and reshoot requested. |
| 07 | Two flowers / mirrored forms † | two-flowers.jpg | Finished; impasto, 22 × 30 in dual-sided board; reverse pairing uncertain and reshoot requested. |
| 08 | Letter to Father Time — “repentance” | father-time.jpg | Finished handwritten letter-poem on weathered panel; potential poster/print; size described only by board family. |
| 09 | Monumental red face † | red-face.jpg | Finished; paint/pastel on board; recurring face motif; reshoot before market. |
| 10 | EAT MORE FOOD | eat-more-food-book.jpg | Finished 2024 sketchbook page; original stays bound; print is potential sale form. |
| 11 | The Unposted Board † | whiteboard-poems.jpg | Framed whiteboard with four **unreleased** signed poems. Treat verbatim contents and high-resolution legibility as **publication-review REQUIRED** even though share page is public. |
| 12 | First painting — tree and house | first-painting.jpg | Artist origin piece signed 2007, saved on paper; **not for sale**; prefer flat scan eventually. |

† indicates a **working title supplied by the share page**, not an artist-confirmed final title. Do not silently finalize it. The share page's "23 photographs" is its count, **not** confirmation that 23 independent high-resolution originals have been transferred into the canonical repo.

## Useful gallery interaction patterns

- Editorial gallery wall with actual images and a lead piece, rather than a generic "archive forming" card.
- Visitor-selectable rooms/filters: whole wall; anchors and foundation; originals; works on paper; in progress and concept. Do not imply mutually exclusive categories when a work spans several.
- Per-piece detail view with finished/in-progress/concept distinction, materials, origin, dimensions where verified, visual process photos, and public-facing behind-the-scenes notes. Open via click/tap/keyboard; provide close/escape/focus return and proper mobile viewport.
- Contextual through-lines from the reference: recurring face, handwriting as physical material, visible damage/accident, and how impasto and assemblage intersect. Attribute these as *gallery interpretation*, not unchallenged artist statements unless confirmed.
- Distinguish **original**, **potential print**, **not for sale**, **working title**, and **reshoot needed** without adding unapproved prices or buy buttons.
- Offer clear public navigation back to `/work/`; keep no separate permanent domain, no duplicate catalog authority, no new Workspace/ALVIRA source.

## Material, privacy, and provenance gates before public code release

1. Reconcile the **studio inventory** with all 12 entries, medium specificity, materials, original dates, print readiness, titles, dimensions, and public-sale intent. Do not convert guesses ("~8×10", "board family", "reverse pairing") into asserted specifications.
2. Determine which of the **23 photos** are approved for reuse. Localize authorized images under the canonical public site's assets instead of indefinitely hotlinking to the separate ephemeral here.now host. Preserve attribution and image alt text.
3. Confirm release of unreleased poems in "The Unposted Board" and any original unpublished text visible in large images. If uncertain, omit readable close-ups and full texts; allow only an explicitly approved teaser or withhold that piece.
4. Exclude the **private internal notes layer** referenced by the share copy; do not copy private process notes, inventories, unpublished prices, personal data or contact details.
5. Implement in the current **#295 staging branch**, preserving the public-route consolidation stack and complete-site assembler; do not merge to `main` to obtain a here.now update.
6. Update `/work/` Physical Works entry from inert placeholder to a link **only when the destination exists in the assembled artifact**. Keep other disciplines and canonical navigation operational.
7. Add asset-presence and privacy checks for the new route in `scripts/build-here-now-staging.mjs` only **after** the gallery exists; do not prematurely make the currently working build fail.
8. Rebuild complete static artifact, run tests, inspect 390px and desktop, gallery cards/modals/filters and links, image failures, keyboard navigation, and no page-level horizontal overflow.
9. Use here.now **in-place stale-version-protected update** for the existing `mighty-yoga-pgph` slug. Record new provider version, deployed source SHA, manifest readback and screenshots. Do not claim live until verified.
10. Production `ashwood-info.vercel.app` stays unchanged pending explicit owner authorization.

## Source-vs-deployment truth

Verified today: supplied gallery reference is HTTP 200 and contains the 12 public-copy descriptions; existing here.now `/work/` is HTTP 200 and Physical Works is unlinked. Existing public repo staging branch has no `assets/physical-works` folder. The snapshot's `/staging-manifest.json` is 404, so it is not the canonical combined public-site staging bundle.

Not verified: all 23 full-resolution images exist outside the share reference; works and prices are approved for direct publication; new gallery route built; staging site updated; Vercel production deployed. **This document registers the required public-site updates but does not itself publish them.**

**Completion evidence:** a visitor can reach the native Physical Works gallery from ASHWOOD `/work/` on the existing sandbox; every approved piece opens with correct photos and accurate process notes; risky/unreleased material is appropriately gated; manifest and provider readback prove the expected revision; all public routes remain intact.
