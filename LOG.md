# Build log

> This log records each checkpoint as it happened. Earlier pending or blocked states are preserved even when a later entry resolves them. Literal commands and paths use the names from that date; navigable links use the renamed folders. See the [historical path key](verification-records/historical-path-key.md). These prose edits do not repeat the tests.

## 2026-10-05

- The user supplied the Architect 2.0 assignment: focus on the full UI/UX for technical and nontechnical users. Simulated feature flows were allowed; working authentication and database features were a plus.
- User explicitly said `skip blueprint`.
- Started a separate project. The existing tetier-convex backend was unrelated and outside the scope of this work.
- Google OAuth and Convex persistence were still the real-integration targets from the original request. No production deployment had been approved.
- Built the React prototype with Guided/Developer views, editable source, isolated HTML preview, bounded version history, source/ZIP import and export, and labeled GitHub/tool/test/deployment simulations.
- Added a department-owned shared-agent library demo with request/approve/version-specific access, contract samples and project reuse. At this checkpoint, real shared memberships, concurrent editing and runtime authorization were proposed architecture, not implemented services.
- Deployed an isolated Convex development backend (`perceptive-ermine-27`) with Better Auth wiring, server-derived project ownership and persistence. Google credentials were absent; the user requested guided setup after prototype completion.
- Build and 19 automated tests passed. Desktop and mobile browser journeys, source-edit preview, local reload persistence, simulated deployment, and Support-to-Finance agent reuse were verified. Browser console contained no application errors at the last check.
- Chrome extension permissions blocked the automated upload picker. Import parser tests passed, but browser upload completion was still unverified. See the browser verification record.
- Delivered an engineering drawing in editable Mermaid, SVG and rendered PNG, separating implemented services, simulations, pending Google configuration and proposed multiplayer services. No production deployment was performed.

### Final automated release checks

- After the implementation agents stopped, independent verification reran `npm test`: 19 tests passed across 3 files (backend project access, import boundaries and sample preview behavior).
- `npm run build` passed frontend TypeScript checking, diagram synchronization and the Vite production bundle build. The output was `runs/dist`; a successful build did not prove every new browser flow worked.
- Refreshed source coverage for agent knowledge/individual fixtures, collection/schema metadata, generated-app authentication simulation, custom HTTP tool definition and guided failed-check repair. The requirement audit kept browser-unverified labels until the main agent recorded matching UI results.
- Production Markdown/SVG and prototype SVG copies in both `src/public` and `runs/dist` matched their documentation sources by SHA-256 after the build. No `.env*` file was present in the built output.
- Reviewed `.gitignore`, `.vercelignore` and the release guide. Local environment files, Convex local state and run output are excluded; `.env.example` is intentionally available for source handoff. A bounded common-token/private-key pattern scan found no matches in candidate project text; it is not a comprehensive secret audit.
- At this checkpoint, the release guide kept the first hosted demo disconnected from the backend until its exact HTTPS origin and real Google sign-in were tested. Public deployment/repository publication still needed approval, and the hiring form had not been submitted. No deployment, push or remote repository creation was performed by these checks.

### Final browser evidence recorded from the main agent

- Verified saved plan editing/approval with a separate explicit build action; changing to Custom preserved source and returned the plan to draft. Marketplace cloning retained sample origin metadata and the selected CrewAI framework.
- Verified the shared-project viewer/request simulation, illustrative per-app usage, Cobalt design persistence and actual preview button color `rgb(71, 100, 173)`, two saved artifact files, GitAgent handoff, and a Studio role change to the same agent with the two-agent count preserved.
- Verified fictional GitHub push/conflict/keep-local/completion, a persisted simulated Editor invitation, and domain/analytics/listing review through completed deployment simulation. No remote write, email, DNS change or public deployment occurred.
- Verified Reviewer knowledge reference and individual fixture, `release_reviews` collection metadata, generated-app Email/Google settings and custom HTTP-tool source definition after reload. The tool used only `PAYMENT_API_KEY` as a variable name; its review explicitly said NOT SENT.
- Verified a real blank-entry-point edit produced a 3/4 source-check failure, the fix action opened the editor, and manually restoring the exact HTML followed by rerunning produced 4/4.
- Verified the disconnected demo build at 127.0.0.1:5180: disabled Google button/setup notice and prompt-to-preview flow; no application console errors, with an extension warning kept separate.
- Final added-modal mobile validation remained unverified because the viewport override did not reach mobile width; it was reset. Earlier 390-pixel results apply only to the earlier core workspace. Download arrival was unconfirmed at that browser check; the later supplied Markdown brief resolves that specific artifact only, as recorded below. At this checkpoint, the upload picker was still permission-blocked. Real Google/cloud browser verification and public release were pending. Full evidence is in `evals/2026-10-05-parity-verification.md`.

