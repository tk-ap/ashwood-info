import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sourceCleanSource } from '../api/_agentos-workstreams-handler.mjs';

const raw = {
  source_id:'tk-youtube-reference-playlist',
  source_type:'youtube_playlist',
  mode:'MONITOR_REFERENCE',
  role:'ECOSYSTEM_REFERENCE_MEDIA',
  source_url:'https://www.youtube.com/playlist?list=PLWYtMecOW_yE',
  status:'ATTENTION',
  discovery_provider:'yt-dlp',
  summary:{ known_videos:2, ingested:1, visual_pending:1, needs_review:0, errors:0 },
  items:[{
    video_id:'abc123',
    title:'A demo',
    channel:'Example',
    video_url:'https://www.youtube.com/watch?v=abc123',
    status:'VISUAL_PENDING',
    coverage:'PARTIAL',
    visual_pending:true,
    needs_review:false,
    transcript:'do not persist this raw transcript in Workspace',
    transcript_chars:1200,
    transcript_excerpt:'As you can see on my screen',
    visual_requirement:{
      required:true,
      approval_state:'AWAITING_USER',
      targets:[{start:'00:01',end:'00:03',reason:'screen demo'}],
    },
    routing_status:'READY_FOR_ANALYSIS',
    findings:[],
  }],
};

test('source sanitizer keeps compact coverage while stripping raw transcript', () => {
  const clean = sourceCleanSource(raw, '2026-09-25T17:00:00.000Z', 'agent-os');
  assert.equal(clean.source_id, 'tk-youtube-reference-playlist');
  assert.equal(clean.summary.visual_pending, 1);
  assert.equal(clean.items[0].coverage, 'PARTIAL');
  assert.equal(clean.items[0].transcript_excerpt, 'As you can see on my screen');
  assert.equal('transcript' in clean.items[0], false);
});

test('source sanitizer rejects non-https video evidence', () => {
  const bad = structuredClone(raw);
  bad.items[0].video_url = 'http://example.com/video';
  const clean = sourceCleanSource(bad, '2026-09-25T17:00:00.000Z', 'agent-os');
  assert.equal(clean.items.length, 0);
});

test('Evidence view exposes Sources and stable API route rewrites to consolidated function', async () => {
  const [html, views, client, vercel, agentos] = await Promise.all([
    readFile(new URL('../workspace/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../workspace/views.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../workspace/sources.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
    readFile(new URL('../api/workspace-agentos.mjs', import.meta.url), 'utf8'),
  ]);
  assert.match(html, /id="sources"/);
  assert.match(html, /\/workspace\/sources\.mjs/);
  assert.match(views, /evidence:[\s\S]*"#sources"/);
  assert.match(views, /sources:"evidence"/);
  assert.match(client, /\/api\/workspace-sources/);
  assert.match(vercel, /"source": "\/api\/workspace-sources"[\s\S]*"destination": "\/api\/workspace-agentos\?view=sources"/);
  assert.match(agentos, /view==='sources'/);
});
