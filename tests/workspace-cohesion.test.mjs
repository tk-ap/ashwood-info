import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const htmlPath = new URL('../workspace/index.html', import.meta.url);
const viewsPath = new URL('../workspace/views.mjs', import.meta.url);
const elitkPagePath = new URL('../workspace/elitk-page.mjs', import.meta.url);
const buildLogsPath = new URL('../workspace/build-logs/index.html', import.meta.url);
const careerOpsPath = new URL('../workspace/career-ops/index.html', import.meta.url);
const productionReviewPath = new URL('../workspace/v3-playtest/index.html', import.meta.url);

test('workspace exposes exactly six primary views on desktop and mobile', async () => {
  const html = await readFile(htmlPath, 'utf8');
  for (const view of ['today','build','work','network','evidence','self']) {
    const matches = html.match(new RegExp('data-workspace-nav="' + view + '"', 'g')) || [];
    assert.equal(matches.length, 2, view + ' should exist once in desktop nav and once in mobile nav');
  }
  assert.doesNotMatch(html, /data-workspace-nav="agentos"/);
});

test('workspace cohesion assets are loaded and escaped newline artifacts are gone', async () => {
  const html = await readFile(htmlPath, 'utf8');
  assert.match(html, /\/workspace\/cohesion\.css/);
  assert.match(html, /\/workspace\/views\.mjs/);
  assert.equal(html.includes('\\n'), false);
});

test('view router keeps AgentOS inside Build and personal context inside Self', async () => {
  const source = await readFile(viewsPath, 'utf8');
  assert.match(source, /build:[\s\S]*"#agentos-board-section"/);
  assert.match(source, /self:[\s\S]*"#frame"[\s\S]*"\.goals"[\s\S]*"#checkin-details"/);
  assert.match(source, /evidence:[\s\S]*"#evidence-panel"/);
});


test('ELITK is a view-level control available regardless of the active Workspace view', async () => {
  const source = await readFile(viewsPath, 'utf8');
  assert.match(source, /ELITK · Explain this view/);
  assert.match(source, /data\.elitkTrigger|dataset\.elitkTrigger/);
  assert.match(source, /function summaryFor\(view\)/);
  for (const view of ['today','build','work','network','evidence']) {
    assert.match(source, new RegExp('view === "' + view + '"'));
  }
  assert.match(source, /What this view is for/);
  assert.match(source, /What it says right now/);
  assert.match(source, /How to read it/);
  assert.match(source, /does not move work, approve actions, or upgrade evidence/);
});


test('ELITK is wired across standalone Workspace routes', async () => {
  const pages = [
    ['build-logs', await readFile(buildLogsPath, 'utf8')],
    ['career-ops', await readFile(careerOpsPath, 'utf8')],
    ['production-review', await readFile(productionReviewPath, 'utf8')]
  ];
  for (const [page, html] of pages) {
    assert.match(html, new RegExp('data-elitk-page="' + page + '"'));
    assert.match(html, /\/workspace\/elitk-page\.mjs/);
    assert.match(html, /\/workspace\/elitk-page\.css/);
  }
});

test('ELITK modules pass JavaScript syntax checks', () => {
  for (const path of [viewsPath, elitkPagePath]) {
    execFileSync(process.execPath, ['--check', fileURLToPath(path)], { stdio:'pipe' });
  }
});

test('ELITK re-escapes rendered Workspace text before using innerHTML', async () => {
  const source = await readFile(viewsPath, 'utf8');
  assert.match(source, /function escapeHtml\(value\)/);
  assert.match(source, /escapeHtml\(summary\.purpose\)/);
  assert.match(source, /escapeHtml\(summary\.current\)/);
  assert.match(source, /escapeHtml\(summary\.read\)/);
});
