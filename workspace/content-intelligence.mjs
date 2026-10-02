export const CONTENT_EDITORIAL_CONTRACT = Object.freeze({
  identity: "TK thinking out loud while making things.",
  principles: Object.freeze([
    "Interesting and true beats promotional and frequent.",
    "Products are evidence and recurring characters, not the organizing identity.",
    "Explain the problem before the solution.",
    "Unfinished infrastructure may produce observations; never imply end-to-end capability without evidence."
  ]),
  territories: Object.freeze(["being alive","making things","building and understanding the future"]),
  channels: Object.freeze({
    Gist: "Developed thought: too developed for Threads, too human for founder content.",
    Threads: "Compressed observation, contradiction, question, or unfinished thought.",
    "TikTok / Reel": "Experience, process, demonstration, or a moment that benefits from being seen or heard.",
    Instagram: "Strong visual authorship with restrained explanation.",
    LinkedIn: "Professional lesson only when the evidence supports a useful takeaway.",
    "Build Journal": "Durable record of what changed, why, and what evidence exists."
  })
});

const textOf = x => `${x?.sourceLabel || ""} ${x?.title || ""} ${x?.notes || ""} ${x?.status || ""}`.toLowerCase();
const cleanTitle = x => String(x?.title || "Untitled evidence")
  .replace(/^(feat|fix|docs|chore|refactor|test)(\([^)]*\))?:\s*/i,"")
  .trim();

export function contentCandidateScore(x, daysSince) {
  if (!x?.date || typeof daysSince !== "function" || daysSince(x.date) > 14) return 0;
  const t = textOf(x);
  let score = (14 - daysSince(x.date)) * 2 + Number(x.confidence || .5) * 10;
  if (/fix|fail|break|regress|block|deny|proof|verify|test|learn|change|decision|launch|ship|deploy|merge|complete|evidence|boundary|context|route|approval|agent/.test(t)) score += 14;
  if (/docs|chore|typo|dependency|cache|metadata/.test(t)) score -= 8;
  if (String(x.status || "").toUpperCase() === "COMPLETED") score += 5;
  if (x.source === "board" && /running|in_progress/i.test(String(x.status || ""))) score -= 4;
  return score;
}

export function contentTruthState(x) {
  const t = textOf(x);
  const status = String(x?.status || "").toUpperCase();
  const explicitlyUnverified = /\bunverified\b|not verified|not yet verified|verification pending|needs verification|pending proof|unproven/.test(t);
  if (status === "COMPLETED" && /\bdeployed\b|\bshipped\b|\breleased\b|production live/.test(t) && !explicitlyUnverified) return "shipped";
  if (status === "COMPLETED" && /end[- ]to[- ]end|\be2e\b|\bworking\b|\bworks\b|\bpassed\b/.test(t) && !explicitlyUnverified) return "working";
  if (status === "COMPLETED") return "evidenced";
  if (!explicitlyUnverified && (/\bverified\b|\bpassed\b|smoke test passed|readback confirmed|independently verified/.test(t))) return "evidenced";
  if (/experiment|prototype|attempt|trying|\btest\b|trial/.test(t) && !/\bverified\b|\bpassed\b/.test(t)) return "experiment";
  return "observation";
}

