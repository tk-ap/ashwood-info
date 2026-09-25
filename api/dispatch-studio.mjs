import crypto from 'node:crypto';
import { getSql, isPreviewReadOnly, json, parseBody, rejectPreviewMutation, requireSession, sameOrigin } from './_workspace.mjs';

const SEED_TITLE = 'Building Around the Agent';
const SEED_SLUG = 'building-around-the-agent';
const SEED_BODY = "# Building Around the Agent\n\nI’ve learned a lot about AI agents over the last couple weeks, mostly because I keep giving them increasingly real jobs and then discovering all the new ways that can go wrong.\n\nThe big one: the model is only part of the system.\n\nWe’re moving pretty quickly from AI that answers questions to AI that uses tools, writes code, maintains state, talks to other systems, and actually does things on our behalf. Which is great. We have, naturally, responded by giving the intern root access.\n\nBut the security conversation is starting to catch up with the capability conversation. Microsoft researchers recently demonstrated vulnerabilities where model-controlled tool parameters could lead to arbitrary file writes and remote code execution, making a broader point that matters for anyone building in this space: the model itself isn't a security boundary.\n\nNIST is actively working through identity and authorization for AI agents. OWASP is talking about least privilege, explicit authorization, human oversight, and separating decision-making from execution.\n\nWhat’s been interesting is that I didn’t start with those frameworks and work backward. My own agents have basically been bullying me into similar conclusions.\n\nAnd somewhere in that process, four projects I’d been building started looking less like separate products and more like parts of the same system.\n\nALVIRA handles context. What should an AI know about the human it’s working for, and what context should be allowed to move between systems?\n\nledgato handles authority. What is the agent actually allowed to do, and can something outside the model enforce that boundary?\n\nAgentOS handles execution and persistence. What work exists, who owns it, what happened, what failed, what evidence exists, and how does work continue across agents, models, and restarts?\n\nASHWOOD handles human visibility and control. Can I actually understand what the machines are doing, what needs me, and what state the whole thing is in?\n\nContext. Authority. Execution. Human understanding.\n\nThat four-part system has become a useful way for me to think about what has to exist around an increasingly capable agent.\n\nWith ledgato, for example, I kept coming back to the difference between asking an agent to respect a boundary and actually having a boundary. “Ask me first” sounds like control until you realize it’s still just more words being fed to the same model. If the action matters, I want something outside the model capable of saying no.\n\nAgentOS has been teaching me the less glamorous side of autonomy. Once agents are working across hours or days, you suddenly care a lot about who owns what, what survived a restart, what failed halfway through, whether two workers are operating on different versions of reality, and whether “done” actually means anything.\n\nAgents, for the record, love saying done. I love evidence.\n\nAnd apparently if you put enough agents together they start reinventing office politics. Ownership, delegation, duplicated work, escalation, conflicting state. I did not set out to build middle management for robots, but here we are.\n\nThe part I really underestimated, though, was the human side of persistence.\n\nI can make AgentOS remember exactly what happened and still wake up the next morning with no idea what the hell everyone did. That’s pushed ASHWOOD into a much more active role in the ecosystem. It started as my personal site, became a build journal, then a workspace, and now it’s becoming the place where all that machine state gets translated back into something I can actually understand: what’s moving, what’s stuck, what changed, what needs me, and what we apparently discussed once three weeks ago and then banished to the backlog.\n\nThat feels increasingly important. If your AI becomes more autonomous but harder for you to understand, you haven’t necessarily eliminated work. You may have just traded labor for opacity.\n\nSo if I were starting an agentic product today, I’d spend at least as much time thinking about the infrastructure around the model as the model itself.\n\nDoes it have the right context? Who controls its authority? How does its work persist and get verified? And can the human still understand and control the system?\n\nYou can build those layers very differently than I am. But I’m increasingly convinced you need answers to all four.\n\nAnd I don’t think the people developing those answers should exclusively be people who are excited about AI.\n\nIf you’re deeply skeptical of this technology, good. There should be a seat at the table for that skepticism too.\n\nYou don’t have to believe every company needs an agent. You don’t have to be excited about automating everything, and you definitely don’t have to accept that more autonomy automatically equals progress. But if these systems are going to be given more authority anyway, the people asking “should it be allowed to do that?” need to be in the room with the people asking “can we make it do that?”\n\nSecurity, authorization, enforcement, auditing and human override aren't anti-innovation positions. They’re places where skepticism can become useful engineering.\n\nSo if your instinct toward AI is distrust, I don't necessarily want to convince you out of it. I’d rather see some of that distrust turned into requirements the rest of us have to build against.\n\nThose questions are increasingly showing up in security research, standards work and real-world incidents too. That convergence is probably the biggest thing I’ve learned recently.\n\nThere is room here. Not because agents aren't capable enough yet, but almost because they're becoming capable enough that everything around them suddenly matters.\n\nAnd the people most excited about giving computers jobs probably shouldn't be the only people deciding the terms of employment.";
const SEED_SOURCES = [{"label":"Microsoft Security — Prompts Become Shells","url":"https://www.microsoft.com/en-us/security/blog/2026/05/07/prompts-become-shells-rce-vulnerabilities-ai-agent-frameworks/"},{"label":"NIST — Software and AI Agent Identity and Authorization","url":"https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd"},{"label":"OWASP — AI Agent Security Cheat Sheet","url":"https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html"}];

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_dispatch_drafts (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    published_title TEXT,
    published_body TEXT,
    published_sources JSONB,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`INSERT INTO workspace_dispatch_drafts(id,slug,title,body,status,sources)
    VALUES ('dispatch:building-around-the-agent',${SEED_SLUG},${SEED_TITLE},${SEED_BODY},'DRAFT',${JSON.stringify(SEED_SOURCES)}::jsonb)
    ON CONFLICT(slug) DO NOTHING`;
}
const clean = (v,n) => String(v ?? '').trim().slice(0,n);

