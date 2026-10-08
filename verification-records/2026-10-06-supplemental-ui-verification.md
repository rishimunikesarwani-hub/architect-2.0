# Supplemental UI verification

> Historical record: results and limits belong to the dated checkpoints below. Literal commands and paths are preserved as recorded; navigable links use the renamed folders. See the [historical path key](historical-path-key.md). This prose update does not repeat the checks.

Date: 2026-10-06. The main agent reported these browser observations against https://architect-2-weld.vercel.app at published commit `4f3d4a5`. This documentation update did not repeat UI operations. Those hosted checks extend the [hosted department acceptance](2026-10-06-hosted-department-acceptance.md), without claiming every branch or a real external integration. The per-agent component was first checked locally on port 5182, then verified on the hosted app after deployment of `c553bf9`, as recorded below.

## Authenticated mobile department dialog

**Observed at actual viewport 391 by 844.** Earlier viewport attempts were mis-targeted or affected by zoom; only the measured final viewport counts.

The owner opened **More project actions → Manage department access**. The dialog measured x **10**, width **371.38**, height **824.31**; client/scroll width was **370/370**, and document/body width was **391**. No controls extended horizontally outside the viewport.

Change department prefilled the existing test member and QA Support. Edit access prefilled QA Support and Editor. No membership or grant was saved or changed. Escape closed the dialog, and the viewport was reset.

Screenshot: `runs/2026-10-06-mobile-department-dialog.jpg`. This proves the measured dialog and inspected prefilled controls, not all mobile management branches.

## Design-reference simulation

On the separate synthetic QA app `j57cm1majys6w7k56yyhajvp7x8fsj35`:

1. Selected Figma and entered `https://example.com/qa-design-reference`.
2. **Review sample import** explicitly said the proposed design was not extracted from the reference.
3. **Use sample direction** selected **Figma sample**, accent `#4764ad`.
4. **Apply to preview**, close, reload and reopen retained the design in the form and Figma sample preset.
5. The latest source heading, `Hosted department QA: Support edit two`, remained intact.

Screenshot: `runs/2026-10-06-hosted-design-reference.jpg`. No reference was fetched, uploaded or parsed. Only the synthetic QA app was affected; the user's CRM remained untouched. This is design-reference simulation proof, **not** real source/ZIP import proof. PDF/repository/ZIP design-reference branches were not separately tested.

## Custom MCP simulation

- An HTTP URL was rejected with HTTPS validation.
- `https://tools.example.com/mcp` plus **Discover tools** and **Read tool output** proceeded through **Confirm simulation**.
- The workspace showed one connection and explicitly stated that no account was authorized.
- Reopening management retained both checked scopes. The endpoint was blank, consistent with the interface's advertised dialog-only storage.
- **Disconnect simulation** returned the connection count to zero.

No external request was performed by the simulated flow. Sampled browser error logs were empty. Screenshot: `runs/2026-10-06-hosted-mcp-simulation.jpg`; it contains transitional opacity, so the recorded interaction results are stronger evidence than that screenshot alone. This check does not claim tool discovery, real MCP execution or runtime schema validation.

## Local per-agent usage verification

The main agent checked the new component in the local preview on **port 5182**, separately from the hosted commit above:

- In Usage & activity, pressing Enter expanded Research copilot. Totals were **8 build / 2 runtime / 9 requests**; Researcher showed **4 / 1 / 5** and Reviewer **4 / 1 / 4**, matching the aggregate exactly.
- Configured agent names/roles and **Model not connected** were visible, together with illustrative/no-billing labels. These are example units, not observed model consumption.
- Expanding Customer support collapsed Research copilot. Open Customer support opened the matching workspace and Project views.
- At measured **391 by 844**, document scroll width was **371**. The usage section measured width **331.28**, client/scroll width **330/330**, with no overflowing buttons. The viewport was reset.
- Screenshot `runs/2026-10-06-mobile-agent-usage.jpg` was visually inspected. Its tool canvas includes white space below the viewport; the supported claim is measured geometry and readable agent rows, not a full-page screenshot match.
- Sampled local browser error logs were empty. Source review confirmed example values are selected by stable project ID, preventing reordering from changing totals; this was source review, not a separate reorder UI test. The implementation agent reported build/typecheck passing.

## Hosted per-agent usage verification

**Passed after deployment of commit `c553bf9`**, Vercel deployment `dpl_czvMPUjEbfVkhVgf4BQAw9QgNTXR`; the canonical URL remained https://architect-2-weld.vercel.app.

