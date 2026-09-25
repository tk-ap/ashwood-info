import { Buffer } from 'node:buffer';

const VARIANT_TERMS = {
  'Risk, Controls & Governance': ['risk','control','controls','governance','compliance','audit','resilien','regulatory','remediation'],
  'Finance & Business Analysis': ['finance','financial','banking','analysis','analytical','portfolio','client','business process','report'],
  'Program, Project & Change': ['program','project','change','implementation','cross-functional','stakeholder','launch','coordination','resilien'],
  'Strategy, Product & Operations': ['strategy','strategic','product','operations','workflow','automation','stakeholder','process','transformation'],
  'Business Analysis & Operations': ['business','analysis','operations','process','workflow','stakeholder','improvement','controls','performance']
};

const xmlEscape = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&apos;');

const clean = value => String(value ?? '').replace(/\s+/g,' ').trim();

export function safeResumeFilename(company='', role='') {
  const bit = value => clean(value).replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,48);
  return ['TK', bit(company), bit(role), 'Resume'].filter(Boolean).join('_') + '.docx';
}

function relevanceScore(text='', terms=[]) {
  const haystack = clean(text).toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term.toLowerCase()) ? 1 : 0), 0);
}

function orderedBullets(bullets=[], variant='') {
  const terms = VARIANT_TERMS[variant] || VARIANT_TERMS['Business Analysis & Operations'];
  return bullets.map((text,index) => ({ text:clean(text), index, score:relevanceScore(text,terms) }))
    .filter(item => item.text)
    .sort((a,b) => b.score - a.score || a.index - b.index)
    .map(item => item.text);
}

export function tailorResumeProfile(profile={}, recommendation={}, posting={}) {
  const identity = profile.identity && typeof profile.identity === 'object' ? profile.identity : {};
  const variant = recommendation.variant || 'Business Analysis & Operations';
  const summary = clean(recommendation.summary || profile.summary || '');
  const terms = VARIANT_TERMS[variant] || VARIANT_TERMS['Business Analysis & Operations'];
  const baseSkills = Array.isArray(profile.skills) ? profile.skills.map(clean).filter(Boolean) : [];
  const postingKeywords = Array.isArray(recommendation.keywords) ? recommendation.keywords.map(clean).filter(Boolean) : [];
  const skills = [...new Set([...postingKeywords, ...terms.slice(0,6), ...baseSkills])].slice(0,14);

  const experience = (Array.isArray(profile.experience) ? profile.experience : []).map((item,index) => {
    const bullets = orderedBullets(Array.isArray(item.bullets) ? item.bullets : [], variant);
    const recent = index < 3;
    const maxBullets = Number.isFinite(Number(item.max_bullets)) ? Number(item.max_bullets) : (recent ? 5 : 3);
    return { ...item, bullets:bullets.slice(0, Math.max(1, maxBullets)) };
  });

  return {
    identity,
    variant,
    target:{ company:clean(posting.company), role:clean(posting.role) },
    summary,
    skills,
    experience,
    education:Array.isArray(profile.education) ? profile.education : [],
    certifications:Array.isArray(profile.certifications) ? profile.certifications : [],
    additional:Array.isArray(profile.additional) ? profile.additional : []
  };
}

