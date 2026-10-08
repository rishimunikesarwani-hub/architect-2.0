# Before and after: maintaining Architect 2.0

Date: 2026-10-07. This compares the saved source before the folder/prose refactor with the current local worktree. It measures file organization, references and source preservation. It does not measure how quickly a new developer understands the project.

**A:** `generated-output/refactor-backups/2026-10-07-before-folder-cleanup/`, including its original `backup-manifest.json`. **B:** the refactored repository. These measurements were taken after the refactor checks, before the separate evaluation harness was added. The refactor has not been published.

## What changed

| Dimension | A: before | B: after | What the result tells us |
|---|---|---|---|
| Maintained public architecture copies | 4 copies under `src/public/`, each byte-identical to its document source | 0 copies under `application/public-assets/`; only the authored favicon remains there | Architecture copies are generated and ignored, so there are fewer files to keep synchronized. Published aliases remain supported. |
| Local file links in 10 paired working documents | 114 link occurrences; 0 missing targets | 109 link occurrences; 0 missing targets | Both versions pass. The baseline's authored documentation did not have broken file links in this scope. |
| Script/config file targets in `package.json` | 10 of 10 exist | 13 of 13 exist | Both versions point to real files. The three additional targets belong to the new `diagrams` command. |
| Declared script aliases mentioned in the paired working documents | 8 of 9 | 10 of 10 | The refactor documents `preview` and adds/documents `diagrams`. Neither version mentions an unknown alias. |
| Folder guide | 7 top-level purpose rows | 7 top-level plus 4 application subfolder rows; a separate 10-command map | More locations and commands are explained explicitly. This is a structural observation, not proof of faster navigation. |
| Hygiene enforcement | Layout and accidentally tracked environment/output checks already existed | Those checks remain; local Markdown file-target checks are added | The refactor extends an existing guard. It did not introduce hygiene checking from nothing. |
| Application and test source | 47 compared files | 33 byte-identical; all 47 equivalent after the intended path substitutions | No unexpected source differences were found. This comparison does not replace runtime checks. |
| Backend names and dependencies | 23 top-level `export const` names | The same 23 names; `package-lock.json` byte-identical | The rename did not change those backend symbols or the dependency lock. The symbol count is not a count of public endpoints. |

The later `eval` alias, evaluation runner and comparison guide were added to perform this A/B exercise. They are outside these measurements and are **not** counted as benefits delivered by the folder refactor. The table's 10 aliases and 13 targets describe the measured refactor state, not every later package edit.

## Repository links and downloaded-document links are different checks

The zero-missing result above applies to documents in their authored repository locations. The copied production architecture Markdown had a separate portability problem:

- **A:** `src/public/arch-production-architecture.md` contained 23 relative file-link occurrences. Of those, 21 targets did not exist relative to the copied file's served location.
- **B:** `generated-output/public-assets/arch-production-architecture.md` retains 3 relative diagram links, all present. The other 20 repository links are converted to absolute GitHub links. The production PNG is now included beside the served Markdown.

The new GitHub paths have not been published or checked externally in this comparison. This establishes the local transformation and available diagram targets; it does not establish that those 20 external links already work. Do not combine this result with the repository-link table and claim that all baseline source documents were broken.

## How the comparison was made

The audit was read-only. It did not edit the snapshot, run application tests, change accounts, deploy or publish anything.

1. Recomputed SHA-256 for all **99 snapshot files** and compared each with the original manifest. All matched; there were no missing or changed snapshot files.
2. Mapped the old folder names to the new names and compared 47 application/test files with TS, TSX, JS, CSS or HTML extensions. Only the intended repository path substitutions and line-ending normalization were allowed. There were zero unexpected differences. The import utility, save queue, project reconciliation, authorization rules, project functions and schema were also checked directly and were byte-identical.
3. Compared backend `export const` names and dependency lockfile bytes.
4. Checked the 10 paired working Markdown files: root README/AGENTS, backend README, and architecture/guides/feature-reference Markdown under `docs/` or `documentation/`. The original supplied brief, historical verification reports and public copies were excluded from this paired-document count. Public Markdown was inspected separately above.
5. Counted local Markdown link occurrences after removing fenced examples and ignoring external URLs and heading fragments. Resolved each file target relative to its containing document. This checks file existence, not anchor correctness, external availability or rendering.
6. Checked local paths following `node`, `--config` and `--project` in package scripts. Compared documented `npm run`/`npm test` aliases with each version's own manifest. File existence is not proof that a command executes successfully.

Useful current references are the [folder/script guide](../documentation/guide-folder-hygiene.md), [package scripts](../package.json), [hygiene checker](../development-tools/check-hygiene.mjs), [artifact sync](../development-tools/sync-diagram.mjs) and [Vite configuration](../development-tools/vite.config.ts). The [refactor verification record](2026-10-07-folder-refactor.md) holds the separate build, regression and browser evidence.

The evidence supports less duplicate maintenance, a more explicit file/command map and an additional automatic link check, while preserving the compared source. It does not support a single overall score, a measured comprehension advantage or a claim that production runtime behavior improved.
