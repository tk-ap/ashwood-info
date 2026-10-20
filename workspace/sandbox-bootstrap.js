/*
 * here.now staging only. This runs before Workspace module scripts and makes
 * the static preview safe to share: no private API, board, Context, funding,
 * Career Ops, or AgentOS request can leave the browser.
 */
(() => {
  if (!window.__ASHWOOD_DEMO_SANDBOX__) return;

  const fixtures = window.__ASHWOOD_DEMO_FIXTURES__;
  if (!fixtures) throw new Error('DEMO fixture bundle is required before the sandbox bootstrap runs.');
  const response = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
  const demoState = () => structuredClone(fixtures.state);
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const request = input instanceof Request ? input : null;
    const url = new URL(request ? request.url : input, window.location.href);
    const method = String(init.method || request?.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      return response({ error: 'DEMO sandbox is read-only. No action was sent.', sandbox: true }, 405);
    }
    if (url.origin !== window.location.origin) {
      return response({ ok: false, sandbox: true, error: 'External data is unavailable in this DEMO sandbox.' }, 503);
    }
    if (!url.pathname.startsWith('/api/')) return originalFetch(input, init);
    if (url.pathname === '/api/workspace-auth') return response({ authenticated: true, configured: true, sandbox: true, mode:'DEMO_ONLY' });
    if (url.pathname === '/api/workspace-board') return response({ rows:fixtures.boardRows, observed_at:fixtures.observedAt, snapshot_id:'demo-snapshot-001', sandbox: true });
    if (url.pathname === '/api/workspace-agentos') return response({ rows:fixtures.boardRows, workstreams:fixtures.boardRows, observed_at:fixtures.observedAt, snapshot_id:'demo-snapshot-001', sandbox: true });
    if (url.pathname === '/api/workspace-state') {
      const view = url.searchParams.get('view');
      if (view === 'commands') return response({ commands:fixtures.commands, sandbox: true });
      if (view === 'feed') return response({ items: [], sandbox: true });
      if (view === 'network') return response({ ...fixtures.network, sandbox: true });
      if (view === 'sprint-recommendation' || view === 'sprint-directives') return response({ recommendation: null, directives: [], sandbox: true });
      if (view === 'build_logs') return response({ logs:fixtures.state.logs, sandbox:true });
      return response({ ...demoState(), sandbox: true });
    }
    if (url.pathname === '/api/workspace-career') return response({ ...fixtures.career, sandbox: true });
    if (url.pathname === '/api/workspace-environments') return response({ ...fixtures.environments, sandbox: true });
    if (url.pathname === '/api/workspace-design') return response({ ...fixtures.design, sandbox: true });
    if (url.pathname === '/api/workspace-context') return response({ ...fixtures.context, sandbox: true });
    if (url.pathname === '/api/workspace-sources') return response({ ...fixtures.sources, sandbox: true });
    if (url.pathname === '/api/workspace-analyses') return response({ ...fixtures.analyses, sandbox: true });
    if (url.pathname === '/api/workspace-review' || url.pathname === '/api/workspace-checklist') return response({ ...fixtures.review, sandbox: true });
    return response({ rows: [], items: [], sandbox: true, notice: 'No private API data is available in this DEMO sandbox.' });
  };

  function markDemo() {
    document.body?.setAttribute('data-ashwood-demo-sandbox', 'true');
    document.querySelectorAll('.workspace-label').forEach(node => { node.textContent = 'WORKSPACE · DEMO SANDBOX'; });
    const liveState = document.querySelector('#live-state');
    if (liveState) liveState.textContent = 'Demo only';
    if (!document.querySelector('.workspace-demo-banner')) {
      const banner = document.createElement('aside');
      banner.className = 'workspace-demo-banner';
      banner.setAttribute('role', 'status');
      banner.textContent = 'DEMO SANDBOX · NO PRIVATE DATA · READ-ONLY';
      document.body.prepend(banner);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markDemo, { once: true });
  else markDemo();
})();
