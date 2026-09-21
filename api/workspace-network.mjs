import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sameOrigin } from './_workspace.mjs';

const TYPES = new Set(['SPONSOR','INVITE','REFERRAL','COLLABORATOR','INTRODUCTION','DESIGN_PARTNER','OTHER']);
const STATUSES = new Set(['RESEARCH','READY','CONTACTED','REPLIED','MEETING','PROPOSAL','WON','LOST','INVITED','ACCEPTED','ACTIVE','PAUSED']);

const trim=(v,max=500)=>{const s=String(v??'').trim();return s?s.slice(0,max):null};

async function ensureSchema(sql){
  await sql`CREATE TABLE IF NOT EXISTS workspace_network_relationships (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organization TEXT,
    relationship_type TEXT NOT NULL DEFAULT 'OTHER',
    status TEXT NOT NULL DEFAULT 'RESEARCH',
    project_fit TEXT,
    why_care TEXT,
    contact TEXT,
    channel TEXT,
    support_level TEXT,
    source TEXT,
    referral_url TEXT,
    next_action TEXT,
    next_action_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS workspace_network_relationships_status_idx ON workspace_network_relationships(status, updated_at DESC)`;
}

export default async function handler(req,res){
  try{
    const session=await requireSession(req);
    if(!session)return json(res,401,{ok:false,error:'Unauthorized'});
    const sql=getSql();
    await ensureSchema(sql);

    if(req.method==='GET'){
      const relationships=await sql`
        SELECT id,name,organization,relationship_type,status,project_fit,why_care,contact,channel,
          support_level,source,referral_url,next_action,next_action_at,notes,created_at,updated_at
        FROM workspace_network_relationships
        ORDER BY
          CASE status
            WHEN 'REPLIED' THEN 1 WHEN 'MEETING' THEN 2 WHEN 'PROPOSAL' THEN 3
            WHEN 'CONTACTED' THEN 4 WHEN 'READY' THEN 5 WHEN 'INVITED' THEN 6
            WHEN 'ACCEPTED' THEN 7 WHEN 'ACTIVE' THEN 8 WHEN 'RESEARCH' THEN 9
            WHEN 'PAUSED' THEN 10 WHEN 'WON' THEN 11 WHEN 'LOST' THEN 12 ELSE 13 END,
          COALESCE(next_action_at,updated_at) ASC
      `;
      return json(res,200,{ok:true,relationships});
    }

    if(req.method!=='POST')return json(res,405,{ok:false,error:'Method not allowed'});
    if(!sameOrigin(req))return json(res,403,{ok:false,error:'Origin not allowed'});
    const body=parseBody(req);
    const action=String(body.action||'').trim();

    if(action==='upsert_relationship'){
      const name=trim(body.name,220);
      if(!name)return json(res,400,{ok:false,error:'Name is required'});
      const id=trim(body.id,250)||`network:${crypto.randomUUID()}`;
      const type=String(body.relationship_type||'OTHER').toUpperCase();
      const status=String(body.status||'RESEARCH').toUpperCase();
      await sql`
        INSERT INTO workspace_network_relationships(
          id,name,organization,relationship_type,status,project_fit,why_care,contact,channel,
          support_level,source,referral_url,next_action,next_action_at,notes,updated_at
        ) VALUES (
          ${id},${name},${trim(body.organization,220)},${TYPES.has(type)?type:'OTHER'},
          ${STATUSES.has(status)?status:'RESEARCH'},${trim(body.project_fit,700)},${trim(body.why_care,1200)},
          ${trim(body.contact,500)},${trim(body.channel,120)},${trim(body.support_level,250)},
          ${trim(body.source,250)},${trim(body.referral_url,1000)},${trim(body.next_action,1000)},
          ${body.next_action_at?new Date(body.next_action_at).toISOString():null},${trim(body.notes,4000)},NOW()
        )
        ON CONFLICT(id) DO UPDATE SET
          name=EXCLUDED.name,organization=EXCLUDED.organization,relationship_type=EXCLUDED.relationship_type,
          status=EXCLUDED.status,project_fit=EXCLUDED.project_fit,why_care=EXCLUDED.why_care,
          contact=EXCLUDED.contact,channel=EXCLUDED.channel,support_level=EXCLUDED.support_level,
          source=EXCLUDED.source,referral_url=EXCLUDED.referral_url,next_action=EXCLUDED.next_action,
          next_action_at=EXCLUDED.next_action_at,notes=EXCLUDED.notes,updated_at=NOW()
      `;
      return json(res,200,{ok:true,id});
    }

    if(action==='update_status'){
      const id=trim(body.id,250);
      const status=String(body.status||'').toUpperCase();
      if(!id||!STATUSES.has(status))return json(res,400,{ok:false,error:'Valid relationship and status are required'});
      const rows=await sql`UPDATE workspace_network_relationships SET status=${status},updated_at=NOW() WHERE id=${id} RETURNING id`;
      if(!rows[0])return json(res,404,{ok:false,error:'Relationship not found'});
      return json(res,200,{ok:true,id,status});
    }

    return json(res,400,{ok:false,error:'Unknown action'});
  }catch(error){
    console.error('workspace network failed',error);
    return json(res,500,{ok:false,error:'Network failed'});
  }
}
