const BUILD_TERMS = /agent|ai|autonom|workflow|harness|runtime|route|routing|boundary|permission|approval|context|infrastructure|e2e|end[- ]?to[- ]?end|verify|verification|proof|evidence|deploy|release|launch|ship|architecture|decision|regress|fail|block|recover/i;
const CREATIVE_TERMS = /music|song|track|record|demo|paint|painting|art|model|modeling|campaign|photo|photograph|video|reel|tiktok|poetry|poem|writing|acting|audition|creative/i;
const LIFE_TERMS = /life|birthday|turning 30|relationship|friend|family|los angeles|\bla\b|dtla|career|job|rejection|money|rent|home|day|week|feeling|thinking/i;
const NOISE_TERMS = /\bchore\b|typo|dependency|cache|metadata|lockfile|formatting|lint|refresh public standing|version bump/i;
const FAILURE_TERMS = /fail|failed|failure|break|broken|bug|regress|blocked|blocker|deny|denied|error|stale|collision|revoked/i;
const PROOF_TERMS = /verify|verified|verification|proof|evidence|test passed|tests passed|smoke|readback|checksum|confirmed|merge|merged|deploy|deployed/i;
const DECISION_TERMS = /decision|change|route|routing|approval|boundary|architecture|policy|permission|authority|contract/i;
const EXPERIMENT_TERMS = /experiment|prototype|trying|testing|test|beta|pilot|investigat|explor|planned|proposed|queued/i;
const SHIPPED_TERMS = /shipped|released|launched|published|public release|general availability|\bga\b/i;
const E2E_TERMS = /e2e|end[- ]?to[- ]?end|production path|canonical path|real user|user[- ]validated|runtime path/i;
const SUCCESS_TERMS = /verified|passed|pass|working|works|successful|success|completed|confirmed/i;

const CHANNELS = ["Gist","Threads","TikTok / Reel","Instagram","LinkedIn","Build Journal"];

function textOf(item = {}) {
  return [item.sourceLabel,item.source,item.title,item.notes,item.status,item.goal]
    .filter(Boolean)
    .join(" ");
}

export function cleanEvidenceTitle(value = "") {
  return String(value)
    .replace(/^(feat|fix|docs|chore|refactor|test|build|ci)(\([^)]*\))?:\s*/i,"")
    .replace(/\s+/g," ")
    .trim();
}

export function evidenceAgeDays(item = {}, now = Date.now()) {
  const timestamp = new Date(item.date || item.occurred_at || 0).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 999;
  return Math.max(0, Math.floor((now - timestamp) / 86400000));
}

export function truthStateForEvidence(item = {}) {
  const text = textOf(item);
  const status = String(item.status || "").toUpperCase();

  if (/BLOCKED|FAILED|ERROR|STALE|REVOKED|COLLISION/.test(status) || FAILURE_TERMS.test(text)) {
    return "observation";
  }
  if (/PLANNED|QUEUED|PROPOSED/.test(status)) return "experiment";
  if (/COMPLETED|DONE|SHIPPED/.test(status) && SHIPPED_TERMS.test(text)) return "shipped";
  if (/COMPLETED|DONE/.test(status) && E2E_TERMS.test(text) && SUCCESS_TERMS.test(text)) return "working";
  if (/COMPLETED|DONE/.test(status) || PROOF_TERMS.test(text)) return "evidenced";
  if (/IN_PROGRESS|RUNNING|EXECUTING|STARTED/.test(status) || EXPERIMENT_TERMS.test(text)) return "experiment";
  return "observation";
}

export function territoryForEvidence(item = {}) {
  const text = textOf(item);
  const goal = String(item.goal || item.goal_id || "").toLowerCase();

  if (CREATIVE_TERMS.test(text) || ["music","modeling","writing"].includes(goal)) return "making things";
  if (BUILD_TERMS.test(text) || ["ownership","learning","leadership"].includes(goal)) return "building / understanding the future";
  if (LIFE_TERMS.test(text) || ["relationships","career"].includes(goal)) return "being alive";
  return "being alive";
}

export function contentCandidateScore(item = {}, now = Date.now()) {
  const age = evidenceAgeDays(item, now);
  if (age > 14) return 0;

  const text = textOf(item);
  const status = String(item.status || "").toUpperCase();
  let score = Math.max(0, 14 - age) * 2 + Math.max(0, Math.min(1, Number(item.confidence ?? .5))) * 8;

  if (BUILD_TERMS.test(text) || CREATIVE_TERMS.test(text) || LIFE_TERMS.test(text)) score += 12;
  if (FAILURE_TERMS.test(text)) score += 4;
  if (/COMPLETED|DONE/.test(status)) score += 4;
  if (String(item.source || "").toLowerCase() === "manual") score += 5;
  if (NOISE_TERMS.test(text)) score -= 18;
  if (/PLANNED|QUEUED|PROPOSED/.test(status)) score -= 10;
  if (String(item.source || "").toLowerCase() === "board" && /RUNNING|IN_PROGRESS/.test(status)) score -= 3;

  return Math.max(0, Math.round(score));
}

function shareState(score) {
  if (score >= 36) return "SHARE";
  if (score >= 26) return "MAYBE";
  return "DO_NOT_POST";
}

