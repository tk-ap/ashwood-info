// Production checks are scoped to a commit so approval never carries into a new release.
export const AI_ZERO_CHECKS = [
  ['desktop', 'Desktop visual review', 'Review the AI from Zero layout and content hierarchy on desktop.'],
  ['mobile', 'Mobile visual review', 'Review the layout, readability, and touch experience on mobile.'],
  ['choices', 'Interactive choice behavior', 'Verify every interactive choice button still works.'],
  ['result', 'Contextual result reveal', 'Verify the revealed result responds to the selected choices.'],
  ['handoff', 'Copy-handoff behavior', 'Use the copy-handoff button and verify the copied result.'],
  ['links', 'Continuity / Reference / Build Gate / Build Journal links', 'Follow all four links and verify their destinations.'],
  ['motion', 'Motion and interaction regression check', 'Check existing motion and interactions, including reduced motion, for regressions.'],
  ['copy', 'Copy density and usefulness', 'Judge whether the copy feels materially lighter without losing usefulness.'],
];

export function aiZeroReviewItems(deployment) {
  if (!deployment.files?.some(file => file.startsWith('ai-from-zero/'))) return [];
  return AI_ZERO_CHECKS.map(([key, label, detail]) => ({
    ...deployment,
    id: `${deployment.id}:ai-zero-${key}`,
    label: `AI from Zero appetite pass: ${label}`,
    detail,
    review_target: 'ai-from-zero',
  }));
}

export function deploymentReviewTarget(item) {
  return item?.review_target === 'ai-from-zero' ? '/ai-from-zero/' : null;
}


export const WORKSPACE_COHESION_CHECKS = [
  ['navigation', 'Six-view navigation', 'Use Today, Build, Work, Network, Evidence, and Self on desktop and mobile; each view should feel distinct and intentional.'],
  ['today', 'Today stays action-first', 'Confirm Today centers command, owner decisions, active AgentOS motion, and the next objective without pulling the full archive back onto the page.'],
  ['build', 'Build contains execution depth', 'Confirm the AgentOS board, active workstreams, and build utilities live under Build and remain usable.'],
  ['work-network', 'Work and Network are cleanly separated', 'Confirm professional/career/public-work material lives under Work and sponsorship/partner activity lives under Network.'],
  ['evidence', 'Evidence is the proof layer', 'Confirm signals, history, contradictions, and evidence are grouped under Evidence and remain readable without dominating Today.'],
  ['self', 'Self contains personal operating context', 'Confirm goals, check-ins, and personal framing live under Self and still load correctly.'],
  ['regression', 'Cross-view functionality regression check', 'Verify Workspace auth, command capture/status, AgentOS mirror, evidence actions, build logs, career ops, and audio upload entry points remain reachable and functional.'],
];

export function workspaceCohesionReviewItems(deployment) {
  const files = deployment.files || [];
  const touched = files.some(file =>
    file === 'workspace/cohesion.css' ||
    file === 'workspace/views.mjs' ||
    file === 'workspace/index.html'
  );
  if (!touched) return [];
  return WORKSPACE_COHESION_CHECKS.map(([key, label, detail]) => ({
    ...deployment,
    id: `${deployment.id}:workspace-cohesion-${key}`,
    label: `Workspace cohesion pass: ${label}`,
    detail,
    review_target: 'workspace-cohesion',
  }));
}

export function deploymentSpecificReviewItems(deployment) {
  return [
    ...aiZeroReviewItems(deployment),
    ...workspaceCohesionReviewItems(deployment),
  ];
}
