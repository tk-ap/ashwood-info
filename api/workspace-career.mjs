import careerOps from './_career-ops-handler.mjs';
import opportunities from './_career-opportunities-handler.mjs';
import resume from './_career-resume-handler.mjs';

export default async function handler(req,res){
  const url=new URL(req.url||'/api/workspace-career',`https://${req.headers?.host||'localhost'}`);
  const view=url.searchParams.get('view');
  if(view==='opportunities') return opportunities(req,res);
  if(view==='resume') return resume(req,res);
  return careerOps(req,res);
}