export function channelFitForEvidence(item = {}, truthState = truthStateForEvidence(item), territory = territoryForEvidence(item)) {
  const text = textOf(item);
  const ordered = [];

  const add = (...channels) => channels.forEach(channel => {
    if (CHANNELS.includes(channel) && !ordered.includes(channel)) ordered.push(channel);
  });

  if (territory === "making things") {
    if (/video|reel|tiktok|demo|before|after|screen|process/i.test(text)) add("TikTok / Reel");
    add("Instagram","Gist","Threads");
  } else if (territory === "building / understanding the future") {
    add("Gist","Threads","Build Journal");
    if (["evidenced","working","shipped"].includes(truthState)) add("LinkedIn");
    if (/demo|video|screen|before|after/i.test(text)) add("TikTok / Reel");
  } else {
    add("Gist","Threads");
    if (/photo|video|visual|painting|model|music/i.test(text)) add("Instagram","TikTok / Reel");
    if (/career|job|professional|work/i.test(text) && ["evidenced","shipped"].includes(truthState)) add("LinkedIn");
  }

  CHANNELS.forEach(add);
  return { primary: ordered[0], alternates: ordered.slice(1, 4) };
}

export function contentAngle(item = {}, { productRoles = {} } = {}) {
  const title = cleanEvidenceTitle(item.title) || "something changed";
  const territory = territoryForEvidence(item);
  const sourceLabel = String(item.sourceLabel || item.source || "the work");
  const repo = productRoles[sourceLabel]?.label || sourceLabel;
  const text = textOf(item);

  if (FAILURE_TERMS.test(text)) {
    return {
      kind: "failure",
      hook: `I keep learning the same annoying thing about ${repo}: ${title}`,
      why: "There is a real failure or constraint here. The useful story is what it changed about your trust or approach—not a progress claim."
    };
  }
  if (PROOF_TERMS.test(text)) {
    return {
      kind: "proof",
      hook: `The part of ${repo} I care about most right now is proving what actually happened.`,
      why: "There is a concrete proof angle here. Keep the distinction between something looking capable and something being reliably evidenced."
    };
  }
  if (DECISION_TERMS.test(text)) {
    return {
      kind: "decision",
      hook: `A boring decision in ${repo} that matters more than it sounds: ${title}`,
      why: "This is a traceable decision. The stronger story is why the boundary or choice exists, not a status update."
    };
  }
  if (territory === "making things") {
    return {
      kind: "creative",
      hook: `I keep thinking about this part of making things: ${title}`,
      why: "There is an authored observation hiding inside the event. Lead with what you noticed rather than turning the work into an announcement."
    };
  }
  if (territory === "being alive") {
    return {
      kind: "life",
      hook: `I keep coming back to this: ${title}`,
      why: "The event is only useful as content if it carries a real observation, tension, or feeling. The human point comes before the update."
    };
  }
  return {
    kind: "observation",
    hook: `Something about ${repo} keeps sticking with me: ${title}`,
    why: "This is recent and traceable. Share it only if you can add the human observation the evidence produced."
  };
}

export function contentDrafts(item = {}, { productRoles = {} } = {}) {
  const angle = contentAngle(item, { productRoles });
  const title = cleanEvidenceTitle(item.title) || "the work changed";
  const truthState = truthStateForEvidence(item);

  return {
    Gist: `${angle.hook}

What happened: ${title}.

What I’m noticing: [the part that changed how I think about the problem].

What I still don’t know: [the unresolved piece].

The question I’m actually trying to answer: [why this matters beyond this specific build or moment].`,
    Threads: `${angle.hook}

[One sentence on what actually happened.]

Still figuring out: [what remains unresolved].`,
    "TikTok / Reel": `Spoken / on-screen hook: ${angle.hook}

Show: the real moment, artifact, failure, or proof when it is safe to display.

Beat: what I expected → what actually happened → what changed in my thinking → what is still unresolved.

Truth boundary: treat this as ${truthState}; do not upgrade it into a broader product claim.`,
    Instagram: `Lead with the strongest real visual.

Caption starting point: ${angle.hook}

Then: what happened → what it made me notice → what I am still sitting with.

Keep the product or milestone secondary to the authored point of view.`,
    LinkedIn: `${angle.hook}

Evidence: ${title}.

What changed in my approach: [specific decision or lesson].

What is still unproven: [boundary].

Useful takeaway: [only if there is one that travels beyond this exact build].`,
    "Build Journal": `What I was trying to do: [goal].

What actually happened: ${title}.

Truth state: ${truthState}.

What the evidence changed: [decision / belief / next test].

What remains unresolved: [uncertainty].`
  };
}

export function recommendContent(item = {}, { now = Date.now(), productRoles = {} } = {}) {
  const score = contentCandidateScore(item, now);
  const truthState = truthStateForEvidence(item);
  const territory = territoryForEvidence(item);
  const channels = channelFitForEvidence(item, truthState, territory);
  const angle = contentAngle(item, { productRoles });
  return {
    score,
    shareState: shareState(score),
    truthState,
    territory,
    primaryChannel: channels.primary,
    alternateChannels: channels.alternates,
    angle,
    drafts: contentDrafts(item, { productRoles })
  };
}

export { CHANNELS as CONTENT_CHANNELS };
