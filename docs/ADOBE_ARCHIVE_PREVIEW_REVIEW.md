# Adobe modeling archive review

## Owner-requested Vercel review (2026-11-09)

TK requested a Vercel preview for the modeling portfolio updates. The existing archive branch is authorized for Preview deployments, with a branch-specific build exception. This supplements the previously verified here.now review; it does not authorize a merge or production promotion.

Status: implemented on `feature/adobe-archive-stories`; owner visual approval and production promotion remain pending.

## Result

The modeling page now shows twelve selected archive photographs rather than the mixed catch-all grid. `/modeling/archive/` provides four studio stories, three dated runway/backstage events, and a separate historical-digitals section. The deeper gallery contains 38 photographs: 27 studio/portrait, 9 event, and 2 undated black tee digitals. Twenty-three original source images are newly imported; existing matched photographs retain their tracked source paths.

Overview IDs from the approved photo map: P03, P09, P13, P20, P22, P28, P30, P32, P36, P39, P40, P42.

Studio sequences: Tailoring P03/P07/P09/P08/P10/P06; Denim P02/P11/P13/P16/P17/P18/P19/P20; Streetwear P22/P26/P28/P30/P32/P34/P36; Expression P37/P39/P40/P41/P42/P43.

Events: ALIVE F03/F05/F01 (Hollywood, October 21, 2023); LA Fashion Week Festival F10/F08/F09/F11 (Santa Monica, March 11, 2023); Up Next F12/F13 (San Antonio, January 1, 2023). F01 is correctly described as backstage rather than a runway walk. Historical digitals: D06/D08, explicitly undated.

## Provenance and holds

Source: TK's Adobe Portfolio, using the November 4 `ASHWOOD_Archive_Photo_Map.html`. Exact source URLs, captions, descriptions, dimensions and retained paths are recorded in `modeling/archive/photos.json`. No photographer or shoot date was invented. Full captions remain available in the image viewer, including host/designer credits.

D01/D02/D03/D05, the October 2023 outdoor turtleneck set, are withheld from the new gallery pending location provenance review. Only D01/D02/D05 would have been newly imported; this reduces the map's 26 proposed additions to 23. Existing D03's asset remains in the repository. Location/reserve P01/P21 and unresolved white-tank source images remain outside this first edit. Existing source assets have not been deleted. No family material or new outdoor digitals were imported.

New source images retain the full frame and source dimensions; EXIF is removed. Lighter WebP gallery files open the full JPEG source in the existing accessible viewer. Landscape and portrait frames keep their original proportions. Mobile uses one column.

## Scope and verification

- Campaign markup and current digitals were compared to main and remain byte-for-byte unchanged.
- Eight existing viewer/public-discovery tests pass.
- All 38 original/delivery pairs decode; new originals contain no EXIF; overview contains exactly 12 images.
- Desktop layout, a 390px-wide embedded mobile viewport, and credited full-screen viewing were visually checked. The mobile check is a width-constrained browser frame, not device emulation.
- No production merge or deployment. The preview uses only the canonical here.now sandbox. Its publisher applies the archive section to the live modeling document and retains unrelated provider files by hash, using `baseVersionId` to reject concurrent changes.
- The temporary import/publish workflows are removed from the final PR; they are review-branch preparation only.

Canonical main at preparation: `3e6e9e503de64cc1287a6a1e002cc3d82061cdb3`. Production observed at `0c22d1e52c66ba7d9bbf1153cf0fa14ad81260ac`, Vercel project `ashwood`. No Vercel Preview was requested.

The modeling routes load a scoped copy of the tested viewer (`modeling/archive/viewer.js`) so an older sandbox shared viewer cannot omit source captions or full-resolution upgrades. Other routes keep their existing viewer.

## Verified sandbox receipt

Preview: https://mighty-yoga-pgph.here.now/modeling/archive/

Current provider version: `01M71FTMBCCYANMC43TFAW5087`. Built source commit: `17164fb411eefb628d4d154b788e2e94e3946b81`. This is an incremental overlay on the existing sandbox, not a replacement of its other content. Initial archive owner-byte readback passed in run 42733084592. The scoped viewer publication and byte verification passed in run 42733223652; final manifest has 314 files. Full-size navigation and source captions were then verified in the browser. The prior timeout was a lost finalize response; fresh provider state established completion before any further mutation. Main remained `3e6e9e503de64cc1287a6a1e002cc3d82061cdb3`.
