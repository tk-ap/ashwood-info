import { getSql, json } from './_workspace.mjs';

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_uploads (
      id BIGSERIAL PRIMARY KEY,
      pathname TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      download_url TEXT,
      content_type TEXT,
      size_bytes BIGINT,
      title TEXT NOT NULL,
      artist TEXT NOT NULL DEFAULT 't.kap',
      producer_credit TEXT,
      rights_note TEXT,
      source_url TEXT,
      publish_to_music BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function publicTrack(row) {
  return {
    id: row.id,
    url: row.url,
    content_type: row.content_type,
    title: row.title,
    artist: row.artist,
    producer_credit: row.producer_credit,
    rights_note: row.rights_note,
    source_url: row.source_url,
    created_at: row.created_at,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const sql = getSql();
    await ensureTable(sql);
    const rows = await sql`
      SELECT id, url, content_type, title, artist, producer_credit, rights_note, source_url, created_at
      FROM workspace_uploads
      WHERE publish_to_music = TRUE
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return json(res, 200, { ok: true, tracks: rows.map(publicTrack) });
  } catch (error) {
    return json(res, 500, { error: error?.message || 'Could not load the music library.' });
  }
}
