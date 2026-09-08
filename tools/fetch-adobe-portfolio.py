#!/usr/bin/env python3
"""Pull every image off an Adobe Portfolio site at the best variant Adobe exposes.

    tools/fetch-adobe-portfolio.py [--out DIR] [--site URL] [--dry-run]

Defaults to https://tkashwood.myportfolio.com into ~/ASHWOOD/Portfolio/adobe-export.

What this does and does not get
-------------------------------
Adobe serves each asset as an un-suffixed original plus `_rw_<width>` renditions.
Where the page HTML references the original, this fetches the original. Where it only
references renditions, the largest rendition is the ceiling — usually 1920px on the long
edge, sometimes 3840. There is no way to construct the original URL: the `?h=` hash is
enforced per variant (400 without it, 403 with a wrong one), so only URLs actually present
in the HTML can be fetched.

For true masters of the rendition-only assets, export from the Adobe account itself. See
docs/ADOBE_PORTFOLIO_MASTER_EXPORT.md.

Card thumbnails (`_car_`, `_carw_`) are cropped derivatives of assets already collected and
are skipped.

Re-running is safe: existing files of the expected size are left alone.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import Counter

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}

# asset id, optional _rw_<width>, extension. Case-insensitive: Adobe mixes .jpg and .JPG.
ASSET_RX = re.compile(
    r"https://cdn\.myportfolio\.com/[a-f0-9-]+/([A-Za-z0-9-]+?)(?:_rw_(\d+))?\.(jpe?g|png)\?h=[a-f0-9]+",
    re.I,
)
PAGE_RX = re.compile(r'href="(/[a-z0-9][a-z0-9/_-]*)"', re.I)
SKIP_RX = re.compile(r"_carw?_", re.I)  # project-card crops
ORIGINAL = 10**9


def fetch(url: str, timeout: int = 45) -> bytes:
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read()


def discover_pages(root: str) -> list[str]:
    try:
        html = fetch(root + "/").decode("utf-8", "ignore")
    except Exception as exc:
        sys.exit(f"error: cannot reach {root}: {exc}")
    pages = {"/"}
    for href in PAGE_RX.findall(html):
        if href.startswith(("/dist", "/css", "/js", "/static")):
            continue
        pages.add(href)
    return sorted(pages)


def collect(root: str, pages: list[str]) -> dict[str, tuple[int, str]]:
    """Map asset id -> (width, url), keeping the best variant seen for each asset."""
    best: dict[str, tuple[int, str]] = {}
    for page in pages:
        try:
            html = fetch(root + page).decode("utf-8", "ignore")
        except Exception as exc:
            print(f"  {page:16s} SKIPPED ({exc})")
            continue
        found = 0
        for m in ASSET_RX.finditer(html):
            url = m.group(0)
            if SKIP_RX.search(url):
                continue
            aid = m.group(1)
            width = int(m.group(2)) if m.group(2) else ORIGINAL
            if aid not in best or width > best[aid][0]:
                best[aid] = (width, url)
            found += 1
        print(f"  {page:16s} {found:4d} image refs")
    return best


def jpeg_dims(raw: bytes) -> str:
    i = 2
    while i < len(raw) - 9:
        if raw[i] != 0xFF:
            i += 1
            continue
        marker = raw[i + 1]
        if marker in (0xC0, 0xC1, 0xC2):
            h = int.from_bytes(raw[i + 5 : i + 7], "big")
            w = int.from_bytes(raw[i + 7 : i + 9], "big")
            return f"{w}x{h}"
        if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        i += 2 + int.from_bytes(raw[i + 2 : i + 4], "big")
    return "?"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="https://tkashwood.myportfolio.com")
    ap.add_argument("--out", default=os.path.expanduser("~/ASHWOOD/Portfolio/adobe-export"))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    root = args.site.rstrip("/")

    print(f"site: {root}")
    pages = discover_pages(root)
    print(f"pages: {', '.join(pages)}\n")

    best = collect(root, pages)
    if not best:
        sys.exit("error: no assets found")

    tally = Counter("original" if w == ORIGINAL else str(w) for w, _ in best.values())
    print(f"\nunique assets: {len(best)}")
    for label, count in sorted(tally.items(), key=lambda kv: (kv[0] != "original", kv[0])):
        print(f"  best available {label:>8}: {count}")

    if args.dry_run:
        print("\ndry run, nothing downloaded")
        return

    os.makedirs(args.out, exist_ok=True)
    manifest, ok, skipped, failed = [], 0, 0, 0

    print(f"\ndownloading to {args.out}")
    for aid, (width, url) in sorted(best.items()):
        ext = re.search(r"\.(jpe?g|png)\?", url, re.I).group(1).lower()
        tag = "orig" if width == ORIGINAL else f"rw{width}"
        name = f"{aid}_{tag}.{ext}"
        path = os.path.join(args.out, name)

        if os.path.exists(path) and os.path.getsize(path) > 0:
            skipped += 1
            continue
        try:
            raw = fetch(url)
        except Exception as exc:
            print(f"  FAILED {name}: {exc}")
            failed += 1
            continue
        if len(raw) == 0:
            print(f"  FAILED {name}: empty response")
            failed += 1
            continue
        with open(path, "wb") as fh:
            fh.write(raw)
        dims = jpeg_dims(raw) if ext in ("jpg", "jpeg") else "?"
        manifest.append(
            {"asset_id": aid, "file": name, "variant": tag, "dimensions": dims,
             "bytes": len(raw), "source_url": url}
        )
        ok += 1
        print(f"  {name:52s} {dims:>11}  {len(raw)/1048576:5.2f}MB")

    mpath = os.path.join(args.out, "manifest.json")
    existing = []
    if os.path.exists(mpath):
        try:
            existing = json.load(open(mpath)).get("assets", [])
        except Exception:
            pass
    merged = {a["asset_id"]: a for a in existing}
    merged.update({a["asset_id"]: a for a in manifest})
    json.dump(
        {"site": root, "asset_count": len(merged), "assets": sorted(merged.values(), key=lambda a: a["asset_id"])},
        open(mpath, "w"),
        indent=1,
    )

    print(f"\ndownloaded {ok}, already present {skipped}, failed {failed}")
    print(f"manifest: {mpath}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
