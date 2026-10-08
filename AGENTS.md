# Working on Architect 2.0

Build against the user's assignment and later decisions. The user explicitly skipped blueprint on 5 October 2026. The assignment asks for a usable journey for beginners and developers: prompt building, source import, framework choice, GitHub, deployment and current Architect features. It permits simulated flows. Do not turn an agent-written checklist into an additional user requirement.

Google OAuth is deferred. Login ID/password accounts and shared saved projects are real. Department membership and Viewer/Editor grants must be enforced by the backend, not just by disabled buttons. Keep the fictional shared-agent library separate from these real project permissions.

## Keep the product honest

Label simulated generation, model calls, tests, connections and generated-app releases. Do not describe them as completed external actions. The production execution architecture is a proposal; the published frontend and approved development backend are running services.

Preserve the existing UX when refactoring. Check relevant desktop/mobile journeys and report what was actually observed. A click attempt, toast or download event is not proof that the final artifact arrived. Verify the destination or file when that matters.

## Put files where their names say

- `application/`: frontend, `interface-components/`, `shared-logic/`, `backend/` and authored browser assets.
- `documentation/`: working guides, reference material and architecture sources.
- `automated-tests/`: isolated automated checks.
- `verification-records/`: dated, sanitized acceptance evidence.
- `development-tools/`: build/test configuration and maintenance scripts.
- `sample-projects/`: safe fixtures.
- `generated-output/`: ignored builds, served asset copies, screenshots, reports and recoverable backups.

The user requested these descriptive names. They replace the earlier short folder convention for this project. Keep required root configuration, ignore files and the lockfile alongside README, AGENTS, LOG and the package manifest.

Edit architecture sources in `documentation/`. Run `npm run diagrams` to render and sync them. Dev/build generate the served copies under `generated-output/public-assets/`; do not bring back tracked duplicates.

## Protect data and permissions

Keep secrets out of client bundles, project source, logs, chat and commits. Preview code must remain isolated from the host app and credentials. Enforce owner/admin and department permissions on every project operation. Preserve revision checks and private draft recovery.

Prepare and test changes before applying them. Schema changes and production deployment need explicit authorization for the target; authorization already given in the session remains valid. `npm run backend` can sync to the live development database, so it is not a harmless local test. Do not submit the hiring form or take unrelated third-party actions without authorization.

Preserve user files and useful evidence. The original `documentation/ref-payment-status-workflow-brief.md` must remain unchanged. The pre-refactor backup contains 99 verified files at `generated-output/refactor-backups/2026-10-07-before-folder-cleanup/`. Do not delete or rewrite that backup.

## Write and verify clearly

For this refactor, the user explicitly requested Rishi Voice: natural English, 60% rawness. Explain the decision like a peer who has read the code. Use concrete examples when they help; do not invent personal stories, slogans or claims.

Use `npm run check` for the local pipeline and the [testing guide](documentation/guide-testing.md) for relevant browser checks. Keep historical results dated. Never reuse an earlier passing result as proof for changed code or paths.
