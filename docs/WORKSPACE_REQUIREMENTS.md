# ASHWOOD Workspace: actionable interface requirements

**Status:** Product direction, not a statement of implemented integrations. **Canonical mandate:** [AgentOS Workspace Operating Mandate](https://github.com/tk-ap/agent-os/blob/docs/workspace-operating-mandate-20260923/docs/WORKSPACE_OPERATING_MANDATE.md). Once merged, update the link to main.

ASHWOOD Workspace is the operator's actual working environment, not a passive status dashboard. It projects authoritative facts from their owning systems and provides direct, governed actions. Do not duplicate AgentOS orchestration or LEDGATo enforcement in the frontend.

## Navigation and views
- **Today:** Prioritized attention queue, deadlines, calendar, pending approvals, work delegated to agents, changes since last visit.
- **Work:** Ecosystem projects, directives, agent/harness state, capacity, sandboxes, diff/review evidence, deployment readiness and market-solution research.
- **Career:** Job pipeline, applications, recruiters, follow-ups, portfolio/submission records, WHO Management audition requests, deadlines and callbacks where authorized source access exists.
- **Communications:** AgentMail and connected correspondence, threaded inquiries, suggested replies, resolve/reopen and human approval controls.
- **Business:** Investor/sponsor pipeline, outreach, publishing/Dispatch/Build Journal, beta feedback, product evidence and zero-dollar infrastructure budget.
- **Records:** Durable commitments, source documents, administrative milestones, evidence history, decisions and provenance.

## Common interaction contract
Every actionable item exposes source, verified versus inferred status, responsible actor, next action, due date, dependency/blocker, authorization gate and evidence link. The same commitment can surface in Today and its owning domain without creating duplicate tasks. Offer direct actions to review/resolve inquiries, inspect sandboxes, request changes, approve/reject governed work, manage application follow-ups and triage audition notices. Clearly distinguish drafted, submitted, acknowledged and externally verified states.

## Operator experience
Provide a persistent quick menu across all six domains; surface urgent decisions separately from informational updates; support search, filtering, inbox triage and concise activity history. Prioritize accessible, functional workflows over additional dense landing-page sections. Preserve existing live public pages and runtime until separately authorized implementation and testing.

## Integration boundaries
AgentOS owns task routing, execution attempts, recovery, evidence references and attention orchestration. GitHub owns repository facts; external mail, agency, recruiting, calendar and financial systems own their respective source records. Agent Control owns generic authorization intelligence where integrated; LEDGATo independently enforces materially consequential protected actions where integrated. Workspace must not imply that a feed is live before its connector and sync behavior are verified.

## Sequencing
Document requirements now. Finish the existing AgentOS lifecycle release candidate first; then integrate AgentOS/Herdr evidence and inbox with Workspace; then add domain connectors in validated increments, preserving $0 operating constraints and explicit action-specific approvals.