export function contentAngle(x, productLabel = "") {
  const title = cleanTitle(x);
  const repo = productLabel || x?.sourceLabel || x?.source || "the work";
  const lower = textOf(x);
  const isAgent = /agent-os|agentos|agent os|milchik|autonom|harness|runtime|agent/.test(lower);

  if (isAgent && /fail|block|stale|didn.?t|not done|recover|resume|regress/.test(lower)) {
    return {
      type:"failure",
      why:"A failure pattern exposes the gap between an impressive demo and a dependable system.",
      hook:"Apparently one of the hardest parts of giving AI autonomy is getting it to know when it hasn’t actually done the thing."
    };
  }
  if (isAgent && /proof|verify|evidence|test|readback|e2e|end[- ]to[- ]end/.test(lower)) {
    return {
      type:"proof",
      why:"The interesting part is the difference between making an agent act and proving what actually happened.",
      hook:"I’m learning that making an AI do something and proving it did the right thing are two different engineering problems."
    };
  }
  if (/ledgato|boundary|approval|permission|deny|authorization|authority/.test(lower)) {
    return {
      type:"boundary",
      why:"This is a concrete trust-and-boundaries question, not a generic product update.",
      hook:"The more useful AI agents get, the less interested I am in giving them vague permission."
    };
  }
  if (/alvira|context|memory|personalization|portab/.test(lower)) {
    return {
      type:"context",
      why:"The tension between useful context and appropriate access is understandable without knowing the product.",
      hook:"I keep coming back to the same AI problem: being more useful requires context, but having context doesn’t mean you should get all of it."
    };
  }
  if (/fix|regress|fail|broken|bug/.test(lower)) {
    return {
      type:"failure",
      why:"A correction is usually more revealing than a status update.",
      hook:`I hit a problem in ${repo}: ${title}`
    };
  }
  if (/decision|change|route|architecture|approval/.test(lower)) {
    return {
      type:"decision",
      why:"A changed decision can become a useful thought if you explain what forced the change.",
      hook:`A build decision changed in ${repo}: ${title}`
    };
  }
  return {
    type:"observation",
    why:"This is recent work with a traceable source. The useful content is the observation it produced, not the commit itself.",
    hook:`Something in ${repo} made me stop and think: ${title}`
  };
}

export function contentChannelOrder(x, truthState, angleType) {
  const t = textOf(x);
  if (/music|audio|song|record|track|model|campaign|photo|painting|art|visual/.test(t)) {
    return ["TikTok / Reel","Instagram","Gist","Threads","Build Journal"];
  }
  if (truthState === "shipped" || truthState === "working") {
    return ["Gist","Build Journal","LinkedIn","Threads","TikTok / Reel"];
  }
  if (["failure","proof","boundary","context","decision"].includes(angleType)) {
    return ["Gist","Threads","Build Journal","LinkedIn","TikTok / Reel"];
  }
  return ["Gist","Threads","Build Journal","TikTok / Reel","LinkedIn"];
}

function truthNote(state) {
  if (state === "shipped") return "The evidence supports describing this as shipped.";
  if (state === "working") return "The evidence supports saying this worked in the observed scope, not that the whole system is solved.";
  if (state === "evidenced") return "There is evidence behind the underlying event, but avoid widening the claim beyond what was verified.";
  if (state === "experiment") return "This is still an experiment. Say what is being tested, not what the system can supposedly do.";
  return "Treat this as an observation from the work, not a product capability claim.";
}

export function contentDrafts(x, angle, truthState) {
  const title = cleanTitle(x);
  const reality = truthNote(truthState);
  return {
    Gist:`${angle.hook}

What actually happened: ${title}

The part I think is worth unpacking isn’t the status update itself. It’s what this changed in how I’m thinking about the problem.

Reality check: ${reality}

What surprised me: [your actual reaction]
What I still don’t know: [leave the uncertainty in]
What I’m testing next: [only if there is a real next test]`,
    Threads:`${angle.hook}

Still figuring out what it means beyond this specific build, but this is the part I want to keep watching.`,
    "TikTok / Reel":`Opening thought: ${angle.hook}

Show or narrate the actual moment/process.
Beat: what I expected → what actually happened → what changed in my thinking.
Truth boundary: ${reality}`,
    Instagram:`Visual first. Use the strongest real image/video from the moment.

Caption direction: ${angle.hook}

Keep the explanation short and let the work carry the post.
Truth boundary: ${reality}`,
    LinkedIn:`${angle.hook}

The useful professional takeaway is not the milestone itself. It is [the decision, failure pattern, or operating lesson].

Evidence: ${title}
Boundary: ${reality}`,
    "Build Journal":`What I was trying to do: [goal]

What actually happened: ${title}

What changed in my thinking or implementation: [owner interpretation]

Evidence: [source / receipt]
Current uncertainty: [what is still unresolved]`
  };
}

export function buildContentRecommendation(x, {daysSince, productLabel} = {}) {
  const score = contentCandidateScore(x, daysSince);
  const truthState = contentTruthState(x);
  const angle = contentAngle(x, productLabel);
  const channels = contentChannelOrder(x, truthState, angle.type);
  const drafts = contentDrafts(x, angle, truthState);
  return {
    score,
    truthState,
    angle,
    channels,
    bestFit: channels.slice(0,2),
    drafts
  };
}
