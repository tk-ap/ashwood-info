/* Browser QA for PR #310 only.
 * All /api calls are synthetic and intercepted within the test browser.
 * No production sessions, private Context records, database or mutations.
 */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:8765';
const out = 'workspace-qa-artifacts';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const report = [];

async function configureMock(context, isAuthenticated) {
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const respond = (status, body) => route.fulfill({
      status, contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(body)
    });
    if (url.origin === base) {
      if (url.pathname === '/api/workspace-auth') {
        return respond(200, { ok: true, configured: true, authenticated: isAuthenticated, bootstrap_used: true });
      }
      if (url.pathname === '/api/workspace-state') {
        return respond(isAuthenticated ? 200 : 401,
          isAuthenticated ? { ok: true, evidence: [], overrides: {}, content_feedback: [] } : { ok: false, error: 'Unauthorized' });
      }
      if (url.pathname.startsWith('/api/')) {
        return respond(401, { ok: false, error: 'Test environment: authenticated backend unavailable' });
      }
      return route.continue();
    }
    if (url.hostname === 'api.github.com') return respond(200, []);
    if (url.hostname === 'ailhat.vercel.app') return respond(200, { ok: false });
    return route.abort('blockedbyclient');
  });
}

async function inspect(width, height) {
  const context = await browser.newContext({
    viewport: { width, height }, reducedMotion: 'reduce',
    colorScheme: 'dark', serviceWorkers: 'block'
  });
  await configureMock(context, true);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  const response = await page.goto(base + '/workspace/#self', { waitUntil: 'domcontentloaded', timeout: 20000 });
  assert.equal(response.status(), 200, 'Workspace entry HTML must load');
  await page.waitForFunction(() => document.body.dataset.workspaceAuth === 'authenticated', { timeout: 15000 });
  await page.waitForSelector('.brain-explorer__scope:not([hidden])', { timeout: 15000 });
  const snapshot = await page.evaluate(() => {
    const canvas = document.querySelector('.brain-explorer__canvas');
    const r = canvas.getBoundingClientRect();
    return {
      currentView: document.body.dataset.workspaceCurrentView,
      authState: document.body.dataset.workspaceAuth,
      outerWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      canvas: { width: r.width, height: r.height },
      navLabels: [...document.querySelectorAll('.workspace-section-nav a')].map(x => x.textContent.trim()),
      active: document.querySelector('#brain-explorer').dataset.workspaceActive
    };
  });
  assert.equal(snapshot.authState, 'authenticated');
  assert.equal(snapshot.currentView, 'self');
  assert.equal(snapshot.active, 'true');
  assert(snapshot.canvas.width > 200 && snapshot.canvas.height > 250, 'Brain canvas needs usable dimensions');
  assert(snapshot.outerWidth <= snapshot.viewportWidth + 2,
    'Unexpected horizontal document overflow at ' + width + 'px: ' + JSON.stringify(snapshot));
  assert(snapshot.navLabels.includes('Today') && snapshot.navLabels.includes('Self'));
  assert(snapshot.navLabels.includes('Operator') && snapshot.navLabels.includes('Career'));

  const select = page.locator('.brain-explorer__select');
  await select.selectOption('thoreau');
  assert.match(await page.locator('.brain-explorer__reading-title').innerText(), /Deliberate living/);
  await page.locator('.brain-explorer__canvas').focus();
  await page.keyboard.press('ArrowRight');
  await page.locator('.brain-explorer__reset').click();
  assert.match(await page.locator('.brain-explorer__reading-title').innerText(), /Self-reliance/);

  const name = width < 700 ? 'mobile-390' : 'desktop-1440';
  await page.screenshot({ path: out + '/self-' + name + '.png', fullPage: true, animations: 'disabled' });

  await page.locator('.workspace-section-nav [data-workspace-nav="today"]').click();
  assert.equal(await page.locator('body').getAttribute('data-workspace-current-view'), 'today');
  assert.equal(await page.locator('#brain-explorer').getAttribute('data-workspace-active'), 'false');
  await page.locator('.workspace-section-nav [data-workspace-nav="self"]').click();
  assert.equal(await page.locator('#brain-explorer').getAttribute('data-workspace-active'), 'true');

  const result = { viewport: width, ...snapshot, currentViewAfterReturn: 'self', pageErrors: errors };
  report.push(result);
  if (errors.length) throw Error('Browser JS errors at ' + width + 'px: ' + errors.join('; ').slice(0, 1000));
  await context.close();
}

async function inspectLocked() {
  const context = await browser.newContext({ viewport: {width:390,height:844}, reducedMotion:'reduce',serviceWorkers:'block' });
  await configureMock(context, false);
  const page = await context.newPage();
  const response = await page.goto(base + '/workspace/#self', { waitUntil: 'domcontentloaded', timeout:20000 });
  assert.equal(response.status(), 200);
  await page.waitForSelector('#workspace-auth-gate');
  assert.equal(await page.locator('body').getAttribute('data-workspace-auth'), 'locked');
  assert.equal(await page.locator('.brain-explorer__scope').getAttribute('hidden'), '');
  assert.equal(await page.locator('.workspace-shell').getAttribute('inert'), '');
  await page.screenshot({path:out + '/locked-mobile.png',animations:'disabled'});
  report.push({view:'locked', authGate:true, brainHidden:true});
  await context.close();
}

try {
  await inspectLocked();
  await inspect(390, 844);
  await inspect(1440, 900);
  console.log('WORKSPACE_BROWSER_QA_PASSED ' + JSON.stringify(report));
} catch(error) {
  console.error('WORKSPACE_BROWSER_QA_FAILED ' + error.stack);
  console.log('WORKSPACE_BROWSER_QA_PARTIAL ' + JSON.stringify(report));
  process.exitCode = 1;
} finally {
  await browser.close();
}