### Release checkpoint preparation

- Completed consultant role/tool context and editable Plan-mode handoff; added an unsent support-draft/edit/copy flow. Browser checks verified exact context preservation, draft project status, clipboard copy and stale-draft clearing.
- Expanded the top-level sample integration catalog to 22 entries and verified Jira's permission review/connect/remove simulation. Verified environment-name persistence, rename, exact source restoration, and the simulated pull completion with source unchanged.
- Converted cross-project documentation links into explicit historical-provenance labels so the release documents do not depend on unrelated local folders.
- Frontend build/typecheck and all 19 tests passed after the additions. Rebuilt the disconnected demo without backend URLs; no deployment hostname appeared in its 15 output files and local environment configuration was unchanged.
- Google readiness was still false. Real OAuth/cloud browser checks and public repository/hosting release needed user setup/approval; no public deployment or hiring submission occurred.

### Supplied Markdown download verified

- The user supplied `payment-status-workflow-brief.md` from Downloads and requested it be saved. The original was preserved; the saved copy is [docs/ref-payment-status-workflow-brief.md](documentation/ref-payment-status-workflow-brief.md).
- Independently read the brief and verified both files are 1,569 bytes with SHA-256 `3220af33a43e34e2647593636604173a13bc770d6980e0f1f9dd1c15128b47a4`. This confirms arrival of this Markdown brief only; ZIP export and other downloads remain unverified.
- The content is an earlier project-derived LangGraph sample snapshot: draft, six source files, no saved plan, and simulated Payment status reuse pinned to version 1.2. It is not the current workspace state or proof of a connected runtime.
- Preserved the earlier browser-event timeout and blocked `chrome://downloads/` attempt as historical, inconclusive checks. Updated README, parity verification and requirement audit with the supplied-file evidence. No source code, tests, builds, browser operations or commits were performed for this update.

### Real department accounts prepared locally

- The user set Google OAuth aside and chose real login ID/password accounts, with the same app data shared across browsers/devices. The blueprint was not restarted.
- Implemented server-owned department membership, same-project Viewer/Editor grants, revocation, expected-revision conflicts and a lightweight project catalog with bounded legacy backfill. Existing projects remain private by default.
- Added account and department screens, real Shared with me filtering, viewer guards and draft recovery. Separate agent-library and runtime/build/integration/deployment scenarios remain simulated.
- Prepared code and migration for the dedicated development deployment; this step applied no new schema, backend code, credentials, public repository or production deployment. See evals/2026-10-05-department-multiplayer.md for checks.

### Release and architecture consistency check

- Re-read the full hiring specification in Chrome. It still requests the sandbox, agent harness, model switching, communication/preview, proxies, GitHub, both deployment paths, scaling, diagram/Markdown, and live URL/repository.
- Corrected stale Google-only and owner-only statements in the production architecture and its generated SVG/PNG. At this checkpoint, department/auth/revision/catalog code was local and awaiting development activation; coding/runtime/registry services remained proposals. Primary-source research and sizing arithmetic were preserved.
- Updated the release guide so a disconnected preview cannot be represented as satisfying real department sharing. Hosted acceptance requires the exact origin, password login and two-account shared-app checks.
- Production build passed; generated diagram/Markdown public and release-bundle copies matched source SHA-256. No schema, deployment or publication action was taken. The pending schema approval was not inferred from the automatic goal continuation.

### Approved development update and live backend acceptance

