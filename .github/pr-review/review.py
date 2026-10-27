#!/usr/bin/env python3
"""Read-only PR reviewer: context pre-pass, review pass, verify pass.

Runs Claude Code headless twice in a throwaway detached worktree of the PR head.
Writes findings.json and report.md to --out. Never touches GitHub or the source checkout.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
MAX_DIFF_CHARS = 60_000
OVERLAP_DAYS, OVERLAP_MAX = 14, 10  # older or extra overlapping PRs are noise
READ_ONLY_TOOLS = ["Read", "Grep", "Glob", "Bash(git diff:*)", "Bash(git log:*)",
                   "Bash(git show:*)", "Bash(git grep:*)", "Bash(git ls-files:*)"]
SECRET_PATTERNS = [re.compile(p, re.I) for p in (
    r"hnk_[a-z0-9]{8,}", r"postgres(?:ql)?://\S+:\S+@", r"authorization\s*:\s*bearer\s+[a-z0-9._-]{12,}",
    r"BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY", r"sk-ant-[a-z0-9-]{10,}", r"gh[pousr]_[A-Za-z0-9]{20,}")]

FINDINGS_SCHEMA = {
    "type": "object",
    "properties": {"findings": {"type": "array", "items": {
        "type": "object",
        "properties": {
            "file": {"type": "string"}, "line": {"type": "integer"},
            "severity": {"enum": ["blocker", "major", "minor"]},
            "lens": {"enum": ["correctness", "scope", "policy", "provenance", "over-engineering"]},
            "summary": {"type": "string"}, "evidence": {"type": "string"},
        },
        "required": ["file", "line", "severity", "lens", "summary", "evidence"]}}},
    "required": ["findings"],
}
VERDICT_SCHEMA = {
    "type": "object",
    "properties": {"verdicts": {"type": "array", "items": {
        "type": "object",
        "properties": {"index": {"type": "integer"}, "verdict": {"enum": ["CONFIRMED", "UNSURE", "REJECTED"]},
                       "reason": {"type": "string"}},
        "required": ["index", "verdict", "reason"]}}},
    "required": ["verdicts"],
}


def git(repo, *args):
    return subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True, text=True).stdout


def gh_json(*args):
    out = subprocess.run(["gh", *args], capture_output=True, text=True)
    return json.loads(out.stdout) if out.returncode == 0 and out.stdout.strip() else None


def build_context(repo, base, head, rules, pr, gh_repo):
    changed = git(repo, "diff", "--name-status", f"{base}...{head}")
    files = {line.split("\t")[-1] for line in changed.splitlines() if line}
    diff = git(repo, "diff", f"{base}...{head}")
    if len(diff) > MAX_DIFF_CHARS:
        diff = diff[:MAX_DIFF_CHARS] + f"\n[diff truncated at {MAX_DIFF_CHARS} characters; run git diff for the rest]\n"
    parts, overlaps, title = [], [], ""
    if pr and gh_repo:
        meta = gh_json("pr", "view", str(pr), "--repo", gh_repo, "--json", "title,body,baseRefName") or {}
        title = meta.get("title", "")
        parts.append(f"## PR #{pr} (base branch {meta.get('baseRefName', '?')})\nTitle: {meta.get('title', '')}\n\n{(meta.get('body') or '')[:6000]}")
        others = gh_json("pr", "list", "--repo", gh_repo, "--state", "open", "--limit", "100",
                         "--json", "number,title,files,updatedAt") or []
        cutoff = (datetime.now(timezone.utc) - timedelta(days=OVERLAP_DAYS)).isoformat()
        recent = sorted((o for o in others if o["number"] != pr and o.get("updatedAt", "") >= cutoff),
                        key=lambda o: o["updatedAt"], reverse=True)
        overlaps = [f"- #{o['number']} {o['title']}: " + ", ".join(sorted(files & {f['path'] for f in o.get('files', [])}))
                    for o in recent if files & {f["path"] for f in o.get("files", [])}][:OVERLAP_MAX]
        parts.append(f"## Other open PRs touching the same files (updated in the last {OVERLAP_DAYS} days)\n" + ("\n".join(overlaps) or "None."))
    agents = Path(repo, "AGENTS.md")
    if agents.exists():
        parts.append("## Repository AGENTS.md (at the source checkout)\n" + agents.read_text()[:20000])
    if rules:
        parts.append("## Rule pack\n" + Path(rules).read_text())
    parts.append(f"## Changed files\n{changed}")
    parts.append(f"## Diff {base[:12]}...{head[:12]}\n{diff}")
    return "\n\n".join(parts), title, overlaps


def claude(prompt, schema, cwd, budget):
    cmd = ["claude", "-p", "--output-format", "json", "--json-schema", json.dumps(schema),
           "--tools", "Read,Grep,Glob,Bash", "--allowedTools", *READ_ONLY_TOOLS,
           "--strict-mcp-config", "--no-session-persistence", "--max-budget-usd", str(budget)]
    # A PR can carry its own .claude settings or CLAUDE.md; never load them.
    cmd += ["--bare"] if os.environ.get("ANTHROPIC_API_KEY") else ["--setting-sources", "user"]
    started = time.time()
    out = subprocess.run(cmd, input=prompt, capture_output=True, text=True, cwd=cwd, timeout=1800)
    try:
        result = json.loads(out.stdout)
    except json.JSONDecodeError:
        raise SystemExit(f"claude returned no JSON (exit {out.returncode}): {out.stderr[-2000:]}")
    if result.get("is_error") or "structured_output" not in result:
        raise SystemExit(f"claude run failed: {result.get('subtype')} {str(result.get('result'))[:500]}")
    return result["structured_output"], {"cost_usd": result.get("total_cost_usd", 0),
                                         "turns": result.get("num_turns"),
                                         "seconds": round(time.time() - started)}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo", required=True)
    ap.add_argument("--base", required=True)
    ap.add_argument("--head", required=True)
    ap.add_argument("--rules")
    ap.add_argument("--pr", type=int)
    ap.add_argument("--gh-repo")
    ap.add_argument("--out", required=True)
    ap.add_argument("--budget", type=float, default=3.0, help="USD ceiling per pass")
    a = ap.parse_args()

    repo = Path(a.repo).expanduser().resolve()
    base, head = git(repo, "rev-parse", a.base).strip(), git(repo, "rev-parse", a.head).strip()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    context, title, overlaps = build_context(repo, base, head, a.rules, a.pr, a.gh_repo)

    work = Path(tempfile.mkdtemp(prefix="pr-review-"))
    checkout = work / "head"
    git(repo, "worktree", "add", "--detach", str(checkout), head)
    try:
        for name in ("CLAUDE.md", ".claude"):
            for p in checkout.rglob(name):
                shutil.rmtree(p) if p.is_dir() else p.unlink()

        review_prompt = (HERE / "prompts/review.md").read_text().replace("{base}", base).replace("{context}", context)
        found, review_run = claude(review_prompt, FINDINGS_SCHEMA, checkout, a.budget)
        findings = found["findings"]

        verify_run = {"cost_usd": 0, "turns": 0, "seconds": 0}
        if findings:
            listing = "\n".join(f"[{i}] {f['file']}:{f['line']} ({f['severity']}, {f['lens']}) {f['summary']}\n    evidence: {f['evidence']}"
                                for i, f in enumerate(findings))
            verify_prompt = ((HERE / "prompts/verify.md").read_text().replace("{base}", base)
                             .replace("{pr_title}", title or f"{base[:12]}...{head[:12]}").replace("{findings}", listing))
            verdicts, verify_run = claude(verify_prompt, VERDICT_SCHEMA, checkout, a.budget)
            by_index = {v["index"]: v for v in verdicts["verdicts"]}
            for i, f in enumerate(findings):
                v = by_index.get(i, {"verdict": "REJECTED", "reason": "verifier returned no verdict"})
                f["verdict"], f["verify_reason"] = v["verdict"], v["reason"]
    finally:
        subprocess.run(["git", "-C", str(repo), "worktree", "remove", "--force", str(checkout)], capture_output=True)
        shutil.rmtree(work, ignore_errors=True)

    confirmed = [f for f in findings if f.get("verdict") == "CONFIRMED"]
    unsure = [f for f in findings if f.get("verdict") == "UNSURE"]
    record = {"repo": str(repo), "pr": a.pr, "base": base, "head": head,
              "runs": {"review": review_run, "verify": verify_run},
              "cost_usd": round(review_run["cost_usd"] + verify_run["cost_usd"], 4),
              "raised": len(findings), "confirmed": len(confirmed), "unsure": len(unsure), "overlaps": overlaps, "findings": findings}
    report = [f"# PR review {'#' + str(a.pr) if a.pr else ''} {head[:7]}",
              f"{len(confirmed)} confirmed of {len(findings)} raised · ${record['cost_usd']}", ""]
    report += [f"- **{f['severity']}** ({f['lens']}) `{f['file']}:{f['line']}`: {f['summary']}" for f in confirmed]
    if overlaps:  # deterministic, from the pre-pass; no model judgement involved
        report += ["", "## Open PRs touching the same files", "", *overlaps]
    if unsure:
        report += ["", "## Needs a human look", ""]
        report += [f"- **{f['severity']}** ({f['lens']}) `{f['file']}:{f['line']}`: {f['summary']} _(verifier: {f['verify_reason']})_" for f in unsure]
    text = json.dumps(record, indent=2)
    md = "\n".join(report) + "\n"
    if any(p.search(text) or p.search(md) for p in SECRET_PATTERNS):
        raise SystemExit("Credential-like text in the review output; nothing written.")
    (out / "findings.json").write_text(text + "\n")
    (out / "report.md").write_text(md)
    print(json.dumps({k: record[k] for k in ("pr", "head", "raised", "confirmed", "unsure", "cost_usd")}))


if __name__ == "__main__":
    sys.exit(main())
