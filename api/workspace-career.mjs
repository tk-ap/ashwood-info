import careerOps from './_career-ops-handler.mjs';
import opportunities from './_career-opportunities-handler.mjs';

export default async function handler(req,res){
  const url=new URL(req.url||'/api/workspace-career',`https://${req.headers?.host||'localhost'}`);
  return url.searchParams.get('view')==='opportunities' ? opportunities(req,res) : careerOps(req,res);
}
