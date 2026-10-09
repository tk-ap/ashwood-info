// Presentation refresh only: this never discovers or verifies programs.
export function startLiveRefresh({refresh, document, window}) {
  let running=false;
  const check=async()=>{
    if (document.visibilityState !== 'visible' || running) return;
    running=true;
    try { await refresh(); } finally { running=false; }
  };
  const timer=window.setInterval(check,60000);
  document.addEventListener('visibilitychange',check);
  window.addEventListener('focus',check);
  window.addEventListener('hashchange',check);
  return ()=>{
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange',check);
    window.removeEventListener('focus',check);
    window.removeEventListener('hashchange',check);
  };
}

export function registryPayload(value) {
  if (!value || !Array.isArray(value.opportunities) || value.opportunities.some(x=>!x || typeof x.id!=='string' || !x.id) || new Set(value.opportunities.map(x=>x.id)).size !== value.opportunities.length) throw new Error('Invalid registry response');
  return value;
}
