#!/usr/bin/env bash
# Build the BarelySain TikTok V3 cut from the frame manifest.
#
#   tools/build-tiktok.sh [output.mp4] [source_dir]
#
# Defaults to assets/tiktok/source, which holds 1440x1920 derivatives committed to this
# repo. Point source_dir at the Drive folder (~/ASHWOOD/tiktok) to render from the
# full-resolution masters instead; filenames there carry a NN_ order prefix, which this
# script resolves by identifier.
#
# Durations come from docs/tiktok-v3-frames.json. Edit the manifest, not this script.
#
# Renders silent by design. Audio is chosen in TikTok, and on-screen text is added
# natively there — never burned in. See docs/CODEX_MODELING_TIKTOK_BRIEF.md.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$ROOT/docs/tiktok-v3-frames.json"
OUT="${1:-$ROOT/build/barelysain-tiktok-v3.mp4}"
SRC="${2:-$ROOT/assets/tiktok/source}"

command -v ffmpeg >/dev/null || { echo "error: ffmpeg not found" >&2; exit 1; }
command -v python3 >/dev/null || { echo "error: python3 not found" >&2; exit 1; }
[ -f "$MANIFEST" ] || { echo "error: manifest not found at $MANIFEST" >&2; exit 1; }

W=1080; H=1920; FPS=30

mkdir -p "$(dirname "$OUT")"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Resolve each frame to a real file, tolerating the NN_ prefix used in the Drive folder.
python3 - "$MANIFEST" "$SRC" "$WORK" <<'PY'
import json, sys, os, glob
manifest, src, work = sys.argv[1], sys.argv[2], sys.argv[3]
d = json.load(open(manifest))
lines = []
missing = []
for f in d["frames"]:
    cand = os.path.join(src, f["file"])
    if not os.path.exists(cand):
        hits = sorted(glob.glob(os.path.join(src, f"*{f['id']}*")))
        hits = [h for h in hits if h.lower().endswith((".jpg", ".jpeg", ".png"))]
        cand = hits[0] if hits else None
    if cand is None:
        missing.append(f["id"])
        continue
    lines.append((cand, float(f["seconds"]), f["position"], f["id"]))
if missing:
    sys.exit("error: no source file for: " + ", ".join(missing))
with open(os.path.join(work, "list.txt"), "w") as fh:
    for path, secs, _, _ in lines:
        fh.write(f"file '{path}'\nduration {secs}\n")
    # concat demuxer needs the final image repeated for its duration to register
    fh.write(f"file '{lines[-1][0]}'\n")
total = sum(s for _, s, _, _ in lines)
for path, secs, pos, ident in lines:
    print(f"  {pos:2d}  {secs:>4.1f}s  {ident}  {os.path.basename(path)}")
print(f"  total: {total:.1f}s")
# The concat demuxer needs the last image repeated to register its duration, which
# makes it play twice. Emit the exact total so the render can be trimmed to it.
with open(os.path.join(work, "total"), "w") as fh:
    fh.write(f"{total:.3f}")
PY

TOTAL="$(cat "$WORK/total")"
echo "rendering ${W}x${H} @ ${FPS}fps, ${TOTAL}s -> $OUT"

# scale to cover the 9:16 window, then centre-crop.
# Per-frame crop offsets are a human decision; adjust `crop` per frame if a centre
# crop weakens a shot (frame 5 in particular). See the brief.
ffmpeg -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$WORK/list.txt" \
  -t "$TOTAL" \
  -vf "scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},format=yuv420p" \
  -c:v libx264 -preset slow -crf 18 -movflags +faststart \
  "$OUT"

echo "done: $OUT"
ffprobe -hide_banner -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT" 2>/dev/null || true
