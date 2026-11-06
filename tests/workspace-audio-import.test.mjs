import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const source = readFileSync(new URL('../workspace/audio-import-studio.js', import.meta.url), 'utf8');
const intake = readFileSync(new URL('../workspace/drop.js', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../workspace/index.html', import.meta.url), 'utf8');
const views = readFileSync(new URL('../workspace/views.mjs', import.meta.url), 'utf8');

test('studio is syntactically valid and mounted on the established Workspace intake', () => {
  assert.doesNotThrow(() => new Script(source));
  assert.match(shell, /workspace\/audio-import-studio\.js/);
  assert.match(shell, /workspace\/audio-import-studio\.css/);
  assert.match(source, /#ashwood-drop/);
  assert.match(views, /"audio-import-studio":"music"/);
  assert.match(views, /music: \["#ashwood-drop"\]/);
  assert.match(shell, /href="#music" data-workspace-nav="music"/);
});

test('MP3 preparation never publishes automatically or installs a downloader', () => {
  assert.match(source, /credentials: 'omit'/);
  assert.match(source, /protocol !== 'https:'/);
  assert.match(source, /youtube\\\.com/);
  assert.match(source, /confirmRights.checked/);
  assert.match(source, /\/workspace\/vendor\/lame\.min\.js/);
  assert.doesNotMatch(source, /ytdl|yt-dlp|youtube-dl|mp3cow\.com/i);
  assert.match(intake, /ashwood:prepared-audio/);
  assert.match(intake, /form\.elements\.publishToMusic\.checked = false/);
});

test('hard size and duration caps protect memory use in mobile browsers', () => {
  assert.match(source, /40 \* 1024 \* 1024/);
  assert.match(source, /MAX_SECONDS = 360/);
  assert.match(source, /getReader\(\)/);
  assert.match(source, /size > MAX_BYTES/);
});