- User explicitly approved **Apply the development update**. Verified the exact dedicated development selector and deployed the additive department schema/functions with `convex dev --once --typecheck enable --tail-logs disable`; functions ready at 22:44 IST on 2026-10-05.
- Legacy metadata backfill returned done:true, migrated:0. Live readiness reported password:true and google:false. Existing project ownership/source were not changed by the backfill.
- Added a guarded development-only smoke script using normal Better Auth and authenticated Convex APIs. All 15 checks passed across four independent synthetic accounts, covering the same shared app, Editor propagation, Viewer denial, isolation, stale-write rejection, revocation, wrong-password rejection and logout/session invalidation. No auth bypass was introduced; credentials remained in process memory and all synthetic sessions were signed out. Labeled synthetic test records are retained.
- Browser Settings reported password sign-in ready. Login and registration dialogs loaded without the old activation notice, and the sampled application error log was empty. Authenticated cross-browser UI acceptance was still pending; the successful live API checks did not establish it.
- Updated setup/evidence and architecture state labels. Public repository/frontend publication, production deployment and hiring-form submission remain unperformed. Google remains deferred.
- After deployment code generation and diagram refresh, the frontend production build and independent backend TypeScript check both passed. The sanitized live smoke report is retained under evals alongside the verification narrative.

### Mobile panel checks and public release preflight

- At a measured 391x844 viewport, checked Design system, Build artifacts, GitAgent files, Custom tools (including its unsent review), and Studio handoff in the disconnected local preview. Dialog geometry showed no horizontal overflow. Screenshot capture timed out; the record is DOM/layout evidence only.
- Reproduced a 72-character knowledge-reference title overflowing its row (client 207/scroll 322), added wrapping, rebuilt, and verified client 207/scroll 207 with text inside the row. Canceled the temporary references and tool proposal; no saved project source changed. Added matching long-name protections for release titles and department grants; authenticated department-render verification was still pending.
- Normal frontend and disconnected preview builds passed. Final browser error log was empty; restored viewport and preserved the live account setup tab. See evals/2026-10-05-mobile-panels.md.
- Read-only GitHub/Vercel checks found the proposed repository/project absent and no remote configured. Reviewed tracked files/history for common credential patterns and recorded the exact hosting-origin change needed for publication approval. No remote or deployment was created. See evals/2026-10-05-release-preflight.md.

## 2026-10-06

- User requested larger website text from a screenshot. Increased typography across navigation, project cards, workspace, agent library, feature panels and account/department forms. Desktop navigation is 16px and home introduction/prompt 17px; small functional labels are at least 12px. Large display headings and decorative miniature previews retain their hierarchy.
- Widened the sidebar for the larger labels and added wrapping to narrow tab/action rows. Verified home at desktop and measured 390x844 mobile with no page horizontal overflow; sign-in fields measured 16px and labels 15px with no dialog horizontal overflow at the observed compact width. Existing user input was left untouched.
- Frontend build/typecheck and whitespace checks passed. Desktop/mobile screenshots are in runs/2026-10-06-larger-text-desktop.jpg and runs/2026-10-06-larger-text-mobile.jpg. Final browser-control call was interrupted by a Chrome extension update requirement; no further UI actions were performed. No backend/schema/authentication behavior changed.

### Approved public release

- User explicitly approved publishing Architect 2.0 to GitHub/Vercel and then verifying hosted shared logins. Published reviewed commit 4883145 to public repository https://github.com/rishimunikesarwani-hub/architect-2 and Vercel project architect-2 under rishi-personal. Canonical live URL: https://architect-2-weld.vercel.app. Vercel reported READY after its production build.
- Verified the upload manifest excluded local environment files, dependencies, tests/evals, data and runs. Only the two public Convex URLs were configured in the frontend environment. No Convex production backend was deployed.
- Changed SITE_URL on dev:perceptive-ermine-27 to the canonical HTTPS origin and read it back. Password readiness remains true; Google false. Hosted auth preflight returned 204 with the exact allowed origin and required headers; anonymous session GET returned 200/null.
- Independently verified public app/assets and architecture artifacts over unauthenticated HTTP, with diagram/Markdown bytes matching the public repository. Browser home and account forms rendered. Saved published-home and account-handoff screenshots under runs.
- At this checkpoint, hosted account creation awaited user password entry/submission under browser-control credential rules. Authenticated shared-login UI acceptance was pending. Retried the synthetic source-import fixture locally; Chrome still required extension file-URL access. No hiring submission performed.

