# Public release preflight

> Historical record: results and limits belong to the dated checkpoints below. Literal commands and paths are preserved as recorded; navigable links use the renamed folders. See the [historical path key](historical-path-key.md). This prose update does not repeat the checks.

Read-only audit on 2026-10-05, before publication. Snapshot commit: `f0975f1`; subsequent local mobile CSS/evidence changes are recorded separately. The full goal still required a live app and repository at this checkpoint. No publication or hiring submission occurred in this audit.

- Git had no remote. Authenticated GitHub account: `rishimunikesarwani-hub`; the exact proposed repository `rishimunikesarwani-hub/architect-2` returned 404 at the time of inspection.
- Vercel scope: `rishi-personal`; its project list contained `rishi-ships-every-day` and `alars`, with no `architect-2` project. Those existing projects are outside this release's scope.
- The snapshot tracked 85 files. Only placeholder `.env.example` was tracked; no environment/key files were found in its four-commit history. Bounded credential-pattern scans of 82 text files in that snapshot and 117 reachable historical text blobs found no matches. This is a heuristic check, not an exhaustive security guarantee.
- The small import-fixture ZIP contains only `index.html` and `README.md`.
- A read-only Convex environment query confirmed the authentication origin at that checkpoint was `http://localhost:5177`.
- Vercel's upload dry-run requires a linked/existing project. No project was created or linked, so exact upload inspection was still pending.

## Publication scope proposed for approval

The proposed scope was to create a public GitHub repository named `rishimunikesarwani-hub/architect-2` and a separate Vercel project named `architect-2` under `rishi-personal`. It covered publishing the reviewed prototype and its architecture artifacts, then configuring the frontend with only the public Convex API and HTTP URLs for the already-approved development deployment. The Better Auth secret would stay on Convex.

After Vercel assigned the actual canonical HTTPS origin, the next step would be to update the development backend's `SITE_URL` to that origin and run hosted sign-in/shared-app acceptance there. The implementation trusted one canonical origin. That change would move normal login away from localhost, so it had to be included in publication approval. Name availability also needed another check immediately before creating resources.

This proposed scope did not include a Convex production deployment, changes to the existing portfolio or alars sites, real model/runtime services, or hiring-form submission. See [the release guide](../documentation/guide-release.md) for working release instructions. The later [public release record](2026-10-06-public-release.md) records the approved publication; this preflight does not establish it.
