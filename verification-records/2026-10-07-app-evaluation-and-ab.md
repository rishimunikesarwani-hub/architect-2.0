# App evaluation: before and after the refactor

Date: 2026-10-07. The user selected **before versus after the folder/documentation refactor**. This is a controlled local comparison, not a live-user experiment.

Both versions passed **93 of 93 automated checks**, both typechecks and the disconnected website build. Six paired browser journeys were exercised with no observed refactor regression in the checked behavior. Actual Chrome JSON exports were subsequently found and verified for both versions, including exact edited HTML and README content with CRLF/Unicode preserved. The composed scenarios still expose an existing import-size limitation. This is not an all-features-passed result.

## Which versions were compared?

| Version | Source |
|---|---|
| A — before | The 99-file snapshot at `generated-output/refactor-backups/2026-10-07-before-folder-cleanup/`. It includes the earlier uncommitted cleanup, so it is not equivalent to checking out commit `78e1cd7` alone. |
| B — after | The local worktree copied at the start of this run, identified by the saved source manifest. It includes the descriptive folders and documentation rewrite. |

The [evaluation contract](../documentation/eval-app-comparison.md) defines the checks. The accepted automated run is `generated-output/evaluations/2026-10-07T07-21-27-522Z-60832/`, started at **07:21:27 UTC** and completed at **07:21:56 UTC**. It contains `report.json`, per-version source manifests, Vitest JSON, command logs and the two built sites. These are ignored local artifacts; this document records the portable result.

Both variants used the same installed dependencies and matching lockfile. The runner excluded environment files and did not inherit Convex/provider credentials. The builds are disconnected guest workspaces. No real accounts, hosted department data, backend deployment or schema change were part of this comparison.

## Automated results

| Check | A | B | Interpretation |
|---|---|---|---|
| Frontend TypeScript | Pass, exit 0 | Pass, exit 0 | Both frontend source layouts satisfy their type rules. |
| Backend TypeScript | Pass, exit 0 | Pass, exit 0 | Both backend layouts satisfy their type rules; no deployment occurred. |
| Existing regression suite | 88/88 | 88/88 | No changed result among the existing checks. |
| Five composed scenarios | 5/5 | 5/5 | The same scenario names and statuses; see the quality boundary below. |
| Public artifact sync and build | Pass, exit 0 | Pass, exit 0 | Both guest websites built successfully. |
| Application/test source | 47 files | 33 byte-identical; 14 differ only in import paths | No changed logic, UI text or added/removed source modules in the comparison. |
| Emitted JavaScript and CSS | 12 JS and 7 CSS files | Same hashes for those JS/CSS sets | Exact built-byte agreement; this does not replace browser acceptance. |
| Original snapshot integrity | 99 files match the original manifest | Same 99-file aggregate and manifest hash after the run | The original baseline stayed unchanged. |

The original manifest SHA-256 remained `4e0ded8f4ac4094b2ebff4ffd2d32fa4a1ef67451733b613d55d5cba03421807`. The source comparison normalizes line endings and module-import paths only; it does not normalize away logic, UI text or arbitrary whitespace changes. Architecture documents and their served copies are outside the identical-JavaScript/CSS claim.

## What the composed scenarios established

These scenarios join the import, project, backend, parser and save-queue paths instead of checking each helper in isolation. They use in-memory Convex/Better Auth fixtures, not the hosted backend. The same scenario source was injected into both copies with only historical import paths adjusted.

| Scenario | Observed result in both versions |
|---|---|
| 220,000-byte multilingual import → create → save/read → parse | Source and its independent initial checkpoint remained exact. Serialized state fit the 550,000-byte client budget; the backend returned the same stored state and a metadata-only catalog card. |
| 300,000-byte source with initial checkpoint | The parser accepted the source, but source plus checkpoint and envelope exceeded both save budgets. Backend creation rejected it and left no partial project or catalog card. |
| Revoke access while a save is queued | The denied commit did not save, the later queued write did not run, and the draft stayed blocked/dirty. Restoring access did not autosave. An explicit retry retained the old revision and required conflict recovery. |
| Invalid or oversized update → valid update | Rejected writes changed neither source nor title/revision/catalog. A subsequent valid write still succeeded at the original expected revision. |
| Malformed collaborator state → recovery | The stored malformed state remained available for recovery but was rejected as renderable client state. A role claim inside that JSON did not elevate access. Valid source could be restored at the next revision. |

The 300 KB row is a **known quality limitation, not a successful import journey**. The parser's advertised maximum and the full workspace save budget describe different things. Creating the first checkpoint duplicates source, and JSON/envelope overhead adds more bytes. A passing rejection assertion proves safe rejection; it does not make the user's 300 KB import usable end to end. This happens in A and B, so it is not a refactor regression. The 220 KB fixture is a positive control, not a newly established universal maximum.

