# Where files belong

A folder name should answer the first question: what will I find here? The user requested descriptive names for this project. Keep one maintained source for each artifact and let scripts produce the copies needed by the website.

## Folder map

| Folder | Put this here | Keep this elsewhere |
|---|---|---|
| `application/` | React app and entry points | Reports and screenshots |
| `application/interface-components/` | Feature UI and its styles | Generic helpers with several consumers |
| `application/shared-logic/` | Logic that features actually share | Helpers created only to make a file shorter |
| `application/backend/` | Convex functions, schema, authorization and generated API types | Client-only state or credentials |
| `application/public-assets/` | Authored browser assets, currently the favicon | Generated copies of architecture documents |
| `documentation/` | Working guides, source references and architecture MD/SVG/PNG | Dated test results |
| `automated-tests/` | Automated regression checks with isolated fixtures | Live credentials or deployment steps |
| `verification-records/` | Dated, sanitized acceptance reports | Build output and raw screenshots |
| `development-tools/` | Build/test configuration and repeatable scripts | Product UI logic |
| `sample-projects/` | Small safe import fixtures | Customer or department data |
| `generated-output/` | Ignored builds, served assets, screenshots, reports and backups | The only copy of maintained source |

The top-level folders are now `application`, `documentation`, `automated-tests`, `verification-records`, `development-tools`, `sample-projects` and `generated-output`. They replace the earlier `src`, `docs`, `tests`, `evals`, `ops`, `data` and `runs` names.

The root keeps `README.md`, `AGENTS.md`, `LOG.md` and `package.json`, plus files the tools need: lockfile, ignore files, `convex.json` and `vercel.json`. Ignored `.env.local` stays at the root because Vite and Convex read it there. `node_modules/`, `.git/` and optional tool-managed `.vercel/` or `.convex/` directories are exceptions, not new places for product files.

## Script map

Run these from the repository root.

| Command | What it does |
|---|---|
| `npm run dev` | Syncs public artifacts, then starts Vite on 127.0.0.1 |
| `npm run build` | Checks frontend types, syncs public artifacts and builds into `generated-output/website/` |
| `npm run preview` | Serves the built website locally |
| `npm run typecheck:frontend` | Checks application types using `development-tools/tsconfig.json` |
| `npm run typecheck:backend` | Checks backend types using `application/backend/tsconfig.json`; no deploy |
| `npm test` | Runs Vitest through `development-tools/vitest.config.ts` |
| `npm run hygiene` | Checks layout, tracked output and local Markdown file links through `development-tools/check-hygiene.mjs`; no changes |
| `npm run check` | Runs hygiene, both typechecks, tests and build in order |
| `npm run diagrams` | Renders the production and prototype drawings, then syncs public copies |
| `npm run eval` | Runs the same automated evaluation against preserved before/after copies; see the [comparison contract](eval-app-comparison.md) |
| `npm run backend` | Runs Convex dev; this can update the configured live development backend |

The last command has a different consequence from the checks above it. Use it only when a backend update is intended and authorized. The optional live smoke script is also separate from `npm run check`; see the [testing guide](guide-testing.md).

## One source, generated copies

Architecture Markdown, SVG and PNG live in `documentation/`. The renderers live in `development-tools/`. Run `npm run diagrams` after changing drawing source, then inspect the rendered result.

`development-tools/sync-diagram.mjs` prepares `generated-output/public-assets/` from the maintained documents and `application/public-assets/favicon.svg`. Dev and build run this sync automatically. Those served copies are ignored output; do not edit them or commit a second copy.

The served Markdown keeps its diagram links beside the download. Its source-code and evidence links are rewritten to GitHub because a downloaded file has no repository folders beside it. Keep relative file links in the original Markdown so they also work in this checkout.

The published names `engineering-drawing.svg`, `production-architecture.svg`, `arch-production-architecture.svg` and `arch-production-architecture.md` remain available. The two production SVG names are intentional aliases so existing links keep working.

## Before removing something

Keep feature-specific UI and styles together. Move a helper into `application/shared-logic/` when several features share its behavior, not merely because a file looks long.

Both TypeScript checks reject unused locals, parameters and imports. They cannot prove that an exported backend function is unused: Convex can call those functions dynamically. Check the consumers before removing exports or dependencies. For example, `@edge-runtime/vm` supports the test environment without a direct app import.

Keep `application/backend/_generated/`; it is the framework's API/type contract. Regenerate it with the appropriate Convex tooling when needed, rather than editing it manually.

Keep dated evidence and link to later results when a check is superseded. Preserve safe fixtures, the user's original brief, useful screenshots and backups. The 99-file backup before this rename is at `generated-output/refactor-backups/2026-10-07-before-folder-cleanup/`. It is recoverable local material, not website content.

The hygiene script checks names, tracked paths and local Markdown file targets. It flags unexpected root entries, accidentally tracked environment/generated files and missing linked files. It skips fenced examples, external URLs and heading fragments. A pass is not certification of external links, anchors, every possible secret or whether all code is used. Add an exception only when a tool needs it; do not weaken the check to hide a misplaced file.
