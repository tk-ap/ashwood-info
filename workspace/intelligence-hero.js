(() => {
  'use strict';

  const mount = document.querySelector('#owner-intelligence');
  if (!mount) return;

  const reflections = [
    { source: 'Stella · Human Design', text: 'Don’t rush or force clarity. Let information gather. Your strongest conclusions arrive after you have had time to review the pattern.' },
    { source: 'ASHWOOD · working principle', text: 'Motion is not the same thing as direction. Notice which work is building ownership, visibility, and relationship equity at the same time.' },
    { source: 'ASHWOOD · working principle', text: 'The useful question is not “what can I build?” but “what becomes more true about the life I am building if I do this next?”' },
    { source: 'ASHWOOD · working principle', text: 'Protect the work that compounds: skill, ownership, relationships, evidence, and a body of work people can actually see.' }
  ];

  let timer = 0;
  let index = 0;
  let cards = [];
  const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function goalSnapshot() {
    return [...document.querySelectorAll('.goal-card')].map((card,index)=>({
      id:card.querySelector('[data-goal]')?.dataset.goal || `goal-${index}`,
      name:card.querySelector('.goal-title span:nth-child(2)')?.textContent?.trim() || `Goal ${index+1}`,
      count:Number(card.querySelector('.goal-reading strong')?.textContent || 0),
      index
    }));
  }

  function buildAnalysis() {
    const goals = goalSnapshot();
    if (!goals.length) return [];
    const sorted = [...goals].sort((a,b) => b.count - a.count);
    const strongest = sorted[0];
    const quiet = sorted.filter(item => item.count === sorted.at(-1)?.count).map(item => item.name);
    const total = goals.reduce((sum, item) => sum + item.count, 0);
    const spread = strongest.count - sorted.at(-1).count;
    if (!total) return [{source:'Owner signal · evidence',text:'The system does not have enough recent evidence to tell a meaningful story yet. Treat today as observation, not judgment.'}];
    const output=[{source:'Owner signal · evidence',text:`${strongest.name} is carrying the most visible recent evidence. The useful question is whether that momentum is also advancing your ownership, leadership, and relationship goals—not merely producing activity.`}];
    output.push(spread>=2 && quiet.length
      ? {source:'Owner signal · imbalance',text:`${quiet.slice(0,2).join(' + ')} ${quiet.length>1?'are':'is'} comparatively quiet. That is not automatically a problem; it is a prompt to decide whether the silence is intentional or neglected.`}
      : {source:'Owner signal · balance',text:'Your recent evidence is relatively distributed. Favor the next move that compounds across more than one goal instead of creating another isolated task.'});
    return output;
  }

  function makeCards() {
    const analysis = buildAnalysis();
    const day = new Date().getDate();
    cards = [reflections[day % reflections.length], ...analysis, reflections[(day + 1) % reflections.length]];
    index %= Math.max(cards.length,1);
  }

  function render() {
    makeCards();
    const card = cards[index] || reflections[0];
    const goals = goalSnapshot();
    const total = goals.reduce((sum,item)=>sum+item.count,0);
    const strongest = [...goals].sort((a,b)=>b.count-a.count)[0];
    mount.innerHTML = `
      <div class="owner-intelligence__field" aria-hidden="true"><span class="owner-intelligence__orbit orbit-a"></span><span class="owner-intelligence__orbit orbit-b"></span><span class="owner-intelligence__pulse"></span></div>
      <div class="owner-intelligence__copy"><p class="section-kicker">Owner signal · live</p><blockquote>${esc(card.text)}</blockquote><div class="owner-intelligence__meta"><span>${esc(card.source)}</span><span>${total} recent evidence signals${strongest ? ` · ${esc(strongest.name)} leading` : ''}</span></div></div>
      <button class="owner-intelligence__next" type="button" aria-label="Show another owner signal">↻</button>`;
    mount.classList.remove('is-changing');
  }

  function next() {
    if (!cards.length) makeCards();
    index = (index + 1) % Math.max(cards.length,1);
    mount.classList.add('is-changing');
    window.setTimeout(render,180);
  }

  mount.addEventListener('click',event=>{
    if (!event.target.closest('.owner-intelligence__next')) return;
    clearInterval(timer); next(); timer=setInterval(next,12000);
  });

  const observer = new MutationObserver(()=>{ if(goalSnapshot().length) render(); });
  const goalGrid = document.querySelector('#goal-grid');
  if (goalGrid) observer.observe(goalGrid,{childList:true,subtree:true});

  render();
  timer = setInterval(next,12000);

  for (const [src, marker] of [['/workspace/owner-constellation.js?v=20260908-constellation1','owner-constellation.js'],['/workspace/cycle-summary.js?v=20260908-cycle1','cycle-summary.js']]) {
    if (!document.querySelector(`script[src*="${marker}"]`)) {
      const script = document.createElement('script'); script.src=src; script.defer=true; document.head.append(script);
    }
  }
})();
