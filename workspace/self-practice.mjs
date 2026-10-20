// ASHWOOD Self: a deterministic, zero-network daily reflection surface.
// These are original prompts inspired by (not quotations from) Florence Scovel Shinn.
// Reflection is optional; no chart claim, health claim, or financial outcome is inferred.
export const DAILY_PRACTICES = Object.freeze([
  {
    theme: 'Worth without proof',
    thought: 'Your worth is not awaiting a receipt.',
    affirmation: 'My value exists before anyone recognizes, hires, or pays me.',
    reflection: 'Where am I asking an outcome to establish my worth?',
    action: 'Name one concrete, dignified move toward income or stability.',
    evening: 'What did I do today that reflected self-respect, regardless of its result?',
    natal: 'sun'
  },
  {
    theme: 'Expectation with preparation',
    thought: 'Make room for what you want; keep your eyes open to what is.',
    affirmation: 'I can expect better conditions and prepare for them without denying today.',
    reflection: 'Which possibility deserves practical preparation rather than anxious rehearsal?',
    action: 'Take the smallest step that makes that possibility more attainable.',
    evening: 'What did reality confirm, challenge, or leave unanswered?',
    natal: 'rising'
  },
  {
    theme: 'Language as direction',
    thought: 'The words you rehearse become the choices you notice.',
    affirmation: 'I speak to myself with honesty, care, and room for growth.',
    reflection: 'Which repeated story narrows my choices?',
    action: 'Rewrite that story as a possibility plus a next action.',
    evening: 'Did the new language lead to a different choice?',
    natal: 'moon'
  },
  {
    theme: 'Receiving and reciprocity',
    thought: 'You can receive support without surrendering authority.',
    affirmation: 'I am allowed to be supported, paid fairly, and met with reciprocity.',
    reflection: 'Where am I confusing independence with carrying everything alone?',
    action: 'Make one clear request or clarify one boundary.',
    evening: 'Where did mutual effort become visible?',
    natal: 'sun'
  },
  {
    theme: 'Gratitude without denial',
    thought: 'Gratitude can sit beside an unfinished need.',
    affirmation: 'I can appreciate what is present while pursuing what is missing.',
    reflection: 'What is genuinely sustaining me, and what still needs to change?',
    action: 'Acknowledge one real resource and address one real unmet need.',
    evening: 'What support, progress, or evidence was real today?',
    natal: 'rising'
  },
  {
    theme: 'Trust through evidence',
    thought: 'Faith in yourself need not require certainty about the future.',
    affirmation: 'I trust my capacity to adapt, learn, and choose again.',
    reflection: 'What can I test instead of trying to predict?',
    action: 'Run one bounded experiment with an observable success signal.',
    evening: 'What did I learn that changes my next move?',
    natal: 'moon'
  },
  {
    theme: 'Sustainable abundance',
    thought: 'A richer life should leave room to live it.',
    affirmation: 'I am building stability, freedom, relationships, and space to create.',
    reflection: 'Would the outcome I am pursuing actually support the life I want?',
    action: 'Protect one essential need while making one durable commitment.',
    evening: 'Did today honor both progress and capacity?',
    natal: 'sun'
  }
]);

// Sign-agnostic interpretive prompts. Placements come only from existing authorized profile text.
export const NATAL_LENSES = Object.freeze({
  sun: {
    pattern: /\b([A-Za-z]+)\s+Sun\b/i,
    suffix: 'Sun · identity and values',
    question: 'Where does your sense of identity support an intentional choice today?'
  },
  moon: {
    pattern: /\b([A-Za-z]+)\s+Moon\b/i,
    suffix: 'Moon · emotional needs',
    question: 'Which feeling needs to be heard, and what observable facts can inform the decision?'
  },
  rising: {
    pattern: /\b([A-Za-z]+)\s+Rising\b/i,
    suffix: 'Rising · environment and approach',
    question: 'What surroundings help you choose sustainably rather than react to pressure?'
  }
});

export function dailyPracticeFor(date = new Date()) {
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  return DAILY_PRACTICES[((day % DAILY_PRACTICES.length) + DAILY_PRACTICES.length) % DAILY_PRACTICES.length];
}

export function natalReferenceFor(profileText, key) {
  const lens = NATAL_LENSES[key];
  if (!lens) return null;
  const match = String(profileText || '').match(lens.pattern);
  if (!match) return null;
  return { title: `${match[1]} ${lens.suffix}`, question: lens.question };
}

export function mountSelfDailyPractice(root = document) {
  const host = root.getElementById('self-practice');
  if (!host) return;
  const practice = dailyPracticeFor();
  const profileText = root.querySelector('#meos-places .workstream-list')?.textContent || '';
  const lens = natalReferenceFor(profileText, practice.natal);
  const nodes = {
    date: host.querySelector('[data-self-date]'),
    theme: host.querySelector('[data-self-theme]'),
    thought: host.querySelector('[data-self-thought]'),
    affirmation: host.querySelector('[data-self-affirmation]'),
    question: host.querySelector('[data-self-question]'),
    step: host.querySelector('[data-self-step]'),
    chart: host.querySelector('[data-self-chart]'),
    chartQuestion: host.querySelector('[data-self-chart-question]')
  };
  if (Object.values(nodes).some(node => !node)) return;
  nodes.date.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  nodes.theme.textContent = practice.theme;
  nodes.thought.textContent = practice.thought;
  nodes.affirmation.textContent = practice.affirmation;
  nodes.chart.textContent = lens ? lens.title : 'Natal reference unavailable';
  nodes.chartQuestion.textContent = lens
    ? lens.question
    : 'Review the existing source lenses below. No chart details are inferred.';
  const morning = host.querySelector('[data-self-phase="morning"]');
  const evening = host.querySelector('[data-self-phase="evening"]');
  function selectPhase(phase) {
    const isEvening = phase === 'evening';
    nodes.question.textContent = isEvening ? practice.evening : practice.reflection;
    nodes.step.textContent = isEvening
      ? 'Observe what happened. A reflection is not a verdict.'
      : practice.action;
    morning?.setAttribute('aria-pressed', String(!isEvening));
    evening?.setAttribute('aria-pressed', String(isEvening));
    host.querySelector('[data-self-step-label]').textContent = isEvening ? 'Reality check' : 'One grounded action';
  }
  morning?.addEventListener('click', () => selectPhase('morning'));
  evening?.addEventListener('click', () => selectPhase('evening'));
  selectPhase('morning');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountSelfDailyPractice());
  else mountSelfDailyPractice();
}
