#!/usr/bin/env python3
"""Safely update the owner-controlled ASHWOOD here.now Operator UI in place.

Source of truth: the actual owner here.now current-version manifest. Preserve
every existing file bit-for-bit except the existing Operator HTML and three
self-contained, ASHWOOD-owned OmniChat prototype assets.

No unrelated private repo, build, token or standalone site is required.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SLUG = "mighty-yoga-pgph"
ROOT = "https://here.now"
API = f"{ROOT}/api/v1/publish/{SLUG}"
CLIENT = "github-actions/ashwood-owner-omnichat"
KEY = os.environ.get("HERENOW_API_KEY", "")
SOURCE_DIR = Path(os.environ["OMNICHAT_SOURCE_DIR"]).resolve()
DRY_RUN = os.environ.get("ASHWOOD_PUBLISH_DRY_RUN", "").lower() == "true"

if not KEY:
    raise SystemExit("No authenticated here.now owner credential; no publish")
for filename in ("index.html", "app.js", "styles.css"):
    if not (SOURCE_DIR / filename).is_file():
        raise SystemExit(f"Missing ASHWOOD-owned OmniChat source file: {filename}")

def request(url, method="GET", data=None, headers=None):
    headers = dict(headers or {})
    headers.setdefault("X-HereNow-Client", CLIENT)
    if url.startswith(ROOT + "/api/"):
        headers["Authorization"] = f"Bearer {KEY}"
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=60) as response:
            return response.read(), response.headers
    except HTTPError as error:
        # Do not print protected body or presigned URLs.
        raise RuntimeError(f"here.now {method} failed HTTP {error.code}") from None

def getjson(url, method="GET", obj=None):
    payload = json.dumps(obj).encode("utf-8") if obj is not None else None
    raw, _ = request(url, method, payload, {"Content-Type": "application/json"})
    try:
        return json.loads(raw)
    except ValueError:
        raise RuntimeError(f"here.now {method} returned invalid JSON") from None

def origin_safe(url):
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.hostname == "here.now"

def replace_operator(html):
    if not re.search(r"<main\b[^>]*>", html, flags=re.I):
        raise RuntimeError("Current Operator HTML lacks a main element; preserve site unchanged")
    if not re.search(r"</head\s*>", html, flags=re.I):
        raise RuntimeError("Current Operator HTML lacks head; preserve site unchanged")
    if not re.search(r"</body\s*>", html, flags=re.I):
        raise RuntimeError("Current Operator HTML lacks body; preserve site unchanged")
    # Version-aware idempotence: strip only our own prior embed, never user markup.
    html = re.sub(r"\s*<section id=\"ashwood-omnichat-workforce\"[\s\S]*?</section><!-- /ashwood-omnichat-workforce -->", "", html, flags=re.I)
    html = re.sub(r"\s*<style id=\"ashwood-omnichat-workforce-style\">[\s\S]*?</style>", "", html, flags=re.I)
    html = re.sub(r"\s*<script id=\"ashwood-omnichat-workforce-sizing\">[\s\S]*?</script>", "", html, flags=re.I)
    style = """<style id="ashwood-omnichat-workforce-style">
#ashwood-omnichat-workforce{display:block;position:relative;width:100%;min-width:0;margin:0 0 2.5rem;padding:1.1rem 0 1.5rem;border-bottom:1px solid var(--border,#4d514b);color:inherit}
#ashwood-omnichat-workforce .ow-header{display:flex;gap:1rem;align-items:baseline;justify-content:space-between;flex-wrap:wrap;margin:0 0 1rem}
#ashwood-omnichat-workforce .ow-header h2{font:500 clamp(1.2rem,2.5vw,1.8rem)/1.2 inherit;margin:0;color:inherit}
#ashwood-omnichat-workforce .ow-header p{margin:.3rem 0;color:inherit;opacity:.72;font-size:.85rem}
#ashwood-omnichat-workforce iframe{display:block;width:100%;height:1600px;min-height:720px;max-width:100%;border:1px solid var(--border,#445047);border-radius:12px;background:#111713}
</style>"""
    section = """<section id="ashwood-omnichat-workforce" aria-label="OmniChat persistent workforce concept">
  <div class="ow-header"><div><h2>OmniChat · Workforce overview</h2><p>Building the Build · Building the Team · persistent agent identities across harnesses</p></div><small>INTERACTIVE DEMO · NO LIVE DISPATCH</small></div>
  <iframe id="ashwood-omnichat-workforce-frame" title="OmniChat autonomous workforce and agent identity interactive prototype" src="/workspace/operator/omnichat/index.html" loading="eager"></iframe>
