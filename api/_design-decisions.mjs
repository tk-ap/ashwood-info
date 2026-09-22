// Agreed 21st.dev-inspired design decisions (ashwood-info#149).
//
// This is the ONLY hand-maintained part of the Design Implementation tracker, and it
// holds only facts no canonical system can supply: what was agreed, which reference
// pattern informs it, the intended UX change, and what must not regress. Everything
// about progress (merged, deployed, verified) is derived by
// scripts/reconcile-design-implementation.mjs from GitHub, the live production
// revision, and verification records posted on ashwood-info#149.
//
// Server-only: this module lives under api/ with a leading underscore, so it is not a
// route and is never served statically. It references a private repository.
//
// Fields: id, product, surface, title, reference, change, regression,
//   impl: { repo, prs: [numbers], commits: [sha] }   implementation evidence
//   design_refs: [{ repo, number, kind }]            design evidence without implementation
//   live: { url, kind: "vercel"|"pages"|"agentos-runtime", domain }
//   paths: [path prefixes]                           a later change here invalidates verification
//   blocker: string | null                           an EXTERNAL blocker, stated exactly
//   stale: bool                                      the item itself is superseded
//   notes: string

const ASHWOOD = "tk-ap/ashwood-info";
const WORKSPACE_LIVE = { url: "https://ashwood-info.vercel.app/workspace/", kind: "vercel", domain: "ashwood-info.vercel.app" };

