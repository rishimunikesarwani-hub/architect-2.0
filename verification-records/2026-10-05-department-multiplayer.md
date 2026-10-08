# Department multiplayer verification

> Historical record: results and limits belong to the dated checkpoints below. Literal commands and paths are preserved as recorded; navigable links use the renamed folders. See the [historical path key](historical-path-key.md). This prose update does not repeat the checks.

> Subsequent hosted UI evidence (2026-10-06): independent Chrome/Edge sessions passed the shared-app, persistence, permissions, conflict-recovery, revocation and logout/sign-in checks. See [hosted department acceptance](2026-10-06-hosted-department-acceptance.md). The pending-browser statements below record the earlier October 5 activation checkpoint, not a new statement about browser status.

Date: 2026-10-05. Scope: real login ID/password accounts and the same app shared through department permissions. The user explicitly deferred Google and kept the decision to skip the blueprint.

## Local implementation checks

- Full automated suite: 88 tests passed across eight files. Covers actual Better Auth signup and password endpoints in an in-memory Convex component, wrong-password rejection, hashed credentials, session expiry, owner/department boundaries, viewer write denial, Editor saves, revocation, revision conflicts, catalog/backfill compatibility and archived-grant cleanup.
- Save queue tests cover revision chaining, independent projects, stale clean drafts, remote updates during pending saves, blocked writes, explicit retry, held draft restoration and account-reset isolation.
- Shared-state parser tests reject malformed and partial state before rendering, preserving the original JSON for download. Card reconciliation tests preserve full source at matching revisions, invalidate stale clean source, apply permission changes and remove revoked apps.
- Frontend production build and independent backend TypeScript checks passed. No dependency or credential changes were required.
- Architecture Markdown/SVG/PNG distinguish the deployed department backend from proposed agent-runtime/registry capabilities.

## Browser checks before activation

- At http://localhost:5177, desktop login-ID and registration dialogs render with exact account fields. Users cannot self-select a privileged department. Submit remains disabled with the accurate backend-update notice.
- Measured mobile viewport: innerWidth390, innerHeight844. Registration dialog bounds x12, right348.62, top12, bottom832.31; document scrollWidth360. Form remains in a scrollable dialog and does not overflow horizontally. Viewport override was reset after checks.
- Opened the existing Payment status workflow - review demo. Typed a temporary source comment, tried Home, observed the save/discard navigation guard, then discarded the draft and verified source exactly matched its pre-test value. No source change was saved by this check.
- Final sampled application error log was empty. Existing browser-local project data remained available.

## Approved development activation

The user explicitly approved **Apply the development update**. Verified the local deployment selector was `dev:perceptive-ermine-27`, then ran `npx convex dev --once --typecheck enable --tail-logs disable`. Convex reported functions ready at 22:44 IST on 2026-10-05. The deployed additive schema includes workspaces, departments, workspaceMembers, projectGrants and projectCatalog, plus optional project workspaceId/revision/catalogued fields and indexes.

`npx convex run catalog:backfillLegacy` returned `{"done":true,"migrated":0}`. No legacy project needed migration. `auth:readiness` returned `{"google":false,"password":true}`. No production deployment, public repository, public frontend or hiring submission was performed.

After deployment-generated types and architecture updates, `npm run build` and `npx tsc --project src/convex/tsconfig.json --noEmit` passed again. Application behavior had not changed since the 88-test source suite above; that suite was not repeated for evidence/diagram changes.

## Live backend acceptance: 15 checks passed

Executed [the live smoke script](../development-tools/smoke-department-backend.mjs) with `--run` against the fixed development endpoints. It used normal Better Auth signup, username signin, session and Convex-token routes, followed by authenticated public project/team APIs. No authentication bypass or deployed test endpoint was added. Four synthetic accounts used independent Convex clients; passwords, session tokens and JWTs remained in process memory and were not logged or saved.

The sanitized report is [saved with the verification evidence](2026-10-05-department-backend-smoke.json). Run ID: `muvikqtl_f47cfc`; shared project: `j57ak7j7cq10bs0cz0yqz5ngy58fqfts`; workspace: `js75zfyqpcv21km3hzrrq955cx8fpe9c`.

Verified all 15 reported checks:

- Anonymous identity and password readiness.
- Four real account signups and login-ID/password signins, including login-ID normalization.
- Workspace, Engineering/Finance departments, account membership and one shared app with Editor/Viewer grants.
- Both department clients read the same project ID and source; listing omits full source.
- Viewer writes and permission changes are rejected by the server.
- Editor saves are visible to independent owner and viewer clients.
- A stale revision is rejected without overwriting newer source.
- Unassigned and anonymous clients cannot read the app.
- Revoking the editor grant removes that existing client's reads, list entry and write access.
- Incorrect password is rejected.
- Logout invalidates the owner session and project access even with its previous JWT.
- All remaining synthetic signup/signin sessions are signed out.

The four clearly labeled synthetic accounts, workspace and app are retained. No app data was deleted. This proves deployed authentication and API behavior across independent sessions; it does not establish a completed browser journey.

## Browser checks after activation and remaining acceptance

At `http://localhost:5177`, Settings displayed **Login ID & password / Ready to sign in**. The sign-in and account-creation dialogs rendered without the earlier backend-update notice; empty-form submission stayed disabled as expected. The sampled error log was empty. The account-creation screen was left open for the user to choose and submit their own password, as required by browser-control credential rules.

These post-activation checks used the rendered DOM. Both viewport and cropped screenshot requests timed out in the browser screenshot service, so no new screenshot artifact is claimed.

At this checkpoint, authenticated browser acceptance still needed two independent browser sessions opening the same app, observing an editor save, preserving a conflicting draft, retaining data after reload/sign-out/in and reflecting revoked access. Department-management screens had passed compile/static review but had not yet completed an authenticated browser flow. Email verification, password-reset delivery, MFA and true simultaneous text co-editing remain outside this implementation.
