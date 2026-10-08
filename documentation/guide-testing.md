# What to test, and when

After a code change, run `npm run check`, then repeat the browser journey that changed. A green test result tells us the checked rules hold. It cannot tell us that a person signed in successfully, used the file chooser or received a download.

## Start with the local checks

Open PowerShell in the repository root, using Node.js 24 (verified with 24.18.0). Installed build dependencies support `^20.19.0 || >=22.12.0`. For a fresh checkout or changed dependencies:

```powershell
npm ci
```

Then run one pipeline at a time:

```powershell
npm run check
```

This runs folder hygiene, frontend types, backend types, automated tests and the website build in order. It does not deploy, create live accounts or call a model. Public artifacts and build output are generated locally.

| Command | Use it for |
|---|---|
| `npm run hygiene` | Find unexpected layout, tracked output/environment files and broken local Markdown file links |
| `npm run typecheck:frontend` | Check React/frontend TypeScript rules |
| `npm run typecheck:backend` | Check Convex TypeScript rules without a deployment |
| `npm test` | Run the local Vitest suite, including isolated Convex/Better Auth fixtures |
| `npm test -- automated-tests/import-project.test.ts` | Run just the source-import checks |
| `npm run build` | Check frontend types, sync artifacts and build into `generated-output/website/` |
| `npm run dev` | Open the local demo/source UI at `http://127.0.0.1:5177`; stop with Ctrl+C |

The hygiene check validates file targets in local Markdown links. With a matching Git repository it also checks the index; in an extracted source ZIP it checks authored files and explicitly reports that tracking metadata is unavailable. It does not certify external URLs, heading fragments or the absence of every possible secret.

The tests cover password validation/rate limiting, ownership and department rules, stale-save rejection, queue ordering and account resets, metadata reconciliation, malformed cloud state, import limits, secret-file exclusion and sample-preview script behavior. Convex fixtures run in memory; these tests do not contact the live backend or run production agents.

For the controlled before/after comparison, run `npm run eval`. It requires the preserved local baseline, checks all baseline cases against both versions, reports any additional current-version cases, and produces separate builds for browser evaluation. It does not control a browser. The [evaluation contract](eval-app-comparison.md) explains the cases, acceptance rules and limits.

The [7 October comparison result](../verification-records/2026-10-07-app-evaluation-and-ab.md) records the historical 93 passing cases per version and paired browser observations, including actual source-export inspection. Its raw-payload large-import rejection remains a backend boundary test. Current client preparation trims old checkpoints to fit the full serialized payload; test that route separately with import, edit, save and reload. Also try an escape-heavy oversized payload: the dialog must retain the selection and show its error. A passing rejection check alone does not make an import journey successful.

Use the [canonical hosted app](https://architect-2-weld.vercel.app) for real sign-in. The backend trusts that origin. Localhost and other preview URLs are not automatically trusted. Do not change `SITE_URL` or run `npm run backend` to make a local test pass; that would be a separate live change.

## Browser checks that matter

Use a clearly named synthetic QA project and workspace. Keep real projects untouched. Each person enters their own credentials; reports should never contain passwords, cookies or tokens.

| Check | Action | What should happen |
|---|---|---|
| Authentication | Sign in at the canonical URL and reload. Sign out and reload again. Try a wrong password once. | The valid session survives reload. Sign-out stays signed out. The wrong password gives no private access. |
| Two-browser editing | Keep the owner in Chrome and an independent member in Edge. Give the member's QA department Editor access. Open Shared with me, save a heading change, then reload/reopen. | Both see the same app and source. The saved edit propagates and persists. The member cannot manage grants or see unrelated owner apps. |
| Save conflict | Hold an unsaved heading in one browser, then save a different heading in the other. | The first draft stays intact and stale Save is blocked. Download it and check the actual content, then explicitly show the latest source. Restore the QA baseline afterward. |
| Permission change | Move the member to a Viewer department, revoke that department's app grant, then restore the intended QA access. | Viewer editing/GitHub/deployment/access-management controls are disabled. Revocation removes the open app without reload. Restored access shows current source. Automated/API tests separately check server denial. |
| Import and export | Choose `sample-projects/import-demo.zip`. Check both files, click the preview button, edit/save a heading, reload/reopen, then export source. | Imported source and the saved edit match. Preview interaction works. The actual downloaded JSON contains the expected files; a toast or watcher timeout is inconclusive. |
| Responsive UI | Check desktop and a measured phone viewport around 390 by 844. Open the editor, department dialog and usage panel. Close dialogs with Escape. | Text and controls remain reachable, the page has no horizontal overflow, and there is a clear return path. Restore the viewport afterward. |
| Simulated flows | Prompt → edit plan → approve → explicitly simulate build. Change framework, review GitHub conflict choices and review deployment. Check the design/tool/usage panel affected by the change. | State and source persist, simulation labels remain visible and the UI never claims a real external action. |

The existing [department](../verification-records/2026-10-06-hosted-department-acceptance.md), [import](../verification-records/2026-10-06-hosted-import-acceptance.md) and [supplemental](../verification-records/2026-10-06-supplemental-ui-verification.md) records show the exact earlier journeys. Repeat affected checks; do not treat those dated results as proof for a later change.

## Optional live backend smoke

This script writes real data to the development service. It is **not part of `npm run check`**.

Run it only with explicit authorization for **`dev:perceptive-ermine-27`** and acknowledgment that it creates **four synthetic accounts plus retained QA workspace/app data**. The public app uses this backend, so it is not an empty disposable target.

Inspect `development-tools/smoke-department-backend.mjs` first. Its `SITE`, `CLOUD` and `ORIGIN` constants must still point to the intended deployment and canonical app. It has fixed targets and a `--run` opt-in; there is no deployment-selector flag.

Without the opt-in, it prints preparation guidance:

```powershell
node development-tools/smoke-department-backend.mjs
```

After the target and data creation have been authorized:

```powershell
node development-tools/smoke-department-backend.mjs --run
```

The script checks normal signup/sign-in, shared access, denied writes, conflicts, revocation and logout. Generated secrets stay in memory and the report is sanitized. QA records are retained and sessions are closed. Do not log credentials or quietly delete test data. The [backend guide](guide-backend-setup.md) and [previous live report](../verification-records/2026-10-05-department-backend-smoke.json) provide context.

## Keep the evidence useful

Record the commit, URL/environment, command or steps, result and relevant error or screenshot. Temporary logs and screenshots belong in ignored `generated-output/`; concise sanitized reports belong in `verification-records/`. Capture the first failure, fix it, then repeat the affected check. Avoid running competing pipelines while diagnosing a timeout.

The most useful future automation would cover import/edit/reload and the shared-app conflict/revocation journey in a real browser. Current preview tests use a small fake document to exercise sample scripts; they do not prove real iframe/CSP isolation. Add a focused browser boundary check when that boundary changes. These are useful improvements, not a reason to reopen every already accepted flow.

Model calls, tool/MCP execution, GitHub sync and generated-app deployment remain simulations. Google is deferred. Production load, sandbox isolation, model quality, billing and runtime recovery belong to the proposed architecture and need their own future evidence.
