# Claude Handoff — Mac → Omarchy Media Migration

Updated: 2026-09-08

## Objective

Move TK's large creative-media library from the Mac to the Omarchy workstation cleanly, without manually curating thousands of photos during transfer.

Canonical role split:
- **Omarchy = master working archive**
- **Mac = capture / creative workstation**
- **Syncthing = ongoing automatic bridge**
- **LocalSend = one-off AirDrop replacement**
- **External SSD + rsync = preferred bulk migration path**
- **GitHub = code/versioned project material, not master photo/video storage**
- **Google Drive = selected sharing/backup, not the canonical master-media bridge**

Do not delete source files from the Mac until the copied data has been verified.

## Current transfer status

Status verified on Omarchy 2026-09-08.

A LocalSend transfer was attempted for 265 files and appeared to stall at **163/265**. There are actually **thousands of photos total**, so LocalSend should not be treated as the primary full-library migration mechanism.

Three batches were sent on 2026-09-08. `~/ASHWOOD/Modeling/BarelySain/Originals` now holds **292 files (4.4G)**. A full decode pass over all 292 found **291 healthy and 1 corrupt**. There are no zero-byte placeholders left. The wider library has not been attempted.

### Where the transfer stopped

Filesystem birth times show LocalSend ran in two ascending passes, not one:

| Pass | Range sent | Files landed | Outcome |
| --- | --- | --- | --- |
| 1 | IMG_6187 -> IMG_6950 | 111 | Completed |
| 2 | IMG_5413 -> IMG_5720 | 54 | Stalled at `IMG_5720.jpg` |

The whole run lasted about two minutes (11:50:42 to 11:52:43 on 2026-09-08) and died partway through the 5xxx pass. **`IMG_5720.jpg` is the last file that arrived.** The 6xxx pass appears complete, so the missing ~100 files are almost entirely 5xxx originals above IMG_5720.

A manifest of the 165 received filenames is written to `~/ASHWOOD/Modeling/BarelySain/localsend-received-165.txt` on Omarchy, for diffing against the Mac-side source folder before re-sending. Note that inode ctimes on these files were all rewritten by a later bulk operation and are useless for ordering; use birth time (`stat %W`/`%w`) instead.

### Verification: neither file count nor file size proves delivery

Transfers in this migration failed in three distinct ways, and each one defeats a different cheap check. Only a decode pass catches all of them.

| Failure mode | Example | Size on disk | Caught by |
| --- | --- | --- | --- |
| Zero-byte placeholder | 25 files across IMG_6091-6117 | 0 bytes | `find -size 0` |
| Truncated at a round boundary | `IMG_6089-edited.jpg` | exactly 4194304 bytes (4 MiB) | decode test only |
| Corrupt committed asset | `assets/campaigns/barelysain/IMG_6881-edited.jpg` | 5.3MB, plausible | decode test only |

The first mode is the dangerous one for automated checks: a correctly named empty file passes a filename check, passes an identifier search, and is counted by `find` and `ls`. An archive reporting 253 files was in fact 228 images and 25 empty placeholders, in a contiguous IMG_6091-6117 block that none of the 18 BarelySain identifiers touch.

The second mode defeats the fix for the first. `IMG_6089-edited.jpg` arrived truncated to exactly 4 MiB where its neighbours run about 13MB, so it has a correct name **and** a non-zero, entirely plausible size. Nothing short of decoding it reveals the problem.

**Audit every batch on arrival.** The cheap checks first:

```bash
ARCH=~/ASHWOOD/Modeling/BarelySain/Originals
echo "total:     $(find "$ARCH" -type f | wc -l)"
echo "zero-byte: $(find "$ARCH" -type f -size 0 | wc -l)"
find "$ARCH" -type f -size 0 -printf '  %f\n'
find "$ARCH" -type f -size -6M -printf '  %10s  %f\n' | sort -n   # size outliers
```

Then the decode pass, which is slow but authoritative — budget several minutes for a few hundred stills:

```bash
for f in "$ARCH"/*; do
  err=$(magick identify -verbose "$f" 2>&1 >/dev/null \
        | grep -iE 'corrupt|premature|error' | head -1)
  [ -n "$err" ] && echo "$(basename "$f"): $err"
done
```

