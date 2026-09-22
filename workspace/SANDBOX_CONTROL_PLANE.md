# ASHWOOD Sandbox Control Plane

Status: accepted owner-interface direction.

## Goal

ASHWOOD Workspace should become the human control surface for sandbox environments across the ecosystem.

The owner should be able to see a sandbox, understand what source/version it represents, verify or update it, and move work forward without opening ChatGPT, Codex, Claude, Hermes, or a provider dashboard for routine operations.

This does **not** make ASHWOOD the execution or authorization system of record.

## Canonical ownership

```
GitHub source facts ───────────────┐
provider deployment facts ────────┤
AgentOS lifecycle / execution ─────┼──→ ASHWOOD Workspace
ledgato authorization decisions ───┤
ailhat portfolio intelligence ─────┘
```

- GitHub owns source-code truth.
- here.now / Vercel own provider deployment facts.
- AgentOS owns work lifecycle, routing, execution attempts, and completion evidence.
- ledgato owns authorization / enforcement decisions.
- ailhat observes environments as portfolio context and may recommend work.
- ASHWOOD renders and initiates owner intent; it does not manufacture provider or execution state.

## Authentication

### Decision

**ASHWOOD Workspace is the canonical owner login experience.**

The existing `ashwood_workspace_session` cookie must **not** be copied, forwarded, exposed, or reused as a bearer token on a sandbox domain.

Reasons:

- it is HttpOnly;
- it is host scoped;
- it is SameSite=Strict;
- sharing it would expand the blast radius of the owner session;
- here.now does not accept arbitrary external session tokens as a native access mode.

### Target experience

```
owner signs into Workspace once
            │
            ▼
ASHWOOD validates owner session
            │
            ▼
sandbox gateway / scoped grant
            │
            ▼
specific sandbox
```

The gateway may use a short-lived, single-sandbox grant or server-side provider credentials. Either way:

- raw Workspace session tokens never leave the ASHWOOD origin;
- grants are sandbox scoped and short lived;
- direct provider credentials stay server side;
- revoking/rotating Workspace access invalidates the owner path;
- a provider-native fallback gate may remain for recovery.

### here.now constraint

here.now currently supports provider-native access modes such as link access, password, restricted email/domain access, and workspace-member access. Those modes are useful provider controls but they are **not** a substitute for ASHWOOD owner-session federation.

For a seamless “one login” experience, ASHWOOD needs a gateway/proxy boundary after the here.now site is claimed and durable provider credentials are available.

Do not solve this by setting the here.now password equal to the ASHWOOD passphrase.

## Environment registry

`workspace_sandbox_environments` stores **non-secret deployment metadata only**:

- environment id
- product key
- provider
- purpose
- environment kind
- URL
- provider site/version identifiers
- source repository/ref
- access mode
- ownership
- persistence
- lifecycle status
- expiry
- last observed time
- non-secret metadata

Never store:

- Workspace browser session tokens
- here.now claim tokens / claim URLs
- provider API keys
- test-user passwords
- ledgato authority secrets

## Provider sync

Publishing tools should update the Workspace registry after successful provider finalize/verification.

Machine writes use a dedicated server-to-server token such as `WORKSPACE_SANDBOX_SYNC_TOKEN`.

The provider observation should include the exact source ref and provider version so Workspace can detect drift.

## Workspace actions

The Sandbox Environments interface may offer actions such as:

- Verify
- Update
- Gate
- Retire

These buttons do **not** directly mutate provider state.

They submit owner intent into the existing Workspace command queue. AgentOS picks up the command, ledgato evaluates authorization where required, the provider adapter performs the bounded operation, and evidence updates the registry.

```
Workspace button
      │
      ▼
owner command
      │
      ▼
AgentOS lifecycle
      │
      ▼
ledgato decision
      │
      ▼
provider adapter
      │
      ▼
provider evidence
      │
      └──────────────→ registry / Workspace / ailhat
```

## ailhat projection

ailhat should not become a second environment registry.

Its owner profile reads the Workspace registry through a dedicated server-to-server read credential and displays the environments as portfolio context.

ailhat may use this data to identify:

- stale or expiring sandboxes;
- source/provider drift;
- missing verification;
- forgotten experiments;
- products with active sandbox work but no production movement;
- sandbox evidence relevant to product readiness.

ailhat must not receive Workspace browser sessions or provider secrets.

## Current first environment

- Product: ASHWOOD
- Provider: here.now
- Purpose: ASHWOOD / GRAVITY public-home parity sandbox
- Site: `https://mighty-yoga-pgph.here.now/`
- Provider version: `01M34Z9SBZS6MN1TGMZFT2KR7Y`
- Source: `tk-ap/ashwood-info@0065f2aae3e8fecf11b833846ce7653885ef4335`
- Parity verification: PASS
- Current ownership: anonymous
- Current persistence: expiring
- Current access: anyone with link
- Expiry: 2026-09-23T16:31:05.087Z

The site must be claimed before durable provider-native gating can be configured.
