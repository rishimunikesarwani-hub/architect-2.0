# Historical paths in verification records

The dated records describe the code, browser sessions and files checked on those dates. The folder cleanup on 2026-10-07 changed where the repository files live. It did not rerun the earlier checks.

Old commands, hashes, timestamps, measurements, source paths and screenshot paths remain as recorded. An earlier pending or blocked result still belongs to that checkpoint, even where a later record resolves it. Words such as current, now and remaining in quoted or retained evidence refer to that checkpoint.

Markdown links now point to the renamed repository files. Source line anchors are historical audit references; lines may have shifted since that inspection. For commands to run today, use the [testing guide](../documentation/guide-testing.md), [backend setup guide](../documentation/guide-backend-setup.md) or [release guide](../documentation/guide-release.md). Do not copy an old command without checking its paths.

| Path used at the test date | Repository path after the folder cleanup |
|---|---|
| `src/components/` | `application/interface-components/` |
| `src/lib/` | `application/shared-logic/` |
| `src/convex/` | `application/backend/` |
| `src/public/favicon.svg` | `application/public-assets/favicon.svg` |
| Other published copies from `src/public/` | `generated-output/public-assets/` |
| Other `src/` files | `application/` |
| `docs/` | `documentation/` |
| `tests/` | `automated-tests/` |
| `evals/` | `verification-records/` |
| `ops/` | `development-tools/` |
| `data/` | `sample-projects/` |
| `runs/dist/` | `generated-output/previous-builds/2026-10-06-hosted-app/` |
| `runs/demo-dist/` | `generated-output/previous-builds/2026-10-06-guest-app/` |
| Other `runs/` files | `generated-output/` |

The archived hosted and guest bundles remain historical builds. New builds go to `generated-output/website/`. Published architecture copies are generated from their editable sources in `documentation/`; only the favicon stays in `application/public-assets/` as source. The generated copies do not replace the evidence of what an earlier build contained.

Paths inside an imported or generated sample app, such as its own `docs/` or `.architect/` files, are part of that app. This repository rename does not change them. Historical local screenshot and download paths are evidence references, not a claim that those files are public or still present at the same absolute location.

The recoverable pre-cleanup source snapshot is under `generated-output/refactor-backups/2026-10-07-before-folder-cleanup`. Its manifest records the original paths and hashes. Local credentials and dependencies were excluded from that backup.
