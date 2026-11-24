#!/usr/bin/env python3
"""Rebase the public here.now ASHWOOD sandbox on the current production source.

The sandbox has historical private Workspace material that is outside the
portfolio preview. This publisher manages the public, static portfolio surface
only: it takes every allowlisted public asset from the supplied live Git ref,
then applies the reviewed Universe overlay from the checked-out branch. Any
unmanaged provider file (including Workspace) stays byte-for-byte preserved.
"""

import hashlib
import json
import mimetypes
import os
import subprocess
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

SLUG = "mighty-yoga-pgph"
ROOT = "https://here.now"
API = f"{ROOT}/api/v1/publish/{SLUG}"
PUBLIC_ORIGIN = f"https://{SLUG}.here.now"
CLIENT = "github-actions/ashwood-sandbox-rebase"
KEY = os.environ.get("HERENOW_API_KEY", "")
DRY_RUN = os.environ.get("ASHWOOD_PUBLISH_DRY_RUN", "").lower() == "true"
LIVE_REF = os.environ.get("ASHWOOD_LIVE_REF", "origin/main")
REPOSITORY = Path(__file__).resolve().parents[1]

# This is deliberately a narrower set than the repository. It excludes API
# functions, docs, tests, build tooling, and the signed-in Workspace.
PUBLIC_PREFIXES = (
    "about/", "ai-from-zero/", "assets/", "audio/", "career/", "connect/",
    "dispatch/", "dive-deeper/", "guide/", "journal/", "journal-lab/",
    "modeling/", "music/", "partners/", "performance/", "portfolio/",
    "sponsor/", "universe/", "work/",
)
PUBLIC_DATA_PATHS = {"data/public-standing.json"}
PUBLIC_TOP_LEVEL_PATHS = {"index.html", "favicon.svg", "robots.txt", "sitemap.xml"}
PUBLIC_SUFFIXES = {
    ".avif", ".css", ".gif", ".htm", ".html", ".jpeg", ".jpg", ".js",
    ".json", ".mjs", ".mp3", ".mp4", ".ogg", ".png", ".svg", ".txt",
    ".wav", ".webm", ".webp", ".woff", ".woff2",
}
OVERLAY_PATHS = (
    "index.html",
    "v3-nav.js",
    "sitemap.xml",
    "universe/index.html",
    "universe/universe.css",
    "universe/universe.js",
    "universe/content.mjs",
)
OVERLAY_SUPPORT_PATHS = {
    ".github/workflows/ashwood-sandbox-rebase.yml",
    ".github/workflows/ashwood-universe-sandbox.yml",
    "scripts/publish-universe-sandbox.py",
    "scripts/rebase-sandbox-from-live.py",
    "tests/public-discovery.test.mjs",
    "tests/universe.test.mjs",
    "universe/DESIGN.md",
    "universe/README.md",
}


def request(url, method="GET", data=None, headers=None):
    headers = dict(headers or {})
    headers.setdefault("X-HereNow-Client", CLIENT)
    if url.startswith(ROOT + "/api/"):
        headers["Authorization"] = f"Bearer {KEY}"
    request_object = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(request_object, timeout=90) as response:
            return response.read(), response.headers
    except HTTPError as error:
        # Provider bodies can contain signed upload URLs; do not log them.
        raise RuntimeError(f"here.now {method} failed HTTP {error.code}") from None


def get_json(url, method="GET", value=None):
    body = json.dumps(value).encode("utf-8") if value is not None else None
    raw, _ = request(url, method, body, {"Content-Type": "application/json"})
    try:
        return json.loads(raw)
    except ValueError:
        raise RuntimeError(f"here.now {method} returned invalid JSON") from None


