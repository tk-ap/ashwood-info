import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const htmlPath = new URL('../workspace/index.html', import.meta.url);
const viewsPath = new URL('../workspace/views.mjs', import.meta.url);

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
