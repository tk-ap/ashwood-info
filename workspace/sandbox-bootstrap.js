/*
 * here.now staging only. This runs before Workspace module scripts and makes
 * the static preview safe to share: no private API, board, Context, funding,
 * Career Ops, or AgentOS request can leave the browser.
 */
(() => {
  if (!window.__ASHWOOD_DEMO_SANDBOX__) return;

  const now = new Date().toISOString();
  const rows = [
    {
      id: 'demo-review', board_key: 'demo-review', title: 'Review the Workspace staging frame',
      summary: 'Synthetic preview item. It is not connected to a person, a product, or an execution system.',
      product: 'DEMO', source_system: 'DEMO', owner: 'Demo AgentOS', assignee: 'Demo AgentOS',
      status: 'waiting_approval', lane: 'review', phase: 'REVIEW', priority: 'p1',
      next_gate: 'Use the draft PR for feedback. This sandbox cannot approve, deny, or execute.',
      updated_at: now, observed_at: now, canonical_url: ''
    },
    {
      id: 'demo-build', board_key: 'demo-build', title: 'Render the complete staging copy',
      summary: 'Synthetic preview item showing the read-only presentation state.',
      product: 'DEMO', source_system: 'DEMO', owner: 'Demo AgentOS', assignee: 'Demo AgentOS',
      status: 'active', lane: 'in_progress', phase: 'IN_PROGRESS', priority: 'p2',
      next_gate: 'No external system is connected.', updated_at: now, observed_at: now, canonical_url: ''
    }
  ];
  const commands = [{ id: 'demo-command', command_text: 'Demo command capture is disabled in this sandbox.', status: 'waiting', created_at: now }];
  const response = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
  const demoState = () => ({ evidence: [], overrides: {}, content_feedback: [], commands });
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
    if (url.pathname === '/api/workspace-auth') return response({ authenticated: true, configured: true, sandbox: true });
    if (url.pathname === '/api/workspace-board' || url.pathname === '/api/workspace-agentos') return response({ rows, workstreams: rows, sandbox: true });
    if (url.pathname === '/api/workspace-state') {
      const view = url.searchParams.get('view');
      if (view === 'commands') return response({ commands, sandbox: true });
      if (view === 'feed') return response({ items: [], sandbox: true });
      if (view === 'network') return response({ people: [], items: [], sandbox: true });
      if (view === 'sprint-recommendation' || view === 'sprint-directives') return response({ recommendation: null, directives: [], sandbox: true });
      return response({ ...demoState(), sandbox: true });
    }
    if (url.pathname === '/api/workspace-career') return response({ applications: [], opportunities: [], resume: null, sandbox: true });
    if (url.pathname === '/api/workspace-environments') return response({ environments: [], sandbox: true });
    if (url.pathname === '/api/workspace-design') return response({ items: [], rows: [], sandbox: true });
    if (url.pathname === '/api/workspace-context') return response({ items: [], context: null, sandbox: true });
    if (url.pathname === '/api/workspace-sources') return response({ sources: [], sandbox: true });
    if (url.pathname === '/api/workspace-analyses') return response({ analyses: [], items: [], sandbox: true });
    if (url.pathname === '/api/workspace-review' || url.pathname === '/api/workspace-checklist') return response({ items: [], checklist: [], sandbox: true });
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
