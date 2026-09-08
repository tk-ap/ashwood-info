(() => {
  'use strict';

  const COLORS = ['#acd58b','#c6b4ee','#e6b27d','#eea5ba','#84cdd1','#e7d179','#9bb9ed'];
  const GOAL_POSITIONS = [
    [50,25],[72,34],[78,58],[61,73],[38,74],[22,58],[28,35]
  ];
  const PRODUCT_POSITIONS = [[50,48],[64,48],[37,49],[53,61],[43,38],[68,65],[31,66],[76,44]];
  const goalHints = {
    'ALVIRA':'ownership','ailhat':'ownership','LEDGATo':'ownership','agent-os':'learning','ASHWOOD':'leadership',
    'Modeling':'modeling','Music':'music','Writing':'writing'
  };

  const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let mount;

  function injectCss(){
    if(document.querySelector('link[href*="owner-constellation.css"]')) return;
    const link=document.createElement('link'); link.rel='stylesheet'; link.href='/workspace/owner-constellation.css?v=20260908-constellation1'; document.head.append(link);
  }

  function ensureMount(){
    if(mount?.isConnected) return mount;
    mount=document.querySelector('#owner-constellation');
    if(mount) return mount;
    const goals=document.querySelector('.goals');
    if(!goals) return null;
    mount=document.createElement('section');
    mount.className='owner-constellation';
    mount.id='owner-constellation';
    mount.setAttribute('aria-labelledby','owner-constellation-title');
    goals.before(mount);
    return mount;
  }

  function goalSnapshot(){
    return [...document.querySelectorAll('.goal-card')].map((card,index)=>({
      id:card.querySelector('[data-goal]')?.dataset.goal || `goal-${index}`,
      name:card.querySelector('.goal-title span:nth-child(2)')?.textContent?.trim() || `Goal ${index+1}`,
      count:Number(card.querySelector('.goal-reading strong')?.textContent || 0),
      index
    }));
  }

  function productSnapshot(){
    const cards=[...document.querySelectorAll('.workstream-card')];
    const out=cards.map((card,index)=>({
      name:card.querySelector('.workstream-product')?.textContent?.trim() || card.querySelector('h3')?.textContent?.trim() || `Work ${index+1}`,
      title:card.querySelector('h3')?.textContent?.trim() || '',
      status:card.querySelector('.workstream-status')?.textContent?.trim().toLowerCase() || 'active',
      index
    }));
    if(out.length) return out.slice(0,8);
    return [...document.querySelectorAll('.ecosystem-name')].slice(0,8).map((el,index)=>({name:el.textContent.replace('↗','').trim(),title:'',status:'active',index}));
  }

  function inferGoal(product,goals){
    const text=`${product.name} ${product.title}`.toLowerCase();
    const direct=Object.entries(goalHints).find(([label])=>text.includes(label.toLowerCase()))?.[1];
    if(direct && goals.some(g=>g.id===direct)) return direct;
    if(/music|song|audio|track/.test(text)) return goals.find(g=>g.id==='music')?.id;
    if(/model|casting|portfolio|photo/.test(text)) return goals.find(g=>g.id==='modeling')?.id;
    if(/writing|dispatch|poetry|essay/.test(text)) return goals.find(g=>g.id==='writing')?.id;
    if(/learn|agent-os|skill|education/.test(text)) return goals.find(g=>g.id==='learning')?.id;
    return goals.find(g=>g.id==='ownership')?.id || goals[0]?.id;
  }

  function render(){
    injectCss();
    const root=ensureMount(); if(!root) return;
    const goals=goalSnapshot(); if(!goals.length) return;
    const products=productSnapshot();
    const max=Math.max(1,...goals.map(g=>g.count));
    const total=goals.reduce((s,g)=>s+g.count,0);
    const sorted=[...goals].sort((a,b)=>b.count-a.count);
    const lead=sorted[0]; const quiet=sorted.at(-1);

    const nodes=goals.map((g,i)=>{
      const [x,y]=GOAL_POSITIONS[i%GOAL_POSITIONS.length];
      const intensity=.22+(g.count/max)*.78;
      const size=72+(g.count/max)*48;
      return `<button class="owner-node owner-node--goal ${g.count===0?'owner-node--quiet':''}" data-owner-goal="${esc(g.id)}" style="left:${x}%;top:${y}%;--node-color:${COLORS[i%COLORS.length]};--node-intensity:${intensity};--node-size:${size}px" aria-label="Open ${esc(g.name)} goal"><strong>${esc(g.name)}</strong><span>${g.count}</span></button>`;
    }).join('');

    const productNodes=products.map((p,i)=>{
      const [x,y]=PRODUCT_POSITIONS[i%PRODUCT_POSITIONS.length];
      const goalId=inferGoal(p,goals) || '';
      const isQuiet=/blocked|failed|waiting/.test(p.status);
      return `<button class="owner-node owner-node--product ${isQuiet?'owner-node--quiet':'owner-node--active'}" data-owner-goal="${esc(goalId)}" style="left:${x}%;top:${y}%" title="${esc(p.title||p.name)}">${esc(p.name.slice(0,12))}</button>`;
    }).join('');

    const lines=products.map((p,i)=>{
      const goalId=inferGoal(p,goals); const gi=goals.findIndex(g=>g.id===goalId); if(gi<0) return '';
      const [x1,y1]=PRODUCT_POSITIONS[i%PRODUCT_POSITIONS.length]; const [x2,y2]=GOAL_POSITIONS[gi%GOAL_POSITIONS.length];
      const strong=goals[gi].count>0?'is-strong':'';
      return `<line class="${strong}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"/>`;
    }).join('');

    const synthesis = total===0
      ? 'Not enough recent evidence to infer pressure yet.'
      : lead.id===quiet.id
        ? 'Evidence is concentrated in one visible direction.'
        : `${lead.name} carries the strongest visible momentum; ${quiet.name} is the quietest signal. Quiet is only a problem if it is accidental.`;

    root.innerHTML=`
      <div class="owner-constellation__head"><div><p>Owner constellation · live</p><h2 id="owner-constellation-title">What is pulling on what?</h2></div><div class="owner-constellation__legend"><span>large = more evidence</span><span>lines = work → goal</span><span>dim = quiet</span></div></div>
      <div class="owner-constellation__field"></div>
      <svg class="owner-constellation__threads" aria-hidden="true">${lines}</svg>
      ${nodes}${productNodes}
      <div class="owner-constellation__readout"><strong>${total} recent signals across ${goals.length} goals</strong><span>${esc(synthesis)}</span></div>`;
  }

  document.addEventListener('click',event=>{
    const node=event.target.closest('[data-owner-goal]'); if(!node) return;
    const id=node.dataset.ownerGoal; if(!id) return;
    const target=document.querySelector(`.goal-card [data-goal="${CSS.escape(id)}"]`);
    if(target){ target.click(); document.querySelector('.goals')?.scrollIntoView({behavior:'smooth',block:'start'}); }
  });

  const observer=new MutationObserver(()=>render());
  const start=()=>{
    const goals=document.querySelector('#goal-grid'); if(goals) observer.observe(goals,{childList:true,subtree:true});
    const work=document.querySelector('#workstream-list'); if(work) observer.observe(work,{childList:true,subtree:true});
    render();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
