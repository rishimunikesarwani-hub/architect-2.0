# Login IDs, departments and saved projects

The user deferred Google and chose login ID/password accounts with one shared app across departments. That account and permission system is real. The approved update reached the dedicated development backend on **5 October 2026 at 22:44 IST** and passed [15 live API checks](../verification-records/2026-10-05-department-backend-smoke.json). The next day's [Chrome/Edge acceptance](../verification-records/2026-10-06-hosted-department-acceptance.md) verified the actual shared-project journey in two browsers.

Think of a department grant as access to one shared document. Support can edit it while Finance can view it. They open the same project ID; they do not receive separate copies.

## The configured target

| Setting | Value |
|---|---|
| Project | `architect-2` |
| Development selector | `dev:perceptive-ermine-27` |
| Convex API / `VITE_CONVEX_URL` | `https://perceptive-ermine-27.convex.cloud` |
| Auth HTTP / `VITE_CONVEX_SITE_URL` | `https://perceptive-ermine-27.convex.site` |
| Trusted app origin / server `SITE_URL` | `https://architect-2-weld.vercel.app` |
| Dashboard | [Open the development deployment](https://dashboard.convex.dev/t/rishi-muni-kesarwani/architect-2/perceptive-ermine-27) |

Only the two public `VITE_*` URLs belong in the frontend configuration. The existing `BETTER_AUTH_SECRET` stays on Convex. Never put a secret in a `VITE_*` variable, project file, source export, chat, log or Git.

The backend currently trusts one origin: the canonical hosted app. Local development at `http://127.0.0.1:5177`, localhost and other Vercel aliases are not automatically trusted for sign-in. Do not change `SITE_URL` just to run local tests. Root `.env.local` is ignored; Vite reads environment settings from the repository root.

Password sign-in needs no Google client credentials, Google project or payment setup. Readiness reports `password: true, google: false`.

## Create accounts, then assign access

1. Open the [hosted app](https://architect-2-weld.vercel.app), choose **Sign in**, then **Create account**. Each person enters their own login ID, password, name and email. Login IDs use 3–40 letters, numbers, dots or underscores and are normalized to lowercase. Passwords use 12–128 characters. Existing Google accounts are not silently linked.
2. The owner opens **Settings → Manage departments**, creates a workspace, then creates departments such as Support and Finance.
3. Teammates create their accounts. The owner assigns each exact existing login ID to one department in that workspace. There is no invitation email, and people cannot give themselves a privileged department.
4. The owner opens an owned app, chooses **Manage access**, attaches it to the workspace and grants Viewer or Editor access to departments.
5. A teammate signs in through a separate browser or device and opens **My projects → Shared with me**. Every authorized department sees the same saved app.
6. A Viewer can inspect and export. An Editor can save. Only the owner/admin can change grants. Removing a membership or grant removes access through the server's next checks and reactive subscriptions.

Email ownership verification, password-reset delivery, MFA, invitation delivery and production account administration are not configured. Use synthetic data for acceptance checks. Nobody needs to paste a password into chat.

## What happens when two people save?

Each save carries `expectedRevision`: the version the editor started from. The backend checks it atomically. If another save has already changed that version, it rejects the stale write with `REVISION_CONFLICT`.

The client stops later queued writes for that app and keeps the local draft. It offers recovery, including a private copy, instead of quietly writing over the other person's change. A retry keeps the original revision; it does not adopt a newer revision and overwrite it. Manual source edits also remember their starting file content.

Pending drafts stay in memory under the account that created them while the tab remains open. They never become guest `localStorage` data. Closing or reloading can lose an unsaved draft, so use the leave warning and export/recovery controls. This is conflict-safe saving. It does not provide live cursors, comments or character-by-character co-editing.

## Server contract

| Function | Contract |
|---|---|
| `auth:readiness` | Returns password/Google capability booleans, never secrets |
| `getCurrentUser` | Returns the current user's id, loginId, name, email and image |
| `projects:list` | Returns up to 100 authorized metadata cards without full source state |
| `projects:watch` | Reactively reads one authorized full app; returns null when unavailable |
| `projects:get` | Reads one full app with strict authorization errors |
| `projects:create` | Derives ownerId from the validated session; an optional workspaceId requires admin access |
| `projects:update` | Requires expectedRevision; returns id/revision; rejects stale saves and Viewer writes |
| `projects:archive` | Keeps the document but removes department grants; owner/admin only |
| `teams:listWorkspaces`, `teams:details` | Return authorized workspace information; details is admin-only |
| Department, membership, attachment and grant operations | Validate the actor and workspace boundaries |

Permissions live outside editable `stateJson`. The server accepts up to 600 KB of UTF-8 state, without credentials. Catalog metadata changes in the same transaction as the project.

Prototype limits are 20 owned workspaces, 20 memberships per account, 100 departments/members/shared apps per workspace and 1,000 grants per workspace. These bounds are not evidence of production scale.

The relevant code is in [application/backend](../application/backend/README.md). Better Auth 1.6.33 and the Convex Better Auth component 0.12.5 are pinned. The declaration-only bridge in `application/shared-logic/backend-provider.tsx` handles a provider type mismatch; runtime authentication still uses the official provider.

## Applied development update

The additive update introduced `workspaces`, `departments`, `workspaceMembers`, `projectGrants` and `projectCatalog`, plus optional workspaceId/revision/catalogued fields and project indexes. Existing project documents and owners were preserved. Old projects remain private until the owner attaches them to a workspace.

The approved command was `convex dev --once --typecheck enable`. The internal `catalog:backfillLegacy` operation then returned `done: true, migrated: 0`: no legacy records needed migration. Backfill adds metadata cards without changing source, ownership or access. It is not scheduled automatically and handles at most five projects per call.

No `convex deploy` was run and no Convex production deployment was created. The separately approved public frontend uses this development backend. See the [public release record](../verification-records/2026-10-06-public-release.md).

For local review, use:

```powershell
npm run typecheck:backend
npm test
npm run build
```

These commands do not sync schema or functions to Convex. `npm run backend` does, so run it only for an intended, authorized backend update. The optional live smoke procedure is in the [testing guide](guide-testing.md).

## Evidence and its limits

The [15-check live report](../verification-records/2026-10-05-department-backend-smoke.json) used four synthetic accounts through normal Better Auth signup/sign-in and independent Convex clients. It checked same-app reads, Editor propagation, Viewer write/grant denial, outsider and anonymous isolation, stale revisions, revocation, wrong passwords and logout invalidating the prior JWT. QA accounts and data were retained; no user data was deleted.

The [hosted acceptance](../verification-records/2026-10-06-hosted-department-acceptance.md) adds browser evidence for saved changes, reloads, conflicts, permission changes and sessions. Hosted account creation was user-performed and was not independently observed. The owner's CRM stayed untouched.

Earlier local readiness checks showed enabled password forms and no sampled app errors. Their screenshot attempts timed out. Those checks established entry readiness, not an authenticated round trip; the later hosted record provides that evidence.

The [hosted two-file ZIP import](../verification-records/2026-10-06-hosted-import-acceptance.md) passed after the user enabled Chrome's file permission. Actual JSON source and conflict-draft HTML files were separately checked by hash and content in the [supplemental record](../verification-records/2026-10-06-supplemental-ui-verification.md). Neither result proves every archive, framework or download branch.

## Google remains optional

Earlier owner-only development checks used a localhost origin and reported Google unavailable. That is historical setup evidence, not the current configuration or a remaining blocker.

If Google is enabled later, register this callback:

```text
https://perceptive-ermine-27.convex.site/api/auth/callback/google
```

Its credentials are server-only `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. A future Google flow needs its own provider round-trip, session, cancellation and sign-out checks. It is not a prerequisite for the current password and department flow.
