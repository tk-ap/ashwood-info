const DAY = 86400000;
const COLORS = ['#acd58b', '#c6b4ee', '#e6b27d', '#eea5ba', '#84cdd1', '#e7d179', '#9bb9ed'];
const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey = date => new Date(date).toISOString().slice(0, 10);
const matches = (item, goal) => item.goal === goal || item.secondaryGoals?.includes(goal);

export function activityDays(evidence, count = 30, now = new Date()) {
  const today = Date.parse(dayKey(now));
  return Array.from({length: count}, (_, index) => {
    const date = new Date(today - (count - index - 1) * DAY);
    const items = evidence.filter(item => item.date && Number.isFinite(Date.parse(item.date)) && dayKey(item.date) === dayKey(date) && Date.parse(item.date) <= now.getTime());
    return {date: dayKey(date), items};
  });
}

export function connections(goals, evidence, now = new Date()) {
  const recent = activityDays(evidence, 30, now).flatMap(day => day.items);
  const sources = [...new Set(recent.map(item => item.sourceLabel || item.source))];
  return sources.map(source => ({source, counts: goals.map(goal => recent.filter(item => (item.sourceLabel || item.source) === source && matches(item, goal.id)).length)}));
}

export function renderOverview(goals, evidence, selectedGoal, onSelect) {
  const days = activityDays(evidence);
  const recent = days.flatMap(day => day.items);
  const maxCount = Math.max(1, ...goals.map(goal => recent.filter(item => matches(item, goal.id)).length));
  document.querySelector('#goal-grid').innerHTML = goals.map((goal, index) => {
    const items = recent.filter(item => matches(item, goal.id));
    const daily = days.map(day => day.items.filter(item => matches(item, goal.id)).length);
    const peak = Math.max(1, ...daily);
    return `<article class="goal-card" style="--goal-color:${COLORS[index % COLORS.length]}">
      <button class="goal-select" data-goal="${escape(goal.id)}" aria-pressed="${selectedGoal === goal.id}">
        <span class="goal-title"><span class="goal-index">0${index + 1}</span><span>${escape(goal.name)}</span><span aria-hidden="true">↗</span></span>
        <span class="goal-reading"><strong>${items.length}</strong><span>${items.length ? (items.length === 1 ? 'evidence item' : 'evidence items') : 'no recent evidence'}<small>last 30 days</small></span></span>
        <span class="goal-volume" aria-hidden="true" title="Evidence volume relative to the most active goal"><span style="width:${items.length / maxCount * 100}%"></span></span>
        <svg class="goal-spark" viewBox="0 0 300 36" aria-hidden="true">${daily.map((n, i) => `<rect x="${i * 10}" y="${35 - (n ? 4 + n / peak * 30 : 2)}" width="6" height="${n ? 4 + n / peak * 30 : 2}" opacity="${n ? 1 : .2}" rx="1"/>`).join('')}</svg>
      </button>
      <details class="goal-context"><summary>Goal details</summary><p>${escape(goal.description)}</p><ul>${(goal.success_signals || []).map(signal => `<li>${escape(signal)}</li>`).join('')}</ul></details>
    </article>`;
  }).join('');

  const links = connections(goals, evidence);
  const rowCount = Math.max(links.length, goals.length, 1);
  const height = rowCount * 48 + 28;
  const y = (index, count) => 24 + index * (height - 48) / Math.max(1, count - 1);
  const lines = links.flatMap((source, i) => source.counts.flatMap((count, j) => count ? [`<path d="M 8 ${y(i, links.length)} C 90 ${y(i, links.length)}, 90 ${y(j, goals.length)}, 172 ${y(j, goals.length)}" stroke="${COLORS[j % COLORS.length]}" stroke-width="${Math.min(6, 1 + Math.sqrt(count))}" opacity="${!selectedGoal || selectedGoal === goals[j].id ? .65 : .08}"/>`] : []));
  document.querySelector('#connection-map').innerHTML = links.length ? `<div class="connection-diagram">
    <div class="connection-labels">${links.map(source => `<span>${escape(source.source)}</span>`).join('')}</div>
    <svg viewBox="0 0 180 ${height}" preserveAspectRatio="none" aria-hidden="true" style="height:${height}px"><g fill="none">${lines.join('')}</g></svg>
    <div class="connection-labels connection-goals">${goals.map((goal, j) => `<button data-goal="${escape(goal.id)}" aria-pressed="${selectedGoal === goal.id}" style="--goal-color:${COLORS[j % COLORS.length]}"><i aria-hidden="true"></i>${escape(goal.name)}</button>`).join('')}</div>
    </div><details class="chart-data"><summary>Connection counts</summary><ul>${links.map(source => `<li><strong>${escape(source.source)}</strong>: ${source.counts.map((count, j) => count ? `${escape(goals[j].name)} (${count})` : '').filter(Boolean).join(', ')}</li>`).join('')}</ul></details>` : '<p class="empty-state">Connections will appear when dated evidence is available.</p>';

  const timeline = activityDays(evidence.filter(item => !selectedGoal || matches(item, selectedGoal)), 14);
  const peak = Math.max(1, ...timeline.map(day => day.items.length));
  document.querySelector('#activity-chart').innerHTML = `<div class="activity-bars">${timeline.map(day => `<div class="activity-day"><span class="day-count">${day.items.length || ''}</span><span class="day-bar" style="height:${day.items.length / peak * 112 + 2}px"></span><span class="day-label">${Number(day.date.slice(-2))}</span></div>`).join('')}</div><div class="chart-range"><span>${timeline[0].date}</span><span>${selectedGoal ? escape(goals.find(goal => goal.id === selectedGoal)?.name) : 'All goals'} · evidence / day</span><span>${timeline.at(-1).date}</span></div><details class="chart-data"><summary>Daily counts</summary><ul>${timeline.map(day => `<li>${day.date}: ${day.items.length} evidence items</li>`).join('')}</ul></details>`;
  const latest = timeline.flatMap(day => day.items).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3);
  document.querySelector('#recent-activity').innerHTML = latest.map(item => `<li><span class="timeline-dot" aria-hidden="true"></span><div><span class="recent-date">${escape(item.sourceLabel || item.source)} · ${dayKey(item.date)}</span><p>${escape(item.title)}</p></div></li>`).join('') || '<li>No evidence recorded in this period.</li>';
  document.querySelectorAll('[data-goal]').forEach(button => button.addEventListener('click', () => onSelect(button.dataset.goal)));
}