### Hosted department browser acceptance

- Observed the user's completed owner login and saved CRM project, then kept that project untouched. Created a clearly labeled synthetic QA app/workspace for verification and added the user-provided second test account to QA Support. Independent sessions ran in Chrome and Edge; no credentials were read or stored.
- Verified owner session restoration, saved Viewer/Editor department grants, exact shared-source equality, an Editor save arriving in the owner's open editor without reload, source persistence after reload/reopen, preserved owner draft when a newer edit arrived, and explicit recovery to the latest shared source.
- Switching the test member to QA Finance changed the open app to Viewer and disabled editing/sharing/deployment controls. Revocation removed the open app and shared listing without reload. Restored the Finance Viewer grant and the test member's Support Editor membership.
- Verified owner reload and member sign-out/reload/sign-in, then reopened the same latest shared source. The authenticated Editor page measured390x844 with document/body width 390; temporary viewport was reset. Evidence and screenshots are recorded in evals/2026-10-06-hosted-department-acceptance.md and runs.
- Source import still awaited Chrome file-URL permission at this checkpoint. A draft-download event timed out and bounded filesystem checks found no arrival; the browser tool rejected its internal downloads page. No download success is claimed. No user CRM source or unrelated access was modified.

### Supplemental parity and responsive verification

- Rechecked the official feature index and added the documented per-agent usage breakdown. It uses configured agent names with explicitly illustrative totals; a stable project ID determines the sample, and each agent column sums to the app total. The view performs no model calls, billing or project writes.
- Local browser checks verified keyboard expansion, switching between apps, navigation to the selected app, and the measured 391x844 mobile layout without horizontal overflow. Build/typecheck and focused auth/query review passed. Published application commit c553bf9; Chrome owner and Edge member then loaded exactly matching saved-agent breakdowns through the hosted app, with no sampled browser errors.
- On the hosted synthetic QA app, verified the mobile department dialog and prefilled membership/access editors without saving permission changes. Verified sample design-reference review/apply/reload and Custom MCP HTTPS validation, scope review, simulated connection and disconnect. The actual CRM was untouched. See evals/2026-10-06-supplemental-ui-verification.md.
- Real source/ZIP import still awaited the already-requested Chrome file-URL permission. The design-reference simulation did not replace that remaining check.
- Verified source JSON export arrived with all six current QA files (5,415 bytes), including the latest source heading and applied accent. Verified a fresh conflict-draft HTML download (3,270 bytes) matched the preserved editor draft exactly by SHA-256. Both download-event watchers timed out, so file arrival and byte equality are the authoritative proof. Restored both sessions to the exact pre-test source afterward; only synthetic QA checkpoints changed.

### Hosted source import acceptance and completion

- After the user enabled Chrome's file-access permission, imported the synthetic `data/import-demo.zip` through the hosted file chooser. The new private Custom project, `QA imported operations - 2026-10-06`, contained exactly the fixture's `index.html` and `README.md`; both editor values matched their archive entries by SHA-256. Existing user and shared QA apps were unchanged.
- Verified the imported preview button, edited and saved its heading, reloaded the hosted page, and reopened the project. The full saved HTML and original README remained exact; the edited heading and working button appeared again. No sampled browser errors were observed. Evidence: `evals/2026-10-06-hosted-import-acceptance.md`; proof screenshot: `runs/2026-10-06-hosted-import-expanded.jpg`.
- This resolved the earlier import-permission blocker. The requirement audit and architecture documentation were updated to distinguish the completed prototype flows and real account/shared-data behavior from simulated model, framework, GitHub, tool and generated-app deployment services. Google OAuth remains deferred; no hiring-form submission or Convex production deployment is included.

### Behavior-preserving cleanup and repeatable checks