</section><!-- /ashwood-omnichat-workforce -->"""
    script = """<script id="ashwood-omnichat-workforce-sizing">
window.addEventListener('message', function(event) {
  if (event.origin !== window.location.origin) return;
  var frame = document.getElementById('ashwood-omnichat-workforce-frame');
  if (!frame || event.source !== frame.contentWindow) return;
  if (!event.data || event.data.type !== 'ashwood:omnichat-resize') return;
  var height = Number(event.data.height);
  if (Number.isFinite(height) && height >= 600 && height <= 15000) {
    frame.style.height = Math.ceil(height + 16) + 'px';
  }
});
</script>"""
    html = re.sub(r"</head\s*>", style + "\n</head>", html, count=1, flags=re.I)
    html = re.sub(r"(<main\b[^>]*>)", lambda m: m.group(1) + "\n" + section + "\n", html, count=1, flags=re.I)
    html = re.sub(r"</body\s*>", script + "\n</body>", html, count=1, flags=re.I)
    if html.count('id="ashwood-omnichat-workforce"') != 1:
        raise RuntimeError("Unexpected duplicate OmniChat mount; no publish")
    return html.encode("utf-8")

# Take the *current live version* as the single base; never build against stale
# local content. A concurrent owner edit forces a version conflict at finalize.
state = getjson(API)
base = state.get("currentVersionId")
manifest = state.get("manifest")
if not base or not isinstance(manifest, list):
    raise RuntimeError("Cannot establish complete current provider manifest")
if len(manifest) > 2400:
    raise RuntimeError("Unexpected manifest size; no publish")
by_path = {item["path"]: item for item in manifest}
if len(by_path) != len(manifest) or "workspace/operator/index.html" not in by_path:
    raise RuntimeError("Current owner site lacks the canonical Operator file")
required = ["index.html", "workspace/index.html", "workspace/self/index.html",
            "workspace/work/studio/index.html", "workspace/operator/index.html"]
if any(path not in by_path for path in required):
    raise RuntimeError("Current site missing a preserved ASHWOOD route")
raw, headers = request(API + "/files/workspace/operator/index.html")
current_hash = hashlib.sha256(raw).hexdigest()
assert current_hash == by_path["workspace/operator/index.html"]["hash"], "Owner bytes mismatch"
operator_html = raw.decode("utf-8")
if not ("OmniChat" in operator_html or "Operator" in operator_html):
    raise RuntimeError("Not the expected ASHWOOD Operator page; refusing mutation")

updates = {"workspace/operator/index.html": replace_operator(operator_html)}
child_html = (SOURCE_DIR / "index.html").read_text("utf-8")
if "<div class=\"app\">" not in child_html:
    raise RuntimeError("Unexpected OmniChat prototype HTML")
child_html = child_html.replace("<div class=\"app\">", '<div class="app" data-ashwood-embedded="true">', 1)
updates["workspace/operator/omnichat/index.html"] = child_html.encode("utf-8")
child_js = (SOURCE_DIR / "app.js").read_text("utf-8")
if "renderIdentities" not in child_js or "Building the Team" not in child_html:
    raise RuntimeError("Missing the validated persistent identity or team view")
# Frame contents should adapt to available widths but never suggest the
# simulated throttle actually mutates AgentOS scheduling.
child_js += """
(function() {
  function report() {
    if (!window.parent || window.parent === window) return;
    var height=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
    window.parent.postMessage({type:'ashwood:omnichat-resize',height:height},window.location.origin);
  }
  window.addEventListener('load', report);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(report).observe(document.body);
})();
"""
updates["workspace/operator/omnichat/app.js"] = child_js.encode("utf-8")
child_css = (SOURCE_DIR / "styles.css").read_text("utf-8")
child_css += """
/* Mounted inside the existing ASHWOOD Operator route and navigation. */
body{min-width:0;background:#151b17}
.app[data-ashwood-embedded=true]{display:block;min-height:0}
.app[data-ashwood-embedded=true] .sidebar{display:none}
.app[data-ashwood-embedded=true] .main{min-width:0;width:100%}
.app[data-ashwood-embedded=true] .topbar{display:none}
.app[data-ashwood-embedded=true] .workforce-overview{padding:25px clamp(12px,3vw,34px)}
.app[data-ashwood-embedded=true] .main[data-workspace-view] .workspace-grid .activity{padding:22px clamp(12px,3vw,34px)}
@media(max-width:650px){.app[data-ashwood-embedded=true] .workforce-overview{padding:15px 10px}}
"""
updates["workspace/operator/omnichat/styles.css"] = child_css.encode("utf-8")

new_manifest=[]
for item in manifest:
    path=item["path"]
    if path in updates:
        blob=updates[path]
        new_manifest.append({"path":path,"size":len(blob),"contentType":item.get("contentType") or "text/html; charset=utf-8",
                             "hash":hashlib.sha256(blob).hexdigest()})
    else:
        if not item.get("hash") or not item.get("contentType") or not isinstance(item.get("size"), int):
            raise RuntimeError(f"Unusable owner manifest entry: {path}")
        new_manifest.append({field:item[field] for field in ("path","size","contentType","hash")})
for path,ctype in (("workspace/operator/omnichat/index.html","text/html; charset=utf-8"),
                    ("workspace/operator/omnichat/app.js","text/javascript; charset=utf-8"),
                    ("workspace/operator/omnichat/styles.css","text/css; charset=utf-8")):
    if path not in by_path:
        new_manifest.append({"path":path,"size":len(updates[path]),"contentType":ctype,
                             "hash":hashlib.sha256(updates[path]).hexdigest()})

if len(new_manifest) != len(manifest) + sum(path not in by_path for path in updates):
    raise RuntimeError("Unexpected omission/duplication; no publish")
original_hashes = {i["path"]:i["hash"] for i in manifest if i["path"] not in updates}
new_hashes = {i["path"]:i["hash"] for i in new_manifest if i["path"] not in updates}
if original_hashes != new_hashes:
    raise RuntimeError("Unrelated published files changed; no publish")
print(f"PREFLIGHT_OK base={base} retained={len(manifest)-sum(p in by_path for p in updates)} changed={len(updates)}")
if DRY_RUN:
    print("DRY_RUN_ONLY owner live version unchanged")
    sys.exit(0)

payload={"baseVersionId":base,"files":new_manifest}
result=getjson(API,"PUT",payload)
upload=result.get("upload") or {}
uploads=upload.get("uploads") or []
skipped=set(upload.get("skipped") or [])
expected_uploads=set(updates)
if set(x["path"] for x in uploads) != expected_uploads:
    raise RuntimeError("Unexpected upload plan; refusing to finalize")
if any(path not in skipped for path in original_hashes):
    raise RuntimeError("Unchanged owner files not listed as skipped; refusing to finalize")
for transfer in uploads:
    path=transfer["path"]
    url=transfer.get("url")
    host=urlparse(url).hostname if isinstance(url,str) else ""
    if not host or not host.endswith(".r2.cloudflarestorage.com") or not url.startswith("https://"):
        raise RuntimeError("Unexpected storage upload destination; refusing publish")
    transfer_headers=transfer.get("headers") or {}
    transfer_headers.pop("Authorization",None)
    request(url, "PUT", updates[path], transfer_headers)
finalize_url=upload.get("finalizeUrl")
if not isinstance(finalize_url,str) or not origin_safe(finalize_url):
    raise RuntimeError("Unexpected finalize endpoint")
version=upload.get("versionId")
if not version:
    raise RuntimeError("Provider did not supply a staged version")
final=getjson(finalize_url,"POST",{"versionId":version})
if not final.get("success") or final.get("slug") != SLUG:
    raise RuntimeError("Finalize did not attest success")
if final.get("previousVersionId") not in (base,None):
    raise RuntimeError("Unexpected release predecessor")
latest=getjson(API)
live_version=latest.get("currentVersionId")
if live_version != final.get("currentVersionId"):
    raise RuntimeError("Provider version readback mismatch")
live_manifest = {item["path"]:item["hash"] for item in latest.get("manifest",[])}
if live_manifest != {item["path"]:item["hash"] for item in new_manifest}:
    raise RuntimeError("Post-publish manifest differs; investigate immediately")
# Verify changed bytes by provider owner read, independent of SPA path routing.
for path in updates:
    restored,_=request(API+"/files/"+path)
    if hashlib.sha256(restored).hexdigest()!=hashlib.sha256(updates[path]).hexdigest():
        raise RuntimeError(f"Published file verification failed: {path}")
print(f"PUBLISHED_AND_VERIFIED slug={SLUG} old={base} current={live_version} total_files={len(new_manifest)}")
summary=os.environ.get("GITHUB_STEP_SUMMARY")
if summary:
    with open(summary,"a",encoding="utf-8") as out:
        out.write(f"### Canonical ASHWOOD incremental update\n- **Site:** https://{SLUG}.here.now/workspace/operator/\n- **Old version:** {base}\n- **New version:** {live_version}\n- **Preserved files:** {len(original_hashes)} (identical hashes)\n- **Updated/added:** {', '.join(updates)}\n- **Source:** ASHWOOD-owned OmniChat prototype; no private Command Center dependency\n- **Scope:** visual demo only; no live AgentOS authority or quota throttling\n")