The malformed-state scenario also has a precise boundary: the backend validates the envelope/access while the client parser checks the richer render shape. It does not prove that every malformed semantic state is rejected at the server, or that a browser recovery button was exercised.

## Harness issues and isolation review

The first attempt, `generated-output/evaluations/2026-10-07T07-20-37-550Z-77060/`, failed before frontend checking because the Node ESM loader received a Windows drive path for `--import` instead of a `file://` URL. Its log records `ERR_UNSUPPORTED_ESM_URL_SCHEME`. The next run corrected that harness path and passed. This first failure is retained as a harness failure, not counted as an application regression.

The first accepted run's guard did not automatically reach Vitest workers: they do not inherit the parent's `--import` flag. The runner was corrected to pass the guard explicitly through worker `execArgv`. A test-only follow-up in `worker-guard-review-1791358508841/`, within the same accepted run directory, completed at **07:35:27 UTC**. Both versions again passed **93/93**, with no failed or pending tests. `report.json` now includes `testWorkerGuardReview`, boot evidence for **nine guarded Vitest workers per version**, and the follow-up test reports/logs.

The follow-up verified unchanged browser artifact manifests, the original 99-file baseline and dependency hashes; it did not rebuild or replace the sites used for the browser comparison. The initial guard gap remains part of the record. The verified protection is the explicit Node socket/HTTP guard in command processes and workers. Entry-level fetch/WebSocket globals are also guarded, but an edge VM can have different globals and relies on the guarded Node socket layer. This is not an operating-system network sandbox or a claim of complete network isolation.

## Paired browser journeys

The two disconnected builds were opened at **A: `http://127.0.0.1:5184/`** and **B: `http://127.0.0.1:5185/`**. Browser observations ran from **07:26:11 to 07:37:56 UTC**. The order was A then B for the main journeys. The phone check was the explicit exception: B then A in one tab, each at a measured 391 × 844 CSS viewport. An earlier desktop-sized A measurement is not counted as phone evidence.

The same synthetic archives were used: `source-with-fake-secrets.zip`, `broken.zip` and `python-source.zip`. Their hashes and the actual observations are saved in the browser record. No result below is inferred from identical bundles or earlier hosted acceptance.

| Journey | A | B | Observed evidence and limit |
|---|---|---|---|
| Valid import → bad archive → valid import recovery | Pass | Pass | Valid selection showed only `index.html` and `README.md`; fake credential/environment files were excluded. A broken archive cleared the old list, displayed `invalid zip data` and disabled Import. Choosing the valid archive again restored the two files and enabled Import. |
| Import → edit → save → reload → export | Pass for the fixture | Pass for the fixture | Imported HTML matched the fixture. The same heading edit, `Evaluation edited source`, survived save/reload/reopen exactly. Actual exported JSON contained exactly `index.html` and `README.md`: edited HTML matched, and the unchanged README retained its original CRLF and Unicode. The later file verification below supersedes the initially inconclusive download checks. |
| Preview isolation | Pass for the probe | Pass for the probe | The iframe reported `Counter: 1; host: blocked; network: blocked` with `sandbox="allow-scripts"`. The controlled receiver at port 5186 recorded zero requests. This proves the exercised host-document and fetch boundary, not every sandbox escape possibility. |
| Unsupported runtime | Pass | Pass | `main.py` remained exact, with no HTML entrypoint. The preview explained that Python/server/build-tool runtimes are not executed here. No Python execution was claimed. |
| Guided/Developer state and source checks | Pass | Pass | Switching views retained the same app and source. HTML showed 4/4 checks; Python showed 3/4 with the HTML entrypoint failure and a manual repair path. Both retained Simulation/No model wording and distinguished source checks from illustrative traces. |
| Measured phone layout and keyboard exit | Bounded pass | Bounded pass | Both measured 391 × 844, with document/body width 372 and no page horizontal overflow. Labels and Escape behavior were checked for sign-in and Test. Both records contain successful Escape results. B's saved sign-in snapshot includes its labeled dialog; A's saved snapshot does not independently preserve that dialog view. |

**Chrome export is now verified for both variants.** The first lookup checked the registered Downloads location and found no matching files; A's download watcher also timed out. Those checks were inconclusive because the files had arrived in the repository root. The final hygiene check exposed the unexpected root files. All three were then inspected: A's original export, A's retry and B's export.

Each JSON file is **1,228 bytes** and contains exactly two source entries, `index.html` and `README.md`. The edited HTML matches the expected source. The README matches the original content **including CRLF line endings and Unicode**. A textarea normalizes line endings, so the earlier editor comparison alone could not establish this; the actual parsed JSON file contents now do. Each export has its own metadata and SHA-256, so the complete A/B JSON files are not claimed to be byte-identical to each other.

