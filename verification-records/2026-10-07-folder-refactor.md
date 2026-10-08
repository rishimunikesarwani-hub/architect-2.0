# Folder cleanup and documentation rewrite

Date: 2026-10-07. This is a local refactor of the worktree based on `78e1cd7`, including the earlier uncommitted cleanup. The hosted app has not been redeployed for this change.

The aim was to make the next change easier to find and safer to make. The application behaves the same; its folders now explain what belongs in them.

## Where things moved

| Before | Now |
|---|---|
| `src/` | `application/` |
| `src/components/` | `application/interface-components/` |
| `src/lib/` | `application/shared-logic/` |
| `src/convex/` | `application/backend/` |
| `docs/` | `documentation/` |
| `tests/` | `automated-tests/` |
| `evals/` | `verification-records/` |
| `ops/` | `development-tools/` |
| `data/` | `sample-projects/` |
| `runs/` | `generated-output/` |

The favicon lives in `application/public-assets/`. Architecture downloads are prepared in `generated-output/public-assets/` from the originals in `documentation/`. The four previously tracked copies were moved to a recoverable local archive. Published SVG and Markdown URLs stay the same. The PNG linked by the production Markdown is now included in the public output too.

The build goes to `generated-output/website/`. Older `dist/` and `demo-dist/` builds were moved to `generated-output/previous-builds/2026-10-06-hosted-app/` and `2026-10-06-guest-app/`. Dependencies, `.git/`, Convex's `_generated/` bindings and tool-required configuration names retain the names their tools expect.

## What changed in the writing

The README, project instructions, guides, feature reference, architecture notes, historical report prose and script explanations were reviewed in Rishi Voice: conversational English at about 60%, adapted to technical documentation. Commands, API names, calculations and verification limits keep their technical meaning.

The supplied payment-status brief remains the original source snapshot. Literal test evidence, JSON reports and generated Convex files were preserved. Earlier successful checks remain dated; editing their prose does not rerun them. The [historical path key](historical-path-key.md) explains how to find files named in those records.

## Checks from this refactor

| Check | Result |
|---|---|
| Recoverable source snapshot | All 99 copied files matched their SHA-256 hashes before changes. Local credentials and dependencies were excluded. |
| Code comparison | 47 application and test files match the snapshot after allowing only the intended import-path replacements. No unexpected code differences. |
| Frontend references | Followed imports from `main.tsx` to 24 files. No unreferenced frontend modules found. Backend functions are discovered by Convex and were retained. |
| Type checks | Frontend and backend passed with unused-local and unused-parameter checks enabled. |
| Automated tests | 88 tests passed across 8 files after the move. |
| Live-check script | Syntax checked; its no-argument mode made no requests. The live development smoke was not run. |
| Chrome UI | Home, workspace, iframe preview, lazy design panel, sign-in dialog and Resources loaded. No sampled console errors. |
| Phone layout | Measured viewport 391 × 844, page width 391; sign-in dialog width 367.38 and scroll width 366. No horizontal overflow. Temporary viewport override reset. |

The final `npm run check` exited **0**: hygiene and local Markdown links, both type checks, **88/88 tests across 8 files**, and the Vite production build all passed. The complete output and code/config fingerprints are in `generated-output/2026-10-07-refactor-check.log` and `2026-10-07-refactor-check.json`.

Both architecture renderers ran successfully and both PNGs were visually inspected. Across the two Markdown documents, 87 table rows, 5 Mermaid blocks and 100 links were preserved, with repository paths updated. Both SVGs retain their original non-text geometry. The production renderer is now formatted for reading and editing.

The built website was then served locally at `http://127.0.0.1:5183/`. Ten HTTP checks returned 200 and matched the built file bytes: the home page, favicon, three SVG URLs, production PNG and Markdown, two entry JavaScript files and the main stylesheet. The generated Markdown's local diagram targets exist; source and evidence links point to the repository paths for the next publication. Those new GitHub paths will become available when the refactor is published. No live external-link check is claimed.

Chrome also loaded the compiled home page, lazy workspace and iframe preview without sampled errors. The built-workspace screenshot is `generated-output/2026-10-07-refactor-built-workspace.jpg`; download checks are in `2026-10-07-refactor-downloads.json`. The development and preview servers were used only for these local checks.

Local evidence lives in ignored `generated-output/`: `2026-10-07-source-equivalence.json`, `2026-10-07-module-audit.json`, `2026-10-07-refactor-browser.json` and `2026-10-07-refactor-login-mobile.jpg`. The original source snapshot and manifest are in `refactor-backups/2026-10-07-before-folder-cleanup/`.

## What these checks do not establish

This refactor did not create accounts, change department access, edit shared projects, deploy backend functions or apply a schema change. The earlier [hosted shared-login check](2026-10-06-hosted-department-acceptance.md) and [hosted import check](2026-10-06-hosted-import-acceptance.md) remain the evidence for those journeys. This local run does not replace them.

Real model execution, external integrations and deployment of generated apps remain simulated. The production architecture describes proposed work. No code was committed, pushed or published during this refactor.

For the next change, start with the [testing guide](../documentation/guide-testing.md) and [folder guide](../documentation/guide-folder-hygiene.md).