- Removed 11 compiler-confirmed unused icon imports, 21 unreferenced legacy auth/usage CSS rules, an unused authentication callback prop and two unnecessary exports. Retained all dependencies, generated Convex API files, historical evidence and published diagram aliases after checking their consumers.
- Consolidated three text-download implementations into `src/lib/download-text.ts`, preserving filenames, MIME types and one-second object-URL cleanup. Replaced the backend scaffold README with a project-specific file map. Added `docs/guide-testing.md` and `docs/guide-folder-hygiene.md`.
- Added `npm run check`: read-only folder/Git hygiene, frontend/backend type checks with unused-symbol enforcement, all automated tests, and production build. The baseline run had 87 passes and one 15-second cold-start timeout; an isolated repeat also timed out at 17.6 seconds. Increased only that first auth-case allowance to 30 seconds, retaining its assertions. Focused rerun passed 7/7; full pipeline passed 88/88 tests, both type checks, hygiene and build.
- Local Chrome checked usage expansion, workspace preview and the current login dialog. At measured 391 by 844, document width was 391 and dialog width 367.38/scroll width 366. Viewport restored; sampled browser errors were empty. Desktop screenshot: `runs/2026-10-06-cleanup-workspace.jpg`. Source-export clicks reached the app toast, but the download watcher timed out and no matching file was found in the checked Downloads locations; new file arrival is not claimed. The earlier hosted export evidence remains historical.
- Cleanup remains local; no live backend mutation, schema update, public push or new deployment was performed. See `evals/2026-10-06-cleanup-verification.md` for the exact check scope.

### Requested development test run

- Re-ran `npm run check` on the cleanup worktree at that checkpoint: all 88 tests across 8 files, frontend/backend type checks, folder hygiene and production build passed. Captured output in `runs/2026-10-06-development-check.log`.
- Retested source export in independent Edge on localhost:5182. The browser event watcher timed out, but `research-copilot-source.json` arrived in the registered Downloads directory: 4,009 bytes, SHA-256 `6fe3d3617648606fa2d21b5fe94d2610c2fc85f27d563295740b9d4749c88d06`. Its three complete file strings matched the corresponding editor values exactly. Sampled browser errors were empty. This resolves the prior file-arrival evidence gap without treating the watcher as proof.
- Saved a scoped completion audit and source fingerprints from that run in the development test record/report. No code changes, backend mutation, schema update or deployment were needed during this follow-up test run.

## 2026-10-07

- Renamed the seven project folders and four application folders so their names explain their contents. Updated imports, npm scripts, Vite, Vitest, TypeScript, Convex, Vercel and ignore rules together. A hash-verified 99-file snapshot preserves the earlier worktree, including uncommitted cleanup.
- Moved four duplicate public documents/drawings out of application source. Dev and build now prepare public downloads from the maintained originals. Kept the existing URLs and added the PNG referenced by the downloaded architecture Markdown. Older build folders remain in a recoverable local archive.
- Rewrote working guides, references, architecture notes, report prose and script explanations using the requested Rishi Voice. Kept the supplied brief, literal evidence, code contracts, calculations and simulation boundaries intact. Both diagrams were rendered and visually checked.
- The final `npm run check` passed: 88 tests, both typechecks, folder/local-link hygiene and the production build. Chrome loaded the development and compiled workspaces without sampled errors. The phone login view measured 391 by 844 without horizontal overflow. Ten local HTTP checks matched the built files byte for byte.
- No accounts, shared projects, permissions, schema or live deployments changed. Nothing was committed or pushed. The [refactor record](verification-records/2026-10-07-folder-refactor.md) contains the scope, evidence and recovery locations.

### Before and after evaluation

- Compared the immutable 99-file pre-refactor worktree with a separately copied current worktree. The same 88 regression tests and five additional import/save/access scenarios passed on both versions. Frontend/backend types and disconnected builds passed. The original backup and dependency metadata remained unchanged; emitted JavaScript and CSS hashes matched.
- Added `npm run eval`, a local comparison runner, reusable browser fixtures and a paired-site server. Corrected a Windows loader-path issue before the accepted run. Review then found that Vitest workers did not inherit the network guard; explicitly guarded worker reruns passed all 93 cases per version, without rebuilding the browser sites. The guard is not an operating-system network sandbox.
- Paired Chrome journeys checked import-error recovery, exact edited HTML after reload, unchanged README editor text, view switching, preview isolation, an honest Python-runtime boundary, source-check outcomes, measured phone geometry and Escape. The local network probe received zero requests. Chrome export initially appeared inconclusive because its watcher timed out and the registered Downloads location was empty. Final hygiene found the actual JSON files in the repository root: each contained exactly the two expected files, with the saved HTML edit and unchanged README including CRLF. Those exports were moved into the run's evidence folder with unchanged hashes. An independent Edge follow-up was blocked by extension file-access permission; no browser security setting was changed.
- The composed cases recorded an existing limit: a 300 KB source import can pass archive parsing but exceed the save budget after its initial checkpoint duplicates source. A 220 KB multilingual round trip passed. See the [evaluation report](verification-records/2026-10-07-app-evaluation-and-ab.md) and [maintainability comparison](verification-records/2026-10-07-maintainability-comparison.md). This was local work; no live accounts, permissions, backend data or deployments changed.

