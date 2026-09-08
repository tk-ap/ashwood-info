(() => {
  'use strict';
  const anchor = document.querySelector('.owner-intelligence');
  if (!anchor) return;
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
