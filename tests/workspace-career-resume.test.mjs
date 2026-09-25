import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResumeDocx, safeResumeFilename, tailorResumeProfile } from '../api/_career-resume-docx.mjs';
import { validateResumeProfile } from '../api/_career-resume-profile.mjs';

const profile = {
  identity:{
    name:'TK Ashwood',
    location:'Los Angeles, CA',
    email:'career@example.com',
    phone:'555-0100',
    linkedin:'linkedin.com/in/example'
  },
  summary:'Baseline summary.',
  skills:['Business analysis','Process improvement','Stakeholder management'],
  experience:[
    {
      company:'Example Bank',
      location:'Los Angeles, CA',
      title:'Business Execution Associate',
      start:'May 2023',
      end:'Mar 2026',
      bullets:[
        'Managed recurring controls reports and aligned workflows with service-level expectations.',
        'Identified automation opportunities that reduced manual work.',
        'Supported cross-functional business resiliency exercises with Risk, Legal, Compliance, and Operations.'
      ]
    }
  ]
};

test('resume profile validation requires structured factual experience', () => {
  assert.equal(validateResumeProfile(profile).ok, true);
  assert.equal(validateResumeProfile({ identity:{ name:'TK' }, experience:[] }).ok, false);
});

test('tailoring reorders existing evidence without inventing work history', () => {
  const tailored = tailorResumeProfile(profile, {
    variant:'Risk, Controls & Governance',
    summary:'Controls-focused summary.',
    keywords:['operational risk','governance']
  }, { company:'Target Co', role:'Risk Manager' });

  assert.equal(tailored.summary, 'Controls-focused summary.');
  assert.equal(tailored.experience[0].company, 'Example Bank');
  assert.equal(tailored.experience[0].end, 'Mar 2026');
  assert.match(tailored.experience[0].bullets[0], /controls|resilien/i);
  assert.ok(tailored.skills.includes('operational risk'));
});

test('DOCX generator produces a real zip-based Word document with ATS text', () => {
  const artifact = buildResumeDocx(profile, {
    variant:'Business Analysis & Operations',
    summary:'Business analysis and operations summary.',
    keywords:['business analysis','operations']
  }, { company:'Target / Co', role:'Senior Business Analyst' });

  assert.equal(artifact.buffer.subarray(0,2).toString(), 'PK');
  assert.match(artifact.buffer.toString('utf8'), /word\/document\.xml/);
  assert.match(artifact.documentXml, /Business analysis and operations summary/);
  assert.match(artifact.documentXml, /Example Bank/);
  assert.match(artifact.documentXml, /Mar 2026/);
  assert.equal(artifact.filename, 'TK_Target_Co_Senior_Business_Analyst_Resume.docx');
});

test('resume filenames remain upload-safe', () => {
  assert.equal(safeResumeFilename('A&B / Co.','Strategy + Ops'), 'TK_A_B_Co_Strategy_Ops_Resume.docx');
});
