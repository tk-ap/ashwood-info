# Agent Instructions

## Product Role

ASHWOOD is the public creative portfolio and founder build archive.

It has two distinct but connected responsibilities:

- **Portfolio** — modeling, acting, music, photography-led creative work, and the authored personal point of view.
- **Build Journal** — founder/product build archive showing what was attempted, believed, changed, learned, verified, launched, or rejected.

Do not collapse those into one generic project feed. Public presentation should feel editorial and authored rather than like an internal operations dashboard.

## Living Experience Direction

ASHWOOD's UI and private Workspace should feel alive: a living, breathing working copy of everything currently relevant about TK for its intended audience to consume. Keep the experience current, personal, and useful. Activity and interaction should reveal meaningful context, work, or change; preserve the distinction between public presentation and private owner state. This direction does not authorize publishing private material or adding motion for its own sake.

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

## Public Media Privacy Boundary

- Never publish or restore media that reveals or strongly implies the owner's residence, home block, building entrance, habitual route, or another sensitive personal location.
- Outdoor imagery from an owner-designated residential-proximity exclusion area is private by default and must not appear on public ASHWOOD surfaces.
- Indoor imagery from that area may be used only when the frame does not reveal an address, building identity, entrance, window/street view, geotag, or other practical location clue.
- If a photo's location provenance is uncertain, do not ship it. Prefer studio, runway, event-venue, campaign, or clearly non-residential imagery that has been visually reviewed.
- Before public release, visually inspect candidate media for street signs, addresses, building numbers, recognizable residential frontage, navigation/map data, license plates when materially identifying, and embedded or rendered location metadata.
- Do not put the exact private exclusion-area boundary into this public repository. That detail belongs in private owner/runtime context.
- `assets/digitals2026/barelysain-01.jpg` is a confirmed location-sensitive asset. It must not be restored to the public repository or referenced by a public route.

## Repository and Release Safety

- Start material work from current `main` on a task branch.
- Inspect relevant open PRs before editing overlapping surfaces.
- Do not commit secrets, credentials, private account data, or temporary session material.
- Keep merge and production promotion human-gated unless the owner explicitly authorizes a narrower task-specific action.
- A READY preview is evidence that a deployment built; it is not proof that the experience passed human/visual verification.

### Canonical Deployment Topology

- Read `.agent-os/deployment.yaml` before any release, deployment diagnosis, or claim about live state.
- The canonical source is `tk-ap/ashwood-info` on `main`.
- Production is the Vercel project `ashwood` at `https://ashwood-info.vercel.app`.
- Do not use repository homepage metadata, an old repository name, or a previously used host as deployment truth when it conflicts with `.agent-os/deployment.yaml`.

### Mandatory Release Preflight

Before editing or deploying:

1. Confirm the repository, production branch, hosting provider, project, and production URL against `.agent-os/deployment.yaml`.
2. Fetch current `main` and record its full commit SHA.
3. Confirm the hosting project is linked to the canonical repository.
4. Inspect the latest production deployment and its commit SHA.
5. If the first deployment assumption is wrong, stop and re-resolve the topology from the canonical file and hosting provider before further troubleshooting.

### Production Completion Gate

Never report a change as live based only on a local commit, pushed branch, merged commit, preview, or READY build. Completion requires evidence that:

1. `main` contains the intended commit.
2. Vercel production deployed that exact full commit SHA.
3. The canonical production URL and every changed route return successfully.
4. Expected live HTML references are present.
5. Every newly published asset URL returns the expected content type and non-empty body.
6. Relevant automated checks pass and production runtime errors are reviewed.

### Local Upload Handling

- Treat a temporary upload path as transient input, not durable project storage.
- After approval and privacy review, copy each required local attachment into its final tracked repository path immediately.
- Validate that the copied asset decodes, has the intended dimensions/format, is referenced by the relevant route, and remains present before commit and production verification.

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
