import checklist from './_review-checklist-handler.mjs';
import visit from './_review-visit-handler.mjs';

export default async function handler(req,res){
  const url=new URL(req.url||'/api/workspace-review',`https://${req.headers?.host||'localhost'}`);
  return url.searchParams.get('view')==='visit' ? visit(req,res) : checklist(req,res);
}
