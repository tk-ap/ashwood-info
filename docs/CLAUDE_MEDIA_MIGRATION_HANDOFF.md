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

The stalled transfer did land: `~/ASHWOOD/Modeling/BarelySain/Originals` currently holds **167 files (2.5G)** — 165 full-res JPG masters from the LocalSend run, plus two HEIC masters recovered on 2026-09-08 (see below). Roughly **100 files from the 265-file batch never arrived**, and the wider library has not been attempted.

### Where the transfer stopped

Filesystem birth times show LocalSend ran in two ascending passes, not one:

| Pass | Range sent | Files landed | Outcome |
| --- | --- | --- | --- |
| 1 | IMG_6187 -> IMG_6950 | 111 | Completed |
| 2 | IMG_5413 -> IMG_5720 | 54 | Stalled at `IMG_5720.jpg` |

The whole run lasted about two minutes (11:50:42 to 11:52:43 on 2026-09-08) and died partway through the 5xxx pass. **`IMG_5720.jpg` is the last file that arrived.** The 6xxx pass appears complete, so the missing ~100 files are almost entirely 5xxx originals above IMG_5720.

A manifest of the 165 received filenames is written to `~/ASHWOOD/Modeling/BarelySain/localsend-received-165.txt` on Omarchy, for diffing against the Mac-side source folder before re-sending. Note that inode ctimes on these files were all rewritten by a later bulk operation and are useless for ordering; use birth time (`stat %W`/`%w`) instead.

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

All 18 identifiers have at least one matching file on Omarchy, but not all of them are masters.

**In the archive as masters — 15 of 18.** The 13 originally present, plus `IMG_6759-edited.heic` (31.5MB) and `IMG_6816-edited.heic` (32.7MB), which were found in `~/Pictures/BarelySain-contact-sheets/source/BarelySain/` and copied into the canonical archive with `cp -p` — bytes and timestamps preserved, no recompression, md5 verified against source.

**No master on Omarchy — 3 of 18.** These exist only as web assets committed under `assets/campaigns/barelysain/`, and their originals are still on the Mac:

| Identifier | Only available copy | Dimensions | Assessment |
| --- | --- | --- | --- |
| 5859 | `assets/campaigns/barelysain/IMG_5859-edited.jpg` | 1350x1800, 622KB | Web derivative |
| 6050 | `assets/campaigns/barelysain/IMG_6050-edited.jpg` | 1350x1800, 551KB | Web derivative |
| 6716 | `assets/campaigns/barelysain/IMG_6716-edited.jpg` | 3024x4032, 5.3MB | Full pixel dimensions but recompressed; comparable masters are ~17MB |

These three are among the ~100 files the stalled LocalSend never delivered. Recover them in the bulk transfer rather than promoting the web assets to masters.

**V3 arc readiness: 8 of 9 frames have masters.** Frames 4, 5, 7, 8 and 9 (6475, 6487, 6751, 6759, 6816) are all present at full resolution. The rusted-fence and DTLA frames depend on the three identifiers above. `IMG_6716-edited.jpg` is usable at full pixel dimensions if the edit cannot wait for the SSD transfer, with the caveat that it is a recompressed copy.

## Guidance for Claude

1. Help finish the Mac → Omarchy migration reliably; do not make TK manually curate thousands of files during transfer.
2. Prefer resumable/verifiable bulk-transfer methods for the full library.
3. Preserve originals and metadata; avoid recompressing masters during migration.
4. Once enough files are present on Omarchy, locate the BarelySain candidates by filename first.
5. Help identify the exact originals corresponding to the ASHWOOD site frames.
6. Do not delete anything from the Mac until counts/sizes and representative files are verified.
7. After the originals are identified, they can be used to complete the clean 9:16 TikTok V3 edit.