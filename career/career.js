(() => {
  const printButton = document.querySelector('[data-print-career]');
  printButton?.addEventListener('click', () => window.print());

  document.querySelectorAll('.evidence-card details').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      document.querySelectorAll('.evidence-card details[open]').forEach((other) => {
        if (other !== details) other.open = false;
      });
    });
  });

  const modes = [...document.querySelectorAll('[data-ir-key]')];
  const pitchTitle = document.getElementById('ir-pitch-title');
  const pitch = document.getElementById('ir-pitch');
  const pilot = document.getElementById('ir-pilot');
  const outcomes = document.getElementById('ir-outcomes');
  const modeContent = {
    throughput: {
      title: 'Make high-value judgment scalable without turning it into bureaucracy.',
      pitch: 'I map work that currently depends on memory, email, chat, or one person’s head; identify what information must be captured; define decision and handoff points; then build a lightweight operating workflow around it. AI can absorb research, preparation, routing, and follow-up where appropriate, while consequential decisions stay behind clear human authority.',
      pilot: 'Give me one live workflow that feels harder to manage than it should. I map the current state, identify failure points, build the operating artifact or lightweight automation, and test whether it reduces context loss, manual coordination, or missed handoffs.',
      outcomes: ['Less context loss', 'Clearer handoffs', 'Less manual chasing', 'More operating capacity']
    },
    product: {
      title: 'Turn a promising idea into something engineering can execute cleanly.',
      pitch: 'I translate business intent into the operating detail a build actually needs: user and business workflows, requirements, edge cases, acceptance criteria, ownership, launch-readiness checks, and approval points for material scope changes. The goal is to reduce the gap between what someone meant and what ultimately gets built.',
      pilot: 'Use one active product, feature, automation, or client build. I produce the discovery brief, workflow map, requirements, acceptance criteria, decision log, approval points, and readiness checklist before the work is treated as build-ready.',
      outcomes: ['Clearer specs', 'Fewer revisions', 'Less scope drift', 'More reliable launches']
    },
    signal: {
      title: 'Turn incoming information into a reviewable, evidence-backed decision flow.',
      pitch: 'I structure how information enters the system, what evidence is required, how it is prioritized, who reviews it, what decision was made, and what action follows. AI can help classify, summarize, compare, and surface changes while human judgment remains explicit where context or consequence demands it.',
      pilot: 'Take one recurring intake or monitoring process. I map input → evidence → priority → review → decision → action, then build the status model and lightweight workflow needed to make that path visible and repeatable.',
      outcomes: ['Better triage', 'Traceable evidence', 'Less duplicate research', 'Faster response']
    }
  };

  modes.forEach((mode) => mode.addEventListener('click', () => {
    const next = modeContent[mode.dataset.irKey];
    if (!next || !pitchTitle || !pitch || !pilot || !outcomes) return;
    modes.forEach((button) => button.setAttribute('aria-pressed', String(button === mode)));
    pitchTitle.textContent = next.title;
    pitch.textContent = next.pitch;
    pilot.textContent = next.pilot;
    outcomes.replaceChildren(...next.outcomes.map((label) => {
      const outcome = document.createElement('span');
      outcome.textContent = label;
      return outcome;
    }));
  }));

  const steps = [...document.querySelectorAll('[data-ir-step]')];
  const stepLabel = document.getElementById('ir-step-label');
  const stepDetail = document.getElementById('ir-step-detail');
  const stepContent = {
    context: {
      label: 'Capture context',
      detail: 'Establish what is known, missing, constrained, and already decided before anyone acts on an assumption.'
    },
    requirements: {
      label: 'Define requirements',
      detail: 'Make inputs, outputs, owners, success conditions, edge cases, and approval points explicit before the work is treated as ready.'
    },
    workflow: {
      label: 'Build workflow',
      detail: 'Turn the work into practical handoffs, checklists, and repeatable execution instead of leaving it dependent on memory or heroic coordination.'
    },
    controls: {
      label: 'Add controls',
      detail: 'Put consequential decisions, exceptions, escalation paths, and authority boundaries where they can be reviewed rather than silently assumed.'
    },
    evidence: {
      label: 'Track evidence',
      detail: 'Keep decisions, outputs, ownership, and next actions visible enough to improve the system from what actually happened.'
    }
  };

  steps.forEach((step) => step.addEventListener('click', () => {
    const next = stepContent[step.dataset.irStep];
    if (!next || !stepLabel || !stepDetail) return;
    steps.forEach((button) => button.setAttribute('aria-pressed', String(button === step)));
    stepLabel.textContent = next.label;
    stepDetail.textContent = next.detail;
  }));
})();
