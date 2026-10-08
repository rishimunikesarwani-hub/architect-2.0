# Added-panel mobile verification

> Historical record: results and limits belong to the dated checkpoints below. Literal commands and paths are preserved as recorded; navigable links use the renamed folders. See the [historical path key](historical-path-key.md). This prose update does not repeat the checks.

Date: 2026-10-05. Tested the source at that checkpoint in the disconnected local preview at `http://127.0.0.1:5180`, separate from the live account form at `http://localhost:5177`. This is layout and local interaction evidence, not authentication or public-hosting proof.

## Measured viewport and dialog checks

The browser override produced a measured `innerWidth:391, innerHeight:844`. Each dialog was opened through the workspace's More project actions menu. Rendered DOM bounds and scroll measurements were inspected; the browser screenshot service timed out, so this record does not claim screenshots or a pixel-level visual review.

| Panel | Observed layout and interaction |
|---|---|
| Design system | Dialog x10/right381.38, y10/bottom834.31; client/scroll width357/357; no descendants extending past its horizontal bounds. Design fields and save/apply controls present. |
| Build artifacts | Dialog x10/right381.38, y134.33/bottom709.96; client/scroll width370/370; no horizontal overflow. Creation control present; no new artifacts created by this check. |
| GitAgent files | Dialog x10/right381.38, y18.09/bottom826.22; client/scroll width370/370; no horizontal overflow. Instructions, configuration tab and download/save controls present. |
| Custom tools | Dialog x10/right381.38, y10/bottom834.31; client/scroll width357/357. Filled a synthetic tool and opened sample review: explicitly Not sent / Not a live response. The expanded form remained width357/357 with vertical scrolling (client height823, scroll height1750). Closed without saving. |
| Studio handoff | Dialog x10/right381.38, y10/bottom834.31; client/scroll width357/357; no horizontal overflow. Existing-agent fields and save/back controls present; closed without editing. |

These checks supplied the missing mobile evidence for these five panels after the earlier failed viewport attempt. They do not cover every modal or every internal branch.

## Reproduced and fixed long-title overflow

In Agents > Researcher, added an unsaved synthetic knowledge reference with a 72-character unbroken title (`Reference` repeated eight times). Before the fix, the title had client width207 and scroll width322. Its painted text extended to x388, beyond the row's x347 edge and the dialog's x381 edge, overlapping the area reserved for controls. A dialog-level scroll-width check alone missed this text overflow.

Added `overflow-wrap:anywhere` and a shrinkable minimum width to knowledge-reference and release-card titles. After rebuilding and repeating the exact reference entry at the same viewport, the title measured client/scroll width207/207; text ended at x267, within its row. The dialog remained width370/370. Canceled the draft both times, preserving the saved agent with zero knowledge references.

The related department-name styles were changed to wrap long names and move grant actions to another row on narrow screens. That change passed source review and build checks. The authenticated department screen still needed a browser check at this checkpoint; the disconnected preview did not verify it.

The conversation drawer initially covered the agent card on mobile; closing it through Hide conversation exposed the card. No underlying control was force-clicked. Final sampled application errors: none. Restored the normal browser viewport and retained the separate account-creation handoff tab.

Both the normal frontend build/typecheck and disconnected preview build passed after the CSS changes. No backend code or schema changed; existing backend tests were not repeated for this layout-only fix.
