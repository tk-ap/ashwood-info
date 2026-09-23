// Pure paper-only calculations; no account or network access.
export function paperQuote(priceCents, contracts, totalFees = 0) {
  const price = Number(priceCents) / 100, n = Number(contracts), fee = Number(totalFees);
  if (![price,n,fee].every(Number.isFinite) || price <= 0 || price >= 1 || !Number.isInteger(n) || n < 1 || fee < 0) throw new RangeError('Invalid paper quote');
  const cost = price * n + fee, gain = n - cost;
  return { cost, gain, breakEven: cost / n };
}
export function paperBalance(trades, start = 400) {
  const realized = trades.filter(t => t.status !== 'OPEN').reduce((sum,t) => sum + t.profit,0);
  const committed = trades.filter(t => t.status === 'OPEN').reduce((sum,t) => sum + t.cost,0);
  return { realized, committed, available: start + realized - committed };
}
export function sizing(allocationPercent, unitCost, start = 400) {
  const percent=Number(allocationPercent);
  if (!Number.isFinite(percent)||percent<=0||percent>100||!Number.isFinite(unitCost)||unitCost<=0) throw new RangeError('Invalid allocation');
  const contracts=Math.floor(start*percent/100/unitCost),cost=contracts*unitCost;
  return { contracts, cost, maxGain:contracts-cost };
}