Never treat file count, filename presence, or a plausible file size as evidence that data arrived.

### Integrity status (2026-09-08)

A full decode pass over all 292 archived files returned a single failure:

```text
IMG_6089-edited.jpg   Premature end of JPEG file
```

`IMG_6089-edited.jpg` is truncated to 4194304 bytes and has no intact copy anywhere on Omarchy. It is the **only outstanding file** in the archive and must be re-sent from the Mac. It is not part of the V3 arc.

The other 291 files decode cleanly, including all nine V3 masters.

For bulk migration, prefer an **exFAT external SSD + rsync**. Syncthing can then maintain selected active folders across Mac and Omarchy after the initial migration.

Blockers as of this update: no external SSD is attached (`lsblk` shows no removable device) and the Syncthing user unit is `inactive`. The bulk leg cannot start until the SSD is connected.

**Capacity check before the bulk copy:** `/home` has **73G free** of 111G. Archived masters average ~15MB each, so a library of a few thousand full-res stills — before any video — can plausibly exceed the remaining space. Decide whether the canonical master archive lives on internal disk or on the external SSD before starting the bulk transfer.

## Canonical ASHWOOD archive target

Create/use:

```text
~/ASHWOOD/Modeling/BarelySain/Originals
```

Longer term, organize creative originals under predictable ASHWOOD paths rather than scattering masters between Drive, GitHub, downloads, and old devices.

## Immediate BarelySain / TikTok need

Do **not** manually inspect thousands of photos to find the needed images. Once the library or relevant batches are present on Omarchy, locate candidate originals by filename/number.

Known ASHWOOD BarelySain repo-era identifiers:

```text
6729
5688
5859
5539
6201
6420
6881
6474
6718
6050
6238
6339
6716
```

Known newer Malibu candidates:

```text
6475
6487
6751
6759
6816
```

Search Omarchy after transfer with the command below. Constrain the search to media extensions: bare four-digit patterns also match git objects and content hashes, which returned 85-128 spurious hits per identifier when run unfiltered.

```bash
for id in 6729 5688 5859 5539 6201 6420 6881 6474 6718 6050 6238 6339 6716 \
          6475 6487 6751 6759 6816; do
  echo "### $id"
  find ~/ -type f \( \
    -iname "*${id}*.heic" -o -iname "*${id}*.jpg"  -o -iname "*${id}*.jpeg" -o \
    -iname "*${id}*.png"  -o -iname "*${id}*.mov"  -o -iname "*${id}*.mp4"  -o \
    -iname "*${id}*.dng"  -o -iname "*${id}*.raf" \
  \) -printf '%10s  %p\n' 2>/dev/null | sort -rn
done
```

## TikTok context

The next content task is TK's **first modeling TikTok**. TikTok has previously seen build videos and physical art, but not modeling. This should introduce modeling as another part of TK's practice rather than read like a leftover campaign recap.

Target V3 visual arc once originals are available:

1. gray car detail
2. rusted-fence full body
3. DTLA crosswalk
4. IMG_6475 close portrait
5. IMG_6487 car pose
6. Malibu two-person beach/car frame
7. IMG_6751 mountain pose
8. IMG_6759 mountain hero
9. IMG_6816 full-body finish

Narrative structure: **detail → model → city → campaign → coast → editorial payoff**.

Some overlap with Instagram and the ASHWOOD portfolio is intentional because this is the strongest first modeling introduction, not an exercise in zero repetition.

Current proposed native TikTok text:

> apparently this app hasn't seen me model yet

Current proposed caption:

> another tab

Do not bake the text into the video; add it natively in TikTok.

## Existing ASHWOOD repo assets

The website repo is `tk-ap/ashwood-info`. Existing campaign web assets live under:

```text
assets/campaigns/barelysain/
```

The repo versions are web assets, not necessarily the desired master originals. The migration goal is to recover/use the original creative files from the Mac/Omarchy archive whenever possible.

## Identifier recovery status (2026-09-08)

**All 18 identifiers now have full-resolution masters in the archive.**

Recovered across two batches plus a manual sweep of `~/Downloads`:

