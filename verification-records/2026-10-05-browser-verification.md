# Prototype verification - 2026-10-05

> Historical record: results and limits belong to the dated checkpoints below. Literal commands and paths are preserved as recorded; navigable links use the renamed folders. See the [historical path key](historical-path-key.md). This prose update does not repeat the checks.

Local app: http://localhost:5177. Chrome was used for visible interaction and layout checks. The results below describe the development prototype at that checkpoint.

The [extended feature verification](2026-10-05-parity-verification.md) records the final plan/framework, marketplace, project extras, sharing, release, knowledge, app-data/authentication, custom-tool and failed-check/retest journeys, including reload checks. It also records the disconnected demo build at `http://localhost:5180`. The main agent performed those browser checks; they do not imply a public deployment or real Google login.

## Automated checks

- `npm run build`: passed, including frontend TypeScript checking and production bundle generation.
- `npm test`: 19 tests passed across backend project ownership/persistence (7), import limits and filtering (10), and sample preview behavior (2).
- Backend TypeScript check: passed.
- Dependency audit at completion: zero reported vulnerabilities.

## Browser journeys

| Journey | Observed result |
| --- | --- |
| Authentication entry | Sign-in dialog accurately showed Google setup pending and offered a demo workspace. No Google login was claimed. |
| Guided onboarding and project creation | Created a research-copilot project, opened the workspace, and used the sample preview interaction. |
| Developer editing | Edited `index.html`, saved, and saw the heading change in the isolated preview. |
| GitHub and release demo | Selected a fictional repository and branch, inspected test results, completed readiness/review and simulated deployment. Completion explicitly stated that no website was created. |
| Local persistence | Reloaded, reopened the demo project, and verified the edited source heading and demo release state remained. |
| Mobile layout — earlier core workspace | Checked the earlier core workspace at an observed 390 CSS-pixel width. Document width matched viewport width, with no horizontal overflow. Sidebar and conversation drawer controls worked. Temporary viewport override was reset. This result does not cover the later added modals. |
| Shared-agent access | Fictional Support builder requested Finance Payment status v1.2, Finance owner approved, and Support saw the grant. Switching to v1.1 correctly required another request. |
| Agent contract | Invalid numeric invoice ID was rejected. Valid input returned the labeled fixture with only status and due date. |
| Agent reuse | Created a new Payment status workflow carrying the selected contract and restrictions into the conversation and agent configuration. |
| Error console | No application console errors were observed at the final check. |
| Engineering drawing | Rendered the SVG to PNG and visually inspected labels, connectors and layout. |

## Checks still open at this checkpoint

- **Google OAuth:** credentials are not configured. Real sign-in, sign-out, session restoration and signed-in browser persistence have not passed an end-to-end browser check. A two-account browser ownership check is also pending, although backend ownership tests pass.
- **File upload UI:** Chrome blocked automated file selection because the ChatGPT extension did not allow access to file URLs. The user was given the extension's official instructions. Safe fixtures are in `data/import-demo.html` and `data/import-demo.zip`. Source/ZIP parser tests pass; the file-picker-to-project browser path remains unverified.
- **Download arrival:** artifact creation and saving into project source were verified. Clicking Download brief did not yield a confirmed download event; browser policy blocked `chrome://downloads/`. Actual arrival in the Downloads folder remains unconfirmed.
- **Added-modal mobile layout:** the final viewport override did not achieve mobile width (observed widths stayed 1390/2084 pixels) and was reset. No mobile pass is claimed for the new modals; the earlier 390-pixel core check remains valid only for its earlier snapshot.
- **Simulation boundaries:** app generation, AI execution, external tools, GitHub sync, invitations, release hosting and shared-agent permissions are scripted demonstrations. Actual Convex project access is owner-only. Test-panel safety traces are illustrative fixtures, not proof of production security.
- **Runtime boundary:** the preview executes plain HTML only, in an opaque-origin iframe with restrictive CSP. It does not execute imported React build systems, Python or arbitrary server frameworks, and is not a production execution sandbox.
- **Deployment:** only the dedicated Convex development backend was deployed. There is no production website or real published preview URL.

## Next verification proposed at this checkpoint

The proposed next step was to follow `docs/guide-backend-setup.md`, configure Google credentials in the dedicated Convex development deployment, then verify sign-in, create/edit/reload, sign-out and owner isolation. The client secret was to stay out of chat, project source and `VITE_*` variables.

The user later deferred Google and chose login ID/password accounts. See the [department record](2026-10-05-department-multiplayer.md) for that change and the [backend setup guide](../documentation/guide-backend-setup.md) for working instructions. The Google step above is historical.
