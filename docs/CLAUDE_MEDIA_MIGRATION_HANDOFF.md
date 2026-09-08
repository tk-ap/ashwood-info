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

A LocalSend transfer was attempted for 265 files and appeared to stall at **163/265**. There are actually **thousands of photos total**, so LocalSend should not be treated as the primary full-library migration mechanism.

For bulk migration, prefer an **exFAT external SSD + rsync**. Syncthing can then maintain selected active folders across Mac and Omarchy after the initial migration.

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

Search Omarchy after transfer with:

```bash
find ~/ -type f \( \
-iname '*6729*' -o \
-iname '*5688*' -o \
-iname '*5859*' -o \
-iname '*5539*' -o \
-iname '*6201*' -o \
-iname '*6420*' -o \
-iname '*6881*' -o \
-iname '*6474*' -o \
-iname '*6718*' -o \
-iname '*6050*' -o \
-iname '*6238*' -o \
-iname '*6339*' -o \
-iname '*6716*' \
\)
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

## Guidance for Claude

1. Help finish the Mac → Omarchy migration reliably; do not make TK manually curate thousands of files during transfer.
2. Prefer resumable/verifiable bulk-transfer methods for the full library.
3. Preserve originals and metadata; avoid recompressing masters during migration.
4. Once enough files are present on Omarchy, locate the BarelySain candidates by filename first.
5. Help identify the exact originals corresponding to the ASHWOOD site frames.
6. Do not delete anything from the Mac until counts/sizes and representative files are verified.
7. After the originals are identified, they can be used to complete the clean 9:16 TikTok V3 edit.