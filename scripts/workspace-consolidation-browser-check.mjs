/* Browser QA for PR #310 only.
 * All /api calls are synthetic and intercepted within the test browser.
 * No production sessions, private Context records, database or mutations.
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:8765';
const out = 'workspace-qa-artifacts';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH } : {}),
  args: ['--no-sandbox']
});
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
  page.on('pageerror', err => errors.push(err.stack || err.message));
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
      active: document.querySelector('#brain-explorer').dataset.workspaceActive,
      topNavVisible: getComputedStyle(document.querySelector('.workspace-section-nav')).display !== 'none',
      bottomNavVisible: getComputedStyle(document.querySelector('.workspace-mobile-nav')).display !== 'none'
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
  if (width <= 680) {
    assert.equal(snapshot.topNavVisible, false, 'mobile must not show a duplicate top tab strip');
    assert.equal(snapshot.bottomNavVisible, true, 'mobile bottom navigation must be visible');
  } else {
    assert.equal(snapshot.topNavVisible, true);
    assert.equal(snapshot.bottomNavVisible, false);
  }

  const select = page.locator('.brain-explorer__select');
  await select.selectOption('thoreau');
  assert.match(await page.locator('.brain-explorer__reading-title').innerText(), /Deliberate living/);
  await page.locator('.brain-explorer__canvas').focus();
  await page.keyboard.press('ArrowRight');
  await page.locator('.brain-explorer__reset').click();
  assert.match(await page.locator('.brain-explorer__reading-title').innerText(), /Self-reliance/);

  const name = width < 700 ? 'mobile-390' : 'desktop-1440';
  // The page's first viewport is a separate introductory hero. Capture that
  // for shell QA, but do NOT mistake it for proof of the Brain rendering.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: out + '/self-' + name + '-viewport.png', fullPage: false, animations: 'disabled' });
  await page.screenshot({ path: out + '/self-' + name + '.png', fullPage: true, animations: 'disabled' });

  // Check actual drawn canvas pixels, not merely element dimensions.
  const brainPixels = await page.locator('.brain-explorer__canvas').evaluate(canvas => {
    const ctx = canvas.getContext('2d');
    if (!ctx || canvas.width < 100 || canvas.height < 100) return 0;
    const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let bright = 0;
    for (let i = 0; i < rgba.length; i += 16) {
      if (rgba[i] > 55 || rgba[i + 1] > 65 || rgba[i + 2] > 65) bright++;
    }
    return bright;
  });
  assert(brainPixels > 100,
    'Brain canvas must contain visible drawn nodes rather than a blank backdrop; found ' + brainPixels);

  // Explicit evidence photos: scroll the real browser to the interactive
  // section before capturing, and independently capture the brain stage.
  await page.locator('#brain-explorer').scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const target = document.querySelector('#brain-explorer');
    const y = target.getBoundingClientRect().top + window.scrollY - 18;
    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
  });
  await page.waitForTimeout(150);
  await page.screenshot({
    path: out + '/brain-' + name + '-viewport.png',
    fullPage: false, animations: 'disabled'
  });
  await page.locator('.brain-explorer__stage').screenshot({
    path: out + '/brain-' + name + '-canvas.png',
    animations: 'disabled'
  });
  console.log('WORKSPACE_BRAIN_CAPTURE ' + JSON.stringify({name, brainPixels, section:'brain-explorer'}));

  const nav = width <= 680 ? '.workspace-mobile-nav' : '.workspace-section-nav';
  await page.locator(nav + ' [data-workspace-nav="today"]').click();
  assert.equal(await page.locator('body').getAttribute('data-workspace-current-view'), 'today');
  assert.equal(await page.locator('#brain-explorer').getAttribute('data-workspace-active'), 'false');
  await page.locator(nav + ' [data-workspace-nav="self"]').click();
  assert.equal(await page.locator('#brain-explorer').getAttribute('data-workspace-active'), 'true');

  const result = { viewport: width, ...snapshot, brainPixels, currentViewAfterReturn: 'self', pageErrors: errors };
  report.push(result);
  if (errors.length) {
    console.log('WORKSPACE_PAGE_ERROR_STACKS ' + JSON.stringify(errors.slice(0, 4)));
    throw Error('Browser JS errors at ' + width + 'px: ' + errors.join('; ').slice(0, 1000));
  }
  await context.close();
}

async function inspectLocked() {
  const context = await browser.newContext({ viewport: {width:390,height:844}, reducedMotion:'reduce',serviceWorkers:'block' });
  await configureMock(context, false);
  const page = await context.newPage();
  const navHistory = [];
  const pageErrors = [];
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) navHistory.push(frame.url());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  const response = await page.goto(base + '/workspace/', { waitUntil: 'load', timeout:30000 });
  assert.equal(response.status(), 200);
  // Avoid Playwright's unstable-element auto-retry while the app is initializing.
  // Sample the final DOM after JS and auth fetch have had a moment to settle.
  await page.waitForTimeout(1600);
  const lockedState = await page.evaluate(() => ({
    auth: document.body.dataset.workspaceAuth ?? null,
    brainHidden: document.querySelector('.brain-explorer__scope')?.hidden,
    shellInert: document.querySelector('.workspace-shell')?.inert,
    authGateVisible: Boolean(document.querySelector('#workspace-auth-gate')),
    url: location.href
  }));
  console.log('WORKSPACE_LOCKED_NAV ' + JSON.stringify(navHistory.slice(-10)));
  console.log('WORKSPACE_LOCKED_ERRORS ' + JSON.stringify(pageErrors.slice(-10)));
  await page.screenshot({path:out + '/locked-mobile.png',animations:'disabled'});
  console.log('WORKSPACE_LOCKED_STATE ' + JSON.stringify(lockedState));
  // Existing gate and inert shell are the security boundary. An absent state
  // marker also fails closed for the new Brain's authReady() predicate.
  assert(lockedState.auth !== 'authenticated', 'signed-out owner state must never show authenticated');
  assert.equal(lockedState.authGateVisible, true, 'signed-out owner must see auth gate');
  assert.equal(lockedState.brainHidden, true, 'Brain content must stay hidden before sign-in');
  assert.equal(lockedState.shellInert, true, 'existing Workspace shell must remain inert');
  report.push({view:'locked', ...lockedState});
  await context.close();
}

try {
  await inspectLocked();
  await inspect(390, 844);
  await inspect(1440, 900);
  await writeFile(out + '/qa-report.json', JSON.stringify({ok:true,report}, null, 2));
  console.log('WORKSPACE_BROWSER_QA_PASSED ' + JSON.stringify(report));
} catch(error) {
  console.error('WORKSPACE_BROWSER_QA_FAILED ' + error.stack);
  console.log('WORKSPACE_BROWSER_QA_PARTIAL ' + JSON.stringify(report));
  process.exitCode = 1;
} finally {
  await browser.close();
}
