(() => {
  'use strict';

  const STORE_KEY = 'ashwood.workspace.progressReveal.seen.v1';
  const LAST_VISIT_KEY = 'ashwood.workspace.progressReveal.lastVisit.v1';

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function readSeen() {
    try { return new Set(JSON.parse(localStorage.getItem(STORE_KEY) || '[]')); }
    catch { return new Set(); }
  }

  function writeSeen(ids) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify([...ids].slice(-240))); }
    catch {}
  }

  function evidenceFromDom() {
    return $$('.evidence-row').map((row, index) => {
      const title = row.querySelector('.evidence-title')?.textContent?.trim() || '';
      const source = row.querySelector('.evidence-source')?.textContent?.trim() || 'Workspace';
      const meta = row.querySelector('.evidence-meta')?.textContent?.trim() || '';
      const status = (meta.split('·')[0] || '').trim().toUpperCase();
      const when = (meta.split('·')[1] || '').trim();
      const id = `${source}|${title}|${when}`;
      return { id, title, source, meta, status, when, index };
    }).filter(x => x.title && !/planned/i.test(x.status));
  }

  function strength(item) {
    let score = 0;
    if (item.status === 'COMPLETED') score += 5;
    if (/today/i.test(item.when)) score += 4;
    else if (/yesterday/i.test(item.when)) score += 3;
    else if (/\b[1-3]d ago\b/i.test(item.when)) score += 2;
    if (/launch|ship|merge|approve|pass|complete|publish|record|deploy|release|review|verify|partner|client|audition|post/i.test(item.title)) score += 2;
    score += Math.max(0, 2 - item.index * .05);
    return score;
  }

  function selectRevealItems(items, seen) {
    const unseen = items.filter(x => !seen.has(x.id));
    const recentUnseen = unseen.filter(x => /today|yesterday|\b[1-7]d ago\b/i.test(x.when));
    const pool = recentUnseen.length ? recentUnseen : unseen.length ? unseen : items.filter(x => /today|yesterday|\b[1-7]d ago\b/i.test(x.when));
    return pool.sort((a,b) => strength(b) - strength(a)).slice(0,3);
  }

  function headline(items, isNew) {
    if (!items.length) return 'The evidence is quiet right now.';
    const completed = items.filter(x => x.status === 'COMPLETED').length;
    if (isNew && completed >= 2) return 'You moved more than one thing forward.';
    if (isNew) return 'You’ve been doing more than it feels like.';
    return 'Here’s what the work says you’ve been moving.';
  }

  function render(items, seen) {
    const shell = $('#progress-reveal');
    if (!shell) return;
    const isNew = items.some(x => !seen.has(x.id));
    const title = $('#progress-reveal-title');
    const note = $('#progress-reveal-note');
    const list = $('#progress-reveal-items');
    if (!items.length) {
      shell.hidden = false;
      title.textContent = headline(items, false);
      note.textContent = 'No strong new progress signal is supported by the current evidence. That is different from saying nothing happened.';
      list.innerHTML = '<article class="progress-reveal__item progress-reveal__quiet"><strong>No material progress reveal yet.</strong><div class="progress-reveal__meta">Evidence first · no invented win</div></article>';
      return;
    }

    title.textContent = headline(items, isNew);
    note.textContent = isNew ? 'Since your last view, these are the strongest evidence-backed movements the Workspace can support.' : 'These are the strongest recent movements currently supported by the Workspace evidence.';
    list.innerHTML = items.map(item => `<article class="progress-reveal__item"><strong>${esc(item.title)}</strong><div class="progress-reveal__meta">${esc(item.source)} · ${esc(item.meta)}</div></article>`).join('');
    shell.hidden = false;

    const hero = $('#workspace-title');
    if (hero && isNew) hero.textContent = 'You’ve been doing more than it feels like.';

    items.forEach(x => seen.add(x.id));
    writeSeen(seen);
    try { localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString()); } catch {}
  }

  function renderDeep(items) {
    const panel = $('#progress-reveal-deep');
    if (!panel) return;
    const ranked = [...items].sort((a,b) => strength(b)-strength(a)).slice(0,5);
    panel.hidden = false;
    if (!ranked.length) {
      panel.innerHTML = '<h3>What are you failing to count as progress?</h3><p>The Workspace does not have enough evidence to make that call yet. Missing evidence is not proof that you failed to move.</p>';
      return;
    }
    panel.innerHTML = `<h3>What are you failing to count as progress?</h3><p>These are not compliments. They are the strongest recent movements supported by the evidence currently visible to ASHWOOD.</p><ol>${ranked.map(x=>`<li><strong>${esc(x.title)}</strong><br><span class="progress-reveal__quiet">${esc(x.source)} · ${esc(x.meta)}</span></li>`).join('')}</ol>`;
  }

  function mount() {
    const evidence = $('#evidence-list');
    const button = $('#progress-deeper');
    if (!evidence || !button) return;
    let latestItems = [];
    const seen = readSeen();
    const refresh = () => {
      const items = evidenceFromDom();
      if (!items.length) return;
      latestItems = items;
      render(selectRevealItems(items, seen), seen);
    };
    const observer = new MutationObserver(() => window.requestAnimationFrame(refresh));
    observer.observe(evidence, { childList:true, subtree:true });
    button.addEventListener('click', () => renderDeep(latestItems.length ? latestItems : evidenceFromDom()));
    refresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();