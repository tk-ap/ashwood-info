const host = document.querySelector('#source-registry');
const statusNode = document.querySelector('#source-registry-status');
const refresh = document.querySelector('#source-registry-refresh');

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const when = value => {
  if (!value) return 'Not observed yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
};

function metric(label, value) {
  return `<article><strong>${Number(value || 0)}</strong><span>${esc(label)}</span></article>`;
}

function itemRow(item) {
  const visual = item.visual_pending
    ? `<p class="source-item-note source-item-note--attention"><strong>Screen review requested.</strong> ${esc(item.visual_requirement?.reason || 'Some meaning may depend on the video itself.')}</p>`
    : '';
  const review = item.needs_review
    ? '<p class="source-item-note source-item-note--attention"><strong>Evidence incomplete.</strong> No usable transcript/audio evidence yet.</p>'
    : '';
  const excerpt = item.transcript_excerpt ? `<p class="source-item-excerpt">${esc(item.transcript_excerpt)}</p>` : '';
  return `<article class="source-item">
    <div class="source-item-main">
      <div class="source-item-title">
        <a href="${esc(item.video_url)}" target="_blank" rel="noopener">${esc(item.title || item.video_id)} ↗</a>
        <span>${esc(item.channel || 'YouTube')} · ${when(item.published_at || item.last_attempt_at)}</span>
      </div>
      <div class="source-item-state">
        <span data-source-state="${esc(item.status)}">${esc(item.status || 'UNKNOWN').replaceAll('_',' ')}</span>
        <small>${esc(item.coverage || 'UNKNOWN')} coverage</small>
      </div>
    </div>
    ${visual}${review}${excerpt}
  </article>`;
}

function sourceCard(source) {
  const summary = source.summary || {};
  const items = Array.isArray(source.items) ? source.items.slice(0, 50) : [];
  const attention = Number(summary.visual_pending || 0) + Number(summary.needs_review || 0) + Number(summary.errors || 0);
  const title = source.source_type === 'youtube_playlist' ? 'YouTube reference playlist' : (source.role || source.source_id);
  return `<article class="source-card">
    <div class="source-card-head">
      <div>
        <p class="section-kicker">${esc(source.mode || 'REFERENCE')} · ${esc(source.discovery_provider || source.source_type)}</p>
        <h3>${esc(title)}</h3>
        <p>AgentOS source: <a href="${esc(source.source_url)}" target="_blank" rel="noopener">${esc(source.source_id)} ↗</a></p>
      </div>
      <div class="source-card-state"><span data-source-state="${esc(source.status)}">${esc(source.status || 'UNKNOWN')}</span><small>Checked ${when(source.observed_at)}</small></div>
    </div>
    <div class="source-metrics">
      ${metric('known videos', summary.known_videos)}
      ${metric('ingested', summary.ingested)}
      ${metric('screen review', summary.visual_pending)}
      ${metric('needs review', Number(summary.needs_review || 0) + Number(summary.errors || 0))}
    </div>
    <div class="source-truth">
      <strong>${attention ? `${attention} item${attention === 1 ? '' : 's'} need attention.` : 'No unresolved evidence gaps in the current projection.'}</strong>
      <span>Raw transcripts stay in AgentOS evidence storage; Workspace receives only compact provenance and coverage state.</span>
    </div>
    <div class="source-items">${items.length ? items.map(itemRow).join('') : '<p class="workspace-state is-empty"><strong>No videos projected yet.</strong> The collector has not published an ingested item.</p>'}</div>
    ${Number(summary.known_videos || 0) > items.length ? `<p class="source-limit">Showing the latest ${items.length} of ${Number(summary.known_videos)} known videos.</p>` : ''}
  </article>`;
}

export async function loadSources() {
  if (!host) return;
  if (refresh) refresh.disabled = true;
  if (statusNode) statusNode.textContent = 'Reading AgentOS source evidence…';
  host.innerHTML = '<div class="workspace-state is-loading"><strong>Loading source registry…</strong>Reading the latest machine-synced evidence projection.</div>';
  try {
    const response = await fetch('/api/workspace-sources', {credentials:'same-origin', cache:'no-store'});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    const sources = Array.isArray(data.sources) ? data.sources : [];
    host.innerHTML = sources.length
      ? sources.map(sourceCard).join('')
      : '<div class="workspace-state is-empty"><strong>No source projection yet.</strong>AgentOS has not published a source-ingestion run to this Workspace.</div>';
    const latest = sources.map(source => source.observed_at).filter(Boolean).sort().at(-1);
    if (statusNode) statusNode.textContent = latest ? `Latest collector check: ${when(latest)}` : 'Waiting for first collector check.';
  } catch (error) {
    host.innerHTML = `<div class="workspace-state is-error"><strong>Source registry unavailable.</strong>${esc(error.message || 'Unable to read source evidence.')}</div>`;
    if (statusNode) statusNode.textContent = 'Source registry unavailable.';
  } finally {
    if (refresh) refresh.disabled = false;
  }
}

refresh?.addEventListener('click', loadSources);
window.addEventListener('ashwood:refresh-sources', loadSources);
loadSources();