export default async function handler(req,res) {
  try {
    if (rejectPreviewMutation(req, res)) return;
    const sql=getSql();
    if (!isPreviewReadOnly()) await ensureTable(sql);

    if (req.method === 'GET' && req.query?.view === 'published') {
      const rows=await sql`SELECT slug,published_title AS title,published_body AS body,published_sources AS sources,published_at
        FROM workspace_dispatch_drafts WHERE published_at IS NOT NULL ORDER BY published_at DESC`;
      return json(res,200,{ok:true,dispatches:rows});
    }

    const session=await requireSession(req);
    if(!session) return json(res,401,{ok:false,error:'Unauthorized'});

    if(req.method === 'GET') {
      const slug=clean(req.query?.slug || SEED_SLUG,160);
      const rows=await sql`SELECT id,slug,title,body,status,sources,published_title,published_body,published_sources,published_at,created_at,updated_at
        FROM workspace_dispatch_drafts WHERE slug=${slug} LIMIT 1`;
      const logs=await sql`SELECT id,title,occurred_at,status,notes FROM workspace_evidence WHERE source='build_log' ORDER BY occurred_at DESC LIMIT 80`;
      return json(res,200,{ok:true,draft:rows[0]||null,build_logs:logs});
    }

    if(req.method !== 'POST') return json(res,405,{ok:false,error:'Method not allowed'});
    if(!sameOrigin(req)) return json(res,403,{ok:false,error:'Origin not allowed'});
    const body=parseBody(req), action=clean(body.action,40), slug=clean(body.slug || SEED_SLUG,160);
    if(action === 'save') {
      const title=clean(body.title,220), text=String(body.body || '').trim().slice(0,60000);
      if(!title || !text) return json(res,400,{ok:false,error:'Title and body are required'});
      const rows=await sql`UPDATE workspace_dispatch_drafts SET title=${title},body=${text},status='DRAFT',updated_at=NOW()
        WHERE slug=${slug} RETURNING slug,title,status,updated_at`;
      return json(res,200,{ok:true,draft:rows[0]});
    }
    if(action === 'publish') {
      const rows=await sql`UPDATE workspace_dispatch_drafts SET
        published_title=title,published_body=body,published_sources=sources,published_at=NOW(),status='PUBLISHED',updated_at=NOW()
        WHERE slug=${slug} RETURNING slug,published_title AS title,published_at`;
      if(!rows[0]) return json(res,404,{ok:false,error:'Draft not found'});
      return json(res,200,{ok:true,published:rows[0],url:'/dispatch/'+slug+'/'});
    }
    return json(res,400,{ok:false,error:'Unknown action'});
  } catch(error) {
    console.error('dispatch studio failed',error);
    return json(res,500,{ok:false,error:'Dispatch Studio failed'});
  }
}
