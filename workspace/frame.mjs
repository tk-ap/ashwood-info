export const STORAGE_KEY = 'ashwood.workspace.checkin.v1';
const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const noon = date => { const day = new Date(date); day.setHours(12, 0, 0, 0); return day; };
const text = value => typeof value === 'string' ? value.trim() : '';
const pad = value => String(value).padStart(2, '0');

export const dayKey = (date = new Date()) => { const day = noon(date); return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`; };
export const shiftDay = (date, delta) => { const day = noon(date); day.setDate(day.getDate() + delta); return day; };
export const emptyRecord = (date = new Date()) => ({date: dayKey(date), checks: {}, commitment: '', evening: []});
export const isActiveRecord = record => Boolean(record && /^\d{4}-\d{2}-\d{2}$/.test(String(record.date)) && (Object.values(record.checks || {}).some(Boolean) || text(record.commitment) || (record.evening || []).some(entry => text(entry))));

// A check is "clear" only when explicitly answered yes; anything else counts against the score.
export function checkScore(record, checks = []) {
  const total = checks.length;
  const score = checks.filter(check => record?.checks?.[check.id] === true).length;
  return {score, total, low: total > 0 && score / total < 0.7};
}

// Consecutive days with a real entry, ending today, or yesterday when today is still untouched.
export function streak(records = [], now = new Date()) {
  const days = new Set(records.filter(isActiveRecord).map(record => record.date));
  const start = days.has(dayKey(now)) ? 0 : days.has(dayKey(shiftDay(now, -1))) ? 1 : null;
  if (start === null) return 0;
  let count = 0;
  while (days.has(dayKey(shiftDay(now, -(start + count))))) count += 1;
  return count;
}

// One record per day: a second entry on the same date replaces the first rather than stacking.
export function mergeCheckin(records = [], record) {
  if (!record || !/^\d{4}-\d{2}-\d{2}$/.test(String(record.date))) return [...records];
  return [...records.filter(item => item?.date !== record.date), record].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export function readCheckins(store = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(store.getItem(STORAGE_KEY) || 'null');
    return Array.isArray(parsed?.records) ? parsed.records.filter(record => record && /^\d{4}-\d{2}-\d{2}$/.test(String(record.date))) : [];
  } catch { return []; }
}

export function writeCheckins(records, store = globalThis.localStorage) {
  try { store.setItem(STORAGE_KEY, JSON.stringify({version: 1, records})); return true; } catch { return false; }
}

// The goal model has no decision_sentence key yet; fall back to the compass default priority and say so.
export function decisionSentence(model = {}) {
  if (text(model.decision_sentence)) return {text: text(model.decision_sentence), label: 'Decision sentence', canonical: true};
  if (text(model.decision_compass?.default_priority)) return {text: text(model.decision_compass.default_priority), label: 'Default priority', canonical: false};
  return null;
}

export function renderFrame(model = {}, root = document) {
  const set = (selector, html) => { const node = root.querySelector(selector); if (node) node.innerHTML = html; return node; };
  const list = (items, tag = 'ul') => `<${tag}>${(items || []).map(item => `<li>${escape(item)}</li>`).join('')}</${tag}>`;
  set('#frame-north-star', escape(model.north_star || ''));
  set('#frame-chapter', escape(model.chapter_frame || ''));

  const decision = decisionSentence(model), decisionNode = root.querySelector('#frame-decision');
  if (decisionNode) {
    decisionNode.hidden = !decision;
    if (decision) decisionNode.innerHTML = `<p class="frame-decision-label">${escape(decision.label)}</p><p class="frame-decision-line">${escape(decision.text)}</p>${decision.canonical ? '' : '<p class="frame-decision-note">The goal model records no <code>decision_sentence</code>; this is the decision compass default priority, shown in its place.</p>'}`;
  }

  const quick = model.quick_return || {}, rule = model.daily_rule || {};
  set('#frame-quick-return', `<p class="section-kicker">Quick return</p><h3>${escape(quick.title || '')}</h3><p class="frame-rule">${escape(quick.rule || '')}</p>${list(quick.actions, 'ol')}`);
  set('#frame-daily-rule', `<p class="section-kicker">Daily rule</p><h3>${escape(rule.title || '')}</h3><p class="frame-rule">${escape(rule.prompt || '')}</p>`);
  set('#frame-year', escape(model.next_personal_year_prompt || ''));
  set('#frame-variant', `<p>${escape(model.decision_compass?.canonical_note || '')}</p><dl class="frame-dimensions">${(model.alignment_dimensions || []).map(dimension => `<div><dt>${escape(dimension.name)}</dt><dd>${escape(dimension.question)}</dd></div>`).join('')}</dl>`);
}

export function mountCheckin(model = {}, options = {}) {
  const root = options.root || document, now = options.now || new Date(), store = 'store' in options ? options.store : globalThis.localStorage;
  const compass = model.decision_compass || {}, checks = compass.checks || [], morning = model.morning_compass || {}, rule = model.daily_rule || {}, evening = model.evening_evidence || {}, prompts = evening.prompts || [];
  const set = (selector, html) => { const node = root.querySelector(selector); if (node) node.innerHTML = html; return node; };
  if (!root.querySelector('#checkin-test')) return null;

  let records = readCheckins(store);
  const stored = records.find(record => record.date === dayKey(now));
  const record = {...emptyRecord(now), ...(stored || {}), checks: {...(stored?.checks || {})}, evening: [...(stored?.evening || [])]};

  set('#checkin-morning', `<p class="section-kicker">Morning compass</p><h3>${escape(morning.title || '')}</h3><p class="checkin-statement">${escape(morning.statement || '')}</p><ul class="identity-signals">${(morning.identity_signals || []).map(signal => `<li>${escape(signal)}</li>`).join('')}</ul>`);
  set('#checkin-commitment', `<p class="section-kicker">Today's durable commitment</p><h3>${escape(rule.title || '')}</h3><label class="checkin-field" for="checkin-commitment-input">${escape(rule.prompt || 'Today’s commitment')}</label><textarea id="checkin-commitment-input" rows="3"></textarea>`);
  set('#checkin-test', `<p class="section-kicker">${escape(compass.subtitle || 'Decision compass')}</p><h3>${escape(compass.title || '')}</h3><ul class="check-list">${checks.map(check => `<li><label class="check"><input type="checkbox" data-check="${escape(check.id)}" /><span class="check-body"><span class="check-name">${escape(check.name)}</span><span class="check-question">${escape(check.question)}</span></span></label></li>`).join('')}</ul>`);
  set('#checkin-reference', `<div class="reference-pair"><div><h4>Green lights</h4><ul>${(compass.green_lights || []).map(item => `<li>${escape(item)}</li>`).join('')}</ul></div><div><h4>Red flags</h4><ul>${(compass.red_flags || []).map(item => `<li>${escape(item)}</li>`).join('')}</ul></div></div><p><strong>When it is unclear.</strong> ${escape(compass.when_unclear || '')}</p><p class="checkin-closing">${escape(compass.closing || '')}</p>`);
  set('#checkin-evening', `<p class="section-kicker">Evening</p><h3>${escape(evening.title || '')}</h3>${prompts.map((prompt, index) => `<label class="checkin-field" for="checkin-evening-${index}">${escape(prompt)}</label><textarea id="checkin-evening-${index}" data-evening="${index}" rows="2"></textarea>`).join('')}`);

  const commitmentInput = root.querySelector('#checkin-commitment-input');
  const eveningInputs = [...root.querySelectorAll('[data-evening]')];
  const checkInputs = [...root.querySelectorAll('[data-check]')];
  if (commitmentInput) commitmentInput.value = record.commitment || '';
  eveningInputs.forEach((input, index) => { input.value = record.evening[index] || ''; });
  checkInputs.forEach(input => { input.checked = record.checks[input.dataset.check] === true; });

  const readout = (saved = true) => {
    const {score, total, low} = checkScore(record, checks), started = isActiveRecord(record), days = streak(mergeCheckin(records, record), now);
    set('#checkin-readout', `<p class="checkin-score"><strong>${score}</strong> of ${total} checks clear${started ? '' : ' · today not started'}</p>${started && low ? `<p class="checkin-warning">${escape(compass.warning || '')}</p>` : ''}`);
    const streakNode = root.querySelector('#checkin-streak');
    if (streakNode) streakNode.textContent = days ? `${days} day${days === 1 ? '' : 's'} in a row` : 'No streak yet — today can start one.';
    const privacy = root.querySelector('#checkin-privacy');
    if (privacy) privacy.textContent = saved ? 'Saved privately in this browser.' : 'This browser refused to save. Nothing was recorded.';
  };

  const persist = () => { records = mergeCheckin(records, record); readout(writeCheckins(records, store)); };
  checkInputs.forEach(input => input.addEventListener('change', () => { record.checks[input.dataset.check] = input.checked; persist(); }));
  if (commitmentInput) commitmentInput.addEventListener('input', () => { record.commitment = commitmentInput.value; persist(); });
  eveningInputs.forEach((input, index) => input.addEventListener('input', () => { record.evening[index] = input.value; persist(); }));
  readout();
  return record;
}
