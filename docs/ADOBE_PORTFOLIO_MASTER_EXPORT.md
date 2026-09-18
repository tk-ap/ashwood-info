# Getting the Adobe Portfolio back catalogue out

The bulk of TK's modeling portfolio lives on `tkashwood.myportfolio.com` rather than in the
ASHWOOD archive. This document covers both halves of moving it: the automated half that is
already solved, and the manual half that needs an Adobe login.

## Half one — automated, already working

```bash
tools/fetch-adobe-portfolio.py --dry-run    # see what is there
tools/fetch-adobe-portfolio.py              # download to ~/ASHWOOD/Portfolio/adobe-export
```

Re-running is safe; existing files are skipped, so it can be used to pick up new work later.

### What it gets, and the ceiling

Adobe serves every asset as an un-suffixed original plus `_rw_<width>` renditions (600,
1200, 1920, sometimes 3840). The script keeps the best variant each page actually
references.

As of 2026-09-08 that is **65 unique assets**:

| Best available | Count |
| --- | --- |
| Original | 10 |
| `_rw_1920` | 48 |
| `_rw_1200` | 7 |

The ten originals are real masters — the largest is 6000x4000. The other 55 top out around
2048px on the long edge.

**The ceiling is not a limitation of the script.** The `?h=` hash on each URL is enforced
per variant: requesting an original without the hash returns 400, and with a wrong or
borrowed hash returns 403. Only URLs actually present in the page HTML can be fetched, so
where Adobe does not reference the original, it cannot be reached from outside.

Two smaller notes. Extensions are case-sensitive and Adobe mixes `.jpg` and `.JPG`, which is
easy to miss and silently halves a naive scrape. Project-card crops (`_car_`, `_carw_`) are
derivatives of assets already collected and are skipped.

## Half two — manual, needs an Adobe login

For true masters of the 55 rendition-only assets, the source is the Adobe account, not the
public site. Portfolio is a publishing surface over Creative Cloud; the files uploaded are
still in the account.

Try these in order. The first that has the originals wins, and it depends on how each
project was uploaded.

**1. Lightroom, if the work was ever synced there.** `lightroom.adobe.com` → select the
album → File → Export → **Original + Settings**. This is the only path that returns the
untouched camera file, RAW included, and is worth checking first.

**2. Creative Cloud assets.** `assets.adobe.com` → Your Files / Synced Files. If projects
were uploaded from a synced folder the originals are still there at full size. Select and
download; a multi-file selection arrives as a zip.

**3. Behance.** Portfolio and Behance share an Adobe identity, and Portfolio projects are
frequently imported from Behance. On a Behance project, Adobe keeps the uploaded source
rather than only the display rendition, so a project imported that way may expose a larger
file than the Portfolio page does.

**4. Portfolio's own admin.** Editing a page in Portfolio and opening an image in the media
manager sometimes exposes a download of the uploaded file rather than the published
rendition. Inconsistent, but free to check while you are in there.

If none of the four has them, the originals were never uploaded — the renditions in
`~/ASHWOOD/Portfolio/adobe-export` are then genuinely the best copies that exist, and the
masters are on whatever drive or phone they were shot from.

### Where to put what you export

```text
~/ASHWOOD/Portfolio/masters/<project-or-shoot-name>/
```

Keep the export beside `adobe-export/` rather than merging into it, so it stays obvious
which files came from an authenticated export and which came off the public site.

## Verify anything you bring across

The media migration into this archive failed three separate ways, and two of them produce
files that pass a filename check and a size check. Run the same audit on any Adobe export:

```bash
D=~/ASHWOOD/Portfolio/masters
find "$D" -type f -size 0 -printf '  zero-byte: %f\n'
find "$D" -type f -size -100k -printf '  suspiciously small: %10s %f\n' | sort -n
for f in "$D"/*; do
  err=$(magick identify -verbose "$f" 2>&1 >/dev/null | grep -iE 'corrupt|premature' | head -1)
  [ -n "$err" ] && echo "  corrupt: $(basename "$f")"
done
```

See `docs/CLAUDE_MEDIA_MIGRATION_HANDOFF.md` for why a plausible file size is not evidence
that data arrived.

## What this unblocks

The 65 recovered assets are enough to rebuild the modeling page on ASHWOOD without waiting
for the Adobe export, since roughly 2048px on the long edge is more than a web page needs.
What the renditions are *not* good enough for is print, aggressive re-cropping, or a 9:16
video cut that needs to fill 1080x1920 from a landscape frame.

The runway assets already in this repo (`assets/runway/up-next-*.jpg`) are 1080x1920 and
need none of this.