- The owner Chrome session listed two apps. The independent Edge test-member session listed one app and did not expose the owner's CRM.
- Both sessions opened **View agents** for the same synthetic QA app and loaded its actual saved Researcher and Reviewer agents. The visible breakdown text compared exactly equal between browsers.
- Both showed **8 build / 2 runtime / 9 requests**, split into **Researcher 4 / 1 / 5** and **Reviewer 4 / 1 / 4**. Sample/no-billing labels remained visible. These totals are illustrative, not real consumption.
- Sampled error logs in both browsers were empty. `runs/2026-10-06-hosted-agent-usage.jpg` was visually inspected and clear.

This adds authenticated hosted metadata/detail-loading and consistent shared-app display evidence to the earlier local interaction/mobile checks.

## Verified JSON source export

The Edge **Export source** event watcher timed out, but a subsequent bounded Downloads lookup found the exact file `qa-shared-department-acceptance-synthetic-t-source.json` in the registered Dropbox Downloads location and its standard Downloads alias. The main agent verified and parsed it; the alias is not evidence of a second download.

| Property | Observed result |
|---|---|
| File size | 5,415 bytes |
| SHA-256 | `9a4bf2f28427738c9570fda3e9dddf021ab867e088cc4b06129ba5857ea1ec20` |
| Export timestamp | `2026-10-06T02:23:41.127Z` |
| File modification timestamp | `2026-10-06T02:23:43.662Z` |
| Project | Parsed title matched the synthetic QA app; framework LangGraph |
| Files | Six: `index.html`, `agents/main.py`, `README.md`, `.architect/design-systems.json`, `docs/design-guide.md`, `.architect/settings.json` |
| Current source | Latest Support edit two heading and applied accent `#4764ad` were present |

This verifies arrival and content of this **JSON source export** despite the inconclusive event watcher. It does not by itself prove conflict-draft download or file-picker import; the separate conflict-draft retest is recorded below. Source export uses JSON, and no ZIP export feature is claimed.

## Verified conflict-draft download retest

**Passed in an independent hosted Edge retest at `c553bf9`.** This supersedes the initial Chrome attempt's unverified arrival, while preserving that earlier timeout as historical.

Both browser sessions began with exactly the same saved source: Support edit two with the cobalt design. Edge held an unsaved heading, `Hosted department QA: preserved download draft`, while the owner saved the competing heading `Hosted department QA: newer download check`. Edge retained its exact draft, disabled Save and offered Download my draft.

A bounded baseline in the registered Downloads location and its standard alias contained no `index*.html`. The download watcher again timed out after 10 seconds, but a new `index.html` arrived:

| Property | Observed result |
|---|---|
| Arrival timestamp | `2026-10-06T02:26:07.060Z` |
| File size | 3,270 bytes |
| SHA-256 | `b191f003bfdc8ce5f59ac3feadc92571bed4551fea202c23eea731afa8ee7182` |
| Content verification | Exactly matched the independently fingerprinted unsaved DOM draft |

Edge then chose **Discard draft and show latest**, which matched the competing saved version. The owner restored and saved the exact pre-retest source. Both browsers' source DOM matched that baseline, and Preview again showed Support edit two. The user's CRM was unchanged.

The file evidence proves this preserved-draft HTML download despite the inconclusive event watcher. It does not imply source/ZIP import passed.

## Evidence limits and remaining checks

The screenshot paths are ignored local `runs/` artifacts, not public repository files. The earlier source/ZIP chooser attempts were blocked by Chrome's file-URL permission. After the user enabled file access, the separate [hosted import acceptance](2026-10-06-hosted-import-acceptance.md) at `f4037db` passed real two-file import, preview interaction, editing and exact-source reload. That later evidence resolves the blocker; the design simulation above is not the import proof. The Markdown brief, JSON source export and the independently retested conflict-draft HTML now have specific file-arrival evidence. Generic ZIP export is not an implemented feature or an additional completion gate; other unobserved formats retain their evidence limits.

At the end of verification, browser control also requested an update to the ChatGPT extension in Chrome. No further browser actions were attempted after that notice. At that checkpoint, the pending import retry required an up-to-date extension with Allow access to file URLs enabled. The later import pass is recorded above. The standard Downloads directory was separately confirmed to be a junction to the registered Dropbox Downloads directory, so the matching paths above identify the same downloaded files.

By the end of this checkpoint, per-agent usage had both the bounded local and hosted evidence above. Its documented basis is the v2.2 entry in the [official index](https://docs.architect.new/llms.txt), which names “a detailed per-agent credit breakdown”. The detailed release page was unavailable through the web reader, so this does not establish vendor-specific fields or pricing.

No membership/grant change, external connection, hiring submission, commit or deployment was performed by this documentation update.
