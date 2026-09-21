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


test('ELITK is an inline page-transform toggle on every primary Workspace view', async () => {
  const [source, html] = await Promise.all([
    readFile(viewsPath, 'utf8'),
    readFile(htmlPath, 'utf8')
  ]);
  assert.match(source, /workspace-elitk-switch/);
  assert.match(source, /type="checkbox" data-elitk-toggle/);
  assert.doesNotMatch(source, /summaryFor\(view\)/);
  assert.doesNotMatch(source, /workspace-elitk-panel/);
  assert.match(html, /\/workspace\/elitk-page\.mjs/);
  assert.match(html, /\/workspace\/elitk-page\.css/);
});


test('ELITK is wired across standalone Workspace routes', async () => {
  const pages = [
    ['build-logs', await readFile(buildLogsPath, 'utf8')],
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

test('ELITK translates jargon inline while preserving the underlying page structure', async () => {
  const { humanizeText } = await import(elitkPagePath);
  assert.equal(humanizeText('P1'), 'high priority');
  assert.equal(humanizeText('Orphaned PRs'), 'Code changes not linked to tracked work');
  assert.equal(humanizeText('Confidence 72%'), 'How sure the system is: 72%');
  assert.equal(humanizeText('TARGET'), 'considering');
  assert.equal(humanizeText('Canonical source ↗'), 'Authoritative record ↗');
  assert.equal(humanizeText('Products, active workstreams, governed execution, and the systems moving them forward.'), 'Products, active projects, agent work with rules and permission checks, and the systems moving them forward.');
});

test('ELITK engine is reversible, persistent, and observes data loaded after the toggle', async () => {
  const source = await readFile(elitkPagePath, 'utf8');
  assert.match(source, /function restore\(\)/);
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(source, /new MutationObserver/);
  assert.match(source, /characterData:true/);
  assert.match(source, /childList:true/);
  assert.match(source, /attributes:true/);
  assert.match(source, /ELITK ON · Show original/);
});
