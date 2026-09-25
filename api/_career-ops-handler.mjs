import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sameOrigin } from './_workspace.mjs';

const STATUS_VALUES = new Set([
  'TARGET',
  'APPLIED',
  'SCREENING',
  'RECRUITER',
  'ASSESSMENT',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'ASSUMED_REJECTED',
  'DECLINED',
  'CLOSED',
  'DEFERRED'
]);

const trim = (value, max = 500) => {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
};

const intOrNull = value => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
};

const dateOrNull = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const objectOrEmpty = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export async function ensureCareerSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_career_applications (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      job_id TEXT,
      posting_url TEXT,
      location TEXT,
      work_arrangement TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      salary_currency TEXT NOT NULL DEFAULT 'USD',
      requested_salary INTEGER,
      status TEXT NOT NULL DEFAULT 'TARGET',
      fit_decision TEXT,
      submitted_at TIMESTAMPTZ,
      next_action TEXT,
      next_action_at TIMESTAMPTZ,
      posting_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
      materials JSONB NOT NULL DEFAULT '{}'::jsonb,
      source TEXT NOT NULL DEFAULT 'manual',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_career_events (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES workspace_career_applications(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source TEXT NOT NULL DEFAULT 'manual',
      source_ref TEXT,
      summary TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS workspace_career_applications_status_idx ON workspace_career_applications(status, updated_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS workspace_career_events_application_idx ON workspace_career_events(application_id, occurred_at DESC)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS workspace_career_events_source_ref_idx ON workspace_career_events(source, source_ref) WHERE source_ref IS NOT NULL`;
}

async function addEvent(sql, {
  applicationId,
  eventType,
  occurredAt,
  source,
  sourceRef,
  summary,
  payload
}) {
  const id = `career-event:${crypto.randomUUID()}`;
  const inserted = await sql`
    INSERT INTO workspace_career_events (
      id, application_id, event_type, occurred_at, source, source_ref, summary, payload
    ) VALUES (
      ${id},
      ${applicationId},
      ${trim(eventType, 80) || 'NOTE'},
      ${dateOrNull(occurredAt) || new Date().toISOString()},
      ${trim(source, 80) || 'manual'},
      ${trim(sourceRef, 300)},
      ${trim(summary, 1200) || 'Career update'},
      ${JSON.stringify(objectOrEmpty(payload))}::jsonb
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  return inserted[0]?.id || null;
}

export default async function handler(req, res) {
  try {
    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });

    const sql = getSql();
    await ensureCareerSchema(sql);

    if (req.method === 'GET') {
      const applications = await sql`
        SELECT id, company, role, job_id, posting_url, location, work_arrangement,
          salary_min, salary_max, salary_currency, requested_salary, status,
          fit_decision, submitted_at, next_action, next_action_at, posting_snapshot,
          materials, source, notes, created_at, updated_at
        FROM workspace_career_applications
        ORDER BY
          CASE status
            WHEN 'INTERVIEW' THEN 1
            WHEN 'RECRUITER' THEN 2
            WHEN 'ASSESSMENT' THEN 3
            WHEN 'SCREENING' THEN 4
            WHEN 'APPLIED' THEN 5
            WHEN 'TARGET' THEN 6
            WHEN 'DEFERRED' THEN 7
            ELSE 8
          END,
          COALESCE(next_action_at, updated_at) ASC
      `;
      const events = await sql`
        SELECT id, application_id, event_type, occurred_at, source, source_ref, summary, payload, created_at
        FROM workspace_career_events
        ORDER BY occurred_at DESC
        LIMIT 1000
      `;
      return json(res, 200, { ok: true, applications, events });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'Origin not allowed' });

    const body = parseBody(req);
    const action = String(body.action || '').trim();

    if (action === 'upsert_application') {
      const company = trim(body.company, 220);
      const role = trim(body.role, 300);
      if (!company || !role) return json(res, 400, { ok: false, error: 'Company and role are required' });

      const id = trim(body.id, 250) || `career:${crypto.randomUUID()}`;
      const requestedStatus = String(body.status || 'TARGET').trim().toUpperCase();
      const status = STATUS_VALUES.has(requestedStatus) ? requestedStatus : 'TARGET';
      const before = await sql`SELECT status FROM workspace_career_applications WHERE id = ${id} LIMIT 1`;

      await sql`
        INSERT INTO workspace_career_applications (
          id, company, role, job_id, posting_url, location, work_arrangement,
          salary_min, salary_max, salary_currency, requested_salary, status,
          fit_decision, submitted_at, next_action, next_action_at, posting_snapshot,
          materials, source, notes, updated_at
        ) VALUES (
          ${id}, ${company}, ${role}, ${trim(body.job_id, 120)}, ${trim(body.posting_url, 1000)},
          ${trim(body.location, 300)}, ${trim(body.work_arrangement, 120)},
          ${intOrNull(body.salary_min)}, ${intOrNull(body.salary_max)}, ${trim(body.salary_currency, 10) || 'USD'},
          ${intOrNull(body.requested_salary)}, ${status}, ${trim(body.fit_decision, 500)},
          ${dateOrNull(body.submitted_at)}, ${trim(body.next_action, 1000)}, ${dateOrNull(body.next_action_at)},
          ${JSON.stringify(objectOrEmpty(body.posting_snapshot))}::jsonb,
          ${JSON.stringify(objectOrEmpty(body.materials))}::jsonb,
          ${trim(body.source, 80) || 'manual'}, ${trim(body.notes, 4000)}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          company = EXCLUDED.company,
          role = EXCLUDED.role,
          job_id = EXCLUDED.job_id,
          posting_url = EXCLUDED.posting_url,
          location = EXCLUDED.location,
          work_arrangement = EXCLUDED.work_arrangement,
          salary_min = EXCLUDED.salary_min,
          salary_max = EXCLUDED.salary_max,
          salary_currency = EXCLUDED.salary_currency,
          requested_salary = EXCLUDED.requested_salary,
          status = EXCLUDED.status,
          fit_decision = EXCLUDED.fit_decision,
          submitted_at = EXCLUDED.submitted_at,
          next_action = EXCLUDED.next_action,
          next_action_at = EXCLUDED.next_action_at,
          posting_snapshot = EXCLUDED.posting_snapshot,
          materials = EXCLUDED.materials,
          source = EXCLUDED.source,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `;

      if (!before[0]) {
        await addEvent(sql, {
          applicationId: id,
          eventType: 'CREATED',
          occurredAt: body.submitted_at || Date.now(),
          source: body.source || 'manual',
          summary: status === 'TARGET' ? 'Application added to tracker' : `Application added with status ${status}`,
          payload: { status }
        });
      } else if (before[0].status !== status) {
        await addEvent(sql, {
          applicationId: id,
          eventType: 'STATUS_CHANGE',
          source: body.source || 'manual',
          summary: `${before[0].status} → ${status}`,
          payload: { from: before[0].status, to: status }
        });
      }

      return json(res, 200, { ok: true, id });
    }

    if (action === 'update_status') {
      const applicationId = trim(body.application_id, 250);
      const requestedStatus = String(body.status || '').trim().toUpperCase();
      if (!applicationId || !STATUS_VALUES.has(requestedStatus)) return json(res, 400, { ok: false, error: 'Valid application and status are required' });
      const before = await sql`SELECT status FROM workspace_career_applications WHERE id = ${applicationId} LIMIT 1`;
      if (!before[0]) return json(res, 404, { ok: false, error: 'Application not found' });

      await sql`
        UPDATE workspace_career_applications
        SET status = ${requestedStatus},
            next_action = COALESCE(${trim(body.next_action, 1000)}, next_action),
            next_action_at = COALESCE(${dateOrNull(body.next_action_at)}, next_action_at),
            updated_at = NOW()
        WHERE id = ${applicationId}
      `;

      await addEvent(sql, {
        applicationId,
        eventType: 'STATUS_CHANGE',
        occurredAt: body.occurred_at,
        source: body.source || 'manual',
        sourceRef: body.source_ref,
        summary: trim(body.summary, 1200) || `${before[0].status} → ${requestedStatus}`,
        payload: { from: before[0].status, to: requestedStatus, ...objectOrEmpty(body.payload) }
      });
      return json(res, 200, { ok: true });
    }

    if (action === 'add_event' || action === 'ingest_email') {
      const applicationId = trim(body.application_id, 250);
      if (!applicationId) return json(res, 400, { ok: false, error: 'Application is required' });
      const exists = await sql`SELECT id FROM workspace_career_applications WHERE id = ${applicationId} LIMIT 1`;
      if (!exists[0]) return json(res, 404, { ok: false, error: 'Application not found' });

      const id = await addEvent(sql, {
        applicationId,
        eventType: body.event_type || (action === 'ingest_email' ? 'EMAIL' : 'NOTE'),
        occurredAt: body.occurred_at,
        source: body.source || (action === 'ingest_email' ? 'gmail' : 'manual'),
        sourceRef: body.source_ref,
        summary: body.summary,
        payload: body.payload
      });

      const requestedStatus = String(body.status || '').trim().toUpperCase();
      if (STATUS_VALUES.has(requestedStatus)) {
        await sql`UPDATE workspace_career_applications SET status = ${requestedStatus}, updated_at = NOW() WHERE id = ${applicationId}`;
      } else {
        await sql`UPDATE workspace_career_applications SET updated_at = NOW() WHERE id = ${applicationId}`;
      }
      return json(res, 200, { ok: true, id, duplicate: !id });
    }

    return json(res, 400, { ok: false, error: 'Unknown action' });
  } catch (error) {
    console.error('workspace career ops failed', error);
    return json(res, 500, { ok: false, error: 'Career Ops failed' });
  }
}
