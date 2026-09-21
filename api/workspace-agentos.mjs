import board from './_agentos-board-handler.mjs';
import workstreams from './_agentos-workstreams-handler.mjs';

export default async function handler(req,res){
  const url=new URL(req.url||'/api/workspace-agentos',`https://${req.headers?.host||'localhost'}`);
  return url.searchParams.get('view')==='workstreams' ? workstreams(req,res) : board(req,res);
}