- `6759` and `6816` were found in `~/Pictures/BarelySain-contact-sheets/source/BarelySain/` and copied in as HEIC masters.
- `5859` and `6050` arrived in the second batch as genuine 3024x4032 masters, replacing the 1350x1800 web derivatives that were previously the only copies.
- `6716` was recovered from `~/Downloads/IMG_6716-edited.heic` (31.4MB), verified against the committed web asset as the same frame. Its RAW original `IMG_6716.DNG` was archived alongside it, together with the `IMG_6717` HEIC/DNG pair from the same setup.

Sixteen further files in the IMG_6100-6117 range were present in the archive only as zero-byte placeholders and were repaired from full copies in `~/Downloads`. All twenty copies were byte-verified with `cmp` against their sources.

### Still outstanding

A third batch on 2026-09-08 delivered the nine files that were previously zero-byte placeholders, together with the rest of the IMG_6091-6120 range, which is now complete at 30 of 30. Forty-four files were copied in from `~/Downloads` and every one was byte-verified with `cmp` against its source.

The only file still missing from the archive is `IMG_6089-edited.jpg`, which arrived truncated. It is not part of the V3 arc, so the TikTok edit is not blocked.

Sixteen files also arrived twice, as `IMG_6114.jpg` and `IMG_6114 (2).jpg`. The `-edited` twins are byte-identical. The unedited masters differ in pixel data, but both copies are Q=100 at identical dimensions with the same capture timestamp, camera and AfterShoot export software, so they are two non-deterministic exports of the same frame rather than an original and a degraded copy. The plain-named copy was archived and every `(2)` was left untouched in `~/Downloads`.

## TikTok V3 source list

All nine frames have masters. The full list, with per-frame dimensions and edit caveats, is generated on Omarchy at `~/ASHWOOD/Modeling/BarelySain/tiktok-v3-source-list.md`.

| # | Frame | Source file |
| --- | --- | --- |
| 1 | gray car detail | `IMG_6729-edited.jpg` |
| 2 | rusted-fence full body | `IMG_5688-edited.jpg` |
| 3 | DTLA crosswalk | `IMG_5539.jpg` |
| 4 | close portrait | `IMG_6475-edited.jpg` |
| 5 | car pose | `IMG_6487-edited.jpg` |
| 6 | Malibu two-person beach/car | `IMG_6716-edited.heic` |
| 7 | mountain pose | `IMG_6751-edited.jpg` |
| 8 | mountain hero | `IMG_6759-edited.heic` |
| 9 | full-body finish | `IMG_6816-edited.heic` |

Frames 1, 2, 3 and 6 are described only by content in this handoff and are not labelled in the site markup, whose alt text reads "BARELYSAIN campaign frame N". They were identified visually from contact sheets built in a scratch directory; the originals were not modified.

Two caveats for the edit:

- **Frame 3 (`IMG_5539.jpg`)** is the only landscape original: 4011x3008 with EXIF Orientation=6. It displays portrait in EXIF-aware tools but renders sideways in anything that ignores EXIF. Bake the rotation into a working copy first.
- **Frames 6, 8 and 9 are HEIC.** Decode to a lossless intermediate rather than re-encoding to JPEG if the NLE struggles. The six JPG sources are 3024x4032 and crop cleanly to 9:16 at 2268x4032.

## Corrupt committed asset

`assets/campaigns/barelysain/IMG_6881-edited.jpg`, used as site frame 7, is a corrupt JPEG: 4005 extraneous bytes before marker 0xd2 and a premature end of data segment. The archive master `IMG_6881-edited.jpg` is clean, so the committed web asset should be regenerated from it. Not part of the V3 arc.

## Guidance for Claude

1. Help finish the Mac → Omarchy migration reliably; do not make TK manually curate thousands of files during transfer.
2. Prefer resumable/verifiable bulk-transfer methods for the full library.
3. Preserve originals and metadata; avoid recompressing masters during migration.
4. Once enough files are present on Omarchy, locate the BarelySain candidates by filename first.
5. Help identify the exact originals corresponding to the ASHWOOD site frames.
6. Do not delete anything from the Mac until counts/sizes and representative files are verified. Counts alone are not enough: failed transfers here produce correctly named zero-byte files, so check `find -size 0` and compare sizes before treating a batch as delivered.
7. After the originals are identified, they can be used to complete the clean 9:16 TikTok V3 edit.