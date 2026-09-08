# Codex Brief — Modeling Page Update and BarelySain TikTok V3

Prepared 2026-09-08. Owning product: `ashwood` (`tk-ap/ashwood-info`), per
`registry/product-routing.yaml` in `tk-ap/agent-os`.

This brief assumes you have this repository and **not** the photo archive. Everything you
need to work from is committed here. Where a task genuinely needs the full-resolution
masters, that is called out and routed to a folder TK uploads to Drive.

## What exists in this repo

| Path | What it is |
| --- | --- |
| `assets/tiktok/source/` | 21 frames, 1440x1920, quality 80. Enough to render a 1080x1920 video. |
| `docs/tiktok-v3-frames.json` | Frame sequence, per-frame durations, alternates, copy. **The source of truth for timing.** |
| `tools/build-tiktok.sh` | Renders the cut from the manifest. Tested; produces a 10.300s 1080x1920 h264 file. |
| `docs/CLAUDE_MEDIA_MIGRATION_HANDOFF.md` | Where the masters live and how the archive was verified. |

Full-resolution masters are **not** in this repo, deliberately — they are 4.4GB. They live at
`~/ASHWOOD/Modeling/BarelySain/Originals` on TK's machine, and the twelve recommended frames
plus nine alternates are copied to `~/ASHWOOD/tiktok/` for upload to Google Drive.

## Task 1 — Render the TikTok cut

```bash
tools/build-tiktok.sh                       # renders from assets/tiktok/source
tools/build-tiktok.sh out.mp4 /path/to/tiktok   # renders from the Drive folder instead
```

The script resolves frames by identifier, so it works against either the repo derivatives or
the `NN_IMG_xxxx_slug.jpg` names in the Drive folder.

### Cut timing

Durations live in `docs/tiktok-v3-frames.json`. Edit the manifest, never the script.

| # | Frame | Seconds | Register |
| --- | --- | --- | --- |
| 1 | `IMG_6105` garment in plastic | 1.3 | before |
| 2 | `IMG_6902` hoodie graphic detail | 1.1 | before |
| 3 | `IMG_6059` close portrait, direct | 1.0 | person |
| 4 | `IMG_6078` rooftop, DTLA skyline | 0.7 | city |
| 5 | `IMG_5538` crosswalk, toward camera | 0.7 | city |
| 6 | `IMG_6729` gray car detail | 0.6 | campaign |
| 7 | `IMG_5688` rusted fence, full body | 0.6 | campaign |
| 8 | `IMG_6475` close portrait | 0.6 | campaign |
| 9 | `IMG_6487` car pose | 0.6 | campaign |
| 10 | `IMG_6716` Malibu two-person | 0.7 | coast |
| 11 | `IMG_6759` mountain hero | 0.8 | coast |
| 12 | `IMG_6816` full-body finish | 1.6 | payoff |
| | **Total** | **10.3** | |

**The shape matters more than the numbers.** Three things are deliberate:

1. **The open is slow.** Frames 1 and 2 total 2.4 seconds because the on-screen line
   ("apparently this app hasn't seen me model yet") is eight words and needs roughly that
   long to read. Cutting the open faster makes the hook unreadable, which is the single
   most likely way this video fails.
2. **The middle accelerates.** The four campaign frames run 0.6s each. This is the fastest
   run in the piece and it is what makes the sequence feel like a reveal rather than a
   slideshow.
3. **The end holds.** 1.6 seconds on the final frame, more than double the campaign cuts,
   so the last image is still on screen as the caption lands.

If TK picks a track, **the audio wins**. Snap cuts to the beat and preserve the shape:
long-long-long, then a fast four, then a held finish. At 120bpm (0.5s per beat) that is
roughly 3/2/2 beats on the open, 1 beat each through the campaign, 3 beats on the finish.

### Hard constraints

- **Render silent.** Audio is chosen in TikTok.
- **Never burn in text.** The on-screen line and the caption are added natively in TikTok.
  This is a standing instruction from the original handoff, not a preference.
- Output 1080x1920, 9:16, 30fps.

### Crop is not automatic

Every frame is portrait 3:4. Cropping to 9:16 keeps full height and takes width — each
frame **loses 25% of its width**. The script centre-crops, which is a default, not a
judgement.

Frame 5 (`IMG_5538`) is the known problem: the subject stands small and low against the
billboards, and a centre crop weakens the composition. Check it before accepting the
render. Per-frame crop offsets are a human decision — surface a concern, do not silently
pick a crop and call it done.

## Task 2 — Modeling page

The modeling page is `portfolio/index.html`. The BarelySain campaign grid is the
`#barelysain` section, currently thirteen `asset-frame` divs pointing at
`/assets/campaigns/barelysain/`.

Two changes are worth making, both independent of the video:

**2a. `IMG_6881-edited.jpg` is corrupt.** The committed web asset used as campaign frame 7
fails to decode: 4005 extraneous bytes and a premature end of data segment. Reproduce with:

```bash
magick identify -verbose assets/campaigns/barelysain/IMG_6881-edited.jpg 2>&1 >/dev/null
```

A clean master exists in the archive, so regenerating it needs TK. Do not paper over it by
swapping in a different frame without asking.

**2b. `IMG_5539` belongs here rather than in the video.** It is the original DTLA crosswalk
frame and the only landscape original in the set (4011x3008, EXIF Orientation 6). It was
replaced in the video by `IMG_5538` — same location, same billboards, shot portrait, walking
toward camera — because 5539 fights the 9:16 format. On the page, landscape is not a
problem and 5539 is the stronger composition. It is already committed as
`assets/campaigns/barelysain/IMG_5539-web.jpg` in an `asset-frame-landscape` slot, so this
may need no change at all; confirm it renders correctly rather than assuming.

## What you must not do

- **Do not launch a browser to verify.** The Codex browser adapter in `tk-ap/agent-os`
  (`adapters/codex/browser.py`) fails closed and returns `BLOCKED`. Any visual confirmation
  of the live page has to come from TK or another authorized surface. Split your
  verification into what you can check statically here versus what someone else supplies.
- **Do not certify the look.** Per `policies/HANDOFF_POLICY.md`, when acceptance is
  materially aesthetic a human gate is preserved: surface evidence and specific concerns,
  never manufacture visual approval.
- **Do not treat the frame selection as settled.** See below.

## Status of the selection

The twelve-frame arc, the durations, and the `5539 → 5538` swap are **proposals**. They have
not been approved by TK.

The nine-frame arc in `docs/CLAUDE_MEDIA_MIGRATION_HANDOFF.md` is the previously agreed set.
The twelve-frame version adds an apartment prologue — the garment in its delivery bag, then
the graphic up close — on the argument that the hook reads as a flex if the video opens on
polished campaign work, and as an actual reveal if it opens on something that looks like
anyone's apartment.

That is a creative judgement, and it is TK's to make. Render the proposal so it can be
looked at; do not treat rendering it as approval of it.

## Verification you can do here

- `tools/build-tiktok.sh` runs clean and reports 10.300s
- `ffprobe` on the output confirms 1080x1920, 30fps, no audio stream
- Every `frames[].file` in the manifest resolves in `assets/tiktok/source/`
- Every referenced image in `portfolio/index.html` exists and decodes
