# Hosted department acceptance

> Historical record: results and limits belong to the dated checkpoints below. Literal commands and paths are preserved as recorded; navigable links use the renamed folders. See the [historical path key](historical-path-key.md). This prose update does not repeat the checks.

Date: 2026-10-06. **The recorded two-browser acceptance matrix passed** at https://architect-2-weld.vercel.app, using the existing `dev:perceptive-ermine-27` backend. This record captures the main agent's browser observations; the documentation agent did not repeat the journey. It complements the earlier [15/15 live backend checks](2026-10-05-department-backend-smoke.json).

## Scope and test data

- Chrome held the owner session; Edge held an independent test-member session. Public evidence uses roles rather than account names or personal email addresses.
- The user's existing CRM project was preserved. The main agent created a separate synthetic app, ID `j57cm1majys6w7k56yyhajvp7x8fsj35`, in workspace **QA hosted acceptance 2026-10-06**.
- Grants were **QA Finance: Viewer** and **QA Support: Editor**. The test member was initially added only to QA Support.
- The user created the test-member account independently in Edge. Successful account creation was user-performed, not an independently observed signup journey. No password value was read or recorded.

## Observed acceptance matrix

| Journey | Browser evidence | Result |
|---|---|---|
| Owner session restoration | A fresh Chrome tab restored the owner session. A later owner reload restored session and the latest saved source. | Pass |
| Department setup | The owner assigned the synthetic app's Viewer/Editor grants and added the supplied test-member account to QA Support through the UI. | Pass |
| Recipient navigation and identity | Edge opened the synthetic app from Shared with me. Its original source exactly matched the owner copy; Manage access was disabled. | Pass |
| Editor save propagation | The test member saved edit 1 in Edge. Chrome's editor updated without a page reload. | Pass |
| Saved-source persistence | Edge reloaded and reopened the app; exact source comparison matched saved edit 1. | Pass |
| Concurrent draft protection | The owner held an unsaved heading draft while Edge saved edit 2. The owner draft remained intact, Save became disabled, and conflict comparison/recovery controls appeared. | Pass |
| Explicit conflict recovery | Choosing **Discard draft and show latest** restored source exactly equal to Support edit 2. The unsaved owner draft did not overwrite the newer saved source. | Pass |
| Reactive Viewer downgrade | Moving the test member to QA Finance changed the open Edge workspace to Viewer without reload. Source input, GitHub, Deploy and Manage access controls became disabled. | Pass |
| Grant revocation | Removing the Finance grant removed the app from the Edge session without reload; My projects showed 0. | Pass |
| Access restoration | The owner restored the Finance Viewer grant and moved the member back to QA Support Editor. Both browsers reopened the latest Support edit 2. | Pass |
| Sign-out persistence | Edge Sign out returned to guest state with no shared app; reloading remained signed out. | Pass |
| Normal sign-in | Edge signed in with the known login ID and the existing browser-filled password. The test-member identity returned; reopening the QA app showed QA Support / Editor and the latest heading, `Hosted department QA: Support edit two`. The secret was not read. | Pass |
| Authenticated mobile editor | At measured `innerWidth: 390`, `innerHeight: 844`, document and body scroll widths were both 390. Offscreen sidebar buttons were intentionally translated left; the page had no horizontal overflow. The viewport was restored afterward. | Pass |

These observations show saved changes arriving in independent browser sessions and the named permission/conflict journeys working. They do not establish character-by-character collaborative editing, every error branch, or production runtime execution.

The main agent sampled both browsers' error logs before and after authentication and reported no errors. This is a bounded sample, not continuous monitoring.

## Screenshots and retained state

The main agent saved these local screenshots:

- `runs/2026-10-06-hosted-grants.jpg`
- `runs/2026-10-06-hosted-viewer.jpg`
- `runs/2026-10-06-hosted-shared-editor.jpg`
- `runs/2026-10-06-hosted-editor-mobile.jpg`

`runs/` is ignored generated evidence, not part of the public repository. Final QA state retained the synthetic app/workspace, restored Finance Viewer and Support Editor grants, the test member in Support, and the latest saved Support source. No user project was deleted or replaced.

## Unverified or separate checks

- **Initial conflict-draft download attempt (historical):** the Chrome Download my draft event timed out. A bounded Downloads lookup found no matching file, and download-page inspection was blocked by URL policy. That attempt was inconclusive, not evidence of an application failure. A later [independent hosted Edge retest](2026-10-06-supplemental-ui-verification.md#verified-conflict-draft-download-retest) at `c553bf9` found the new 3,270-byte `index.html` and verified its SHA-256 exactly against the unsaved DOM draft fingerprint. It then recovered the competing saved version and restored the original baseline. The later retest establishes this download's arrival without rewriting the initial result.
- **Signup:** user-performed account creation was not independently observed. The later normal sign-in, sign-out and session-restoration results above were observed.
- **Initial source-import attempt (historical):** the safe ZIP retry on local port 5180 was blocked by Chrome's file-URL permission. The user subsequently enabled file access, and the [hosted import acceptance](2026-10-06-hosted-import-acceptance.md) at `f4037db` passed actual chooser selection, exact two-file import, preview interaction, editing and save/reload. The earlier blocked attempt remains historical; that blocker was resolved.
- The previously verified Markdown brief download does not establish other download formats. The measured mobile Editor check does not cover every department-management dialog or unreported UI branch.
- Google is deferred. Generated-app build/tool/GitHub/deployment flows remain simulations, and the production execution architecture remains a proposal. No hiring submission was performed.
