import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sameOrigin } from './_workspace.mjs';
import { ensureCareerSchema } from './_career-ops-handler.mjs';
import { loadCareerResumeProfile, ensureCareerResumeSchema } from './_career-resume-profile.mjs';
import { resumeRecommendation, scoreOpportunity, stripHtml } from './_career-opportunities.mjs';
import { buildResumeDocx } from './_career-resume-docx.mjs';

const SOURCE = 'remotive';

async function resolveOpportunity(sql, source, opportunityId) {
  if (source !== SOURCE) return null;
  const rows = await sql`
    SELECT payload
    FROM workspace_career_opportunity_cache
    WHERE source = ${SOURCE}
    LIMIT 1
  `;
  const jobs = Array.isArray(rows[0]?.payload) ? rows[0].payload : [];
  return jobs.find(job => String(job.id || '') === String(opportunityId || '')) || null;
}

async function resolveTarget(sql, body) {
  const applicationId = String(body.application_id || '').trim();
  if (applicationId) {
    const rows = await sql`
      SELECT id, company, role, posting_snapshot, materials, source, job_id
      FROM workspace_career_applications
      WHERE id = ${applicationId}
      LIMIT 1
    `;
    const app = rows[0];
    if (!app) return null;
    const description = app.posting_snapshot?.summary || [
      ...(app.posting_snapshot?.responsibilities || []),
      ...(app.posting_snapshot?.requirements || []),
      ...(app.posting_snapshot?.preferred || [])
    ].join(' ');
    const job = { title:app.role, description };
    const score = scoreOpportunity(job);
    return {
      applicationId:app.id,
      source:String(app.source || '').toLowerCase(),
      opportunityId:String(app.job_id || ''),
      company:app.company,
      role:app.role,
      recommendation:resumeRecommendation(job, score.matches || []),
      materials:app.materials || {}
    };
  }

  const source = String(body.source || SOURCE).trim().toLowerCase();
  const opportunityId = String(body.opportunity_id || '').trim();
  if (!opportunityId) return null;
  const job = await resolveOpportunity(sql, source, opportunityId);
  if (!job) return null;
  const scored = scoreOpportunity(job);
  return {
    applicationId:null,
    source,
    opportunityId,
    company:String(job.company_name || '').trim(),
    role:String(job.title || '').trim(),
    recommendation:resumeRecommendation(job, scored.matches || []),
    materials:{},
    postingSummary:stripHtml(job.description || '')
  };
}

export default async function handler(req, res) {
  try {
    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok:false, error:'Unauthorized' });
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok:false, error:'Origin not allowed' });

    const sql = getSql();
    await ensureCareerSchema(sql);
    await ensureCareerResumeSchema(sql);

    const profileRow = await loadCareerResumeProfile(sql);
    if (!profileRow?.profile) {
      return json(res, 409, {
        ok:false,
        code:'RESUME_PROFILE_NOT_CONFIGURED',
        error:'Private baseline resume profile is not configured yet.'
      });
    }

    const body = parseBody(req);
    const target = await resolveTarget(sql, body);
    if (!target?.company || !target?.role) {
      return json(res, 404, { ok:false, error:'Career target not found' });
    }

    const artifact = buildResumeDocx(profileRow.profile, target.recommendation, {
      company:target.company,
      role:target.role
    });
    const generatedAt = new Date().toISOString();
    const artifactId = `career-resume:${crypto.randomUUID()}`;

    await sql`
      INSERT INTO workspace_career_resume_artifacts (
        id, application_id, source, opportunity_id, company, role, variant,
        filename, format, generated_at, metadata
      ) VALUES (
        ${artifactId}, ${target.applicationId}, ${target.source || null}, ${target.opportunityId || null},
        ${target.company}, ${target.role}, ${target.recommendation.variant},
        ${artifact.filename}, 'docx', ${generatedAt},
        ${JSON.stringify({
          profile_source:profileRow.source,
          profile_updated_at:profileRow.updated_at || null,
          keywords:target.recommendation.keywords || []
        })}::jsonb
      )
    `;

    if (target.applicationId) {
      const nextMaterials = {
        ...(target.materials || {}),
        resume:artifact.filename,
        resume_variant:target.recommendation.variant,
        resume_format:'docx',
        resume_generated_at:generatedAt,
        resume_artifact_id:artifactId
      };
      await sql`
        UPDATE workspace_career_applications
        SET materials = ${JSON.stringify(nextMaterials)}::jsonb,
            updated_at = NOW()
        WHERE id = ${target.applicationId}
      `;
    }

    res.status(200);
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename.replaceAll('"','')}"`);
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Resume-Variant', encodeURIComponent(target.recommendation.variant || ''));
    res.end(artifact.buffer);
  } catch (error) {
    console.error('career resume generation failed', error);
    return json(res, 500, { ok:false, error:'Resume generation failed' });
  }
}
