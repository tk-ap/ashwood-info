import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { rankOpportunityQueues, rotateOpportunities } from '../api/_career-opportunities.mjs';

async function fixture() {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(
    strings.reduce((query, part, index) => query + (index ? `$${index}` : '') + part, ''), values
  )).rows;
  const source = (await readFile(new URL('../api/_career-opportunities-handler.mjs', import.meta.url), 'utf8'))
    .replace(/^import .*;\n/gm, '')
    .replace('export async function verifyPendingOpportunities', 'async function verifyPendingOpportunities')
    .replace('export default async function handler', 'async function handler');
  const dependencies = {
    getSql:() => sql,
    json:(res, status, body) => { res.statusCode = status; res.body = body; },
    parseBody:req => req.body || {},
    requireSession:async req => req.owner ? { token:'owner' } : null,
    sameOrigin:req => req.origin !== 'foreign',
    rankOpportunityQueues,
    rotateOpportunities,
    CURATED_CAREER_OPPORTUNITIES:[],
    verifyEmployerListing:async job => ({
      status:'verified',
      employer_url:`https://jobs.${job.company_name.toLowerCase().replaceAll(' ', '')}.com/${job.id}`,
      source_url:job.source_url,
      // Relative to now: the listing only promotes links verified in the last 7 days, so a fixed
      // date made this test start failing a week after it was written.
      checked_at:new Date().toISOString(),
      verified_at:new Date().toISOString(),
      evidence:{ company_matches:true, role_matches:true }
    })
  };
  const handlers = Function(...Object.keys(dependencies), `${source}\nreturn { handler, verifyPendingOpportunities };`)(...Object.values(dependencies));
  await sql`CREATE TABLE workspace_career_applications (company TEXT, role TEXT, posting_url TEXT, status TEXT)`;
  const response = () => ({ statusCode:0, body:null });
  return { db, ...handlers, response };
}

test('autonomous verification stores independent evidence and promotes only the verified employer link', async t => {
  const f = await fixture();
  t.after(() => f.db.close());
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => new Response(JSON.stringify({ jobs:[{
    id:'job-1',
    jobTitle:'Senior Business Analyst',
    companyName:'Example Co',
    jobGeo:'USA',
    jobType:['Full-time'],
    pubDate:new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    jobDescription:'Business analysis, stakeholder management, controls and process improvement.',
    url:'https://jobicy.com/jobs/job-1'
  }] }), { status:200, headers:{ 'content-type':'application/json' } });
  t.after(() => { globalThis.fetch = originalFetch; });

  const verify = f.response();
  await f.verifyPendingOpportunities({ method:'POST', owner:true, headers:{}, body:{
    opportunities:[{ source:'Jobicy', opportunity_id:'job-1' }]
  } }, verify);
  assert.equal(verify.statusCode, 200);
  assert.equal(verify.body.checked, 1);
  assert.equal(verify.body.verified, 1);

  const listed = f.response();
  await f.handler({ method:'GET', owner:true, headers:{ host:'example.test' }, url:'/api/workspace-career?view=opportunities' }, listed);
  assert.equal(listed.statusCode, 200);
  const promoted = [...listed.body.opportunities, ...listed.body.review_opportunities]
    .find(item => item.id === 'job-1');
  assert.ok(promoted);
  assert.equal(promoted.url, 'https://jobs.exampleco.com/job-1');
  assert.equal(promoted.source_url, 'https://jobicy.com/jobs/job-1');
});
