# Codex Brief — Modeling Page Update and BarelySain TikTok V3

Prepared 2026-09-08. Owning product: `ashwood` (`tk-ap/ashwood-info`), per
`registry/product-routing.yaml` in `tk-ap/agent-os`.

This brief assumes you have this repository and **not** the photo archive. Everything you
need to work from is committed here. Where a task genuinely needs the full-resolution
masters, that is called out and routed to a folder TK uploads to Drive.

## What exists in this repo

| Path | What it is |
| --- | --- |
| `assets/tiktok/source/` | 24 frames: the 12 in the cut plus 12 alternates, 1440x1920 quality 80. |
| `docs/tiktok-v3-frames.json` | Frame sequence, per-frame durations, alternates, copy. **The source of truth for timing.** |
| `tools/build-tiktok.sh` | Renders the cut from the manifest. Tested; produces a 10.600s 1080x1920 h264 file. |
| `docs/CLAUDE_MEDIA_MIGRATION_HANDOFF.md` | Where the masters live and how the archive was verified. |

Full-resolution masters are **not** in this repo, deliberately — they are 4.4GB. They live at
`~/ASHWOOD/Modeling/BarelySain/Originals` on TK's machine, and the twelve frames in the cut
plus twelve alternates are copied to `~/ASHWOOD/tiktok/` for upload to Google Drive.

## Task 1 — Render the TikTok cut

```bash
tools/build-tiktok.sh                       # renders from assets/tiktok/source
tools/build-tiktok.sh out.mp4 /path/to/tiktok   # renders from the Drive folder instead
```

The script resolves frames by identifier, so it works against either the repo derivatives or
the `NN_IMG_xxxx_slug.jpg` names in the Drive folder.

### What this reel is

A book-me reel drawn **only from the BarelySain shoot**, balanced evenly across its three
locations: four downtown, four Malibu, four mountain. The goal is to demonstrate modeling
competence to someone deciding whether to hire.

Two earlier drafts were wrong in instructive ways. The first opened on an apartment sequence
for narrative reasons — casual frames read as content creator, not model. The second opened
on runway frames, which are strong proof but come from a different shoot. TK scoped the video
to BarelySain only.

### Cut timing

Durations live in `docs/tiktok-v3-frames.json`. Edit the manifest, never the script.

| # | Location | Frame | Seconds |
| --- | --- | --- | --- |
| 1 | downtown | `IMG_5459` walking, Metro bus | 1.1 |
| 2 | downtown | `IMG_5496` close portrait, sunglasses | 0.9 |
| 3 | downtown | `IMG_5538` crosswalk, toward camera | 0.8 |
| 4 | downtown | `IMG_5724` graffiti wall | 0.8 |
| 5 | malibu | `IMG_6487` car pose | 0.8 |
| 6 | malibu | `IMG_6475` close portrait on the car | 0.7 |
| 7 | malibu | `IMG_6501` beach, full body | 0.8 |
| 8 | malibu | `IMG_6716` two-person, beach and car | 0.9 |
| 9 | mountain | `IMG_6902` garment graphic detail | 0.6 |
| 10 | mountain | `IMG_6751` rock pose | 0.8 |
| 11 | mountain | `IMG_6759` mountain hero | 0.9 |
| 12 | mountain | `IMG_6816` full-body finish | 1.5 |
| | | **Total** | **10.6** |

**The shape matters more than the numbers.**

- **Grouped, not interleaved.** Each location reads as its own block, so the range argument
  is made three times rather than blurred into one.
- **Open on motion.** 1.1s on a walking full-body frame, the longest cut before the finish.
- **Frame 9 is punctuation.** 0.6s, the shortest cut, entering the mountain block. Not a
  frame meant to be studied.
- **Hold the finish.** 1.5s so the last image is still on screen as the caption lands.

If TK picks a track, **the audio wins**. Snap cuts to the beat and preserve that shape.

### Hard constraints

- **Render silent.** Audio is chosen in TikTok.
- **Never burn in text.** On-screen line and caption are added natively in TikTok. Standing
  instruction from the original handoff, not a preference.
- Output 1080x1920, 9:16, 30fps.

### Deliberate exclusions — do not reintroduce these

- **Anything not from the BarelySain shoot.** Runway (`up-next-*`) and `IMG_7192` are
  different shoots. This is the scope rule; it overrides how good a frame is.
- **Agency digitals** (`IMG_7195`-`7209`): 1400x1050 landscape, ~1.8x upscale for 9:16, no
  higher-resolution copies exist anywhere.
- **The apartment block** (`IMG_6088`-`6120`).
- **The rooftop frames** (`IMG_6072`, `IMG_6078`): BarelySain but a different styling, and
  they belong to none of the three locations, so they unbalance the split.

### Known issue with frame 12

`IMG_6816` is the grey and purple styling; every other frame is the black tracksuit with the
yellow-green graphic. It was the agreed finisher in the original nine-frame arc so it is
kept, but `IMG_6818` is the same mountain full-body beat in the black look. If the wardrobe
change on the closing frame reads as a break rather than a close, that is the swap. Raise it
rather than deciding it.

### Crop is not automatic

Every frame is 3:4, so cropping to 9:16 **loses 25% of its width**. The script centre-crops,
which is a default, not a judgement.

Frame 3 (`IMG_5538`) is the known problem: the subject stands small and low against the
billboards. Check it before accepting the render. Per-frame crop offsets are a human
decision — surface a concern, do not silently pick a crop and call it done.

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

The twelve-frame cut and the durations are **proposals**. Rendering them is not approval.

Decided by TK, do not relitigate:

- **BarelySain shots only.** This is a scope rule, not a preference.
- **Balanced across downtown, Malibu and mountain** — the reason the cut is 4/4/4.
- The reel is a **book-me piece**, not a narrative one.
- **No agency digitals, no apartment block.**
- **`IMG_5539` is out of the video** and belongs on the modeling page instead.

Open, and reserved to TK: final frame order, per-frame crop, audio, and the frame 12
wardrobe question above.

## Verification you can do here

- `tools/build-tiktok.sh` runs clean and reports 10.600s
- `ffprobe` confirms 1080x1920, 30fps, no audio stream
- Every `frames[].file` in the manifest resolves in `assets/tiktok/source/`
- The manifest's `balance` block matches the actual per-register frame counts
- Every image referenced by `portfolio/index.html` exists and decodes
