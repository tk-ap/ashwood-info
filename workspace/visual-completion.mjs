const SIGNALS = {
  today: [
    ['ops-pulse-underway','Underway'],
    ['ops-pulse-owner','Needs owner'],
    ['ops-pulse-blocked','Blocked / parked'],
    ['ops-pulse-queued','Queued']
  ],
  career: [
    ['career-state','Career state'],
    ['career-refreshed','Last refresh']
  ],
  build: [
    ['build-command-freshness','Build evidence']
  ]
};

function clean(value){
  return String(value || '').replace(/\s+/g,' ').trim();
}
function numeric(value){
  const match=clean(value).match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}
function makeSignal(sourceId,label){
  const source=document.getElementById(sourceId);
  if(!source) return null;
  const item=document.createElement('div');
  item.className='workspace-signal';
  item.dataset.source=sourceId;
  item.innerHTML='<span class="workspace-signal__glyph" aria-hidden="true"></span><div><strong>—</strong><span></span></div>';
  item.querySelector('span:last-child').textContent=label;
  const sync=()=>{
    const value=clean(source.textContent);
    item.querySelector('strong').textContent=value || '—';
    const n=numeric(value);
    item.querySelector('.workspace-signal__glyph').style.setProperty('--signal-fill', n === null ? 8 : Math.max(8,Math.min(100,n*12)));
  };
  sync();
  new MutationObserver(sync).observe(source,{subtree:true,childList:true,characterData:true});
  return item;
}
function renderRail(){
  const intro=document.querySelector('.workspace-view-intro');
  if(!intro) return;
  let rail=document.getElementById('workspace-signal-rail');
  if(!rail){
    rail=document.createElement('div');
    rail.id='workspace-signal-rail';
    rail.className='workspace-signal-rail';
    rail.setAttribute('aria-label','Current view signals');
    intro.append(rail);
  }
  rail.replaceChildren();
  const view=document.body.dataset.workspaceCurrentView || 'today';
  const definitions=SIGNALS[view] || [];
  definitions.map(([id,label])=>makeSignal(id,label)).filter(Boolean).forEach(node=>rail.append(node));
  rail.dataset.empty=String(!rail.children.length);
}
function bindViewChanges(){
  renderRail();
  new MutationObserver((records)=>{
    if(records.some(r=>r.attributeName==='data-workspace-current-view')) renderRail();
  }).observe(document.body,{attributes:true,attributeFilter:['data-workspace-current-view']});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bindViewChanges,{once:true});
else bindViewChanges();
