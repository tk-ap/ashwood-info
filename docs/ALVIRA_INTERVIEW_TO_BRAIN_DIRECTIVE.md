# ALVIRA Interview Data → ASHWOOD Second Brain: Agent Directive

**Owner-approved direction (2026-10-18).** Applies to herdr, AgentOS, and any agent handling ALVIRA interview output for ASHWOOD Brain. This is a data handoff contract, **not** authorization to import data, bypass authentication, publish content, or merge/deploy code.

## Source of truth and purpose
- **ALVIRA** remains authoritative for the subject's living Context, interviews, corrections, provenance, and approved Context projections. Do not build a second profile engine or overwrite ALVIRA records from ASHWOOD.
- **ASHWOOD Brain** stores private, useful Markdown notes and pointers for reflection, retrieval, and synthesis. Treat these as derived, traceable artifacts, not canonical copies of Career, Funding, Auditions, AgentOS execution state, or other registries.
- **AgentOS/herdr** can prepare and validate seed proposals. LEDGATo governs consequential transfers/publication when applicable. Reading Context does not grant ingest/write permission.

## Required interview handling
1. Locate the **actual** ALVIRA session export produced by the authorized actor. Record the session/artifact reference, source type, creation time (if available), actor and subject identities or stable internal references, and delegation status. Never fabricate a missing export or treat a public deployment as the artifact.
2. Accept the source's five editable Markdown Context files or a ZIP of those files; do not assume that five-file format is mandatory when the real exporter differs. Normalize only after inspecting the supplied bytes and confirming source provenance. Do not paste raw interview answers into repository issues, PRs, logs, or public fixtures.
3. Preserve evidence categories for each material claim: **KNOWN** (source-supported; not necessarily personally confirmed), **INFERRED** (unconfirmed synthesis), and **UNKNOWN** (gap). Also preserve the distinction between self-reported and delegated-agent contributed Context. Neither a synthesis nor a model output silently upgrades to subject-confirmed fact.
4. Extract only durable ideas, decisions, preferences, relevant questions, and personally useful reflections. Flag potentially stale claims, conflicts, sensitive details and low-confidence inferences for owner review. Minimize unnecessary medical, financial, legal, location, identity or third-party details.
5. Deduplicate against existing Brain notes and references using stable source identifiers and content hashes where available. Maintain source IDs, version/fingerprint, last-reviewed timestamp, and links back to the authoritative Context records. Reimports must be idempotent. Never overwrite an owner-edited note automatically.
6. Produce a **reviewable staging manifest** with title, proposed Markdown content or securely held content reference, ALVIRA provenance, claim status, sensitivity, source links, target note relation, and disposition (create / update proposal / link only / skip / needs review). A manifest may contain metadata only in version control; private contents must remain in authorized private storage.
7. Import only approved notes using the existing authenticated ASHWOOD Brain API. No direct agent-to-Neon owner-role writes, new databases/apps, public endpoints, undocumented tokens, or elevated privileges. If Workspace authentication/database dependencies are unavailable, halt writes and retain the package securely until access is restored.
8. Keep derived notes private by default. No public ASHWOOD publication, cross-user sharing, ALVIRA canonical mutation, or external distribution without explicit scope-specific owner approval and applicable enforcement.

## Verification and acceptance
- Independently inspect an authentic seed artifact and its provenance; report missing/unknown fields, not guessed ones.
- On an isolated authorized path, demonstrate **one approved real note**: create → read → search → Markdown export → content/source equivalence check. Include a negative test for anonymous access, and verify the endpoint is server-side and no credentials are in frontend assets.
- Demonstrate repeated import does not duplicate the note and a rejected/conflicting inference cannot be promoted to fact. Verify no existing ALVIRA, Career, Funding, Auditions, or AgentOS canonical record changed.
- Record evidence links, executed commands/tests and output, permissions used, unresolved blockers, and clear **proposed / staged / tested / live** status.
- Do not equate GitHub green CI or a Vercel READY deployment with authenticated end-to-end proof. Keep production promotion separately gated.

## Operator handoff
When herdr finishes, deliver the authentic Markdown/ZIP package **through an authorized private channel** plus a non-sensitive manifest with: source session and actor/delegation metadata, file count/types, provenance, claim confidence/status, conflicts, proposed Brain mappings, and what remains for owner review. If no export exists, report the precise blocker and where it is expected to be produced. Do not reconstruct it from recollection.

**Relevant existing contract:** ALVIRA `AGENTS.md` (“Context Ingest Modes: Human vs Delegated Agent”) and `docs/ALVIRA_CONTEXT_ONBOARDING_MODEL.md`. Brain implementation is staged in ASHWOOD PR #273 until verified.
