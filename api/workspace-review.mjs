import checklist from './_review-checklist-handler.mjs';
import visit from './_review-visit-handler.mjs';
import design from './_design-handler.mjs';

export default async function handler(req,res){
  const url=new URL(req.url||'/api/workspace-review',`https://${req.headers?.host||'localhost'}`);
  const view=url.searchParams.get('view');
  if (view==='design') return design(req,res);
  return view==='visit' ? visit(req,res) : checklist(req,res);
}