### Submission-readiness candidate

- Fixed duplicate ZIP entries before extraction could overwrite source. Unified creation/edit/recovery around the exact serialized workspace budget, trimming history when needed while preserving current source. Removed the separate 160 KB edit gate; import failures remain in the dialog and rejected changes cannot report success.
- Added nine focused regression cases. A repeatable evaluation passed 93/93 baseline and 102/102 current cases, with no removed baseline cases. A separate clean source package passed a fresh installation and `npm run check` with 97 tests, both typechecks, hygiene and build. The original 99-file backup remains unchanged.
- Added the reviewer guide, made local evidence references portable, and checked both architecture drawings and all eight architecture categories. Corrected the proposal to keep external-operation idempotency keys stable across retries.
- Browser control initially failed before page navigation; those attempts did not establish UI acceptance. It later recovered, and the changed local journeys below were completed. Public release alignment remains pending in the [readiness record](verification-records/2026-10-07-submission-readiness.md); no backend/schema or hiring-form action was taken.

### Completed local import/save acceptance

- With code unchanged at `628afb1e5191b547bac62cbd214116416e23304d`, verified that an escape-heavy 300,000-byte import shows the inline budget error while retaining its name, framework and file. A duplicate ZIP clears its invalid selection and disables Import; choosing valid source recovers.
- A fresh local QA project imported the exact 300,000-character/byte HTML fixture. Changed its heading from ready to saved, saved, reloaded and reopened: the complete expected source still matched, and the iframe showed `Large import saved`. Version history correctly explained that no checkpoint fit; Escape closed it.
- At measured 391 × 844, document/body width was 391 without horizontal overflow. After hiding the conversation, the budget notice and Export source control were readable. Desktop and phone screenshots were captured as `large-import-desktop.jpg` and `large-import-phone-preview.jpg`; the viewport was restored to 1576 × 887. Captured console output contained only an extension warning, with no captured application warnings/errors.
- The optional quote-heavy editor-rejection follow-up remains browser-unverified because automation lost its connection during input. State was preserved; automated rejection coverage remains valid. This is separate from the verified oversized-import recovery and normal large-source save journey.
- These checks wrote only local QA data. No live database writes, backend/schema changes or hiring submission occurred. Remote main remains last checked at `78e1cd78e483de7e214bbef94392eedad2871d8b`; publication of the local candidate is still pending.

### Published review package

- Published reviewed source and browser evidence at `9b9536645a540a14fc374b6f9141c7e0b2373935` to the existing public GitHub repository. Vercel deployment `dpl_2Do9RGbq8QrvLDXrWqKuzWm2ExGB` built successfully and reached Ready at the canonical app URL. This closes the pending publication step above.
- Canonical HTTP and all three directly referenced JS/CSS assets returned 200. All six served downloads matched their local generated copies exactly. Public GitHub main was independently checked through an unauthenticated request.
- The existing hosted owner session loaded the synthetic imported QA app, its saved heading and two-file source. The preview button worked. Captured browser messages contained only an extension warning; the app was left open. No live saved data, permissions, backend/schema or hiring form changed.
- Final source packaging verifies protected application, test, tooling and configuration hashes against the accepted evaluation and clean-install candidate, and verifies every ZIP entry. Subsequent changes in this handoff are documentation only. See the [readiness record](verification-records/2026-10-07-submission-readiness.md) for the evidence and honest prototype limits.
