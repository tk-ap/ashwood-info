const $=s=>document.querySelector(s);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={relationships:[],selectedId:null};

async function api(options={}){
  const r=await fetch('/api/workspace-state?view=network',{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  const body=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(body.error||`Request failed (${r.status})`);
  return body;
}

function counts(){
  const rows=state.relationships;
  return {
    active:rows.filter(r=>!['WON','LOST','PAUSED'].includes(r.status)).length,
    conversations:rows.filter(r=>['REPLIED','MEETING','PROPOSAL'].includes(r.status)).length,
    invites:rows.filter(r=>['INVITED','ACCEPTED','ACTIVE'].includes(r.status)||['INVITE','REFERRAL'].includes(r.relationship_type)).length,
    due:rows.filter(r=>r.next_action&&(!r.next_action_at||new Date(r.next_action_at)<=new Date(Date.now()+7*86400000))).length
  };
}

function renderSummary(){
  const c=counts();
  const cards=[
    [c.active,'active relationships'],
    [c.conversations,'live conversations'],
    [c.invites,'invite / referral'],
    [c.due,'need action']
  ];
  const markup=cards.map(([v,l])=>`<article><strong>${v}</strong><span>${l}</span></article>`).join('');
  $('#network-summary').innerHTML=markup;
  const hero=$('#workspace-view-data-hero');
  if(hero) hero.innerHTML='<p class="section-kicker">Network · live relationship state</p><div class="workspace-data-hero-grid">'+markup+'</div>';
}
