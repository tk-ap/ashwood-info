# Striped Attire spotlight — preview review

Source: current main and Vercel production both `0e9d155a60a8bbaa54621e236b3bdb7d30f6e8ce`. Authoritative page: `modeling/index.html`; styles: `portfolio/portfolio.css`; interactions: `portfolio-lightbox.js` and existing portfolio scripts. Open PRs inspected; no existing Striped Attire implementation found. Workspace branches were not incorporated.

## Asset recovery and fidelity

Recovered all 20 earlier uploads and all 13 subsequent photos. Earlier upload #10 occurs twice with identical SHA-256, so 33 uploads contain 32 distinct photographs. Earlier numbering 1–19 is retained from the crop archives; subsequent review numbers are matched to the existing named crops. No missing photographs have been fabricated.

Original JPEG uploads remain unchanged in the owner's file collection, separate from public web crops. Original filenames, SHA-256, exact crop boxes, output dimensions and ranked choices are recorded in `modeling/striped-attire-assets.json`. The exported WebP files are lossless and verified pixel-for-pixel against the corresponding original crop. No color adjustments, retouching, upscaling, stretching or generative edits. Small extra edge trims on newer images remove the slanted Polaroid aperture edges. Source originals are not served by the site. Visually reviewed: public campaign park setting; no readable addresses, residential identifiers or precise location credits added. Exported files have no EXIF/geotags.

## Current owner-approved exclusions and sequence

TK excluded #27 (hands in hair) and #16 (pink stripes with undershirt showing at the collar). Neither appears in the rendered gallery or image viewer. Original files remain preserved separately.

Current six-frame preview sequence: **#1 → #18 → #4 → #25 → #11 → #2** (contact-sheet **A08 → A13 → A07 → B06 → A16 → A06**). #24 / B03 remains exclusively the page hero. #10 and #32 are reserves; #16 and #27 remain excluded. The sequence alternates looks while making room for Dylan’s original double exposures.

Both campaign headers go directly to the Photography & creative direction / Brand contact structure, with Dylan linked at @itndylan and Cashden at @cashdenglobal.

## Image delivery diagnosis and correction

The first eight lossless crops totalled 8,174,264 bytes with no responsive alternatives. These are static files served by Vercel, not an upload/database/image-generation backend. Observed original asset response: HTTP 200, image/webp, 1,032,100 bytes for #24. Previous browser checks loaded all campaign photographs; that does not rule out intermittent failures on TK's device. Heavy downloads and lazy loading can contribute to blank/late images; no evidence supports blaming TK's connection.

Seven retained pixel-exact lossless masters total 7,178,850 bytes. Web delivery now has 360px, 720px and original-width WebP candidates at quality 90, preserving crop, proportions and color treatment, with no artistic alterations. These are compressed delivery copies, not pixel-identical masters. The seven 720px copies total 933,286 bytes (87% smaller than masters); the 360px copies total 378,338 bytes (95% smaller). High-density devices may select larger candidates. Content-hashed filenames have immutable caching only under the new delivery directory. The Striped Attire hero has high fetch priority; the other six small delivery files load eagerly at low priority so fast scrolling does not first encounter unrequested images. Existing BARELYSAIN lazy-loading behavior is preserved. The lightbox immediately displays the already-loaded delivery image, then upgrades to the untouched full-resolution crop from data-full-src after its load event. An original-load failure leaves the working delivery image visible; an index/open-state guard prevents late loads from replacing a different photograph. Legacy images retain their prior currentSrc/src behavior.

## Implementation

Shared data-driven static campaign renderer: `scripts/render-modeling-campaigns.mjs`, `modeling/campaigns.json`. Run `node scripts/render-modeling-campaigns.mjs` after editing campaign data; `--check` detects stale output. No browser JavaScript is required to see campaigns. The existing BARELYSAIN gallery rules are extended through a shared selector with equal specificity. Its 15 photographs, frame classes, loading behavior, credit and interactions remain intact. Both campaign headers preserve direct creator/brand contacts without generic introductory sentences. Other modeling sections are preserved with sequential numbering. Booking links are unchanged; hero campaign link now points to Striped Attire.

TK explicitly authorized a Vercel preview for this bounded task despite the repository's usual here.now-only preview policy. No production deployment, main merge, project-wide protection change, Workspace modification or paid service is authorized.

## Full recovered inventory

