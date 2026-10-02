import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { recommendContent, truthStateForEvidence } from "../workspace/content-intelligence.mjs";

const now = Date.parse("2026-10-02T02:00:00Z");

test("unfinished AgentOS failure is an observation and routes to Gist", () => {
  const recommendation = recommendContent({
    source:"board",
    sourceLabel:"agent-os",
    title:"E2E proof stops before routing",
    notes:"runtime prerequisite is blocked; canonical path is not complete",
    status:"BLOCKED",
    date:"2026-10-01T23:00:00Z",
    confidence:.9
  }, { now });

  assert.equal(recommendation.truthState, "observation");
  assert.equal(recommendation.primaryChannel, "Gist");
  assert.equal(recommendation.shareState, "SHARE");
  assert.match(recommendation.angle.why, /not a progress claim/i);
});

test("component proof is evidenced, not silently upgraded to working", () => {
  assert.equal(truthStateForEvidence({
    sourceLabel:"agent-os",
    title:"Verify Telegram synchronization and persist evidence",
    status:"COMPLETED"
  }), "evidenced");
});

test("working requires explicit successful E2E semantics", () => {
  assert.equal(truthStateForEvidence({
    sourceLabel:"agent-os",
    title:"Verified E2E task → workflow → harness → host → evidence path passed",
    status:"COMPLETED"
  }), "working");
});

test("shipped requires explicit release language", () => {
  assert.equal(truthStateForEvidence({
    sourceLabel:"ALVIRA",
    title:"Released public beta",
    status:"COMPLETED"
  }), "shipped");
});

test("routine repo noise is suppressed", () => {
  const recommendation = recommendContent({
    source:"github",
    sourceLabel:"ashwood-info",
    title:"chore: refresh public standing",
    status:"IN_PROGRESS",
    date:"2026-10-01T23:30:00Z",
    confidence:.9
  }, { now });

  assert.equal(recommendation.shareState, "DO_NOT_POST");
});

test("creative work stays human-first instead of becoming founder content", () => {
  const recommendation = recommendContent({
    source:"manual",
    sourceLabel:"workspace",
    title:"Finished a new painting study",
    status:"COMPLETED",
    date:"2026-10-01T22:30:00Z",
    confidence:1,
    goal:"writing"
  }, { now });

  assert.equal(recommendation.territory, "making things");
  assert.ok(["Instagram","Gist","TikTok / Reel"].includes(recommendation.primaryChannel));
  assert.match(recommendation.angle.why, /authored observation/i);
});


test("Workspace mounts the queue and persists owner feedback through the existing state API", async () => {
  const [html, app, api] = await Promise.all([
    readFile(new URL("../workspace/index.html", import.meta.url), "utf8"),
    readFile(new URL("../workspace/app.js", import.meta.url), "utf8"),
    readFile(new URL("../api/workspace-state.mjs", import.meta.url), "utf8")
  ]);

  assert.match(html, /id="from-work-queue"/);
  assert.match(html, /data-workspace-nav="content"/);
  assert.match(html, /observation ≠ working/);
  assert.match(app, /recommendContent/);
  assert.match(app, /record_content_feedback/);
  assert.match(api, /workspace_content_feedback/);
  assert.match(api, /DO_NOT_POST/);
  assert.match(api, /Gist/);
});
