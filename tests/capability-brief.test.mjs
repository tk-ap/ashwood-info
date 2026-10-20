import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the one-page capability brief is shareable, downloadable and linked from /career', async () => {
  const [brief, career, pdf] = await Promise.all([
    read('brief/index.html'),
    read('career/index.html'),
    stat(new URL('../brief/tk-ashwood-capability-brief.pdf', import.meta.url))
  ]);
  assert.match(brief, /messy operating problems into systems people/);
  assert.match(brief, /href="tk-ashwood-capability-brief\.pdf" download/);
  assert.match(brief, /mailto:ashwood\.info@agentmail\.to/);
  assert.match(brief, /linkedin\.com\/in\/tk-ashwood/);
  // The brief carries no pricing until TK supplies it (issue #225).
  assert.doesNotMatch(brief, /\$\s?\d|per hour|\/hr|day rate/i);
  assert.ok(pdf.size > 10_000, 'the downloadable PDF is present');
  assert.match(career, /href="\/brief\/"/);
  assert.match(career, /href="\/brief\/tk-ashwood-capability-brief\.pdf" download/);
});