The files were moved to the accepted run's `downloaded-source/` folder and their hashes were verified unchanged:

| Export | Preserved local file | SHA-256 |
|---|---|---|
| A original | `downloaded-source/before-source.json` | `5df0af16adf3952143fccd4054f7b1aa7f3d7975f551d3842b8974040c4eab0f` |
| A retry | `downloaded-source/before-source-retry.json` | `b1b9f4a30fe80bf7b82b005709e57998b388ab09f0a1e68cd60b9e97bfb55689` |
| B | `downloaded-source/after-source.json` | `f7d595f4fa463fb00c88993356f1a7c44549a8290c82ed343bfbeb76c1b2da20` |

The bounded Edge follow-up remains permission-blocked: its file chooser's `setFiles` operation required the extension's **Allow access to file URLs** permission. No files were uploaded, no browser security setting was changed and the temporary Edge tabs were closed. That attempt did not verify Edge export. It does not undo the later actual-file verification of the Chrome exports.

The phone screenshot attempt timed out. Phone evidence is measured geometry and DOM observations, not screenshot proof. The after-version desktop imported-workspace screenshot was captured and visually inspected. Sampled browser logs contained extension warnings and no application errors; this was not a complete console or network capture. Deliberate CSP rejection is part of the isolation check, not an unexpected application error. The keyboard checks are bounded observations, not a full accessibility audit.

The paths below are local evidence under ignored output. They are not included in a fresh checkout or published as repository attachments; this report preserves the portable findings. They are written as paths rather than links so a reviewer is not sent to missing files:

- Browser observations, fixture hashes and source strings: `generated-output/evaluations/2026-10-07T07-21-27-522Z-60832/browser-observations.json`
- Controlled receiver: zero requests: `generated-output/evaluations/2026-10-07T07-21-27-522Z-60832/network-probe.json`
- Inspected after-version desktop screenshot: `generated-output/evaluations/2026-10-07T07-21-27-522Z-60832/after-imported-workspace.jpg`
- Automated report and worker-guard follow-up: `generated-output/evaluations/2026-10-07T07-21-27-522Z-60832/report.json`
- Permission-blocked Edge export follow-up: `generated-output/evaluations/2026-10-07T07-21-27-522Z-60832/edge-export-attempt.json`
- Actual export-file verification: `generated-output/evaluations/2026-10-07T07-21-27-522Z-60832/download-verification.json`
- Preserved exports: A original: `generated-output/evaluations/2026-10-07T07-21-27-522Z-60832/downloaded-source/before-source.json`, A retry: `generated-output/evaluations/2026-10-07T07-21-27-522Z-60832/downloaded-source/before-source-retry.json`, B: `generated-output/evaluations/2026-10-07T07-21-27-522Z-60832/downloaded-source/after-source.json`

## Maintainability result

The separate [maintainability comparison](2026-10-07-maintainability-comparison.md) preserves the measurement method and timing. Its main results are:

| Dimension | A | B |
|---|---|---|
| Maintained duplicate public architecture files | 4 | 0; served copies generated/ignored |
| Missing local file links in 10 paired working documents | 0 of 114 link occurrences | 0 of 109 link occurrences |
| Existing package script/config targets | 10/10 | 13/13 |
| Documented declared aliases at refactor completion | 8/9 | 10/10 |
| Hygiene | Layout/tracked-output checks already present | Those checks plus local Markdown file-target checks |

The later `eval` alias and evaluation harness were added to run this comparison. They are not counted as improvements delivered by the refactor. More explicit folder/script maps are observable; faster human comprehension was not measured.

The old copied architecture Markdown had 21 unresolved relative-link occurrences at its served location. The new served Markdown has three available relative diagram links and converts 20 repository links to absolute GitHub targets. Those descriptive GitHub paths still need publication; this run does not establish their external availability. Authored repository docs had zero missing targets in both versions.

## What this result can support

No refactor regression was observed within the automated scenarios and the six paired browser journeys. Chrome export arrival and exact source preservation are now verified from the actual two-file JSON exports, including the README's CRLF/Unicode. The measured maintenance changes are fewer duplicate document copies, a more explicit file/command map and automatic local-link checking. The hygiene check also helped locate the exports outside the initially checked Downloads folder. Both versions still share the import/save-budget limitation, and Edge export was not exercised past its permission blocker. These results apply to the checked tasks and fixtures, not every feature or archive.

There is no statistical winner, latency improvement, real model-quality result or production capacity claim. Real model/tool/framework execution and generated-app deployment remain simulations. Hosted login, reactive cloud subscriptions and department UI acceptance were not rerun here; their earlier [hosted record](2026-10-06-hosted-department-acceptance.md) remains separate evidence. This evaluation did not publish the refactor.
