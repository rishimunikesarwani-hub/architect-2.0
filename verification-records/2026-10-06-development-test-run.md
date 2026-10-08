# Development test run

> Historical record: results and limits belong to the dated checkpoints below. Literal commands and paths are preserved as recorded; navigable links use the renamed folders. See the [historical path key](historical-path-key.md). This prose update does not repeat the checks.

Date: 2026-10-06. Tested the local cleanup worktree based on `78e1cd7`, including its uncommitted source changes. The goal was to run tests on this development version, not publish it or implement the proposed production runtime.

## Completion audit

| Requirement | Evidence from this run | Result |
|---|---|---|
| Run the development validation pipeline | `npm run check` exited 0; output captured in `runs/2026-10-06-development-check.log` | Pass |
| Automated behavior regressions | 88 tests across 8 files passed: authentication, ownership/departments, save ordering/conflicts, cloud-state reconciliation, imports and preview script behavior | Pass |
| Frontend/backend type safety and unused symbols | Both TypeScript configurations passed with unused-local/parameter checks enabled | Pass |
| Folder hygiene and build | Folder/Git guard passed; Vite production build completed | Pass |
| Verify the changed UI surfaces | Earlier checks on this same code recorded usage expansion, workspace preview, login dialog and measured 391 by 844 login layout without horizontal overflow; code was unchanged before this follow-up | Pass within that recorded scope |
| Resolve download verification after shared-helper extraction | Edge downloaded a source JSON bundle; all three file contents matched the editor exactly | Pass |

## Export verification

In an independent Edge tab at `http://127.0.0.1:5182`, opened the guest Research copilot, selected Export source, and inspected the actual resulting file in the registered Downloads directory. No credentials were entered or cloud projects modified.

- File: `research-copilot-source.json`, 4,009 bytes.
- Export timestamp: `2026-10-06T13:41:10.002Z`.
- SHA-256: `6fe3d3617648606fa2d21b5fe94d2610c2fc85f27d563295740b9d4749c88d06`.
- Parsed title/framework: Research copilot / LangGraph.
- Exact file-to-editor matches: `index.html` (2,947 characters), `agents/main.py` (360), `README.md` (312).
- Sampled browser errors: none.
- Screenshot: `runs/2026-10-06-development-export-verified.jpg`.

The download-event watcher timed out after 10 seconds even though the file arrived. The file metadata, parsed contents and exact editor comparisons confirmed the download. This resolved the earlier missing-arrival result; it did not prove Chrome's watcher worked.

## Scope and handoff

The requested development test run was complete at this checkpoint. No app source changed during this follow-up; source hashes are in `runs/2026-10-06-development-test-report.json`. The earlier cold-start test timeout and cleanup rationale remain in the [cleanup record](2026-10-06-cleanup-verification.md).

No live backend smoke, schema update, commit, push or deployment was run. Real hosted shared-account acceptance was previously recorded and was not repeated here. Model execution, external integrations and generated-app deployment remain labeled simulations. These local results are not production load, runtime isolation or model-quality certification.
