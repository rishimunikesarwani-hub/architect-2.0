# Cleanup verification

> Historical record: results and limits belong to the dated checkpoints below. Literal commands and paths are preserved as recorded; navigable links use the renamed folders. See the [historical path key](historical-path-key.md). This prose update does not repeat the checks.

Date: 2026-10-06. Base: `78e1cd7`. Local working-tree cleanup only.

> Follow-up: the [development test run](2026-10-06-development-test-run.md) passed the complete local pipeline again and verified the downloaded source bundle's arrival and exact contents in Edge. That result resolves the earlier download-evidence gap recorded below; Chrome's watcher attempt remains inconclusive.

## Changes

- Removed 11 unused icon imports; compiler checks independently found the same names.
- Removed 21 orphan CSS rules (1,876 characters): obsolete Google-auth classes and the old usage-table classes. The UI at that checkpoint used `dauth-*` and `ub-*`. All 606 retained CSS rules matched their previous text.
- Removed the unprovided `onAuthenticated` prop/call and unnecessary exports for the internal preview helper and save-queue options type.
- Moved the repeated download code into one shared helper. Existing call arguments and the recovery MIME `text/plain;charset=utf-8` are preserved; defaults remain `text/plain` and JSON exports retain `application/json`. URL cleanup still runs after one second.
- Added the testing/folder guides, project-specific backend README, unused-symbol compiler enforcement and one-command validation. Folder guard reads names only, changes no files and is not a full secret scanner.

No dependencies were proven unused. Framework-generated types, backend endpoints and published SVG aliases remain necessary. The existing seven project folders were retained; no source/evidence/data folders were deleted or moved.

## Automated results

| Check | Result |
|---|---|
| Initial full suite | 87 passed; first backend-projects test exceeded its 15-second allowance |
| Isolated baseline repeat | Same timeout at 17.6 seconds; other six tests passed |
| Focused rerun after changing only the first-case timeout to 30 seconds | 7/7 passed; assertions unchanged |
| `npm run check` | Passed: hygiene, frontend/backend types, 88 tests across 8 files, and production build |
| `git diff --check` | Passed |

## Targeted browser check

Chrome loaded the local app on port 5182 in guest/demo mode. Usage expanded to the two configured sample agents, the workspace preview rendered, and the actual department sign-in form opened. No credentials were entered or live project data changed.

At the measured mobile viewport of 391 by 844, document width was 391; the login dialog measured width 367.38 and scroll width 366. The viewport override was reset. Mobile screenshot capture timed out; the geometry result is DOM evidence. A normal desktop screenshot succeeded at `runs/2026-10-06-cleanup-workspace.jpg`. Sampled browser error logs were empty.

The Export source button reached its normal toast. A registered download watcher timed out, and bounded checks of the registered/standard Downloads locations did not find `research-copilot-source.json`. The toast was **not proof of file arrival**, and this attempt did not reproduce a JavaScript error. At this checkpoint, actual file arrival still needed verification before releasing the download refactor. Earlier hosted download hashes described the previous deployed version. The follow-up linked above supplied the missing file check.

No live smoke, schema update, commit, push or deployment was performed for this cleanup. The [testing guide](../documentation/guide-testing.md) separates repeatable local checks from real hosted two-browser acceptance and optional authorized backend smoke.
