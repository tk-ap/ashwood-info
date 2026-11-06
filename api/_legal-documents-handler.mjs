import { handleUpload } from '@vercel/blob/client';
import { getSql, json, requireSession, sameOrigin } from './_workspace.mjs';

const PDF_TYPE = 'application/pdf';

async function ensureLegalDocuments(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_legal_documents (
      id BIGSERIAL PRIMARY KEY,
      matter TEXT NOT NULL,
      title TEXT NOT NULL,
      pathname TEXT NOT NULL,
      blob_url TEXT NOT NULL UNIQUE,
      version_label TEXT,
      size_bytes BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS workspace_legal_documents_matter_created_idx
    ON workspace_legal_documents (matter, created_at DESC)`;
}

async function latestUd(sql) {
  const rows = await sql`
    SELECT id, matter, title, pathname, blob_url, version_label, size_bytes, created_at
    FROM workspace_legal_documents
    WHERE matter = 'unlawful-detainer'
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `;
  return rows[0] || null;
}

async function proxyPrivatePdf(row, res) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return json(res, 503, { error: 'Private legal-document storage is not connected.' });
  const upstream = await fetch(row.blob_url, { headers: { Authorization: `Bearer ${token}` } });
  if (!upstream.ok) return json(res, 502, { error: 'The latest legal record could not be opened.' });

  const bytes = Buffer.from(await upstream.arrayBuffer());
  res.status(200);
  res.setHeader('Content-Type', PDF_TYPE);
  res.setHeader('Content-Disposition', `inline; filename="${String(row.title || 'latest-unlawful-detainer-record.pdf').replace(/["\\]/g, '')}"`);
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(bytes);
}

export default async function handler(req, res) {
  try {
    const session = await requireSession(req);
    if (!session) return json(res, 401, { error: 'Workspace is locked.' });

    const sql = getSql();
    await ensureLegalDocuments(sql);
    const url = new URL(req.url || '/api/workspace-legal', `https://${req.headers?.host || 'localhost'}`);

    if (req.method === 'GET') {
      const latest = await latestUd(sql);
      if (!latest) return json(res, 404, {
        error: 'No unlawful-detainer PDF has been stored in Workspace legal documents yet.',
        matter: 'unlawful-detainer',
      });
      if (url.searchParams.get('view') === 'latest') return proxyPrivatePdf(latest, res);
      return json(res, 200, {
        ok: true,
        latest: {
          id: latest.id,
          title: latest.title,
          version_label: latest.version_label,
          size_bytes: Number(latest.size_bytes || 0),
          created_at: latest.created_at,
          open_url: '/api/workspace-legal?view=latest',
        },
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return json(res, 405, { error: 'Method not allowed.' });
    }
    if (!sameOrigin(req)) return json(res, 403, { error: 'Cross-origin upload rejected.' });

    const proto = String(req.headers?.['x-forwarded-proto'] || 'https');
    const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '');
    const request = new Request(`${proto}://${host}${req.url || '/api/workspace-legal'}`, {
      method: 'POST',
      headers: req.headers,
    });

    const result = await handleUpload({
      body: req.body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let meta = {};
        try { meta = JSON.parse(clientPayload || '{}'); } catch { meta = {}; }
        if (meta.matter !== 'unlawful-detainer') throw new Error('Unsupported legal matter.');
        const title = String(meta.title || '').trim().slice(0, 220);
        if (!title) throw new Error('Document title is required.');
        return {
          allowedContentTypes: [PDF_TYPE],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            matter: 'unlawful-detainer',
            title,
            versionLabel: String(meta.versionLabel || '').trim().slice(0, 100),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let meta = {};
        try { meta = JSON.parse(tokenPayload || '{}'); } catch { meta = {}; }
        if (!blob?.url || meta.matter !== 'unlawful-detainer') return;
        await sql`
          INSERT INTO workspace_legal_documents
            (matter, title, pathname, blob_url, version_label, size_bytes)
          VALUES
            ('unlawful-detainer', ${meta.title || 'Unlawful Detainer factual record'},
             ${blob.pathname || ''}, ${blob.url}, ${meta.versionLabel || null}, ${blob.size || null})
          ON CONFLICT (blob_url) DO NOTHING
        `;
      },
    });
    return json(res, 200, result);
  } catch (error) {
    console.error('workspace legal documents failed', error?.message || error);
    return json(res, 400, { error: error?.message || 'Legal-document request failed.' });
  }
}
