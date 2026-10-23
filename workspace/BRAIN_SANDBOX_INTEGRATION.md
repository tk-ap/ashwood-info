# Workspace Brain integration — 2026-10-23

## Scope

One embedded, read-only Brain interaction in the existing Workspace Self view. No new application, top-level navigation tab, identity authority, API, persistence layer, or production deployment.

### Included
- Native Workspace CSS tokens and responsive layout; no iframe
- Procedural perspective canvas, pointer rotation, keyboard rotation, optional motion, reduced-motion default, selectable concepts and connections
- Contextual reading under the brain with attributable source links and concept-specific questions
- Accessible search/index as an alternative to navigating the graphic
- Existing authenticated event and body auth-state gate; locked state never initializes the interactive model
- Explicit registration under the fail-closed Self mapping
- Synthetic reading examples; no original private notebook data copied into public source

### Deliberately absent
- The private, source-preserving 133-node notebook graph, chief aim, natal data, Context and interview transcripts
- Real agent identity sign-in/delegation — here.now Phase 1 remains synthetic, not production security
- Brain writes, new database, autonomous execution, or ALVIRA persistence fork
- Claims that node positions are neuroscientifically validated

## Sandbox release gate

Stable sandbox: https://mighty-yoga-pgph.here.now/ — only update it in place through the authorized owner publisher. Do not create a second Site, use Vercel Preview or touch production.

1. Reconcile live sandbox version against current main and this branch; do not overwrite other agents' unpublished work. Use here.now baseVersionId.
2. Publish a complete static site bundle, not a Brain-only partial fixture. Verify every Workspace asset resolves, including the new CSS and module.
3. Verify existing synthetic demo bootstrap, Workspace shell, desktop and 390px interactions, and signed-out denial. Demo auth is illustrative only.
4. Scrub pre-existing private information in the public sandbox; this Brain addition does not fix older owner-specific copy.
5. Read back provider currentVersionId; record tested URL and result before marking published.

No here.now ownership credential or live Site editing connection was available during implementation. This branch is not a published sandbox update.

## Review priorities
- Browser drag / node hit-testing / zoom / keyboard
- Focus management and mobile navigation
- Auth transitions, stale sessions and sign-out (existing app reload)
- Full bundle and content privacy audit
- Reduced-power mobile performance

## Data integrity

The integrated graph uses synthetic reading content only. Private Brain storage and ALVIRA Context remain separate authorities. Real personal graph nodes must be served only through the existing owner-authenticated Brain API once its own release gates pass, never embedded in public JavaScript.
