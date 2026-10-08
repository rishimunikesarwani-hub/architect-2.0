# Accounts, projects and department access

This folder holds the real server-side parts of Architect 2.0. An Editor can save a shared app. Changing a browser button or the project's JSON cannot turn a Viewer into an Editor, because the backend checks permission on every operation.

| File | Responsibility |
|---|---|
| `auth.ts`, `auth.config.ts`, `http.ts` | Better Auth login ID/password setup and HTTP routes |
| `access.ts` | Shared authorization rules |
| `teams.ts` | Workspaces, departments, memberships and app grants |
| `projects.ts` | Authorized reads, saves, revision conflicts and recoverable archiving |
| `catalog.ts` | Lightweight project cards and bounded legacy backfill |
| `schema.ts`, `convex.config.ts` | Data definitions and component registration |
| `_generated/` | Generated API/types required by Convex; do not edit manually |

The approved development backend supports real shared saved changes. Google remains deferred. Model execution, generated-app deployment and the fictional shared-agent registry are not implemented by these functions.

Run local checks from the repository root:

```powershell
npm run typecheck:backend
npm test
```

These checks do not deploy or modify the live database. Backend tests use in-memory Convex fixtures. In contrast, `npm run backend` can sync changes to the configured development deployment.

Read the [backend setup guide](../../documentation/guide-backend-setup.md) for environment names, permissions and save behavior, and the [testing guide](../../documentation/guide-testing.md) for the optional live smoke test. Schema changes and production deployment need authorization. Keep credentials out of source, logs and commits.