def git(*args):
    result = subprocess.run(
        ("git", *args), cwd=REPOSITORY, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    if result.returncode:
        raise RuntimeError(f"git {' '.join(args[:2])} failed while preparing the sandbox source")
    return result.stdout


def is_public_path(path):
    if path in PUBLIC_TOP_LEVEL_PATHS or path in PUBLIC_DATA_PATHS:
        return True
    if "/" not in path:
        return Path(path).suffix.lower() in PUBLIC_SUFFIXES and path not in {"package.json", "package-lock.json", "vercel.json"}
    return path.startswith(PUBLIC_PREFIXES) and Path(path).suffix.lower() in PUBLIC_SUFFIXES


def content_type(path):
    suffix = Path(path).suffix.lower()
    if suffix in {".html", ".htm"}:
        return "text/html; charset=utf-8"
    if suffix == ".css":
        return "text/css; charset=utf-8"
    if suffix in {".js", ".mjs"}:
        return "text/javascript; charset=utf-8"
    if suffix == ".json":
        return "application/json; charset=utf-8"
    if suffix == ".svg":
        return "image/svg+xml"
    if suffix == ".xml":
        return "application/xml; charset=utf-8"
    if suffix == ".txt":
        return "text/plain; charset=utf-8"
    guessed, _ = mimetypes.guess_type(path)
    return guessed or "application/octet-stream"


def file_descriptor(path, data):
    return {
        "path": path,
        "size": len(data),
        "contentType": content_type(path),
        "hash": hashlib.sha256(data).hexdigest(),
    }


def safe_storage_url(url):
    parsed = urlparse(url)
    return parsed.scheme == "https" and bool(parsed.hostname) and parsed.hostname.endswith(".r2.cloudflarestorage.com")


def safe_finalize_url(url):
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.hostname == "here.now" and parsed.path.startswith("/api/")


def assert_overlay_lineage():
    # The branch may only overlay the public Universe layer above live main.
    merge_base = git("merge-base", LIVE_REF, "HEAD").decode().strip()
    live_commit = git("rev-parse", LIVE_REF).decode().strip()
    if merge_base != live_commit:
        raise RuntimeError("Checked-out sandbox branch is not based on the requested live source")
    changed = set(git("diff", "--name-only", f"{LIVE_REF}...HEAD").decode().splitlines())
    unexpected = changed - set(OVERLAY_PATHS) - OVERLAY_SUPPORT_PATHS
    if unexpected:
        raise RuntimeError(f"Unexpected divergence from live source: {', '.join(sorted(unexpected))}")


def source_files():
    assert_overlay_lineage()
    names = git("ls-tree", "-r", "--name-only", LIVE_REF).decode().splitlines()
    files = {path: git("show", f"{LIVE_REF}:{path}") for path in names if is_public_path(path)}
    for relative_path in OVERLAY_PATHS:
        path = (REPOSITORY / relative_path).resolve()
        if not path.is_file() or REPOSITORY not in path.parents:
            raise RuntimeError(f"Missing or unsafe Universe overlay: {relative_path}")
        files[relative_path] = path.read_bytes()
    if b"/universe/" not in files["index.html"] or b"Universe" not in files["v3-nav.js"]:
        raise RuntimeError("Universe entry points are missing; refusing rebase")
    if b"prefers-reduced-motion" not in files["universe/universe.css"]:
        raise RuntimeError("Reduced-motion fallback is missing; refusing rebase")
    if b"href: null" not in files["universe/content.mjs"]:
        raise RuntimeError("Held editorial content must remain non-public; refusing rebase")
    if len(files) > 900 or sum(map(len, files.values())) > 250 * 1024 * 1024:
        raise RuntimeError("Unexpected public source size; refusing broad sandbox update")
    return files


def route_for(path):
    if path == "index.html":
        return "/"
    if path.endswith("/index.html"):
        return "/" + path[:-10]
    return None


def main():
    if not KEY:
        raise SystemExit("No authenticated here.now owner credential; no publish")
    source = source_files()
    state = get_json(API)
    base_version = state.get("currentVersionId")
    manifest = state.get("manifest")
    if not base_version or not isinstance(manifest, list) or not manifest or len(manifest) > 2400:
        raise RuntimeError("Cannot establish a complete current provider manifest")
    current = {item.get("path"): item for item in manifest}
    if len(current) != len(manifest) or any(not path for path in current):
        raise RuntimeError("Provider manifest contains duplicate or missing paths")

    preserved = {
        path: {field: item[field] for field in ("path", "size", "contentType", "hash")}
        for path, item in current.items()
        if not is_public_path(path)
    }
    desired = dict(preserved)
    desired.update({path: file_descriptor(path, data) for path, data in source.items()})
    new_manifest = list(desired.values())

    before_preserved = {path: item["hash"] for path, item in current.items() if path in preserved}
    after_preserved = {path: item["hash"] for path, item in desired.items() if path in preserved}
    if before_preserved != after_preserved:
        raise RuntimeError("A protected provider path would change; refusing publish")

    current_public = {path for path in current if is_public_path(path)}
    source_paths = set(source)
    added = source_paths - set(current)
    removed = current_public - source_paths
    replaced = {
        path for path in source_paths & set(current)
        if current[path].get("hash") != desired[path]["hash"]
    }
    print(
        f"PREFLIGHT_OK base={base_version} live_ref={git('rev-parse', LIVE_REF).decode().strip()} "
        f"public={len(source)} retained={len(preserved)} added={len(added)} replaced={len(replaced)} removed={len(removed)}"
    )
    if DRY_RUN:
        print("DRY_RUN_ONLY owner live version unchanged")
        return

    plan = get_json(API, "PUT", {"baseVersionId": base_version, "files": new_manifest})
    upload = plan.get("upload") or {}
    uploads = upload.get("uploads") or []
    skipped = set(upload.get("skipped") or [])
    upload_paths = {entry.get("path") for entry in uploads}
    if not upload_paths.issubset(source_paths) or not source_paths.issubset(upload_paths | skipped):
        raise RuntimeError("Provider proposed an incomplete or unsafe public upload plan")
    for transfer in uploads:
        path, url = transfer.get("path"), transfer.get("url")
        if path not in source or not isinstance(url, str) or not safe_storage_url(url):
            raise RuntimeError("Unexpected storage upload destination; refusing publish")
        headers = dict(transfer.get("headers") or {})
        headers.pop("Authorization", None)
        request(url, "PUT", source[path], headers)
    finalize_url, version = upload.get("finalizeUrl"), upload.get("versionId")
    if not isinstance(finalize_url, str) or not safe_finalize_url(finalize_url) or not version:
        raise RuntimeError("Provider did not return a safe finalization plan")
    final = get_json(finalize_url, "POST", {"versionId": version})
    if not final.get("success") or final.get("slug") != SLUG or final.get("previousVersionId") not in (base_version, None):
        raise RuntimeError("Finalize did not attest a version-safe ASHWOOD update")

    latest = get_json(API)
    expected_manifest = {item["path"]: item["hash"] for item in new_manifest}
    live_manifest = {item["path"]: item["hash"] for item in latest.get("manifest", [])}
    if latest.get("currentVersionId") != final.get("currentVersionId") or live_manifest != expected_manifest:
        raise RuntimeError("Post-publish manifest differs; investigate before retrying")
    for route in sorted(filter(None, (route_for(path) for path in source))):
        page, _ = request(PUBLIC_ORIGIN + route)
        if not page:
            raise RuntimeError(f"Public route readback was empty: {route}")
    print(
        f"PUBLISHED_AND_VERIFIED slug={SLUG} old={base_version} current={latest.get('currentVersionId')} "
        f"public={len(source)} retained={len(preserved)}"
    )


if __name__ == "__main__":
    main()
