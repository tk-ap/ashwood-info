(() => {
  'use strict';
  const anchor = document.querySelector('.owner-intelligence');
  if (!anchor) return;
  if (!document.querySelector('#cycle-summary-style')) {
    const style = document.createElement('style');
    style.id = 'cycle-summary-style';
    style.textContent = '.cycle-summary{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin:28px 0 52px;padding:24px 0;border-block:1px solid var(--line)}.cycle-summary h2{margin:4px 0 8px;font-size:clamp(28px,3.5vw,48px);font-weight:500;letter-spacing:-.04em}.cycle-summary p{margin:0;max-width:64ch;color:var(--muted);line-height:1.5}.cycle-summary a{flex:none;color:inherit;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:3px;font-size:12px}@media(max-width:760px){.cycle-summary{align-items:flex-start;flex-direction:column}}';
    document.head.append(style);
  }
  const section = document.createElement('section');
  section.className = 'cycle-summary';
  section.id = 'cycle-summary';
  section.innerHTML = '<div><p class="section-kicker">Operating balance · live</p><h2>Reading the loop…</h2><p>Checking build, review, use, and evidence debt.</p></div><a href="/workspace/cycle/">Open operating cycle →</a>';
  anchor.after(section);

  const set = (title, body) => {
    section.querySelector('h2').textContent = title;
    section.querySelector('p:not(.section-kicker)').textContent = body;
  };

  Promise.all([
    fetch('/api/workspace-checklist',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({})),
    fetch('/api/workspace-workstreams',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({}))
  ]).then(([checklist,workstreams])=>{
    const auto = Array.isArray(checklist.auto_items) ? checklist.auto_items : [];
    const done = new Set(checklist.deployment_completed_items || []);
    const pending = auto.filter(item => String(item.id||'').startsWith('deploy:') && !done.has(item.id));
    const rows = Array.isArray(workstreams.rows) ? workstreams.rows : [];
    if (pending.length) {
      set('Verification debt is leading.', `${pending.length} production change${pending.length===1?'':'s'} still need owner review. Finish the loop before starting another feature.`);
      return;
    }
    if (!rows.length) {
      set('Balance signal is incomplete.', 'No canonical workstreams are synced right now. Open the cycle for the evidence boundary.');
      return;
    }
    const buildHeavy = rows.filter(row => /build|implement|develop|ship|merge|code|active|running|in_progress/i.test(`${row.status||''} ${row.stage||''} ${row.next_gate||''}`)).length;
    if (buildHeavy >= Math.max(2, rows.length - 1)) {
      set('You are build-heavy.', 'Most visible work is still in build/execution. Check whether verify, use, or observation should come next.');
      return;
    }
    set('The loop is moving.', 'No strong production-review debt is visible. Open the cycle to inspect where the next corrective move belongs.');
  });
})();
