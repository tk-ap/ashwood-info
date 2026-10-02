import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CONTENT_EDITORIAL_CONTRACT,
  buildContentRecommendation,
  contentTruthState
} from "../workspace/content-intelligence.mjs";

const daysSince = () => 0;

test("content intelligence memorializes the TK editorial contract and Gist role", () => {
  assert.equal(CONTENT_EDITORIAL_CONTRACT.identity, "TK thinking out loud while making things.");
  assert.match(CONTENT_EDITORIAL_CONTRACT.channels.Gist, /too developed for Threads/i);
  assert.ok(CONTENT_EDITORIAL_CONTRACT.principles.some(value => /never imply end-to-end capability/i.test(value)));
});

test("unfinished AgentOS work becomes an observation, not a shipped claim", () => {
  const item = {
    id:"agentos:test",
    source:"board",
    sourceLabel:"agent-os",
    title:"E2E proof remains blocked after runtime restart",
    notes:"agent must verify what actually happened",
    status:"IN_PROGRESS",
    date:new Date().toISOString(),
    confidence:.9
  };
  const recommendation = buildContentRecommendation(item,{daysSince,productLabel:"AgentOS"});
  assert.equal(contentTruthState(item),"observation");
  assert.equal(recommendation.truthState,"observation");
  assert.equal(recommendation.bestFit[0],"Gist");
  assert.match(recommendation.angle.hook,/hardest parts of giving AI autonomy/i);
  assert.match(recommendation.drafts.Gist,/observation from the work|Reality check/i);
});

test("unverified language never upgrades an unfinished claim", () => {
  const item = {
    source:"board",
    sourceLabel:"agent-os",
    title:"E2E result remains unverified",
    notes:"verification pending",
    status:"IN_PROGRESS",
    date:new Date().toISOString(),
    confidence:1
  };
  assert.equal(contentTruthState(item),"observation");
});

test("verified production evidence can be described as shipped", () => {
  const item = {
    source:"github",
    sourceLabel:"ALVIRA",
    title:"Production deployment verified live",
    notes:"production deployed and verified",
    status:"COMPLETED",
    date:new Date().toISOString(),
    confidence:1
  };
  assert.equal(contentTruthState(item),"shipped");
});

test("workspace keeps the evidence-driven queue and durable feedback endpoint wired", async () => {
  const [html, app, api] = await Promise.all([
    readFile(new URL("../workspace/index.html", import.meta.url),"utf8"),
    readFile(new URL("../workspace/app.js", import.meta.url),"utf8"),
    readFile(new URL("../api/workspace-state.mjs", import.meta.url),"utf8")
  ]);
  assert.match(html,/id="from-work-queue"/);
  assert.match(html,/TK is not a founder-content account/);
  assert.match(html,/data-workspace-nav="content"/);
  assert.match(app,/buildContentRecommendation/);
  assert.match(app,/record_content_feedback/);
  assert.match(api,/workspace_content_feedback/);
  assert.match(api,/record_content_feedback/);
  assert.match(api,/do_not_post/);
});
