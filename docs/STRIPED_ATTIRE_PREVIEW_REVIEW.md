# Striped Attire spotlight — preview review

Source: current main and Vercel production both `0e9d155a60a8bbaa54621e236b3bdb7d30f6e8ce`. Authoritative page: `modeling/index.html`; styles: `portfolio/portfolio.css`; interactions: `portfolio-lightbox.js` and existing portfolio scripts. Open PRs inspected; no existing Striped Attire implementation found. Workspace branches were not incorporated.

## Asset recovery and fidelity

Recovered all 20 earlier uploads and all 13 subsequent photos. Earlier upload #10 occurs twice with identical SHA-256, so 33 uploads contain 32 distinct photographs. Earlier numbering 1–19 is retained from the crop archives; subsequent review numbers are matched to the existing named crops. No missing photographs have been fabricated.

Original JPEG uploads remain unchanged in the owner's file collection, separate from public web crops. Original filenames, SHA-256, exact crop boxes, output dimensions and ranked choices are recorded in `modeling/striped-attire-assets.json`. The exported WebP files are lossless and verified pixel-for-pixel against the corresponding original crop. No color adjustments, retouching, upscaling, stretching or generative edits. Small extra edge trims on newer images remove the slanted Polaroid aperture edges. Source originals are not served by the site. Visually reviewed: public campaign park setting; no readable addresses, residential identifiers or precise location credits added. Exported files have no EXIF/geotags.

## Ranked edit

| Rank | Review photo | Portfolio role |
| --- | --- | --- |
| 1 | #24 | Direct gaze |
| 2 | #27 | Hands in hair |
| 3 | #25 | Side profile |
| 4 | #10 | Seated in blue overalls |
| 5 | #18 | Orange striped shirt |
| 6 | #1 | Polaroid toss |
| 7 | #16 | Pink striped shirt |
| 8 | #32 | Seated outfit detail |

Selection is the recommended eight-image edit of the recovered collection, pending TK's visual approval. #21 remains an alternate; #25 and #32 have been retained to add profile and outfit detail. No provisional substitute assets were needed. Photographer credit verified by TK during implementation: all photos by Dylan, owner and upcycler; linked to @itndylan. Individual clothing-label attribution is not inferred from this. Brand attribution links only to the user-identified @stripedattire account; no official website or additional commercial claims are invented. Owner will provide an optional official brand reference.

## Implementation

Shared data-driven static campaign renderer: `scripts/render-modeling-campaigns.mjs`, `modeling/campaigns.json`. Run `node scripts/render-modeling-campaigns.mjs` after editing campaign data; `--check` detects stale output. No browser JavaScript is required to see campaigns. The existing BARELYSAIN gallery rules are extended through a shared selector with equal specificity. Its 15 photographs, frame classes, loading behavior, credit and interactions remain intact. Its introductory sentence now reflects selected work. Other modeling sections are preserved with sequential numbering. Booking links are unchanged; hero campaign link now points to Striped Attire.

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
| 7430AEED-6DBB-4C4D-B5DC-FB4A179001B0.jpeg | Selected, rank 6, review #1 |
| 745A375E-4618-4372-AA93-7BBDF6AC7801.jpeg | Reviewed; reserve / omitted for redundancy |
| 7A8E3BA7-67ED-4C4A-B863-BE7F3BD0E2F8.jpeg | Reviewed; reserve / omitted for redundancy |
| 7B43C2A5-B1C6-4C6C-9691-6F8FB3792602.jpeg | Reviewed; reserve / omitted for redundancy |
| 7F6D3A44-CD28-45C9-B2BC-C601B034A131.jpeg | Reviewed; reserve / omitted for redundancy |
| 8FEEF8AB-01C6-42A1-A825-1C36CEEB567D.jpeg | Selected, rank 5, review #18 |
| A30E78B0-315E-46E6-B485-FE114CB098AB.jpeg | Reviewed; reserve / omitted for redundancy |
| A60F1282-382B-4244-A8C2-5EEDE5389188.jpeg | Reviewed; reserve / omitted for redundancy |
| B4ECD10B-A798-4366-B8E7-16981C26FAAA.jpeg | Reviewed; reserve / omitted for redundancy |
| B513EE6C-D597-45D2-9E24-C0AFE20DFA8A.jpeg | Selected, rank 7, review #16 |
| ECAA539D-EE48-488F-AE22-D153BC8E927B.jpeg | Reviewed; reserve / omitted for redundancy |
| EECD142A-DAB6-4471-A64A-2C501A5CE29E(1).jpeg | Reviewed; reserve / omitted for redundancy |
| EECD142A-DAB6-4471-A64A-2C501A5CE29E.jpeg | Duplicate of EECD142A-DAB6-4471-A64A-2C501A5CE29E(1).jpeg |
| 006F2DB7-472A-449F-BC66-6E52A295EAD5.jpeg | Reviewed; reserve / omitted for redundancy |
| 0445666B-F416-43A4-95CC-4C64EC621609.jpeg | Reviewed; reserve / omitted for redundancy |
| 116292E3-E31C-454F-9E6C-FBC71C1C8F53.jpeg | Selected, rank 1, review #24 |
| 51C57097-9DA9-4243-9C8A-8D53C0EEB3BF.jpeg | Reviewed; reserve / omitted for redundancy |
| 8048E6A0-3AAC-42C8-91E6-D522B9783B3B.jpeg | Selected, rank 8, review #32 |
| 88680B6C-2F73-4BE2-A145-7B22D5BA9DE5.jpeg | Selected, rank 3, review #25 |
| 88CD4132-3CC6-44BB-8742-5C8359481466.jpeg | Reviewed; reserve / omitted for redundancy |
| 991BF991-A292-400B-A601-77C995EC1B1C.jpeg | Reviewed; reserve / omitted for redundancy |
| 9D0AD012-3060-4B09-97E8-0A7BAF6971F8.jpeg | Reviewed; reserve / omitted for redundancy |
| A1C400D2-0059-4C2B-A6B2-066267F74DE5.jpeg | Reviewed; reserve / omitted for redundancy |
| DE4324BB-DFAB-4E96-9434-9911E7CE8AD2.jpeg | Selected, rank 2, review #27 |
| E9A40F58-EED6-426F-9DB2-C729B791BB04.jpeg | Reviewed; reserve / omitted for redundancy |
| EA87900F-FA6E-43F3-B4BB-F7756B028CB3.jpeg | Reviewed; reserve / omitted for redundancy |