export const DECISIONS = [
  {
    id: "ASH-WS-SHELL", product: "ASHWOOD", surface: "Workspace",
    title: "One coherent Workspace shell and navigation",
    reference: "21st.dev sidebar / app-shell navigation",
    change: "Six intentional views (Today, Build, Work, Network, Evidence, Self) behind one persistent navigation instead of a long mixed page.",
    regression: "All six views reachable on desktop and mobile; view isolation stays fail-closed.",
    impl: { repo: ASHWOOD, prs: [126, 119] },
    live: WORKSPACE_LIVE,
    paths: ["workspace/views.mjs", "workspace/cohesion.css", "workspace/workspace.css"],
  },
  {
    id: "ASH-WS-MENU-RUNTIME", product: "ASHWOOD", surface: "Workspace",
    title: "Workspace menu initializes (runtime fix)",
    reference: "Release integrity for the Workspace shell",
    change: "Bind every Workspace menu button as a collection so initialization no longer throws and stops the rest of the page (evidence, filters, Career Ops) from loading.",
    regression: "Workspace menu closes after a menu action; initialization reaches refresh; no 'forEach is not a function'.",
    impl: { repo: ASHWOOD, commits: ["c6d4ced764b72560970b185da243ef8ac46af255"] },
    live: WORKSPACE_LIVE,
    paths: ["workspace/app.js"],
    notes: "Authored on fix/workspace-menu-runtime; integrated into the #149 release rather than shipped separately.",
  },
  {
    id: "ASH-WS-COMMAND", product: "ASHWOOD", surface: "Workspace · Today",
    title: "Command input: tell the system what needs to exist",
    reference: "AgentDock-style command input",
    change: "A single command field that becomes durable AgentOS ingress, instead of a disconnected form.",
    regression: "Command capture and routing status; ledgato remains the authorization boundary.",
    impl: { repo: ASHWOOD, prs: [123] },
    live: WORKSPACE_LIVE,
    paths: ["workspace/today.mjs", "workspace/today.css"],
  },
  {
    id: "ASH-WS-GLOBAL-ADD", product: "ASHWOOD", surface: "Workspace · all views",
    title: "Global Add reaches the same command input from any view",
    reference: "AgentDock-style command input",
    change: "Add in the Workspace header opens the command input wherever you are, rather than a view-specific form.",
    regression: "Existing evidence capture and command ingress unchanged.",
    design_refs: [{ repo: ASHWOOD, number: 149, kind: "issue" }],
    live: WORKSPACE_LIVE,
    paths: ["workspace/index.html", "workspace/app.js"],
  },
  {
    id: "ASH-WS-KANBAN", product: "ASHWOOD", surface: "Workspace · Build",
    title: "Operator-grade Kanban for Build / AgentOS work",
    reference: "thegridcn Kanban",
    change: "Lanes, filters and card detail over the canonical AgentOS snapshot; no second task database.",
    regression: "Board stays a projection of the AgentOS snapshot; lane counts match canonical state.",
    impl: { repo: ASHWOOD, prs: [134] },
    live: WORKSPACE_LIVE,
    paths: ["workspace/agentos-board.mjs", "workspace/agentos-board.css"],
  },
  {
    id: "ASH-WS-NOTIFICATIONS", product: "ASHWOOD", surface: "Workspace · Evidence",
    title: "Notifications grouped by what needs attention",
    reference: "21st.dev nested / filterable notifications",
    change: "Ecosystem signals read as notifications with an attention lifecycle, ELITK explanations and aged-out handling, instead of a flat feed.",
    regression: "Attention states persist; no signal is silently dropped.",
    impl: { repo: ASHWOOD, prs: [120, 121, 129] },
    live: WORKSPACE_LIVE,
    paths: ["workspace/feed.mjs", "workspace/feed.css", "api/_attention.mjs"],
  },
  {
    id: "ASH-WS-TODAY", product: "ASHWOOD", surface: "Workspace · Today",
    title: "Today as the execution front door",
    reference: "21st.dev Bento composition",
    change: "Today leads with what needs you, what agents are doing, and the next objective, composed by importance rather than as a card wall.",
    regression: "Command capture, owner decisions and autonomous sessions load.",
    impl: { repo: ASHWOOD, prs: [122, 130] },
    live: WORKSPACE_LIVE,
    paths: ["workspace/today.mjs", "workspace/today.css"],
  },
  {
    id: "ASH-WS-SELF", product: "ASHWOOD", surface: "Workspace · Self",
    title: "Self composed around current state and decisions",
    reference: "21st.dev Bento composition",
    change: "Compass, thesis, constraints and check-ins arranged by what matters now, not stacked sections.",
    regression: "Goals, check-ins and frame still load and save.",
    design_refs: [{ repo: ASHWOOD, number: 149, kind: "issue" }],
    live: WORKSPACE_LIVE,
    paths: ["workspace/frame.mjs", "workspace/workspace.css"],
  },
  {
    id: "ASH-WS-CAREER-IN-WORK", product: "ASHWOOD", surface: "Workspace · Work",
    title: "Career Ops lives inside Work",
    reference: "Information architecture (six-view cohesion)",
    change: "Career Ops, the application monitor and fresh targets render inside Work rather than on a separate page.",
    regression: "Career Ops data, application monitor and opportunities load in Work.",
    impl: { repo: ASHWOOD, prs: [126] },
    live: WORKSPACE_LIVE,
    paths: ["workspace/career-ops", "workspace/views.mjs"],
  },
  {
    id: "ASH-WS-LIST-DETAIL", product: "ASHWOOD", surface: "Workspace · Work + Network",
    title: "Work and Network use list / detail in place",
    reference: "21st.dev list-detail pattern",
    change: "Selecting an item shows its detail in the page instead of blank space followed by buttons that navigate elsewhere.",
    regression: "Relationships and applications remain editable.",
    design_refs: [{ repo: ASHWOOD, number: 149, kind: "issue" }],
    live: WORKSPACE_LIVE,
    paths: ["workspace/network.mjs", "workspace/career-ops"],
  },
  {
    id: "ASH-WS-ELITK", product: "ASHWOOD", surface: "Workspace · all views",
    title: "ELITK rewrites the current page in place",
    reference: "In-place interpretation mode",
    change: "One switch turns jargon into plain language on the current page and data, and turns it back; it is not navigation.",
    regression: "Underlying data unchanged; toggling back restores the original text.",
    impl: { repo: ASHWOOD, prs: [135, 136] },
    live: WORKSPACE_LIVE,
    paths: ["workspace/elitk-page.mjs", "workspace/elitk-page.css"],
  },
  {
    id: "ASH-WS-STATES", product: "ASHWOOD", surface: "Workspace · all views",
    title: "Designed empty, loading and error states",
    reference: "21st.dev empty / skeleton states",
    change: "Every section states why it is empty or loading, and failures say what is affected, instead of accidental whitespace.",
    regression: "No section renders as unexplained blank space.",
    design_refs: [{ repo: ASHWOOD, number: 149, kind: "issue" }],
    live: WORKSPACE_LIVE,
    paths: ["workspace/"],
  },
  {
    id: "ASH-WS-DESIGN-TRACKER", product: "ASHWOOD", surface: "Workspace · Build",
    title: "Design Implementation tracker",
    reference: "Truthful projection over GitHub, production, and verification evidence",
    change: "Build shows what was agreed, what is in code, merged, live and visually verified, and what is blocked or stale.",
    regression: "Tracker is read-only and session-protected; Kanban, Build Log and Dispatch Studio unaffected.",
    design_refs: [{ repo: ASHWOOD, number: 149, kind: "issue" }],
    live: WORKSPACE_LIVE,
    paths: ["workspace/design-implementation.mjs", "workspace/design-implementation.css", "api/_design-"],
  },
  {
    id: "ASH-JOURNAL-IMMERSIVE", product: "ASHWOOD", surface: "Build Journal",
    title: "Immersive Build Journal chronology",
    reference: "Artifact-led chronology (prototype #114)",
    change: "Stronger chronology with real build artifacts embedded in the story rather than generic panels.",
    regression: "Existing journal entries, links and archive keep working.",
    design_refs: [{ repo: ASHWOOD, number: 114, kind: "prototype" }],
    live: { url: "https://ashwood-info.vercel.app/workspace/build-logs/", kind: "vercel", domain: "ashwood-info.vercel.app" },
    paths: ["workspace/build-logs"],
    notes: "#114 is a draft prototype on a branch; it is reference-only until reconciled onto current main.",
  },
  {
    id: "AIL-DRAG-GRID", product: "ailhat", surface: "Portfolio overview",
    title: "Draggable portfolio grid",
    reference: "21st.dev draggable grid (Motion Reorder)",
    change: "Owners reorder real product cards by a visible handle, with a keyboard path (Alt + arrows).",
    regression: "Portfolio data, scans, evidence and checklist actions unchanged.",
    impl: { repo: "tk-ap/ailhat", prs: [66] },
    live: { url: "https://ailhat.vercel.app/dashboard", kind: "vercel", domain: "ailhat.vercel.app" },
    paths: ["src/components/ui/draggable-portfolio-grid.tsx", "src/routes/dashboard.tsx"],
    blocker: "ailhat.vercel.app is serving a CLI production deploy of an unpushed branch (feat/playbook-per-product, 99c871e) that does not contain #66. Reported in the AgentOS mailbox (msg-20260922-001); the owning session must push it and restore a main-based production build.",
    notes: "Code review found two defects to fix before verification: Reorder.Group uses axis=\"y\" while the grid is two columns at xl widths, and the chosen order is not kept across reloads.",
  },
  {
    id: "ALV-IMMERSIVE-INTERVIEW", product: "ALVIRA", surface: "Interview",
    title: "Immersive interview on the real interview engine",
    reference: "Conversational immersive shell (prototype #177)",
    change: "Clearer progression through landing, interview, Context Mirror, adaptive follow-up and generated Context, using the real engine.",
    regression: "Signed-out interview, Context Mirror, Context creation, uploads, auth and data models.",
    design_refs: [{ repo: "tk-ap/ALVIRA", number: 177, kind: "prototype" }, { repo: "tk-ap/ALVIRA", number: 168, kind: "dependency" }],
    live: { url: "https://alviratech.vercel.app", kind: "vercel", domain: "alviratech.vercel.app" },
    paths: [],
    notes: "#177 is a draft built over the unmerged Interview Engine Lab (#168). It is not on main.",
  },
  {
    id: "LED-AGENT-CONTROLS", product: "ledgato", surface: "Agent Controls",
    title: "Agent Controls and project status",
    reference: "Authorization-state presentation",
    change: "A public /agent-controls surface: what exists, what ledgato controls, bounded lab proof, and readiness states before the private-beta CTA.",
    regression: "/app, enforcement and approval / resume unchanged.",
    impl: { repo: "tk-ap/ledgato", prs: [48] },
    live: { url: "https://ledgato.vercel.app/agent-controls", kind: "vercel", domain: "ledgato.vercel.app" },
    paths: ["web/src/main.jsx", "web/src/styles.css"],
    blocker: "Vercel production for ledgato is not built from main (last production build 1 commit behind, before #48); /agent-controls returns 404. A production deploy of main is needed, which requires owner permission for CLI deploys.",
  },
  {
    id: "AOS-OPERATOR-ACTIONS", product: "AgentOS", surface: "Workspace · Today",
    title: "Human gates and deferred operator actions in Workspace",
    reference: "Approval / gate presentation",
    change: "Terminal actions waiting for the owner render as a clear queue in Today.",
    regression: "ASHWOOD only projects AgentOS state; it never becomes a second authority.",
    impl: { repo: ASHWOOD, prs: [144] },
    live: WORKSPACE_LIVE,
    paths: ["workspace/operator-actions.mjs", "workspace/operator-actions.css"],
    notes: "The canonical AgentOS queue behind this view (agent-os #166) arrives with the governed combined runtime activation.",
  },
  {
    id: "AOS-EXECUTION-VIZ", product: "AgentOS", surface: "Operator surfaces",
    title: "Approval, plan / tool-call and routing visualization",
    reference: "21st.dev plan / tool-call and status patterns",
    change: "One visual language for approvals, plans, tool calls, routing and verification across operator surfaces.",
    regression: "Canonical state, verifier independence and runtime activation constraints.",
    design_refs: [{ repo: ASHWOOD, number: 149, kind: "issue" }],
    live: { url: null, kind: "agentos-runtime", domain: null },
    paths: [],
    notes: "Discussed and designed; not one unified implementation. Anything that needs runtime data waits for the governed combined activation.",
  },
];

// Superseded work that must not be revived; the tracker shows these explicitly.
export const STALE_REFERENCES = [
  { repo: ASHWOOD, ref: "PR #146", reason: "Deployment-availability work was reconciled into #147, now on main.", replacement: "PR #147" },
  { repo: ASHWOOD, ref: "PR #145", reason: "Dispatch Studio was reconciled into #147, now on main.", replacement: "PR #147" },
  { repo: ASHWOOD, ref: "branch fix/workspace-menu-runtime", reason: "Its single commit is integrated into the #149 release.", replacement: "ASH-WS-MENU-RUNTIME" },
  { repo: "tk-ap/ailhat", ref: "branch feature/portfolio-draggable-grid", reason: "Pre-squash history of #66; everything in it is on main.", replacement: "PR #66" },
  { repo: ASHWOOD, ref: "PR #114 (prototype/immersive-journal-v1)", reason: "Draft prototype from before current main; reference only, not to be merged wholesale.", replacement: "ASH-JOURNAL-IMMERSIVE" },
  { repo: "tk-ap/ALVIRA", ref: "PR #177 (prototype/immersive-interview-v1)", reason: "Draft prototype over the unmerged Interview Lab; reference only.", replacement: "ALV-IMMERSIVE-INTERVIEW" },
];