| Original upload filename | Review outcome |
| --- | --- |
| 07139B2A-D7C5-4351-A858-74BAC1839995.jpeg | Reviewed; reserve / omitted for redundancy |
| 165AA7F1-A776-4753-A4F7-4F2DB329E75C.jpeg | Reviewed; reserve / omitted for redundancy |
| 211488B1-16DF-4ADE-9AEE-B23406B9916C.jpeg | Reviewed; reserve / omitted for redundancy |
| 287C4216-E801-46D1-B3E0-B7562B4240CE.jpeg | Reviewed; reserve / omitted for redundancy |
| 2941BA7A-A0DB-4E08-B031-50D9562C8F31.jpeg | Reviewed; reserve / omitted for redundancy |
| 32E28266-62FE-48B2-BB33-09B471735093.jpeg | Reviewed; reserve / omitted for redundancy |
| 5EFFFB45-A2D9-41BE-A4CF-7DC7E90FBECB.jpeg | Reviewed; reserve / omitted for redundancy |
| 7430AEED-6DBB-4C4D-B5DC-FB4A179001B0.jpeg | Selected, strength rank 5, sequence 6, review #1 |
| 745A375E-4618-4372-AA93-7BBDF6AC7801.jpeg | Reviewed; reserve / omitted for redundancy |
| 7A8E3BA7-67ED-4C4A-B863-BE7F3BD0E2F8.jpeg | Reviewed; reserve / omitted for redundancy |
| 7B43C2A5-B1C6-4C6C-9691-6F8FB3792602.jpeg | Reviewed; reserve / omitted for redundancy |
| 7F6D3A44-CD28-45C9-B2BC-C601B034A131.jpeg | Reviewed; reserve / omitted for redundancy |
| 8FEEF8AB-01C6-42A1-A825-1C36CEEB567D.jpeg | Selected, strength rank 1, sequence 1, review #18 |
| A30E78B0-315E-46E6-B485-FE114CB098AB.jpeg | Reviewed; reserve / omitted for redundancy |
| A60F1282-382B-4244-A8C2-5EEDE5389188.jpeg | Reviewed; reserve / omitted for redundancy |
| B4ECD10B-A798-4366-B8E7-16981C26FAAA.jpeg | Reviewed; reserve / omitted for redundancy |
| B513EE6C-D597-45D2-9E24-C0AFE20DFA8A.jpeg | Selected, strength rank 6, sequence 5, review #16 |
| ECAA539D-EE48-488F-AE22-D153BC8E927B.jpeg | Reviewed; reserve / omitted for redundancy |
| EECD142A-DAB6-4471-A64A-2C501A5CE29E(1).jpeg | Reviewed; reserve / omitted for redundancy |
| EECD142A-DAB6-4471-A64A-2C501A5CE29E.jpeg | Duplicate of EECD142A-DAB6-4471-A64A-2C501A5CE29E(1).jpeg |
| 006F2DB7-472A-449F-BC66-6E52A295EAD5.jpeg | Reviewed; reserve / omitted for redundancy |
| 0445666B-F416-43A4-95CC-4C64EC621609.jpeg | Reviewed; reserve / omitted for redundancy |
| 116292E3-E31C-454F-9E6C-FBC71C1C8F53.jpeg | Selected, strength rank 2, sequence 2, review #24 |
| 51C57097-9DA9-4243-9C8A-8D53C0EEB3BF.jpeg | Reviewed; reserve / omitted for redundancy |
| 8048E6A0-3AAC-42C8-91E6-D522B9783B3B.jpeg | Selected, strength rank 7, sequence 7, review #32 |
| 88680B6C-2F73-4BE2-A145-7B22D5BA9DE5.jpeg | Alternate, review #25 (removed from active sequence) |
| 88CD4132-3CC6-44BB-8742-5C8359481466.jpeg | Reviewed; reserve / omitted for redundancy |
| 991BF991-A292-400B-A601-77C995EC1B1C.jpeg | Reviewed; reserve / omitted for redundancy |
| 9D0AD012-3060-4B09-97E8-0A7BAF6971F8.jpeg | Reviewed; reserve / omitted for redundancy |
| A1C400D2-0059-4C2B-A6B2-066267F74DE5.jpeg | Reviewed; reserve / omitted for redundancy |
| DE4324BB-DFAB-4E96-9434-9911E7CE8AD2.jpeg | Selected, strength rank 4, sequence 4, review #27 |
| E9A40F58-EED6-426F-9DB2-C729B791BB04.jpeg | Reviewed; reserve / omitted for redundancy |
| EA87900F-FA6E-43F3-B4BB-F7756B028CB3.jpeg | Reviewed; reserve / omitted for redundancy |

