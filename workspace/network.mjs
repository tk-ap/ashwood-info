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

}

function renderList(){
  const root=$('#network-relationships');
  if(!state.relationships.length){
    root.innerHTML='<div class="network-empty"><strong>No relationships recorded yet.</strong><p>This is an intentional empty state. Add sponsors, collaborators, referrals, invitations, introductions, or design partners here. This is the private operating record.</p></div>';
    $('#network-detail').innerHTML='<div class="network-empty"><p>Select or add a relationship to see details and next action.</p></div>';
    return;
  }
  root.innerHTML=state.relationships.map(r=>`<button class="network-row ${state.selectedId===r.id?'is-selected':''}" type="button" data-network-id="${escapeHtml(r.id)}">
    <span><small>${escapeHtml(r.relationship_type.replaceAll('_',' '))}</small><strong>${escapeHtml(r.name)}</strong><em>${escapeHtml(r.organization||'')}</em></span>
    <b>${escapeHtml(r.status)}</b>
  </button>`).join('');
  root.querySelectorAll('[data-network-id]').forEach(b=>b.addEventListener('click',()=>{state.selectedId=b.dataset.networkId;renderList();renderDetail()}));
}

function renderDetail(){
  const root=$('#network-detail');
  const r=state.relationships.find(x=>x.id===state.selectedId);
  if(!r){root.innerHTML='<div class="network-empty"><p>Select a relationship to see its operating context.</p></div>';return}
  root.innerHTML=`<div class="network-detail-head"><div><p class="section-kicker">${escapeHtml(r.relationship_type.replaceAll('_',' '))}</p><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.organization||'')}</p></div><button type="button" id="network-edit">Edit</button></div>
  <dl class="network-detail-grid">
    <div><dt>Status</dt><dd>${escapeHtml(r.status)}</dd></div>
    <div><dt>Channel</dt><dd>${escapeHtml(r.channel||'—')}</dd></div>
    <div><dt>Contact</dt><dd>${escapeHtml(r.contact||'—')}</dd></div>
    <div><dt>Source</dt><dd>${escapeHtml(r.source||'—')}</dd></div>
  </dl>
  <section><span>Why this relationship matters</span><p>${escapeHtml(r.why_care||r.project_fit||'No context recorded yet.')}</p></section>
  <section><span>Next action</span><p><strong>${escapeHtml(r.next_action||'No next action set.')}</strong>${r.next_action_at?` · ${escapeHtml(new Date(r.next_action_at).toLocaleString())}`:''}</p></section>
  ${r.referral_url?`<section><span>Referral / invite URL</span><p><a href="${escapeHtml(r.referral_url)}" target="_blank" rel="noopener">Open issued URL ↗</a></p></section>`:''}
  ${r.notes?`<section><span>Notes</span><p>${escapeHtml(r.notes)}</p></section>`:''}`;
  $('#network-edit')?.addEventListener('click',()=>openDialog(r));
}

function openDialog(r=null){
  const d=$('#network-dialog'); $('#network-form').reset();
  $('#network-form-id').value=r?.id||'';
  $('#network-name').value=r?.name||''; $('#network-organization').value=r?.organization||'';
  $('#network-type').value=r?.relationship_type||'COLLABORATOR'; $('#network-status-input').value=r?.status||'RESEARCH';
  $('#network-project-fit').value=r?.project_fit||''; $('#network-why-care').value=r?.why_care||'';
  $('#network-contact').value=r?.contact||''; $('#network-channel').value=r?.channel||'';
  $('#network-support-level').value=r?.support_level||''; $('#network-source').value=r?.source||'';
  $('#network-referral-url').value=r?.referral_url||''; $('#network-next-action').value=r?.next_action||'';
  $('#network-next-action-at').value=r?.next_action_at?new Date(r.next_action_at).toISOString().slice(0,16):'';
  $('#network-notes').value=r?.notes||''; d.showModal();
}

async function save(e){
  e.preventDefault();
  const payload={action:'network_upsert',id:$('#network-form-id').value||undefined,name:$('#network-name').value,organization:$('#network-organization').value,relationship_type:$('#network-type').value,status:$('#network-status-input').value,project_fit:$('#network-project-fit').value,why_care:$('#network-why-care').value,contact:$('#network-contact').value,channel:$('#network-channel').value,support_level:$('#network-support-level').value,source:$('#network-source').value,referral_url:$('#network-referral-url').value,next_action:$('#network-next-action').value,next_action_at:$('#network-next-action-at').value,notes:$('#network-notes').value};
  const out=await api({method:'POST',body:JSON.stringify(payload)}); state.selectedId=out.id; $('#network-dialog').close(); await load();
}

async function load(){
  try{
    $('#network-state').textContent='Loading relationships…'; $('#network-relationships').innerHTML='<div class="workspace-state is-loading"><strong>Loading relationships…</strong><span>Reading the private Work relationship record.</span></div>'; $('#network-detail').innerHTML='<div class="workspace-state is-loading"><strong>Preparing detail…</strong><span>The selected relationship will appear here.</span></div>';
    const data=await api(); state.relationships=data.relationships||[];
    if(!state.selectedId&&state.relationships.length)state.selectedId=state.relationships[0].id;
    $('#network-state').textContent='Private workspace'; renderSummary(); renderList(); renderDetail();
  }catch(e){$('#network-state').textContent='Unavailable';$('#network-relationships').innerHTML=`<div class="workspace-state is-error"><strong>Relationships could not load.</strong><span>${escapeHtml(e.message)} Canonical relationship data was not changed.</span></div>`;$('#network-detail').innerHTML='<div class="workspace-state is-error"><strong>Detail unavailable.</strong><span>No relationship was modified.</span></div>'}
}

$('#network-add')?.addEventListener('click',()=>openDialog());
$('#network-refresh')?.addEventListener('click',load);
$('#network-form')?.addEventListener('submit',save);
document.querySelectorAll('[data-network-close]').forEach(b=>b.addEventListener('click',()=>$('#network-dialog').close()));
load();
