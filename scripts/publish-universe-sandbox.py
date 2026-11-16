#!/usr/bin/env python3
"""Publish only ASHWOOD's public Universe layer to the existing here.now sandbox.

This is intentionally an incremental publisher.  It takes the provider's live
manifest as its base, changes the explicitly listed public files below, and
rejects any upload plan that would replace an unrelated hosted file.  In
particular, it never reads, rebuilds, or uploads the private Workspace.
"""

import hashlib
import json
import mimetypes
import os
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

SLUG = "mighty-yoga-pgph"
ROOT = "https://here.now"
API = f"{ROOT}/api/v1/publish/{SLUG}"
PUBLIC_ORIGIN = f"https://{SLUG}.here.now"
CLIENT = "github-actions/ashwood-universe"
KEY = os.environ.get("HERENOW_API_KEY", "")
DRY_RUN = os.environ.get("ASHWOOD_PUBLISH_DRY_RUN", "").lower() == "true"
REPOSITORY = Path(__file__).resolve().parents[1]
CHANGED_PATHS = (
    "index.html",
    "v3-nav.js",
    "sitemap.xml",
    "universe/index.html",
    "universe/universe.css",
    "universe/universe.js",
    "universe/content.mjs",
)
PRESERVED_PATHS = (
    "index.html",
    "modeling/index.html",
    "workspace/index.html",
    "workspace/operator/index.html",
    "workspace/self/index.html",
    "workspace/work/studio/index.html",
)


def request(url, method="GET", data=None, headers=None):
    headers = dict(headers or {})
    headers.setdefault("X-HereNow-Client", CLIENT)
    if url.startswith(ROOT + "/api/"):
        headers["Authorization"] = f"Bearer {KEY}"
    request_object = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(request_object, timeout=60) as response:
            return response.read(), response.headers
    except HTTPError as error:
        # Provider bodies may contain signed URLs. Keep logs credential-free.
        raise RuntimeError(f"here.now {method} failed HTTP {error.code}") from None


def get_json(url, method="GET", value=None):
    body = json.dumps(value).encode("utf-8") if value is not None else None
    raw, _ = request(url, method, body, {"Content-Type": "application/json"})
    try:
        return json.loads(raw)
    except ValueError:
        raise RuntimeError(f"here.now {method} returned invalid JSON") from None


def content_type(path):
    if path.endswith((".js", ".mjs")):
        return "text/javascript; charset=utf-8"
    if path.endswith(".css"):
        return "text/css; charset=utf-8"
    if path.endswith(".xml"):
        return "application/xml; charset=utf-8"
    guessed, _ = mimetypes.guess_type(path)
    return (guessed or "application/octet-stream") + "; charset=utf-8"


def source_files():
    files = {}
    for relative_path in CHANGED_PATHS:
        path = (REPOSITORY / relative_path).resolve()
        if not path.is_file() or REPOSITORY not in path.parents:
            raise RuntimeError(f"Missing or unsafe public source: {relative_path}")
        files[relative_path] = path.read_bytes()
    if b"/universe/" not in files["index.html"] or b"Universe" not in files["v3-nav.js"]:
        raise RuntimeError("Universe entry points are missing; refusing publish")
    if b"prefers-reduced-motion" not in files["universe/universe.css"]:
        raise RuntimeError("Reduced-motion fallback is missing; refusing publish")
    if b"href: null" not in files["universe/content.mjs"]:
        raise RuntimeError("Held editorial content must remain non-public; refusing publish")
    return files


def safe_storage_url(url):
    parsed = urlparse(url)
    return parsed.scheme == "https" and bool(parsed.hostname) and parsed.hostname.endswith(".r2.cloudflarestorage.com")


def safe_finalize_url(url):
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.hostname == "here.now" and parsed.path.startswith("/api/")


