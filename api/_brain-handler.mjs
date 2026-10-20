import { neon } from '@neondatabase/serverless';
import { json, parseBody, requireSession, sameOrigin } from './_workspace.mjs';

// One owner account is supported by the existing Workspace auth. Never accept an
// owner id from the caller; all SQL also scopes to the server-owned key.
const OWNER = 'owner';
const MAX_BODY = 100_000;
function database() {
  const url = process.env.ASHWOOD_BRAIN_DATABASE_URL;
  if (!url) throw new Error('Brain database not configured');
  return neon(url);
}
function cleanText(value, max) { return String(value ?? '').trim().slice(0, max); }
// Imports must be idempotent (ashwood-info#277): a note created from a source
// carries an immutable source_key, and the same key never creates a second note.
// A repeat import returns the existing note untouched, so owner edits survive.
const SOURCE_KEY = /^[A-Za-z0-9:._-]{1,200}$/;
const FINGERPRINT = /^[0-9a-f]{64}$/;
let sourceColumnsReady = null;
function ensureSourceColumns(sql) {
  if (!sourceColumnsReady) {
    sourceColumnsReady = (async () => {
      await sql`ALTER TABLE brain.notes ADD COLUMN IF NOT EXISTS source_key text`;
      await sql`ALTER TABLE brain.notes ADD COLUMN IF NOT EXISTS source_fingerprint text`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS brain_notes_owner_source_key ON brain.notes (owner_key, source_key) WHERE source_key IS NOT NULL`;
    })().catch(error => { sourceColumnsReady = null; throw error; });
  }
  return sourceColumnsReady;
}
function validId(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value)); }
function markdown(note) {
  // Markdown is data. Never generate executable HTML in the export route.
  const heading = note.title ? '# ' + note.title.replace(/[\r\n]+/g, ' ') + '\n\n' : '';
  const source = note.source_url ? '\n\nSource: ' + note.source_url : '';
  return heading + note.body_markdown + source + '\n';
}
export function createBrainHandler({ authenticate = requireSession, sqlFactory = database } = {}) {
  return async function handler(req, res) {
    try {
      // This check is on the server, never solely a hidden workspace element.
      const session = await authenticate(req);
      if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const url = new URL(req.url || '/api/workspace-brain', 'https://localhost');
      const id = url.searchParams.get('id');
      const action = url.searchParams.get('action');
      const sql = sqlFactory();
      if (req.method === 'GET') {
        if (action === 'export') {
          if (!validId(id)) return json(res, 400, { ok: false, error: 'Invalid note id' });
          const rows = await sql`SELECT id, title, body_markdown, source_url FROM brain.notes WHERE owner_key = ${OWNER} AND id = ${id}::uuid AND archived_at IS NULL LIMIT 1`;
          if (!rows[0]) return json(res, 404, { ok: false, error: 'Not found' });
          res.status(200).setHeader('Content-Type', 'text/markdown; charset=utf-8');
          res.setHeader('Cache-Control', 'private, no-store');
          res.setHeader('Content-Disposition', 'attachment; filename="brain-note.md"');
          return res.end(markdown(rows[0]));
        }
        if (id) {
          if (!validId(id)) return json(res, 400, { ok: false, error: 'Invalid note id' });
          const rows = await sql`SELECT id, title, body_markdown, source_url, created_at, updated_at FROM brain.notes WHERE owner_key = ${OWNER} AND id = ${id}::uuid AND archived_at IS NULL LIMIT 1`;
          return rows[0] ? json(res, 200, { ok: true, note: rows[0] }) : json(res, 404, { ok: false, error: 'Not found' });
        }
        const q = cleanText(url.searchParams.get('q'), 200);
        const limit = Math.min(30, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
        const rows = q
          ? await sql`SELECT id, title, source_url, created_at, updated_at FROM brain.notes WHERE owner_key = ${OWNER} AND archived_at IS NULL AND to_tsvector('english', title || ' ' || body_markdown) @@ plainto_tsquery('english', ${q}) ORDER BY updated_at DESC LIMIT ${limit}`
          : await sql`SELECT id, title, source_url, created_at, updated_at FROM brain.notes WHERE owner_key = ${OWNER} AND archived_at IS NULL ORDER BY updated_at DESC LIMIT ${limit}`;
        return json(res, 200, { ok: true, notes: rows });
      }
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
      if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'Origin not allowed' });
      const body = parseBody(req);
      const title = cleanText(body.title, 240);
      const content = String(body.body_markdown ?? '');
      const source = cleanText(body.source_url, 2048);
      if (!title || content.length > MAX_BODY) return json(res, 400, { ok: false, error: 'Invalid title or note length' });
      if (source && (!/^https?:\/\//i.test(source) || (() => { try { new URL(source); return false; } catch { return true; } })())) {
        return json(res, 400, { ok: false, error: 'Invalid source URL' });
      }
      const sourceKey = body.source_key == null || body.source_key === '' ? null : String(body.source_key);
      const fingerprint = body.source_fingerprint == null || body.source_fingerprint === '' ? null : String(body.source_fingerprint).toLowerCase();
      if (sourceKey !== null && !SOURCE_KEY.test(sourceKey)) return json(res, 400, { ok: false, error: 'Invalid source key' });
      if (fingerprint !== null && (!sourceKey || !FINGERPRINT.test(fingerprint))) return json(res, 400, { ok: false, error: 'Invalid source fingerprint' });
      if (!sourceKey) {
        const rows = await sql`INSERT INTO brain.notes(owner_key, title, body_markdown, source_url) VALUES (${OWNER}, ${title}, ${content}, ${source || null}) RETURNING id, title, created_at`;
        return json(res, 201, { ok: true, note: rows[0] });
      }
      await ensureSourceColumns(sql);
      const inserted = await sql`INSERT INTO brain.notes(owner_key, title, body_markdown, source_url, source_key, source_fingerprint)
        VALUES (${OWNER}, ${title}, ${content}, ${source || null}, ${sourceKey}, ${fingerprint})
        ON CONFLICT (owner_key, source_key) WHERE source_key IS NOT NULL DO NOTHING
        RETURNING id, title, created_at`;
      if (inserted[0]) return json(res, 201, { ok: true, note: inserted[0], imported: true });
      // Already imported: never overwrite (the owner may have edited it). Report whether the source changed.
      const existing = await sql`SELECT id, title, created_at, source_fingerprint FROM brain.notes WHERE owner_key = ${OWNER} AND source_key = ${sourceKey} LIMIT 1`;
      const note = existing[0];
      return json(res, 200, { ok: true, note: { id: note.id, title: note.title, created_at: note.created_at }, imported: false, duplicate: true,
        source_changed: Boolean(fingerprint && note.source_fingerprint && note.source_fingerprint !== fingerprint) });
    } catch (error) {
      console.error('Brain request failed', error?.name || 'Unknown');
      return json(res, 503, { ok: false, error: 'Brain temporarily unavailable' });
    }
  };
}
export default createBrainHandler();
