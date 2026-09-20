import { getSql, json, requireSession } from './_workspace.mjs';
export default async function handler(req,res) {
  try {
    if (!await requireSession(req)) return json(res,401,{ok:false,error:'Unauthorized'});
    if (req.method !== 'GET') return json(res,405,{ok:false,error:'Method not allowed'});
    const sql=getSql();
    const logs=await sql`SELECT id,title,occurred_at,status,notes FROM workspace_evidence WHERE source='build_log' ORDER BY occurred_at DESC LIMIT 500`;
    return json(res,200,{ok:true,logs});
  } catch { return json(res,500,{ok:false,error:'Could not load build logs'}); }
}
