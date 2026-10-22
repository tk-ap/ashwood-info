import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { createBrainHandler } from '../api/_brain-handler.mjs';

// Exercise the actual PostgreSQL text-search and parameterized SQL contract,
// without needing the unavailable Workspace database or any private seed data.
function asSql(db) {
  return async (strings, ...params) => {
    let statement = strings[0];
    for (let i=0;i<params.length;i++) statement += '$' + (i+1) + strings[i+1];
    const result = await db.query(statement, params);
    return result.rows;
  };
}
function response() {
  return {
    code: 200, headers: {}, body: '',
    status(code) { this.code=code; return this; },
    setHeader(k,v) { this.headers[k.toLowerCase()]=v; return this; },
    end(str) { this.body=str; return this; }
  };
}
function req(method,url,body,authenticated=true) {
  return {method,url,body,headers:{
    host:'local.test',origin:'https://local.test',
    ...(authenticated?{'x-test-auth':'owner'}:{})
  }};
}
test('Brain integration: private create / list / search / read / Markdown export and owner isolation',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`CREATE SCHEMA brain;
    CREATE TABLE brain.notes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_key text NOT NULL,
      title text NOT NULL DEFAULT '',
      body_markdown text NOT NULL DEFAULT '',
      source_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      archived_at timestamptz
    );`);
  const sql=asSql(db);
  const handler=createBrainHandler({
    authenticate:async r=>r.headers['x-test-auth']==='owner'?{token:'fixture'}:null,
    sqlFactory:()=>sql
  });
  async function call(request) {
    const res=response();await handler(request,res);
    return {...res,json:()=>JSON.parse(res.body)};
  }
  const anonymous=await call(req('GET','/api/workspace-brain',undefined,false));
  assert.equal(anonymous.code,401);
  const source='https://example.org/owner-approved-source';
  const posted=await call(req('POST','/api/workspace-brain',{
    title:'Context handoff proof',body_markdown:'Only supported knowledge becomes a note.\n\nProof phrase: private garden.',source_url:source
  }));
  assert.equal(posted.code,201,posted.body);
  const id=posted.json().note.id;
  assert.match(id,/^[a-f0-9-]{36}$/);
  // Another person's note in the same database must not be visible, even
  // through direct ID, list, search, or export.
  const other=await sql`INSERT INTO brain.notes(owner_key,title,body_markdown) VALUES ('other-owner','Unrelated private record','private garden') RETURNING id`;
  const otherId=other[0].id;
  const list=await call(req('GET','/api/workspace-brain'));
  assert.equal(list.code,200);
  assert.deepEqual(list.json().notes.map(n=>n.id),[id]);
  const search=await call(req('GET','/api/workspace-brain?q=private%20garden'));
  assert.deepEqual(search.json().notes.map(n=>n.id),[id]);
  const read=await call(req('GET','/api/workspace-brain?id='+id));
  assert.equal(read.json().note.source_url,source);
  const exported=await call(req('GET','/api/workspace-brain?action=export&id='+id));
  assert.equal(exported.code,200);
  assert.equal(exported.headers['content-type'],'text/markdown; charset=utf-8');
  assert.equal(exported.headers['cache-control'],'private, no-store');
  assert.equal(exported.body,'# Context handoff proof\n\nOnly supported knowledge becomes a note.\n\nProof phrase: private garden.\n\nSource: '+source+'\n');
  for(const path of ['/api/workspace-brain?id='+otherId,'/api/workspace-brain?action=export&id='+otherId]){
    const result=await call(req('GET',path));assert.equal(result.code,404);
  }
  const deniedExport=await call(req('GET','/api/workspace-brain?action=export&id='+id,undefined,false));
  assert.equal(deniedExport.code,401);
  const forged=req('POST','/api/workspace-brain',{title:'Wrong origin'});forged.headers.origin='https://external.test';
  const deniedWrite=await call(forged);assert.equal(deniedWrite.code,403);
  const count=await sql`SELECT count(*)::int AS n FROM brain.notes`;
  assert.equal(count[0].n,2);
 } finally {await db.close();}
});

test('Brain import is idempotent by source key and never overwrites owner edits (Codex review of #273)',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`CREATE SCHEMA brain;
    CREATE TABLE brain.notes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_key text NOT NULL,
      title text NOT NULL DEFAULT '',
      body_markdown text NOT NULL DEFAULT '',
      source_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      archived_at timestamptz
    );`);
  const migration=await readFile(new URL('../migrations/20261021_brain_source_keys.sql', import.meta.url),'utf8');
  await db.exec(migration);
  const sql=asSql(db);
  const handler=createBrainHandler({authenticate:async r=>r.headers['x-test-auth']==='owner'?{token:'fixture'}:null,sqlFactory:()=>sql});
  async function call(request){const res=response();await handler(request,res);return {...res,json:()=>JSON.parse(res.body)};}
  const fp='a'.repeat(64);
  const note={title:'Goals — ALVIRA interview, 2026-10-15',body_markdown:'Approved note text.',source_key:'alvira:fixture-profile:goals:0',source_fingerprint:fp};
  const first=await call(req('POST','/api/workspace-brain',note));
  assert.equal(first.code,201,first.body);
  assert.equal(first.json().imported,true);
  const id=first.json().note.id;
  const again=await call(req('POST','/api/workspace-brain',note));
  assert.equal(again.code,200,again.body);
  assert.deepEqual([again.json().imported,again.json().duplicate,again.json().note.id,again.json().source_changed],[false,true,id,false]);
  // The owner edits the note; a re-import (even with a changed source) must not overwrite it.
  await sql`UPDATE brain.notes SET body_markdown='Owner edited this.' WHERE id=${id}::uuid`;
  const changed=await call(req('POST','/api/workspace-brain',{...note,body_markdown:'Newer source text.',source_fingerprint:'b'.repeat(64)}));
  assert.equal(changed.code,200);
  assert.equal(changed.json().source_changed,true);
  const kept=await sql`SELECT body_markdown FROM brain.notes WHERE id=${id}::uuid`;
  assert.equal(kept[0].body_markdown,'Owner edited this.');
  // Another owner using the same source key is a different note (owner-scoped uniqueness).
  await sql`INSERT INTO brain.notes(owner_key,title,source_key) VALUES ('other-owner','x','alvira:fixture-profile:goals:0')`;
  const count=await sql`SELECT count(*)::int AS n FROM brain.notes WHERE owner_key='owner'`;
  assert.equal(count[0].n,1,'a repeated import added no row');
  // Bad keys are refused; manual notes without a source key still work.
  for(const bad of [{...note,source_key:'has spaces'},{...note,source_key:'alvira:x',source_fingerprint:'not-hex'},{title:'Manual',body_markdown:'x',source_fingerprint:fp}]){
    assert.equal((await call(req('POST','/api/workspace-brain',bad))).code,400);
  }
  assert.equal((await call(req('POST','/api/workspace-brain',{title:'Manual note',body_markdown:'x'}))).code,201);
 } finally {await db.close();}
});
