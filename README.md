# Architect 2.0

Architect 2.0 is a working assignment prototype for building agentic apps. You can start with a prompt, review a plan, edit the project, import source, configure agents and walk through GitHub and deployment flows. Guided and Developer views use the same project.

**[Open the app](https://architect-2-weld.vercel.app)** · **[GitHub repository](https://github.com/rishimunikesarwani-hub/architect-2.0)**

This repository contains the application source used by the live app above. On 8 October 2026, Vercel inspection confirmed production deployment `dpl_2Do9RGbq8QrvLDXrWqKuzWm2ExGB`. Its release record identifies source commit `9b9536645a540a14fc374b6f9141c7e0b2373935`; the imported repository revision `41da9240c64400ebb9dfa3ddae55fadf80f3cdf2` adds documentation only. Vercel remains connected to the original project; pushing here does not update that deployment. Historical release links below refer to the original repository. Verification of this copy passed `npm run check`: 97 tests, both TypeScript checks, hygiene and the build. Two first-run backend timeouts did not recur on the full rerun; no application code was changed.

For a quick review, use the [submission guide](documentation/guide-submission.md): architecture attachments, demo route and local setup. The [readiness record](verification-records/2026-10-07-submission-readiness.md) distinguishes completed checks from pending release checks.

The user chose to skip blueprint on 5 October 2026. The assignment allows simulated flows, so the app shows where a step is a demonstration. Real account access and shared saved changes were added separately and verified in two browsers.

## Run it locally

Use Node.js 24 (verified with 24.18.0) and npm. The installed Vite dependencies require Node `^20.19.0 || >=22.12.0`. The lockfile pins the package versions.

```powershell
npm ci
npm run dev
```

Open the URL printed by Vite. The published app is the configured sign-in origin; local development is useful for the demo and UI work, but it is not currently an approved authentication origin.

```powershell
npm run check
```

This checks folder hygiene, frontend and backend types, automated tests, and the website build. It does not deploy the backend or replace browser acceptance. The build goes to `generated-output/website/`. See [what to test](documentation/guide-testing.md) for smaller checks and the important manual journeys.

## What is real, and what is a simulation?

| Area | What you can rely on |
|---|---|
| Accounts and shared projects | Login ID/password sign-in, administrator-assigned departments, Viewer/Editor access to the same app, reactive saved changes, stale-save rejection and private draft recovery. These run on the approved Convex development backend. Google is deferred. |
| Project work | Saved plans, agent settings, editable source, version history, safe source import and JSON export. Guest projects stay in the browser; signing in does not upload them automatically. |
| Preview | Plain HTML runs in an isolated iframe. Design presets can change that HTML. React, Python and server files can be edited, but this prototype does not execute them. |
| Build and external services | Generation, model execution, framework execution, GitHub sync, tool connections, invitations and generated-app deployment are labeled simulations. They do not call a model, connect an external account, send a message or publish a generated website. |
| Agents and usage | The shared-agent library uses fictional people and grants. It is separate from real department access to projects. Usage reads the project's saved agents, then shows illustrative credits rather than metered use or charges. |

The workspace also includes template review and copying, agent knowledge and test fixtures, generated-app data/auth demonstrations, custom HTTP and MCP tool reviews, design references, artifacts, file-based handoffs and Studio editing. Source checks inspect actual project state; the sample safety traces are not production security tests.

Imports accept up to 300,000 UTF-8 source bytes and 100 files. The client measures the complete serialized save payload against a 550,000-byte budget; the server allows 600,000 bytes. Older checkpoints are dropped first, including the last checkpoint when needed to keep current source. The workspace explains when no restore point fits. JSON escaping or other project data can still make a source bundle too large; the import dialog shows the error and keeps the selection. Environment files, credential files, dependency folders and Git folders are excluded. Duplicate normalized paths are rejected before ZIP extraction can overwrite source.

The iframe uses an opaque origin and restrictive Content Security Policy to separate preview code from the host app and its credentials. It is not the production code-execution sandbox described in the architecture proposal.

## What has been checked?

The live backend passed [15 account and permission checks](verification-records/2026-10-05-department-backend-smoke.json). The hosted Chrome/Edge journey then verified shared editing, reload persistence, conflict recovery, Viewer downgrade, revocation and sign-out/sign-in. The real ZIP chooser, preview interaction and saved edit passed for a two-file HTML fixture. JSON source export and conflict-draft HTML download were checked against the actual downloaded files.

| Evidence | What it covers |
|---|---|
| [Hosted department acceptance](verification-records/2026-10-06-hosted-department-acceptance.md) | Two browsers, the same app, permissions and saved changes |
| [Hosted import acceptance](verification-records/2026-10-06-hosted-import-acceptance.md) | Two exact imported files, working preview, edit, save and reload |
| [Supplemental verification](verification-records/2026-10-06-supplemental-ui-verification.md) | Actual downloads, per-agent usage, design/MCP simulations and measured mobile panels |
| [Requirement audit](verification-records/2026-10-05-requirement-audit.md) | Assignment requirements, source evidence and the limits of each check |
| [Public release record](verification-records/2026-10-06-public-release.md) | Published URLs, repository and artifact checks |

These are bounded checks, not a claim that every framework, archive or mobile panel has been tested. Account creation was user-performed in the hosted journey. Earlier permission-blocked import attempts remain in the history and are superseded by the successful import record. The supplied [Markdown brief](documentation/ref-payment-status-workflow-brief.md) is preserved byte-for-byte as an earlier sample snapshot.

The [7 October refactor check](verification-records/2026-10-07-folder-refactor.md) passed `npm run check`: 88 automated tests, both typechecks, folder/link hygiene and the production build. Chrome loaded the renamed app and compiled workspace; the measured phone login view had no horizontal overflow. That record describes the local checkpoint before the submission-readiness fixes.

The subsequent [before/after evaluation](verification-records/2026-10-07-app-evaluation-and-ab.md) passed the same 93 automated cases on each version: 88 regressions plus five combined import/save/access scenarios. JavaScript and CSS output matched exactly at that checkpoint. Paired browser checks found no observed behavior regression; actual exported JSON preserved both expected source files exactly. Its 300 KB case exposed a save-budget problem addressed by the later payload preparation change. Run `npm run eval` with the preserved local baseline to compare against the current code; all original cases must still pass, and new regression cases are reported separately. See the [evaluation contract](documentation/eval-app-comparison.md) for scope and browser steps.

## Find your way around

| Start here | Use it for |
|---|---|
| [Folder and script map](documentation/guide-folder-hygiene.md) | Where code, guides, checks and generated files belong |
| [Backend setup](documentation/guide-backend-setup.md) | Login IDs, departments, environment names and permission rules |
| [Testing guide](documentation/guide-testing.md) | Commands and browser checks |
| [Feature coverage](documentation/ref-feature-coverage.md) | What came from the assignment and current Architect references |
| [Current engineering drawing](documentation/arch-engineering-drawing.md) · [SVG](documentation/arch-engineering-drawing.svg) · [PNG](documentation/arch-engineering-drawing.png) | How this prototype actually works |
| [Production architecture proposal](documentation/arch-production-architecture.md) · [SVG](documentation/arch-production-architecture.svg) · [PNG](documentation/arch-production-architecture.png) | Proposed execution services, scaling choices and their rationale |
| [Release guide](documentation/guide-release.md) | Published scope and how to prepare a later release |

The website is public; its backend is still the dedicated **development** deployment. No hiring form has been submitted. Keep secrets out of `VITE_*` values, project files, chat, logs and Git.
