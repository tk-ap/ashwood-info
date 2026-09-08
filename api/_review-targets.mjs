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
