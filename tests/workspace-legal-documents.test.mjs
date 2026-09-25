import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Workspace exposes a stable latest unlawful-detainer PDF action',()=>{
 const html=fs.readFileSync('workspace/index.html','utf8');
 assert.match(html,/\/api\/workspace-legal\?view=latest/);
 assert.match(html,/Latest UD record/);
});

test('legal document route requires Workspace session and keeps blobs private',()=>{
 const src=fs.readFileSync('api/_legal-documents-handler.mjs','utf8');
 assert.match(src,/requireSession/);
 assert.match(src,/BLOB_READ_WRITE_TOKEN/);
 assert.match(src,/Authorization: `Bearer/);
 assert.match(src,/Cache-Control', 'private, no-store/);
 assert.doesNotMatch(src,/access:\s*'public'/);
});

test('legal manager uploads PDFs as private blobs and latest is server-selected',()=>{
 const page=fs.readFileSync('workspace/legal/index.html','utf8');
 assert.match(page,/access:'private'/);
 assert.match(page,/application\/pdf/);
 const src=fs.readFileSync('api/_legal-documents-handler.mjs','utf8');
 assert.match(src,/ORDER BY created_at DESC, id DESC/);
});
