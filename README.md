# Architect 2.0

I built this prototype around one journey: describe an agentic app, review the plan, inspect the source and take it through a release flow. Guided and Developer modes open the same project. Departments can work on the same saved app through separate login IDs.

Start with the app. The code and tests are here when you want to look closer.

[Live demo](https://architect-2-weld.vercel.app) · [Architecture](architecture.md)

The [architecture document](architecture.md) explains the working prototype and proposed production design. Four PNG views are included in [documentation/](documentation/): prototype, system, agent execution and release operations.

## Run it

Use **Node.js 24**; this copy was checked with 24.18.0. Open a terminal in this folder:

```sh
npm ci
npm run check
npm run dev
```

Open **http://127.0.0.1:5177**. The guest demo needs no account, API key or environment file. Keep the terminal running; Ctrl+C stops it. If port 5177 is busy, stop the process using it or run `npm run dev -- --port 5180` and use the address printed by Vite.

| Command | What it checks or starts |
|---|---|
| `npm run check` | Folder/link hygiene, frontend/backend TypeScript, all automated tests and the production build |
| `npm test` | The complete automated suite, including in-memory backend permissions and saves |
| `npm run eval` | Ten focused source-preservation, payload-budget and collaboration scenarios |
| `npm run dev` | Local guest workspace with live code reload |
| `npm run build` then `npm run preview` | Compiled app; open the address printed in the terminal |

The checks use synthetic, in-memory backend data. They do not deploy or edit the hosted workspace. This copy's `eval` runs current behavior; it needs no historical backup and does not measure model quality.

Verified on 8 October 2026 with Node.js 24.18.0: a fresh `npm ci`, all 102 automated tests, both TypeScript checks and the production build passed. The guest app opened in Chrome; both architecture image links opened, the Markdown download matched this repository, and the browser reported no console errors. Live login and multi-browser sharing on a new backend were not tested for this package.

The 8 October import refactor separates ZIP header validation from source collection and reuses one UTF-8 encoder per import. The limits, exclusions, duplicate rejection and error messages are preserved. After the change, `npm run check` passed all 105 tests, both TypeScript checks, hygiene and the production build. Three added cases cover exact capacity, file order and normalized paths. A local guest browser check verified ZIP import, preview interaction and reopening after reload, with no console errors. Live account sharing was not retested.

## Try one complete journey

1. Enter “Track supplier invoices and ask for approval before sending reminders.” Choose **Plan**, create the project, review the steps, approve them and choose **Simulate build**.
2. Switch to **Developer → Code**. Change a heading, save, then check Preview. Reload and reopen the project: the saved edit should remain.
3. Open **Agents**, inspect instructions and tools, then review the GitHub and Deploy flows. Their simulation labels matter.
4. Return home and import [automated-tests/import-demo.zip](automated-tests/import-demo.zip). It contains two small files. Try the preview button, edit the heading and reopen the project. Export source downloads JSON.

## What works, and what is simulated?

**Working:** guest persistence, source import/edit/export, checkpoints when space allows, isolated HTML preview, and login/password plus department permissions when connected to a configured Convex backend. Shared saves use revision checks so one person cannot silently overwrite another person's newer change.

**Simulated:** model generation, framework/server execution, external tools, GitHub operations and generated-app deployment. Python and server frameworks can be imported as source; this preview runs HTML. The production runtime diagram is a proposal. Google sign-in is deferred.

The local guest demo stays in that browser. It does not establish cross-device collaboration. For that, configure your own backend below.

## Optional: run shared login on your own backend

The complete backend source is included. Guest review and automated tests do not require these steps.

1. Run `npm run backend` and select **your own** Convex development project. This command syncs schema/functions to that project; it is not a local-only test. Keep it running.
2. In that project's Convex dashboard, set `SITE_URL` to `http://127.0.0.1:5177` and `BETTER_AUTH_SECRET` to your own strong random secret.
3. Use `.env.example` as a guide for the root `.env.local`. Keep the deployment selector written by Convex and set `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` to your project's public cloud/site URLs. Restart the frontend. The browser address must exactly match `SITE_URL`, including the port.
4. Create two test accounts in separate browser profiles. The owner opens **Settings → Manage departments**, creates a workspace/department and adds the other account's existing login ID. Attach a test app through **Manage access**, grant Editor, then open **Shared with me** in the second account. Check a saved edit, Viewer restrictions and a stale-save conflict.

Keep secrets on the backend. Anything prefixed `VITE_` is public. Email verification, password-reset delivery and MFA are not configured. Use synthetic data for this review.

## Find the code

```text
architect-2.0/
├── README.md              # Setup and review journey
├── architecture.md        # Implementation map and production proposal
├── application/           # UI, shared logic and Convex backend
├── automated-tests/       # Tests and one import ZIP
├── development-tools/     # Build, test and hygiene configuration
└── documentation/         # Four PNG architecture views
```

The root also keeps AGENTS.md, the package manifest/lockfile, backend/hosting configuration, ignore rules and a blank environment example. Local builds go into ignored `generated-output/`; dependencies and private environment files are excluded.

Start with `application/backend/access.ts` for permissions, `projects.ts` for revision checks, and `application/shared-logic/project-budget.ts` for source/history limits. This repository preserves the interview application's behavior, with the import refactor and verification described above. Documentation resource links and packaging are adapted for this copy. Private environment files, development history, diagram generators and old test reports are left out.