function p(text, style='BodyText') {
  if (!clean(text)) return '';
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function boldLine(left='', right='') {
  const rightRun = right ? `<w:r><w:tab/><w:t>${xmlEscape(right)}</w:t></w:r>` : '';
  return `<w:p><w:pPr><w:pStyle w:val="JobLine"/><w:tabs><w:tab w:val="right" w:pos="9360"/></w:tabs></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>${xmlEscape(left)}</w:t></w:r>${rightRun}</w:p>`;
}

function bullet(text) {
  return p(`• ${clean(text)}`, 'BulletText');
}

function documentXml(resume) {
  const contact = [
    resume.identity.location,
    resume.identity.phone,
    resume.identity.email,
    resume.identity.linkedin
  ].map(clean).filter(Boolean).join(' | ');

  const experience = resume.experience.map(item => {
    const companyLine = [clean(item.company), clean(item.location)].filter(Boolean).join(' · ');
    const dates = [clean(item.start), clean(item.end)].filter(Boolean).join(' – ');
    return [
      boldLine(clean(item.title), dates),
      p(companyLine,'CompanyLine'),
      ...(item.bullets || []).map(bullet)
    ].join('');
  }).join('');

  const education = resume.education.map(item => {
    const left = [clean(item.school), clean(item.credential)].filter(Boolean).join(' — ');
    return boldLine(left, clean(item.date));
  }).join('');

  const certifications = resume.certifications.map(item => p(typeof item === 'string' ? item : [item.name,item.issuer].filter(Boolean).join(' — '),'BodyText')).join('');
  const additional = resume.additional.map(item => {
    if (typeof item === 'string') return p(item,'BodyText');
    return [boldLine(clean(item.title || item.name), clean(item.dates || item.date)), p([item.organization,item.location].filter(Boolean).join(' · '),'CompanyLine'), ...(Array.isArray(item.bullets)?item.bullets.map(bullet):[])].join('');
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${p(resume.identity.name || 'TK Ashwood','Name')}
${p(contact,'Contact')}
${p('Professional Summary','SectionHeading')}
${p(resume.summary,'BodyText')}
${resume.skills.length ? p('Core Skills','SectionHeading') + p(resume.skills.join(' · '),'BodyText') : ''}
${p('Professional Experience','SectionHeading')}
${experience}
${education ? p('Education','SectionHeading') + education : ''}
${certifications ? p('Certifications','SectionHeading') + certifications : ''}
${additional ? p('Additional Experience','SectionHeading') + additional : ''}
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>
</w:body></w:document>`;
}

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Name"><w:name w:val="Name"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="40"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Contact"><w:name w:val="Contact"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr><w:sz w:val="18"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="SectionHeading"><w:name w:val="Section Heading"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="120" w:after="50"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="21"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="JobLine"><w:name w:val="Job Line"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="60" w:after="0"/><w:keepNext/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="CompanyLine"><w:name w:val="Company Line"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="20"/><w:keepNext/></w:pPr><w:rPr><w:i/><w:sz w:val="18"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="BodyText"><w:name w:val="Body Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="45" w:line="240" w:lineRule="auto"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="BulletText"><w:name w:val="Bullet Text"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="240" w:hanging="180"/><w:spacing w:after="25" w:line="230" w:lineRule="auto"/></w:pPr></w:style>
</w:styles>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n=0;n<256;n++) {
    let c=n;
    for (let k=0;k<8;k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n]=c>>>0;
  }
  return table;
})();

function crc32(buffer) {
  let c=0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u16(n) { const b=Buffer.alloc(2); b.writeUInt16LE(n>>>0,0); return b; }
function u32(n) { const b=Buffer.alloc(4); b.writeUInt32LE(n>>>0,0); return b; }

function zipStore(files) {
  const localParts=[];
  const centralParts=[];
  let offset=0;
  for (const file of files) {
    const name=Buffer.from(file.name,'utf8');
    const data=Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data,'utf8');
    const crc=crc32(data);
    const local=Buffer.concat([
      u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),
      u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name
    ]);
    localParts.push(local,data);
    const central=Buffer.concat([
      u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),
      u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),
      u16(0),u16(0),u32(0),u32(offset),name
    ]);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const central=Buffer.concat(centralParts);
  const end=Buffer.concat([
    u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),
    u32(central.length),u32(offset),u16(0)
  ]);
  return Buffer.concat([...localParts,central,end]);
}

export function buildResumeDocx(profile={}, recommendation={}, posting={}) {
  const resume=tailorResumeProfile(profile,recommendation,posting);
  const document=documentXml(resume);
  const buffer=zipStore([
    {name:'[Content_Types].xml',data:contentTypes},
    {name:'_rels/.rels',data:rootRels},
    {name:'word/document.xml',data:document},
    {name:'word/styles.xml',data:stylesXml},
    {name:'word/_rels/document.xml.rels',data:docRels}
  ]);
  return { buffer, filename:safeResumeFilename(posting.company,posting.role), resume, documentXml:document };
}
