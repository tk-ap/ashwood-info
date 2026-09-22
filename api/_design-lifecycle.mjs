// Lifecycle derivation for the Design Implementation tracker (ashwood-info#149).
//
// States are derived from canonical evidence, never typed in by hand:
//   discussed  - an agreed decision exists (the decisions module)
//   designed   - a design reference exists (issue, prototype PR, or spec)
//   built      - implementation exists in code (a PR, or commits on the default branch)
//   merged     - GitHub says every implementation PR is merged / every commit is on main
//   deployed   - the revision the production domain is ACTUALLY serving contains the merge
//   verified   - a visual-verification record exists for a revision contained in the live
//                revision, and no later commit touched the item's regression paths
//
// "Merged" is never inferred from a branch, "deployed" never from a merge, and
// "verified" never from a deployment reporting READY.

export const STATES = ["discussed", "designed", "built", "merged", "deployed", "verified"];

export const STATE_LABELS = {
  discussed: "Discussed",
  designed: "Designed",
  built: "Built",
  merged: "Merged",
  deployed: "Deployed",
  verified: "Visually verified",
};

/**
 * @param {object} decision  agreed decision (see _design-decisions.mjs)
 * @param {object} facts     reconciled evidence for that decision:
 *   { prs: [{number, state, merged, mergeCommit}], commitsOnMain: [{sha, onMain}],
 *     live: {revision, containsAll: bool|null, source, note},
 *     verification: {revision, at, url, exercised, containedInLive: bool, pathsChangedSince: string[]} | null,
 *     designRefs: number }
 */
export function deriveLifecycle(decision, facts = {}) {
  const prs = facts.prs || [];
  const commits = facts.commitsOnMain || [];
  // Evidence counts only when it was actually retrieved. A failed GitHub lookup
  // (unavailable PR, commit that could not be found, ancestry that could not be
  // checked) never raises the state; it is surfaced as evidenceUnavailable instead.
  const prKnown = pr => pr && pr.unavailable !== true && pr.state !== "unknown";
  const commitKnown = c => c && c.exists === true;
  const evidenceUnavailable = prs.some(pr => !prKnown(pr)) || commits.some(c => !commitKnown(c) || c.onMain === null || c.onMain === undefined);
  const hasImplementation = prs.some(prKnown) || commits.some(commitKnown);
  const allMerged = hasImplementation && !evidenceUnavailable
    && prs.every(pr => pr.merged === true)
    && commits.every(c => c.onMain === true);

  let state = "discussed";
  if (decision.design_refs?.length || facts.designRefs) state = "designed";
  if (hasImplementation) state = "built";
  if (hasImplementation && allMerged) state = "merged";
  if (state === "merged" && facts.live?.containsAll === true) state = "deployed";

  const v = facts.verification;
  let verification = "none";
  if (v) {
    if (state !== "deployed") verification = "not-live";
    else if (!v.containedInLive) verification = "different-revision";
    else if ((v.pathsChangedSince || []).length) verification = "reverify";
    else verification = "current";
  }
  if (state === "deployed" && verification === "current") state = "verified";

  const blocked = Boolean(decision.blocker) || (state === "merged" && facts.live?.containsAll === false
    && Boolean(facts.live?.note));
  return {
    state,
    stateIndex: STATES.indexOf(state),
    verification,          // none | not-live | different-revision | reverify | current
    blocked,
    stale: Boolean(decision.stale),
    evidenceUnavailable,
    unfinished: state !== "verified" && !decision.stale,
  };
}

/** Counts that answer the tracker's eight questions at a glance. */
export function summarize(items) {
  const at = (s) => items.filter(i => !i.lifecycle.stale && i.lifecycle.stateIndex >= STATES.indexOf(s)).length;
  const active = items.filter(i => !i.lifecycle.stale);
  return {
    agreed: active.length,
    inCode: at("built"),
    merged: at("merged"),
    live: at("deployed"),
    verified: at("verified"),
    unfinished: active.filter(i => i.lifecycle.unfinished).length,
    blocked: active.filter(i => i.lifecycle.blocked).length,
    stale: items.filter(i => i.lifecycle.stale).length + items.reduce((n, i) => n + (i.stale_refs?.length || 0), 0),
  };
}
