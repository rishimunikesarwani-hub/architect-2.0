# Evaluating the app before and after the refactor

This comparison answers one question: did the folder and documentation cleanup preserve the app's behavior, and did it make the project easier to maintain?

The user selected **before versus after the refactor** on 7 October 2026. This is a controlled local comparison, not an experiment on live users. No production traffic is split between versions.

## The two versions

Run `npm run eval` for the repeatable automated comparison. It writes a new dated run under `generated-output/evaluations/`. The paired browser journeys below are recorded separately because the command does not control a browser.

| Version | Source |
|---|---|
| A — before | The 99-file, hash-verified snapshot in `generated-output/refactor-backups/2026-10-07-before-folder-cleanup/`. It includes the earlier uncommitted cleanup. It is not just commit `78e1cd7`. |
| B — after | The current local worktree, copied when the evaluation starts. Its file hashes identify the exact version checked. |

The runner creates separate copies. The original snapshot stays untouched. Both copies use the same installed dependencies; their lockfiles must match. Environment files are excluded. Browser builds run as disconnected guest workspaces, so the experiment does not need accounts or write to the live backend.

This command requires the preserved local snapshot and the already installed dependencies. The snapshot is ignored by Git; a fresh checkout does not contain it. The runner stops if the snapshot or dependency hashes do not match. It does not install packages or reconstruct a baseline from a different commit.

## Decide what counts before reading the results

Run all 88 baseline regression tests and five shared composed scenarios against both versions. A remains the immutable 93-case baseline. B may add passing regression cases as fixes are made, but it must preserve every canonical baseline test name and passing status. The runner rejects removed, duplicated, skipped and failed cases and reports additions and status changes. Report every result, including failures. A failure or limitation in both is an existing issue, not an improvement and not a refactor regression.

The additional scenarios connect parts that the ordinary tests mostly check separately:

1. Import 220 KB of multilingual source, create the app, save/read it in the in-memory backend, and parse the saved state. Source and the initial checkpoint must remain exact.
2. Submit a raw 300 KB import with its duplicated initial checkpoint directly to the backend fixture. Record parser acceptance and the backend's save-budget rejection. This deliberately bypasses the current client payload-preparation helper and preserves the historical negative boundary case. Separate B-only regression cases cover preparing a normal 300 KB import, trimming history, saving a small edit and reading the exact source back. A passing rejection check does **not** mean that the corresponding user journey succeeded.
3. Queue two edits, revoke access before the first commit, then restore access. The denied save must not commit, the later queued save must not run, and an explicit stale retry must require conflict recovery.
4. Reject malformed and oversized updates without changing the source, title, revision or catalog. A subsequent valid update must still work at the original revision.
5. Store malformed collaborator state without allowing it to render or change permissions, then restore valid source at the next revision.

These use in-memory Convex and Better Auth fixtures. They do not establish that a hosted login, WebSocket subscription or browser recovery button worked.

## Paired browser journeys

Use the same synthetic files and actions in separate local origins. Record the order, results and any differences. Browser timings are descriptive; a single run cannot establish a performance win.

| Journey | Required observation |
|---|---|
| Import recovery | Select valid source, then a broken archive. The earlier selection clears and Import becomes unavailable. Selecting the valid archive again recovers. Fake environment/credential files stay excluded. |
| Import, edit and reload | Both source files match the fixture; the preview responds. Save the same heading edit in each version, reload and verify exact source and unchanged README. |
| Preview isolation | The imported page can update its own counter but cannot read the host document. Its controlled network probe is blocked; record browser evidence and the probe receiver's request count. |
| Unsupported runtime | Python source is retained and the preview explains that it is not executed. |
| Guided and Developer state | Changing the view keeps the same app and source. Source checks report the actual saved source; their result must not claim a model or runtime ran. |
| Phone layout and keyboard exit | Measure the viewport and overflow, check labeled controls and use Escape to leave the relevant dialog. This is a bounded usability check, not accessibility certification. |

Use the actual file chooser and inspect downloaded files if export is tested. Never count a toast or a download-event attempt as file-arrival proof. Keep unexpected browser errors separate from the deliberate CSP denial in the isolation fixture.

To prepare the local browser comparison after the automated run:

```powershell
node development-tools/evaluation-cases/browser-fixtures.mjs
node development-tools/evaluation-cases/serve-comparison.mjs '<absolute run directory printed by npm run eval>'
```

The server exposes A at `http://127.0.0.1:5184/`, B at `http://127.0.0.1:5185/`, and a harmless local probe receiver at `http://127.0.0.1:5186/health`. It accepts only run directories inside this repository's `generated-output/evaluations/`. Use the fixture files in `generated-output/evaluation-browser-fixtures/` and record their hashes before testing. Keep those files unchanged for both versions; regenerating ZIPs may change their timestamps and hashes. Stop the server with Ctrl+C afterward. Browser file-access permission must already be enabled for the selected extension; a blocked chooser is an unverified journey, not a passing import.

The [7 October comparison](../verification-records/2026-10-07-app-evaluation-and-ab.md) records the first run, the browser observations and their limits.

That first run measured a behavior-preserving refactor. Later import/save fixes intentionally change behavior and emitted JavaScript; matching bundle hashes are no longer an acceptance requirement. Keep the original record unchanged and document the new fixes and affected browser journeys separately.

## Maintainability comparison

Compare authored versus generated public copies, folder purposes, working local document links and documented commands against the actual scripts. Preserve the original payment-status brief and literal historical evidence. Do not turn fewer files, fewer words or a reviewer preference into proof that people complete tasks faster.

## What the report must say

Keep source manifests, commands, test JSON, build results, fixture hashes and browser observations in the run's ignored `generated-output/` directory. Save the concise result in `verification-records/`.

Report the observed differences and existing limits separately. Do not claim a statistical winner, production load capacity, full security coverage, real model quality or a newly verified hosted multiplayer journey from this experiment. The report is useful even when A and B tie, or when a quality check finds a problem.
