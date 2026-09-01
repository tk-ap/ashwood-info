# Agent Instructions

## Product Role

ASHWOOD is the public creative portfolio and founder build archive.

It has two distinct but connected responsibilities:

- **Portfolio** — modeling, acting, music, photography-led creative work, and the authored personal point of view.
- **Build Journal** — founder/product build archive showing what was attempted, believed, changed, learned, verified, launched, or rejected.

Do not collapse those into one generic project feed. Public presentation should feel editorial and authored rather than like an internal operations dashboard.

## Evidence and Public-Claim Rules

- ASHWOOD may curate verified evidence from the broader product ecosystem, but it does not become the canonical operating source for another product.
- Distinguish proposed, simulated, attempted, implemented, previewed, verified, deployed, and user-validated states.
- Do not present a product capability as live merely because a branch, PR, mockup, or preview exists.
- Preserve the provenance of build claims when they matter to the Journal.
- A Build Journal entry should capture decision/evidence context rather than retroactively smoothing every experiment into a success story.

## Visual and Interaction Boundaries

- Preserve ASHWOOD's photography-led editorial identity and established asset fidelity.
- Modeling should represent the subject/creative identity rather than generic unrelated photography.
- Portfolio and Journal should retain distinct information architecture and tone.
- Treat desktop and mobile as potentially different interaction grammars when the evidence supports it; do not force a desktop curiosity interaction onto touch/mobile merely for parity.
- Visual changes require verification at relevant desktop and mobile sizes.
- Preserve reduced-motion/accessibility behavior where interaction or motion is involved.
- Do not replace established art assets with lower-fidelity approximations without explicit approval.

## Repository and Release Safety

- Start material work from current `main` on a task branch.
- Inspect relevant open PRs before editing overlapping surfaces.
- Do not commit secrets, credentials, private account data, or temporary session material.
- Keep merge and production promotion human-gated unless the owner explicitly authorizes a narrower task-specific action.
- A READY preview is evidence that a deployment built; it is not proof that the experience passed human/visual verification.

## Agent OS Control-Plane Integration

This repository participates in `tk-ap/agent-os` as the canonical shared workforce/control-plane layer.

Before material planning or implementation:

1. Read Agent OS `BOOTSTRAP.md` and `registry/product-routing.yaml`.
2. Read this repository's `.agent-os/product.yaml` and `.agent-os/integration-surface.yaml`.
3. Resolve whether the task is truly ASHWOOD presentation/evidence work or belongs to another product.
4. Use the minimum-sufficient Agent OS agents/skills rather than treating every task as a generic coding task.
5. Use portable contracts for cross-product work, especially `work-item` when handing underlying product work back to its owner and `outcome-event` when verified product evidence becomes a candidate Journal/public reference.
6. Preserve local visual, editorial, evidence, and human-verification constraints even when an execution harness can technically make broader changes.

The normal chain is:

`request → ASHWOOD boundary → governed task → agents/skills → authorized harness/host → branch/change → technical + visual verification → evidence → human merge/production gate`

Agent OS / Workforce is infrastructure, not a public ASHWOOD offering. ASHWOOD can document the governed-agent build process when it is meaningful evidence, but it should not expose private operating machinery merely because it exists.
