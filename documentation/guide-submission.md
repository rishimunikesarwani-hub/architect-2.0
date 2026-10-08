# Reviewing Architect 2.0

Start with the [live prototype](https://architect-2-weld.vercel.app) and [public source repository](https://github.com/rishimunikesarwani-hub/architect-2). You can explore the guest workspace without an account. The public links show the published release; they do not imply that every change in a local checkout has been published. The [release guide](guide-release.md) records that distinction.

The prototype covers the app-building journey. The production architecture explains how real execution would work. Keep those two scopes separate when reviewing it.

## Architecture attachments

| Artifact | Open it |
|---|---|
| Proposed production services and connections | [PNG](arch-production-architecture.png) · [SVG](arch-production-architecture.svg) |
| Production decisions, service rationale and sequences | [Markdown](arch-production-architecture.md) |
| Current prototype implementation | [PNG](arch-engineering-drawing.png) · [SVG](arch-engineering-drawing.svg) · [Markdown](arch-engineering-drawing.md) |

The production document covers sandbox choice; the planning/code/tool/error-recovery harness; model switching; frontend/backend/preview communication; proxies; GitHub; deployment of generated apps and the platform; and capacity for thousands of builders/runtime users. Its infrastructure and capacity figures are proposals, not deployed services or measured throughput.

## A three-minute guest walkthrough

Use a signed-out browser or a fresh browser profile so the review stays separate from real project data.

1. **Start with a plan.** Enter “Track supplier invoices and require human approval before sending reminders.” Choose Plan mode and create the project. Open **Review plan**, change a step, approve it, then choose **Simulate build**. Approval and building are separate actions.
2. **Inspect the result.** Use the preview, switch to **Developer** and open the source. Edit a heading, save it and return to Preview. Guided and Developer views use the same project. The preview executes plain HTML; it does not run Python or a server framework.
3. **Inspect the agent.** Open **Agents** and review a role, instructions and tool configuration. The framework selector exposes the chosen setup, while execution remains simulated. The fictional Agent library's approval/reuse flow is separate from real department permissions.
4. **Review the release journey.** Open GitHub and Deploy, inspect the review/progress/result states and their simulation labels. These steps do not push a repository or publish the generated app. Architect itself is already hosted at the live link above.

For a separate source-import check, use **Import a project → Upload files** with [the small ZIP fixture](../sample-projects/import-demo.zip). Inspect its two files, use its preview button, edit/save, then reopen the project. Export source produces JSON. Verify the actual downloaded file rather than relying on a toast.

Imports have file-count, source-size and serialized-workspace limits. Source, JSON encoding and retained history all contribute to the saved payload. The included small fixture is a useful review case; do not assume that every archive or framework can run because its files can be imported. Consult the current [testing guide](guide-testing.md) and error message for the relevant boundary.

## What is real?

| Real behavior | Demonstration or proposal |
|---|---|
| Login ID/password accounts, server-enforced project access, shared saved changes and stale-save rejection on the dedicated development backend | Google remains deferred; production account administration is not established |
| Local guest persistence, editable source, import/export, version history and isolated HTML preview | Model generation, framework/server execution, external tool/MCP connections and GitHub operations are simulated |
| Owner/admin-assigned departments and Viewer/Editor access to the same project | Agent-library personas and capability grants, external invitations, Studio execution and generated-app deployment are simulated |
| Configured agent names and real project/version counts | Usage credits are illustrative; production model billing and the proposed AWS/E2B runtime are not connected |

Guest work is not automatically uploaded on sign-in. Do not put credentials into prompts, project files or exported source.

## Review real department access separately

This needs **two user-controlled accounts in independent browser sessions** and a workspace owner/admin. Each person enters their own credentials; there are no shared demo passwords in the repository.

The owner creates a synthetic QA workspace and department, assigns the other account's exact existing login ID, attaches a QA app and grants Editor access. The member opens **Shared with me**. Save a small edit and check that the owner sees it in the same app. Then test Viewer access and grant revocation, restoring the intended QA access afterward. Use the [backend guide](guide-backend-setup.md) for setup and the [testing guide](guide-testing.md) for conflict/session checks.

Use the canonical live origin for this check: the current backend does not automatically trust localhost or arbitrary preview URLs. Keep existing customer projects untouched. Earlier [hosted department acceptance](../verification-records/2026-10-06-hosted-department-acceptance.md) is dated evidence, not a claim that this new review has already run.

## Check the code locally

**Node 24.18.0** is the verified version. The installed toolchain's compatible Node range is `^20.19.0 || >=22.12.0`; use the verified version to match the recorded environment.

From the repository root:

```powershell
npm ci
npm run check
npm run dev
```

`check` runs hygiene, both typechecks, automated tests and the website build. It does not deploy or write live backend data. `dev` opens the local app for guest/UI review. Do not run `npm run backend` merely to test the frontend; it can update the configured development service.

The optional `npm run eval` compares against the preserved **local-only** pre-refactor snapshot. That ignored baseline is absent from a fresh clone, so this command is not required for ordinary reviewer setup. See the [evaluation contract](eval-app-comparison.md) and [recorded comparison](../verification-records/2026-10-07-app-evaluation-and-ab.md) for its conditions and limits. Additional after-version tests are reported separately; existing baseline cases must retain their names and passing results.

The [feature coverage](ref-feature-coverage.md) and [requirement audit](../verification-records/2026-10-05-requirement-audit.md) connect the assignment to the implementation and evidence. This guide prepares a review; it does not submit the hiring form or supply personal application answers.
