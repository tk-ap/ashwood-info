import { handleUpload } from '@vercel/blob/client';
import { getSql, json, parseBody, requireSession, sameOrigin } from './_workspace.mjs';

const AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
];

const CLEARANCE = new Set(['not-cleared', 'review', 'cleared']);
const AGREEMENT = new Set(['unknown', 'discussion', 'draft', 'signed']);
const REGISTRATION = new Set(['not-recorded', 'not-applicable', 'pending', 'registered']);

export async function ensureUploadsTable(sql) {
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
      rights_ledger JSONB NOT NULL DEFAULT '{}'::jsonb,
      rights_updated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE workspace_uploads ADD COLUMN IF NOT EXISTS rights_ledger JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE workspace_uploads ADD COLUMN IF NOT EXISTS rights_updated_at TIMESTAMPTZ`;
}

function cleanText(value, max = 1200) {
  return String(value || '').trim().slice(0, max);
}

function cleanRightsLedger(input) {
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const directTkPct = raw.directTkPct === null || raw.directTkPct === '' ? null : Number(raw.directTkPct);
  const editionSize = raw.editionSize === null || raw.editionSize === '' ? null : Number(raw.editionSize);
  const editionPrice = raw.editionPrice === null || raw.editionPrice === '' ? null : Number(raw.editionPrice);

  if (directTkPct !== null && (!Number.isFinite(directTkPct) || directTkPct < 0 || directTkPct > 100)) {
    throw new Error('Direct-sale TK share must be between 0 and 100.');
  }
  if (editionSize !== null && (!Number.isFinite(editionSize) || editionSize < 1 || editionSize > 100000)) {
    throw new Error('Edition size must be a positive number.');
  }
  if (editionPrice !== null && (!Number.isFinite(editionPrice) || editionPrice < 0 || editionPrice > 1000000)) {
    throw new Error('Edition price must be zero or greater.');
  }

  const commercialClearance = CLEARANCE.has(raw.commercialClearance) ? raw.commercialClearance : 'not-cleared';
  const agreementStatus = AGREEMENT.has(raw.agreementStatus) ? raw.agreementStatus : 'unknown';
  const registration = (value, fallback = 'not-recorded') => REGISTRATION.has(value) ? value : fallback;

  return {
    compositionSplit: cleanText(raw.compositionSplit, 1500),
    masterSplit: cleanText(raw.masterSplit, 1500),
    directTkPct,
    commercialClearance,
    agreementStatus,
    agreementReference: cleanText(raw.agreementReference, 1500),
    proRegistration: registration(raw.proRegistration),
    soundexchangeRegistration: registration(raw.soundexchangeRegistration, 'not-applicable'),
    copyrightRegistration: registration(raw.copyrightRegistration),
    editionSize,
    editionPrice,
    notes: cleanText(raw.notes, 4000),
  };
}

function publicRow(row) {
  return {
    id: row.id,
    pathname: row.pathname,
    url: row.url,
    download_url: row.download_url,
    content_type: row.content_type,
    size_bytes: Number(row.size_bytes || 0),
    title: row.title,
    artist: row.artist,
    producer_credit: row.producer_credit,
    rights_note: row.rights_note,
    source_url: row.source_url,
    publish_to_music: Boolean(row.publish_to_music),
    rights_ledger: row.rights_ledger && typeof row.rights_ledger === 'object' ? row.rights_ledger : {},
    rights_updated_at: row.rights_updated_at,
    created_at: row.created_at,
  };
}

export default async function handler(req, res) {
  try {
    const sql = getSql();
    await ensureUploadsTable(sql);

    if (req.method === 'GET') {
      const session = await requireSession(req);
      if (!session) return json(res, 401, { error: 'Workspace is locked.' });
      const rows = await sql`SELECT * FROM workspace_uploads ORDER BY created_at DESC LIMIT 50`;
      return json(res, 200, { ok: true, uploads: rows.map(publicRow) });
    }

    if (req.method === 'PATCH') {
      if (!sameOrigin(req)) return json(res, 403, { error: 'Cross-origin update rejected.' });
      const session = await requireSession(req);
      if (!session) return json(res, 401, { error: 'Workspace is locked.' });
      const body = parseBody(req);
      const id = Number(body.id);
      if (!Number.isFinite(id) || id <= 0) return json(res, 400, { error: 'A valid upload id is required.' });

      let rows;
      if (Object.prototype.hasOwnProperty.call(body, 'rightsLedger')) {
        const rightsLedger = cleanRightsLedger(body.rightsLedger);
        rows = await sql`
          UPDATE workspace_uploads
          SET rights_ledger = ${JSON.stringify(rightsLedger)}::jsonb,
              rights_updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;
      } else if (Object.prototype.hasOwnProperty.call(body, 'publishToMusic')) {
        const publish = Boolean(body.publishToMusic);
        rows = await sql`
          UPDATE workspace_uploads
          SET publish_to_music = ${publish}
          WHERE id = ${id}
          RETURNING *
        `;
      } else {
        return json(res, 400, { error: 'No supported update was supplied.' });
      }

      if (!rows[0]) return json(res, 404, { error: 'Upload not found.' });
      return json(res, 200, { ok: true, upload: publicRow(rows[0]) });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST, PATCH');
      return json(res, 405, { error: 'Method not allowed.' });
    }

    const body = parseBody(req);
    const proto = String(req.headers?.['x-forwarded-proto'] || 'https');
    const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '');
    const request = new Request(`${proto}://${host}${req.url || '/api/workspace-upload'}`, {
      method: 'POST',
      headers: req.headers,
    });

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!sameOrigin(req)) throw new Error('Cross-origin upload rejected.');
        const session = await requireSession(req);
        if (!session) throw new Error('Workspace is locked.');

        let meta = {};
        try { meta = JSON.parse(clientPayload || '{}'); } catch { meta = {}; }
        const title = String(meta.title || '').trim();
        if (!title) throw new Error('Track title is required.');

        const safeMeta = {
          title: title.slice(0, 180),
          artist: String(meta.artist || 't.kap').trim().slice(0, 120) || 't.kap',
          producerCredit: String(meta.producerCredit || '').trim().slice(0, 300),
          rightsNote: String(meta.rightsNote || '').trim().slice(0, 800),
          sourceUrl: String(meta.sourceUrl || '').trim().slice(0, 1000),
          publishToMusic: Boolean(meta.publishToMusic),
        };

        return {
          allowedContentTypes: AUDIO_TYPES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(safeMeta),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let meta = {};
        try { meta = JSON.parse(tokenPayload || '{}'); } catch { meta = {}; }
        if (!meta.title || !blob?.url) return;

        await sql`
          INSERT INTO workspace_uploads (
            pathname, url, download_url, content_type, size_bytes,
            title, artist, producer_credit, rights_note, source_url, publish_to_music
          ) VALUES (
            ${blob.pathname || ''}, ${blob.url}, ${blob.downloadUrl || null}, ${blob.contentType || null}, ${blob.size || null},
            ${meta.title}, ${meta.artist || 't.kap'}, ${meta.producerCredit || null}, ${meta.rightsNote || null},
            ${meta.sourceUrl || null}, ${Boolean(meta.publishToMusic)}
          )
          ON CONFLICT (url) DO UPDATE SET
            title = EXCLUDED.title,
            artist = EXCLUDED.artist,
            producer_credit = EXCLUDED.producer_credit,
            rights_note = EXCLUDED.rights_note,
            source_url = EXCLUDED.source_url,
            publish_to_music = EXCLUDED.publish_to_music
        `;
      },
    });

    return json(res, 200, result);
  } catch (error) {
    const message = error?.message || 'Upload failed.';
    const missingBlob = /BLOB|token|store/i.test(message) && !process.env.BLOB_READ_WRITE_TOKEN;
    return json(res, 400, {
      error: missingBlob
        ? 'ASHWOOD Drop storage is not connected yet. Connect a Vercel Blob store to the ASHWOOD project once, then this uploader will work without GitHub file handling.'
        : message,
    });
  }
}
