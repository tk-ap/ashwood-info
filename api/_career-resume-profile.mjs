export async function ensureCareerResumeSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_career_resume_profiles (
      id TEXT PRIMARY KEY,
      profile JSONB NOT NULL DEFAULT '{}'::jsonb,
      source TEXT NOT NULL DEFAULT 'manual',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_career_resume_artifacts (
      id TEXT PRIMARY KEY,
      application_id TEXT,
      source TEXT,
      opportunity_id TEXT,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      variant TEXT NOT NULL,
      filename TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'docx',
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS workspace_career_resume_artifacts_opportunity_idx ON workspace_career_resume_artifacts(source, opportunity_id, generated_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS workspace_career_resume_artifacts_application_idx ON workspace_career_resume_artifacts(application_id, generated_at DESC)`;
}

const objectOrNull = value => value && typeof value === 'object' && !Array.isArray(value) ? value : null;

export function validateResumeProfile(profile) {
  if (!objectOrNull(profile)) return { ok:false, error:'Resume profile must be an object' };
  if (!objectOrNull(profile.identity) || !String(profile.identity.name || '').trim()) return { ok:false, error:'Resume profile requires identity.name' };
  if (!Array.isArray(profile.experience) || !profile.experience.length) return { ok:false, error:'Resume profile requires at least one experience entry' };
  for (const item of profile.experience) {
    if (!objectOrNull(item) || !String(item.company || '').trim() || !String(item.title || '').trim()) {
      return { ok:false, error:'Every experience entry requires company and title' };
    }
    if (!Array.isArray(item.bullets)) return { ok:false, error:'Every experience entry requires a bullets array' };
  }
  return { ok:true };
}

export async function loadCareerResumeProfile(sql) {
  await ensureCareerResumeSchema(sql);
  const rows = await sql`
    SELECT profile, source, updated_at
    FROM workspace_career_resume_profiles
    WHERE id = 'owner'
    LIMIT 1
  `;

  const raw = process.env.CAREER_RESUME_PROFILE_JSON;
  let environmentProfile = null;
  let environmentUpdatedAt = null;

  if (raw) {
    try {
      const profile = JSON.parse(raw);
      const valid = validateResumeProfile(profile);
      if (!valid.ok) throw new Error(valid.error);
      environmentProfile = profile;
      const sourceUpdated = profile?._source_notes?.updated;
      const parsed = sourceUpdated ? new Date(sourceUpdated) : null;
      environmentUpdatedAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    } catch (error) {
      console.error('CAREER_RESUME_PROFILE_JSON is invalid', error);
    }
  }

  const stored = rows[0] || null;
  const storedUpdatedAt = stored?.updated_at ? new Date(stored.updated_at) : null;
  const environmentIsNewer = Boolean(
    environmentProfile &&
    environmentUpdatedAt &&
    (!stored?.profile || !storedUpdatedAt || Number.isNaN(storedUpdatedAt.getTime()) || environmentUpdatedAt > storedUpdatedAt)
  );

  if (environmentIsNewer) {
    const saved = await saveCareerResumeProfile(sql, environmentProfile, 'environment-seed');
    if (saved.ok) {
      return {
        profile: environmentProfile,
        source: 'environment-seed',
        updated_at: new Date().toISOString()
      };
    }
  }

  if (stored?.profile) return stored;
  if (environmentProfile) return { profile: environmentProfile, source:'environment', updated_at:null };
  return null;
}

export async function saveCareerResumeProfile(sql, profile, source='workspace') {
  await ensureCareerResumeSchema(sql);
  const valid = validateResumeProfile(profile);
  if (!valid.ok) return valid;
  await sql`
    INSERT INTO workspace_career_resume_profiles (id, profile, source, updated_at)
    VALUES ('owner', ${JSON.stringify(profile)}::jsonb, ${String(source || 'workspace').slice(0,80)}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      profile = EXCLUDED.profile,
      source = EXCLUDED.source,
      updated_at = NOW()
  `;
  return { ok:true };
}
