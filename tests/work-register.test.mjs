import test from 'node:test';
import assert from 'node:assert/strict';
import { REGISTER_REPOS, parseChecklist, githubRecord, permittedGitHubUrl } from '../api/_work-register-core.mjs';

test('checklist only counts explicit Markdown checkboxes', () => {
  const found = parseChecklist('### Verify\n- [x] Tests\n- [ ] Independent review\n- unrelated\n* [X] Evidence');
  assert.equal(found.total, 3);
  assert.equal(found.completed, 2);
  assert.equal(found.items[1].label, 'Independent review');
});

test('GitHub issues and pull requests are separate and keep canonical refs', () => {
  const issue = githubRecord({ number: 13, title: 'Test issue', body: '- [ ] Verify' }, 'agent-os');
  const pr = githubRecord({ number: 14, title: 'Draft', pull_request: {}, body: '- [x] Run checks' }, 'agent-os');
  assert.equal(issue.type, 'issue');
  assert.equal(pr.type, 'pr');
  assert.equal(pr.url, 'https://github.com/tk-ap/agent-os/pull/14');
  assert.equal(pr.checklist.completed, 1);
  assert.equal(githubRecord({ number: 1, title: 'No' }, 'not-allowed'), null);
});

test('only canonical GitHub issue/PR source links are accepted', () => {
  assert.ok(permittedGitHubUrl('https://github.com/tk-ap/ashwood-info/issues/298'));
  assert.ok(!permittedGitHubUrl('https://evil.example.com/tk-ap/agent-os/issues/1'));
  assert.ok(!permittedGitHubUrl('https://github.com/tk-ap/agent-os/settings/secrets'));
  assert.ok(REGISTER_REPOS.includes('ledgato'));
});
