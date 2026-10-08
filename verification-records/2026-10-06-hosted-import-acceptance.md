# Hosted ZIP import acceptance

> Historical record: results and limits belong to the dated checkpoints below. Literal commands and paths are preserved as recorded; navigable links use the renamed folders. See the [historical path key](historical-path-key.md). This prose update does not repeat the checks.

Date: 2026-10-06. **Passed on the deployed `f4037db` app** at https://architect-2-weld.vercel.app after the user enabled Chrome's extension file-access permission. The main agent performed the browser journey. The documentation agent independently checked the local fixture/archive-entry hashes below, without repeating UI actions.

This later pass resolved the earlier permission-blocked chooser attempts. Those attempts remain in the record; no browser permission was bypassed.

## Fixture integrity

The actual chooser selected `data/import-demo.zip`, a safe tracked fixture containing exactly two source files:

| File | Bytes | SHA-256 |
|---|---:|---|
| `data/import-demo.zip` | 685 | `266dc1ec2d14482bd7cb148ff76b469ed0e9f21dc0c6f8c0e5dbffe45b41e6e4` |
| Archive entry `index.html` | 645 | `06901f75ded4e36b4baef9eda8c5bf094d681177c537e1cae3d41c328f9b46c5` |
| Archive entry `README.md` | 60 | `163a90f285fde60e9a59f6daf0f2bb3e9756586e63b7c5ee129d8ec0aeb5fc64` |

## Observed journey

| Step | Evidence | Result |
|---|---|---|
| Choose and parse ZIP | The real chooser accepted the archive; the UI listed exactly `index.html` and `README.md`. | Pass |
| Continue in the builder | Created a new private project in Personal workspace, **QA imported operations - 2026-10-06**, with Custom framework configuration. | Pass |
| Preserve imported files | Both editor DOM strings matched their archive entries exactly. | Pass |
| Run the HTML preview | Clicking the preview button displayed **Local interaction works.** | Pass |
| Edit and save | Changed the heading to **Imported operations workspace — saved edit** and saved. | Pass |
| Reload and reopen | Reloaded the hosted page and reopened the same named project. Edited source matched exactly, with README retained. | Pass |
| Verify continued behavior | The saved heading remained visible and the preview button still produced **Local interaction works.** | Pass |

The saved/reloaded edited HTML had SHA-256 `15fa743acdf63f75208540d410cd1cefcca621592d28423abd553b48909dff53`. Sampled browser error logs were empty. The imported project was left open.

## Visual evidence

- **Primary:** `runs/2026-10-06-hosted-import-expanded.jpg`, captured and visually checked. The project name, full saved-edit heading and Local interaction works status appear together.
- **Secondary:** `runs/2026-10-06-hosted-import-verified.jpg`; its heading is clipped, so it is weaker standalone visual evidence.

These screenshots are ignored local run artifacts, not public repository files.

## Scope of the pass

This check verified a real ZIP file-picker-to-project journey: both imported files stayed exact, the plain-HTML interaction worked, and edits persisted on the hosted app after reload. It does not establish arbitrary framework execution, every archive shape, large imports, every invalid-input branch or a real GitHub repository fetch.

The earlier parser tests remain separate automated evidence. No new app code, test run, commit or deployment was needed for this acceptance documentation. Source export uses JSON; ZIP import support does not imply a ZIP export feature.
