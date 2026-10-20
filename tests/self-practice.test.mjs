import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DAILY_PRACTICES, dailyPracticeFor, natalReferenceFor } from '../workspace/self-practice.mjs';

test('one local date has stable daily practice', () => {
  const morning = dailyPracticeFor(new Date(2026, 9, 20, 8, 5));
  const evening = dailyPracticeFor(new Date(2026, 9, 20, 22, 30));
  assert.equal(morning, evening);
  assert.ok(morning.action && morning.reflection && morning.evening);
});

test('next local day rotates authored practice', () => {
  assert.notEqual(dailyPracticeFor(new Date(2026, 9, 20)), dailyPracticeFor(new Date(2026, 9, 21)));
  assert.equal(DAILY_PRACTICES.length, 7);
});

test('natal lens requires matching preexisting chart source, never invents it', () => {
  const chart = 'Astrology: Aries Sun · Taurus Moon · Gemini Rising';
  assert.match(natalReferenceFor(chart, 'sun').title, /Aries Sun/);
  assert.match(natalReferenceFor(chart, 'moon').title, /Taurus Moon/);
  assert.match(natalReferenceFor(chart, 'rising').title, /Gemini Rising/);
  assert.equal(natalReferenceFor('', 'sun'), null);
  assert.equal(natalReferenceFor(chart, 'other'), null);
  const synthetic = 'Astrology: DEMO Sun · DEMO Moon · DEMO Rising.';
  assert.match(natalReferenceFor(synthetic, 'sun').title, /DEMO Sun/);
});

test('Self daily practice is reachable through the fail-closed six-view Workspace shell', async () => {
  const [html, views] = await Promise.all([
    readFile(new URL('../workspace/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../workspace/views.mjs', import.meta.url), 'utf8')
  ]);
  assert.match(views, /self:\s*\[[\s\S]*?"#self-practice"/);
  assert.match(html, /id="self-practice"/);
  assert.match(html, /src="\/workspace\/self-practice\.mjs/);
  assert.match(html, /href="\/workspace\/self-practice\.css/);
  assert.match(html, /data-workspace-nav="self"/);
});

test('complete-site here.now demo artifact requires Self JS and CSS', async () => {
  const builder = await readFile(new URL('../scripts/build-here-now-staging.mjs', import.meta.url), 'utf8');
  assert.match(builder, /'workspace\/self-practice\.mjs'/);
  assert.match(builder, /'workspace\/self-practice\.css'/);
  assert.match(builder, /Incomplete Self staging integration/);
  assert.match(builder, /DEMO_ONLY_NO_PRIVATE_API_OR_RECORDS/);
  assert.match(builder, /Cannot prove Self profile sanitization/);
  assert.match(builder, /Personal natal profile detected/);
  assert.match(builder, /DEMO Sun/);
});

test('complete public here.now artifact has no original Self chart disclosure and stays DEMO-only', async () => {
  const { execFileSync } = await import('node:child_process');
  const { mkdtemp, readFile, rm, stat } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const repoRoot = fileURLToPath(new URL('../', import.meta.url));
  const temp = await mkdtemp(join(tmpdir(), 'ashwood-self-demo-'));
  const output = join(temp, 'site');
  try {
    execFileSync(process.execPath, ['scripts/build-here-now-staging.mjs', output], {
      cwd: repoRoot,
      timeout: 30000,
      stdio: 'pipe'
    });
    const [original, emitted, child, manifest] = await Promise.all([
      readFile(new URL('../workspace/index.html', import.meta.url), 'utf8'),
      readFile(join(output, 'workspace/index.html'), 'utf8'),
      readFile(join(output, 'workspace/sandbox/index.html'), 'utf8'),
      readFile(join(output, 'staging-manifest.json'), 'utf8')
    ]);
    const privateBlock = original.match(/<details class="disclosure"><summary>Underlying profile &amp; source lenses<\/summary>[\s\S]*?<\/details>/i)?.[0];
    assert.ok(privateBlock, 'preflight: source disclosure must be located');
    assert.ok(!emitted.includes(privateBlock), 'real source profile must not remain in emitted public HTML');
    assert.match(emitted, /DEMO Sun · DEMO Moon · DEMO Rising/);
    assert.match(emitted, /id="self-practice"/);
    assert.match(emitted, /__ASHWOOD_DEMO_SANDBOX__/);
    assert.match(child, /__ASHWOOD_DEMO_SANDBOX__/);
    assert.equal(JSON.parse(manifest).workspace_mode, 'DEMO_ONLY_NO_PRIVATE_API_OR_RECORDS');
    await stat(join(output, 'workspace/self-practice.mjs'));
    await stat(join(output, 'workspace/self-practice.css'));
  } finally {
    await rm(temp, {recursive:true, force:true});
  }
});
