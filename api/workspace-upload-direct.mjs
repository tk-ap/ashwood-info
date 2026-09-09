import { put } from '@vercel/blob';
import { ensureUploadsTable } from './workspace-upload.mjs';
import { getSql, json, requireSession, sameOrigin } from './_workspace.mjs';

// The client upload flow sends the file straight from the browser to Blob storage,
// which is the only way large masters can be uploaded at all — a serverless function
// body is capped around 4.5MB. That direct transfer is currently stalling for the
// owner, so this route offers the other path for files small enough to survive it:
// the browser posts the bytes here and the function writes them to Blob itself.
//
// This is a fallback, not a replacement. Anything above the cap must keep using
// /api/workspace-upload, because it physically cannot pass through this one.
const MAX_DIRECT_BYTES = 4 * 1024 * 1024;

const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
]);

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'binary');
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    // Stop reading rather than buffering a file that is already over the limit.
    if (total > MAX_DIRECT_BYTES) throw Object.assign(new Error('too-large'), { code: 'TOO_LARGE' });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function metaFrom(req) {
  const proto = String(req.headers?.['x-forwarded-proto'] || 'https');
  const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || 'localhost');
  const params = new URL(req.url || '/', `${proto}://${host}`).searchParams;
  const text = (key, max) => String(params.get(key) || '').trim().slice(0, max);
  return {
    title: text('title', 180),
    artist: text('artist', 120) || 't.kap',
    producerCredit: text('producerCredit', 300),
    rightsNote: text('rightsNote', 800),
    sourceUrl: text('sourceUrl', 1000),
    publishToMusic: params.get('publishToMusic') === 'true',
    pathname: text('pathname', 300),
    contentType: text('contentType', 120),
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return json(res, 405, { error: 'Method not allowed.' });
    }
    if (!sameOrigin(req)) return json(res, 403, { error: 'Cross-origin upload rejected.' });
    const session = await requireSession(req);
    if (!session) return json(res, 401, { error: 'Workspace is locked.' });

    const meta = metaFrom(req);
    if (!meta.title) return json(res, 400, { error: 'Track title is required.' });
    if (!meta.pathname) return json(res, 400, { error: 'An upload path is required.' });
    if (meta.contentType && !AUDIO_TYPES.has(meta.contentType)) {
      return json(res, 415, { error: 'That file type is not an accepted audio format.' });
    }

    let file;
    try {
      file = await readRawBody(req);
    } catch (error) {
      if (error?.code === 'TOO_LARGE') {
        return json(res, 413, { error: 'File is too large for the direct route. Use the standard uploader.' });
      }
      throw error;
    }
    if (!file.length) return json(res, 400, { error: 'No file was received.' });
    if (file.length > MAX_DIRECT_BYTES) {
      return json(res, 413, { error: 'File is too large for the direct route. Use the standard uploader.' });
    }

    const blob = await put(meta.pathname, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: meta.contentType || undefined,
    });

    const sql = getSql();
    await ensureUploadsTable(sql);
    const rows = await sql`
      INSERT INTO workspace_uploads (
        pathname, url, download_url, content_type, size_bytes,
        title, artist, producer_credit, rights_note, source_url, publish_to_music
      ) VALUES (
        ${blob.pathname || meta.pathname}, ${blob.url}, ${blob.downloadUrl || null},
        ${blob.contentType || meta.contentType || null}, ${file.length},
        ${meta.title}, ${meta.artist}, ${meta.producerCredit || null}, ${meta.rightsNote || null},
        ${meta.sourceUrl || null}, ${meta.publishToMusic}
      )
      ON CONFLICT (url) DO UPDATE SET
        title = EXCLUDED.title,
        artist = EXCLUDED.artist,
        producer_credit = EXCLUDED.producer_credit,
        rights_note = EXCLUDED.rights_note,
        source_url = EXCLUDED.source_url,
        publish_to_music = EXCLUDED.publish_to_music
      RETURNING id, url, pathname
    `;

    return json(res, 200, { ok: true, upload: rows[0] || { url: blob.url, pathname: blob.pathname } });
  } catch (error) {
    const message = error?.message || 'Upload failed.';
    const missingBlob = /BLOB|token|store/i.test(message) && !process.env.BLOB_READ_WRITE_TOKEN;
    console.error('direct upload failed', message);
    return json(res, 400, {
      error: missingBlob
        ? 'ASHWOOD Drop storage is not connected yet. Connect a Vercel Blob store to the ASHWOOD project once, then this uploader will work.'
        : message,
    });
  }
}
