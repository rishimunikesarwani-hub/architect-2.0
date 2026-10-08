# What Architect 2.0 needs to cover

The assignment asks for an end-to-end app-building experience for technical and nontechnical users. The user explicitly said **skip blueprint**, and the assignment permits dummy flows. This document is an implementation/review inventory, not an approved blueprint and not a new source of requirements.

The later account decision is clear: Google is deferred; login ID/password accounts and shared department projects are real. The public app and repository are published. [Hosted department acceptance](../verification-records/2026-10-06-hosted-department-acceptance.md), [supplemental UI checks](../verification-records/2026-10-06-supplemental-ui-verification.md) and [two-file ZIP import acceptance](../verification-records/2026-10-06-hosted-import-acceptance.md) record the observed journeys. Use the [requirement audit](../verification-records/2026-10-05-requirement-audit.md) for individual feature status, and the [folder-refactor record](../verification-records/2026-10-07-folder-refactor.md) for the current local changes.

## Where the scope came from

| Source | What it establishes | What it does not establish |
|---|---|---|
| User's assignment screenshot | Prompt-build an agentic app; import and continue a project; choose an agent framework; connect GitHub; deploy; keep current Architect features; serve developers and nontechnical users. Dummy flows are allowed. | The screenshot alone does not require live model execution or exhaustive framework support. |
| [Full hiring assignment](https://hiring.lyzrarchitect.space/), browser-read during this work | A detailed architecture diagram and Markdown service rationale, plus a live prototype URL and GitHub repository for the shipping deliverable. | Permission to submit the hiring form. That remains a separate action. |
| [Official docs index](https://docs.architect.new/llms.txt), read 5 October 2026; per-agent usage entry refreshed 6 October | Documented feature groups: planning, themes, data/auth, GitHub, artifacts, environment variables, GitAgent, sharing, tools/MCP, tests and usage. | Proof that any source-product runtime worked in our account or that we inspected every undocumented screen. |
| [Build guide](https://docs.architect.new/build/build-guide), [data/auth](https://docs.architect.new/build/database-auth), [GitHub](https://docs.architect.new/build/github-connect), [deployment](https://docs.architect.new/build/deployment), [sharing](https://docs.architect.new/build/share-app), read 5 October | The described user journeys used in the inventory below. | A source-product app being built, imported, connected, shared or deployed during this audit. |
| Earlier local research, outside this repository | Historical home, library, consultant and Studio observations, plus source pointers. | Current runtime verification. |

The earlier local research files were `Research_Data/2026-09-25-architect-feature-matrix.md`, `Research_Data/2026-09-26-architect-product-report.md` and `Research_Data/2026-09-25-architect-evidence-ledger.md`. These are historical provenance, not portable repository links.

The docs index mentioned GitAgent beta, artifacts, environment variables and v2.2 GitHub import/test-agent features. Detailed pages for some of those entries were unavailable through the web reader. The index supports their feature-group names; it does not support invented detail about their behavior.

An earlier local `outputs/2026-10-05-architect-clone-preflight.md` asked for real model-backed generation. The later user-supplied assignment explicitly permits demonstrations, so that older demand does not control this build. Older Google requirements are also superseded by the password/department decision.

The full architecture assignment covers sandbox choice, the planning/code/tool/error-recovery harness, model switching, frontend/backend/live-preview connections, proxy responsibility, GitHub, deployment of both generated apps and the platform, and thousands of concurrent builders/runtimes. Those choices are addressed as a **proposal** in the [production architecture](arch-production-architecture.md). They are not claimed as running infrastructure.

## Feature groups and review points

A destination can be a page, panel or dialog. A separate URL for every row was an early design suggestion, not an assignment requirement. What matters is that someone can reach the flow, understand its state and return without losing project context.

These review points preserve the intent of the original inventory. They do not assert that every branch below has been browser-tested; the dated audit and acceptance records carry that evidence.

| Destination or feature group | Experience to cover | Review point |
|---|---|---|
| Home and account context | Prompt composer, personal/shared/published projects, account/workspace context, suggested starts, import and Guided/Developer preference | Both audiences can start. Empty input gets useful guidance; changing the view should preserve the prompt. |
| Sign-in | Login ID/password, loading/error states, session and sign-out; identifiable guest demo | Never present a demo as a real session. The hosted password journey is verified; the earlier Google round-trip checklist is historical and applies only if Google is enabled later. |
| Projects | My/shared/published views, search, cards, rename, reopen and recoverable archive | Correct title and source survive reopening. Empty/loading/error states explain what to do next. Shared access opens the same project ID. |
| Prompt and build | Prompt, editable plan, agents, preview, conversation and visible build/revision state | The journey continues into the workspace. Simulated generation is labeled where it runs; a revision changes visible project state. |
| Import | Local source/ZIP and GitHub URL entry, source summary, framework choice/detection, recoverable errors and continuation | Real local import reaches the normal editor. A simulated GitHub import must not claim to have fetched a repository. The verified archive is the two-file HTML fixture, not every format. |
| Plan | Requirements, user journey, agents/tools, editable assumptions, approval and explicit build action | Plan edits persist. Approval alone is not a completed build. Returning from preview keeps the plan. |
| Agents and framework | Graph/list, role, goal, instructions, model, tools, knowledge, permissions and Custom framework choice | Explain capabilities to a beginner and expose configuration to a developer. Framework changes preserve source and explain execution limits. |
| Preview and history | Preview, device size, refresh/open, refinement and version choice | Active project, source and selected version stay aligned. Plain HTML runs; other runtimes get an honest unsupported-runtime state. |
| Source editor | File tree, editable source, save state and source export | File selection and a saved local edit work. Source is not presented as a running backend. Diffs and terminal/run output were additional developer suggestions, not separate mandatory deliverables. |
| Test agent and results | Individual fixtures, normal/failure examples, bounded event timeline, results and retry | Show inputs, tools, outputs and errors without invented hidden reasoning. Distinguish real source checks from illustrative runtime traces. |
| Data and generated-app auth | Collections, documents/schema, auth status and storage mode | Keep the real platform's Convex data separate from generated-app sample data and sign-in simulations. Verify real save/access behavior independently. |
| Integrations and tools | Searchable categories, permissions/scopes, connect/disconnect, custom HTTP tools and MCP configuration | Invalid input is recoverable. A simulated connection never claims an external account was authorized or a request was sent. |
| GitHub source connection | Repository/branch review, sync, changed files, pull/push, conflicts and disconnect | App-source sync is separate from giving an agent a GitHub tool. Keep simulated commits/pushes clearly simulated; do not invent a real remote SHA. |
| Deployment | Review, progress, result, preview/open, repeat deployment, naming/domain/analytics/marketplace options | The documented flow need not require GitHub. A simulated result opens a functioning local preview with a clear label, not an invented public app URL. |
| Project settings | Name, framework detail, environment variable names, access, history/restore and archive | Current environment fields hold names/status only. Never put secret values in preview, source or export. Version restore concerns project source, not a database rollback. |
| Library and consultant | Searchable prompt categories, template detail/use and a guided role/problem/tools interview | Selected ideas reach an editable project and can be reviewed before a build. |
| Marketplace | Discover/filter/detail/clone, sample author and template identity | A copy is independent and retains origin metadata; it does not mutate the sample. |
| Design systems | Presets, brand instructions/assets and Figma/PDF/GitHub/ZIP reference flows | Applied presets change the HTML preview. State what was actually processed; sample directions are not extracted designs. Design-reference import is distinct from real project-source import. |
| Usage, preferences and support | Build/runtime breakdown by app and agent, account/workspace preferences and help | Sample credit data remains labeled illustrative and never looks like a charge. Configured agent names come from the saved project. |

Artifacts, GitAgent file configuration, sharing, Studio handoff and integration categories may sit inside these destinations. Studio should stay connected to the selected agent or clearly describe a simulation; it should not silently route to an unrelated external account.

## Developer ideas added during review

The assignment asks for a useful developer experience. The following were proposed ways to provide it, not a user-approved expansion of scope:

- Keep Guided and Developer views on one project. The first emphasizes intent and preview; the second exposes source, configuration and Git detail.
- Make framework choice explicit. Lyzr, LangGraph, CrewAI and Custom are choices in the prototype; the original inventory also suggested AutoGen and an adapter contract. A selection alone does not prove executable support.
- Continue from import into a first meaningful edit and preview. Diffs or terminal output can help later, but do not turn them into missing requirements solely because this inventory mentioned them.
- Make agent configuration and bounded event traces inspectable. Show enough to understand a tool failure without fabricating private reasoning.
- Bring the selected version, checks and configuration status into the deployment review. This should help a user make a decision, not become an invented production compliance gate.

## Real integration boundaries

| Area | Evidence we need to make a real claim |
|---|---|
| Password accounts and Convex | Authenticated creation/read/save and reopening; server-side owner/admin and department checks; anonymous/outsider denial; Viewer restrictions; stale revision rejection; revoke/restore and sessions |
| Configuration | Exact environment names and setup steps; no credentials in frontend bundles, logs, project source or exports; usable unconfigured local demo |
| Optional future Google | Registered callback, successful provider round trip, real session, reload/sign-out and cancellation/error recovery |
| Production runtime proposal | Separate future implementation and verification for model execution, sandboxing, external tools, deployment, scale and billing |

Real project-sharing evidence must not be confused with the fictional Agent library grant simulation. Guest projects and cloud projects are separate, and signing in does not upload guest work automatically.

## What would make the handoff misleading?

A landing page alone cannot cover prompt → plan → agents → preview → deployment. Developer mode also needs to expose useful project work, rather than just change a label. Watch for buttons with no state transition, lost context after returning, fake login success, imaginary public deployment URLs or simulated connectors described as live.

Review changed flows on desktop and a measured phone viewport. Check primary actions, dialog close/focus behavior, overflow and useful empty/error states. Record what was observed. The current evidence establishes the assignment prototype at its permitted fidelity; it does not claim production readiness or exhaustive source-product parity.
