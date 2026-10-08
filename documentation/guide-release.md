# Publishing Architect 2.0

The user approved publication on 6 October 2026. The [app](https://architect-2-weld.vercel.app) and [public repository](https://github.com/rishimunikesarwani-hub/architect-2) are live. Hosted two-browser department access and the two-file ZIP import journey have passed their recorded checks.

Publishing the prototype and submitting the hiring form are separate actions. No hiring submission has been authorized or performed.

## Published targets

| Target | Recorded value |
|---|---|
| Canonical app | `https://architect-2-weld.vercel.app` |
| Public repository / branch | `rishimunikesarwani-hub/architect-2` / `main` |
| Vercel scope / project | `rishi-personal` / `architect-2` |
| Backend | `dev:perceptive-ermine-27`; no Convex production deployment |
| Auth origin | `SITE_URL=https://architect-2-weld.vercel.app` |
| Readiness | `password: true, google: false` |

The initial release used commit `4883145cd6dd2841c69940e7dfe022bf90693fd7` and Vercel deployment `dpl_FcAHKcGmCmS1ukK6cnQsSFjpQwnc`, which reached READY at [its deployment URL](https://architect-2-jo8szc60f-rishi-personal.vercel.app). Later source and documentation updates are recorded separately; that first commit is not a claim about today's local HEAD.

The [public release record](../verification-records/2026-10-06-public-release.md) contains the initial HTTP/assets, artifact-hash, repository and hosted-form checks. The [earlier preflight](../verification-records/2026-10-05-release-preflight.md) describes the state before publication approval. Its uncreated-resource statements are historical.

The [7 October readiness record](../verification-records/2026-10-07-submission-readiness.md) records the published folder refactor and import/save fixes: source commit `9b95366`, Ready deployment `dpl_2Do9RGbq8QrvLDXrWqKuzWm2ExGB`, passing local/hosted checks and the remaining prototype boundaries. Later evidence-only commits do not change that deployed application code.

## What the release contains

The repository includes application source, both engineering drawings and their Markdown explanations. The current prototype drawing describes implemented behavior. The production drawing proposes execution services and scaling; publishing the drawing does not deploy those services.

`vercel.json` runs the Vite build and publishes `generated-output/website/`. The build generates public document copies in `generated-output/public-assets/` before bundling. Maintain documents in `documentation/`; do not restore tracked copies in the served-assets folder.

`.vercelignore` excludes local environment files, dependencies, generated output, tests, evidence records and sample fixtures from the deployment upload. The build recreates the assets it needs. Those tests, evidence and safe fixtures remain in GitHub where tracked. `.gitignore` keeps local credentials and generated files out of Git.

The earlier bounded credential scan found only the placeholder `.env.example` and no detected real credentials or private imports. That is evidence for the inspected release, not a permanent guarantee for later changes.

## Before a later release

1. Run `npm run check` and repeat the browser journeys affected by the change. If a drawing changed, run `npm run diagrams` and inspect the result.
2. Review the candidate diff and tracked paths. Check that private imports, local environment values and generated screenshots are excluded, and that source diagrams and explanations remain in the repository.
3. Prepare the exact commit, destination and scope for review. Production deployment and schema changes need authorization for that action and target; use existing session authorization when it already covers them.
4. After publishing, verify the canonical page, assets and architecture downloads. If authentication configuration changed, verify the trusted origin and the relevant session journey.
5. Record the observed result in `verification-records/`. Keep the hiring submission separate.

Only `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` belong in the frontend environment. `BETTER_AUTH_SECRET` stays on Convex. The backend trusts the canonical hosted origin; localhost and arbitrary Vercel aliases are not sign-in targets. Do not copy credentials from another application. Google remains deferred.

The guest demo remains useful, but it cannot establish real shared department data. Generation, framework/model execution, tool connections, GitHub operations and generated-app deployment remain labeled simulations after Architect itself is published.

## Evidence already in place

| Record | What passed |
|---|---|
| [15 live backend checks](../verification-records/2026-10-05-department-backend-smoke.json) | Normal authentication, same-app permissions, stale saves, revocation and session invalidation |
| [Hosted department acceptance](../verification-records/2026-10-06-hosted-department-acceptance.md) | Owner/member sessions in Chrome/Edge, reactive saves, exact-source reload, draft preservation/recovery, Viewer restrictions, revoke/restore and sign-out/sign-in |
| [Supplemental verification](../verification-records/2026-10-06-supplemental-ui-verification.md) | Actual JSON source and conflict-draft HTML downloads, saved agents with illustrative usage, design/MCP simulations and measured mobile checks |
| [Hosted import acceptance](../verification-records/2026-10-06-hosted-import-acceptance.md) | Real chooser, exact two-file source, preview button, heading edit, save and reload in a new private Custom app |
| [Requirement audit](../verification-records/2026-10-05-requirement-audit.md) | Requirement coverage and remaining evidence limits |

Hosted account creation was user-performed and not independently observed. The department checks used a synthetic QA app and left the owner's CRM untouched. The verified downloads were a 5,415-byte source JSON and a 3,270-byte conflict-draft HTML file; Export source produces JSON, not ZIP.

Earlier chooser attempts failed because Chrome file access was disabled. After the user enabled it, `sample-projects/import-demo.zip` imported into **QA imported operations - 2026-10-06**. Its exact `index.html` and `README.md` were preserved. The saved heading, **Imported operations workspace — saved edit**, and working preview button survived reload. That proves this two-file Custom/HTML journey, not every archive or framework.

Report the live links with these limits. Do not turn an unobserved optional branch into a claim of success—or into an extra hiring requirement.
