import board from './_agentos-board-handler.mjs';
import workstreams from './_agentos-workstreams-handler.mjs';

async function selfDirective(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'POST required'});
  const target=process.env.AGENTOS_API_URL;
  if(!target) return res.status(503).json({error:'AgentOS write bridge is not configured'});
  const directive=String(req.body?.directive||'').trim();
  if(!directive) return res.status(400).json({error:'directive is required'});
  try{
    const upstream=await fetch(target.replace(/\/$/,'')+'/operating-directive',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({directive,source:'ashwood-self'})
    });
    const body=await upstream.json().catch(()=>({}));
    return res.status(upstream.status).json(body);
  }catch(error){
    return res.status(502).json({error:'AgentOS write bridge unavailable'});
  }
}

export default async function handler(req,res){
  const url=new URL(req.url||'/api/workspace-agentos',`https://${req.headers?.host||'localhost'}`);
  const view=url.searchParams.get('view');
  if(view==='self-directive') return selfDirective(req,res);
  return view==='workstreams' ? workstreams(req,res) : board(req,res);
}