def main():
    if not KEY:
        raise SystemExit("No authenticated here.now owner credential; no publish")
    updates = source_files()
    state = get_json(API)
    base_version = state.get("currentVersionId")
    manifest = state.get("manifest")
    if not base_version or not isinstance(manifest, list) or not manifest:
        raise RuntimeError("Cannot establish a complete current provider manifest")
    if len(manifest) > 2400:
        raise RuntimeError("Unexpected manifest size; no publish")
    current = {item.get("path"): item for item in manifest}
    if len(current) != len(manifest) or any(not path for path in current):
        raise RuntimeError("Provider manifest contains duplicate or missing paths")
    if any(path not in current for path in PRESERVED_PATHS):
        raise RuntimeError("Current site lacks a required preserved ASHWOOD route")
    if any(path.startswith("workspace/") for path in updates):
        raise RuntimeError("Workspace files are never part of this public publisher")

    new_manifest = []
    for item in manifest:
        path = item["path"]
        if path in updates:
            data = updates[path]
            new_manifest.append({"path": path, "size": len(data), "contentType": content_type(path), "hash": hashlib.sha256(data).hexdigest()})
        else:
            if not item.get("hash") or not item.get("contentType") or not isinstance(item.get("size"), int):
                raise RuntimeError(f"Unusable preserved manifest entry: {path}")
            new_manifest.append({field: item[field] for field in ("path", "size", "contentType", "hash")})
    for path, data in updates.items():
        if path not in current:
            new_manifest.append({"path": path, "size": len(data), "contentType": content_type(path), "hash": hashlib.sha256(data).hexdigest()})

    before = {item["path"]: item["hash"] for item in manifest if item["path"] not in updates}
    after = {item["path"]: item["hash"] for item in new_manifest if item["path"] not in updates}
    if before != after or len(new_manifest) != len(manifest) + sum(path not in current for path in updates):
        raise RuntimeError("Unrelated hosted files would change; refusing publish")
    print(f"PREFLIGHT_OK base={base_version} retained={len(before)} changed={len(updates)}")
    if DRY_RUN:
        print("DRY_RUN_ONLY owner live version unchanged")
        return

    plan = get_json(API, "PUT", {"baseVersionId": base_version, "files": new_manifest})
    upload = plan.get("upload") or {}
    uploads = upload.get("uploads") or []
    skipped = set(upload.get("skipped") or [])
    upload_paths = {entry.get("path") for entry in uploads}
    if not upload_paths.issubset(updates) or any(path not in skipped and path not in upload_paths for path in before):
        raise RuntimeError("Provider proposed an unrelated file update; refusing finalize")
    if not set(updates).issubset(upload_paths | skipped):
        raise RuntimeError("Provider plan omitted an intended public file")
    for transfer in uploads:
        path, url = transfer.get("path"), transfer.get("url")
        if path not in updates or not isinstance(url, str) or not safe_storage_url(url):
            raise RuntimeError("Unexpected storage upload destination; refusing publish")
        headers = dict(transfer.get("headers") or {})
        headers.pop("Authorization", None)
        request(url, "PUT", updates[path], headers)
    finalize_url = upload.get("finalizeUrl")
    version = upload.get("versionId")
    if not isinstance(finalize_url, str) or not safe_finalize_url(finalize_url) or not version:
        raise RuntimeError("Provider did not return a safe finalization plan")
    final = get_json(finalize_url, "POST", {"versionId": version})
    if not final.get("success") or final.get("slug") != SLUG or final.get("previousVersionId") not in (base_version, None):
        raise RuntimeError("Finalize did not attest a version-safe ASHWOOD update")

    latest = get_json(API)
    if latest.get("currentVersionId") != final.get("currentVersionId"):
        raise RuntimeError("Provider version readback mismatch")
    live_manifest = {item["path"]: item["hash"] for item in latest.get("manifest", [])}
    expected_manifest = {item["path"]: item["hash"] for item in new_manifest}
    if live_manifest != expected_manifest:
        raise RuntimeError("Post-publish manifest differs; investigate before retrying")
    for path, data in updates.items():
        restored, _ = request(API + "/files/" + path)
        if hashlib.sha256(restored).digest() != hashlib.sha256(data).digest():
            raise RuntimeError(f"Provider readback mismatch: {path}")
    for route in ("/", "/modeling/", "/workspace/", "/workspace/operator/", "/universe/"):
        page, _ = request(PUBLIC_ORIGIN + route)
        if not page:
            raise RuntimeError(f"Public route readback was empty: {route}")
    print(f"PUBLISHED_AND_VERIFIED slug={SLUG} old={base_version} current={latest.get('currentVersionId')} total_files={len(new_manifest)}")


if __name__ == "__main__":
    main()
