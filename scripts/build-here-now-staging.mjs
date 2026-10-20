#!/usr/bin/env node
/**
 * Build the complete, static ASHWOOD staging artifact used by the one stable
 * here.now sandbox. It deliberately takes files from the checked-out web app,
 * not from a hand-made mock. Workspace runtime reads are intercepted by the
 * companion bootstrap and the few static Workspace data files are replaced
 * with explicit DEMO fixtures.
 *
 * Usage: node scripts/build-here-now-staging.mjs /absolute/new/output-directory
 */
import { execFileSync } from 'node:child_process';
import { access, copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';

const [destinationArg] = process.argv.slice(2);
if (!destinationArg || !isAbsolute(destinationArg)) {
  throw new Error('Pass one new, absolute output directory. The builder never replaces an existing directory.');
}

const root = process.cwd();
const destination = resolve(destinationArg);
if (destination === root || !destination.startsWith(`${resolve('/tmp')}${sep}`)) {
  throw new Error('The staging artifact must be a new directory below /tmp, never the repository or a stable source directory.');
}
try {
  await access(destination);
  throw new Error(`Refusing to replace existing output directory: ${destination}`);
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const allowedExtensions = new Set([
  '.css', '.gif', '.html', '.ico', '.jpeg', '.jpg', '.js', '.mjs', '.mp3',
  '.png', '.svg', '.txt', '.wav', '.webp', '.woff', '.woff2', '.xml'
]);
const excludedRoots = new Set(['.agent-os', '.github', 'api', 'docs', 'node_modules', 'scripts', 'tests']);
const requiredPaths = [
  'index.html', 'career/index.html', 'guide/index.html', 'workspace/index.html',
  'workspace/today.mjs', 'workspace/sandbox-bootstrap.js',
  'workspace/self-practice.mjs', 'workspace/self-practice.css',
  'v3-nav.js', 'theme.js'
];

const demoFixtures = {
  'workspace/goals.json': {
    schema_version: 'demo-1',
    source_note: 'DEMO sandbox fixture. No private reflection, Context, or owner data is connected.',
    north_star: 'Use a safe preview to evaluate the Workspace frame.',
    goals: [
      { id: 'demo-direction', name: 'Direction', description: 'A synthetic staging objective.', priority: 1, success_signals: ['preview reviewed'], repo_hints: ['demo'] }
    ]
  },
  'workspace/priorities.json': {
    as_of: 'DEMO',
    principle: 'DEMO sandbox fixture. It is not connected to an owner workstream or a live system.',
    priorities: [
      { rank: 1, product: 'Demo Workspace', tier: 'NOW', outcome: 'Review the staging experience without creating a real record.', owner_next: 'Leave feedback in the code review, not in this demo.', phase_done_when: ['The preview is reviewed.'], match: ['demo'] }
    ]
  },
  'workspace/agentos/health-evidence.json': {
    schema_version: 'demo-1',
    assessed_at: 'DEMO',
    overall_score: null,
    status: 'UNAVAILABLE_IN_DEMO',
    scores: [],
    evidence_note: 'DEMO sandbox fixture. No host, runtime, fleet, or private evidence is connected.'
  },
  'workspace/funding/opportunities.json': {
    version: 1,
    generated_at: 'DEMO',
    source_note: 'DEMO sandbox fixture. No career, funding, or owner opportunity records are published here.',
    opportunities: [{
      id: 'demo-funding-001', name: 'Demo Build Grant', funder: 'Demo Foundation',
      type: 'creative_funding', value: 'Illustrative only — no real funding record',
      verification: 'DEMO', confidence: 'demo_fixture', disposition: 'CONSULT',
      reason: 'This fictional record exists only so the review screen has a complete state.',
      criteria: ['No real eligibility is represented.'], eligibility_rules: [], evidence: [], documents: [],
      benefit_interactions: [], source_label: 'Demo source', source_url: 'https://example.invalid/'
    }]
  }
};

const isPublishable = path => {
  const parts = path.split('/');
  if (excludedRoots.has(parts[0])) return false;
  if (path === '.gitignore' || path.startsWith('data/')) return false;
  if (path.startsWith('workspace/') && (path.endsWith('.json') || path.endsWith('.md'))) return false;
  return allowedExtensions.has(extname(path).toLowerCase());
};

function safeWorkspaceHtml(html, path) {
  const withoutPrivateRecord = html.replace(
    /<a\b[^>]*\bworkspace-legal-record\b[^>]*>[\s\S]*?<\/a>/gi,
    '<span class="text-button workspace-legal-record" aria-label="Private record unavailable in demo">Private record unavailable in demo</span>'
  );
  let safeHtml = withoutPrivateRecord;
  if (path === 'workspace/index.html') {
    // Public DEMO must not inherit the owner's natal or other private source lenses.
    const privateProfileBlock = /<details class="disclosure"><summary>Underlying profile &amp; source lenses<\/summary>[\s\S]*?<\/details>/i;
    const originalProfile = withoutPrivateRecord.match(privateProfileBlock)?.[0];
    if (!originalProfile) {
      throw new Error('Cannot prove Self profile sanitization; refuse sandbox artifact.');
    }
    safeHtml = withoutPrivateRecord.replace(
      privateProfileBlock,
      '<details class="disclosure"><summary>Underlying profile &amp; source lenses · DEMO</summary><div class="workstream-list"><p><strong>Astrology:</strong> DEMO Sun · DEMO Moon · DEMO Rising.</p><p>Illustrative profile only. No owner chart, Human Design, numerology, or private Saturn Return source content is included in this sandbox demo.</p></div></details>'
    );
    if (safeHtml.includes(originalProfile) ||
        !safeHtml.includes('DEMO Sun · DEMO Moon · DEMO Rising')) {
      throw new Error('Personal natal profile detected in public Self sandbox artifact.');
    }
  }
  const bootstrap = '<script>window.__ASHWOOD_DEMO_SANDBOX__=true;</script>\n  <script src="/workspace/sandbox-demo-fixtures.js?v=20261019-demo2"></script>\n  <script src="/workspace/sandbox-bootstrap.js?v=20261020-demo3"></script>';
  if (!/<\/head>/i.test(safeHtml)) throw new Error('Workspace HTML has no </head> for the DEMO sandbox bootstrap.');
  return safeHtml.replace(/<\/head>/i, `${bootstrap}\n</head>`);
}

async function writeRelative(path, data) {
  const target = resolve(destination, path);
  if (!target.startsWith(`${destination}${sep}`)) throw new Error(`Unsafe output path: ${path}`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
}

const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'buffer' })
  .toString('utf8').split('\0').filter(Boolean).filter(isPublishable);

await mkdir(destination, { recursive: true });
for (const path of tracked) {
  const from = resolve(root, path);
  const to = resolve(destination, path);
  if (!to.startsWith(`${destination}${sep}`)) throw new Error(`Unsafe source path: ${path}`);
  await mkdir(dirname(to), { recursive: true });
  if (path.startsWith('workspace/') && path.endsWith('.html')) {
    await writeFile(to, safeWorkspaceHtml(await readFile(from, 'utf8'), path));
  } else {
    await copyFile(from, to);
  }
}
for (const [path, fixture] of Object.entries(demoFixtures)) {
  await writeRelative(path, `${JSON.stringify(fixture, null, 2)}\n`);
}

for (const path of requiredPaths) {
  try { await stat(resolve(destination, path)); }
  catch { throw new Error(`Incomplete staging artifact: required path missing: ${path}`); }
}

const emittedWorkspace = await readFile(resolve(destination, 'workspace/index.html'), 'utf8');
if (!emittedWorkspace.includes('id="self-practice"') ||
    !emittedWorkspace.includes('src="/workspace/self-practice.mjs') ||
    !emittedWorkspace.includes('href="/workspace/self-practice.css')) {
  throw new Error('Incomplete Self staging integration: daily practice or asset refs missing.');
}
const emittedViewRouter = await readFile(resolve(destination, 'workspace/views.mjs'), 'utf8');
if (!emittedViewRouter.includes('"#self-practice"')) {
  throw new Error('Self staging section not registered in fail-closed view router.');
}

if (/drive\.google\.com|workspace-legal-record[^>]*href=/i.test(emittedWorkspace)) {
  throw new Error('Private Workspace record link remained in the staging artifact.');
}
const emittedPaths = [];
async function collect(dir) {
  const entries = await (await import('node:fs/promises')).readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) await collect(full);
    else emittedPaths.push(relative(destination, full));
  }
}
await collect(destination);
for (const path of emittedPaths) {
  if (path.startsWith('api/') || path.startsWith('data/') || path.endsWith('.md') || path.startsWith('.agent-os/')) {
    throw new Error(`Non-public source leaked into staging artifact: ${path}`);
  }
}

const manifest = {
  format: 'ashwood-here-now-demo-static-v1',
  source_commit: sourceCommit,
  base: 'https://ashwood-info.vercel.app/',
  workspace_mode: 'DEMO_ONLY_NO_PRIVATE_API_OR_RECORDS',
  generated_at: new Date().toISOString(),
  file_count: emittedPaths.length,
  required_paths: requiredPaths
};
await writeRelative('staging-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ output: destination, ...manifest }));