## Brand header revision

TK requested campaign-specific brand headers and the BARELYSAIN Instagram link. BARELYSAIN now links to https://www.instagram.com/barelysain/. Its header uses a native SVG silhouette traced directly from the repeated lowercase yellow-green print in `assets/campaigns/barelysain/IMG_6718-web-v2.jpg`, rather than a substitute font. The vector retains the photographed garment's printed contours; it is not claimed to be an official supplied logo master. SVG source crop provenance is embedded in `assets/brand-marks/barelysain-garment.svg`.

Striped Attire now uses literal blue-and-white horizontal bands clipped into the existing editorial letterforms, reflecting the stripes observed on the clothing and the official https://striped.world/ landing page. The official site is also linked. Both headings retain a single accessible campaign name; the decorative SVG does not become a gallery/lightbox image. Forced-color mode uses readable system colors. Campaign photographs and gallery behavior are unchanged.

## Opening page hero

TK selected #24 as the opening /modeling portrait. The renderer derives it from the newest campaign's `pageHeroImage` data, falling back to that campaign's first image, and updates the opening campaign CTA from the same record. This is separate from #18, which leads the campaign gallery sequence. Existing hero layout/navigation are preserved; the hero uses the same responsive delivery candidates and original-resolution viewer target.

## Archive and booking review

The Archive section is now named Archive. Original Adobe source captions were recovered for 13 of its 17 frames and three of four current runway-strip frames, matched to the exact photographs. They appear below those photographs and in the viewer, with direct photographer links. Five unmatched/uncaptioned frames remain explicitly unresolved in modeling/archive-credits.json. See docs/MODELING_ARCHIVE_BOOKING_AUDIT.md for evidence and booking recommendations.

The opening hero is stored as its own image record under the latest campaign's pageHero, so it can remain #24 while the gallery uses #25. The owner-excluded #27 and #16 remain excluded.

## Alternating looks

TK flagged consecutive overalls frames #10 and #1. #25 now separates them, retaining the seated garment view and energetic toss while alternating looks throughout the gallery: #18 → #10 → #25 → #1 → #32. #24 remains the page hero only.

## Approved face-first edit

TK approved the tighter four-frame recommendation after the Muse review was reconciled against the actual preview. #1 opens with expression and movement; #18 supplies the standing orange/navy look; #11 / A16 replaces #10 with the smiling commercial frame; #25 closes with a profile. #32 is omitted. #18 is a standing portrait with the face visible, not a headless torso detail or a complete feet-in-frame full-length photograph. The recovered inventory remains 33 uploads / 32 unique photographs.

Frame #11 uses the original JPEG crop [159, 238, 1157, 1580], matched to the reviewed crop archive (normalized correlation 0.99990). The WebP master is pixel-identical to that source crop; responsive copies use quality 90. Source colors/composition are preserved beyond border removal. BARELYSAIN assets, order and layout are unchanged; generic image descriptions are replaced with visually verified descriptions. Creator credits remain at campaign level; no per-image location is guessed.

## Experimental expansion for visual review

TK requested adding the layered overalls double exposure (A07 / #4) and an overhead double exposure to the preview. A06 / #2 was selected over A04 because its face and raised-arm gesture read more clearly. The final six-frame sequence alternates overalls → orange/navy → layered overalls → grey/navy profile → smiling overalls → pink/denim overhead. #24 remains hero only. No claim of TK directing or photographing the shoot is introduced. Dylan’s original exposure effects and color casts are preserved; both additions use border-only source crops and pixel-exact lossless masters, with quality-90 responsive web copies. This remains a preview for visual review, without production authorization.

## Release cleanup — November 4, 2026

TK approved the latest six-frame preview visually and requested release cleanup. Removed the temporary `modeling/preview-review.html` route and the task-specific Vercel branch deployment exception; restored the main-only ignore command. Immutable caching for content-hashed campaign delivery assets is retained. No portfolio layout, campaign sequence, music-player placement, authentication, or Workspace changes were made during cleanup. Music-player placement is deferred at TK’s request. This approval covers visual acceptance and release preparation; merge and production promotion remain separate actions.

Preflight: canonical main and production both reference `0e9d155a60a8bbaa54621e236b3bdb7d30f6e8ce`; production is project `ashwood` at `https://ashwood-info.vercel.app`. The approved six-frame implementation is `055451e389c32140bab5b180ca26f45851b9a7df`. GitHub Actions validation is recorded on the release-cleanup PR head.
