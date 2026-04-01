# Industrial Pipe Acceptance Report

Date: 2026-03-31
Environment: `http://localhost:3000/main#/editor`
Scope: `industrial/pipe` end-to-end browser acceptance

## Runtime Confirmation

- Verified host loads widget assets from `apps/studio/public/widgets/industrial/pipe/dist`.
- Verified latest deployed timestamps are `2026-03-31 16:41:28`.
- Browser network confirmed fresh `200` responses for:
  - `/widgets/industrial/pipe/dist/__federation_expose_Main.js`
  - `/widgets/industrial/pipe/dist/19.js`
- This run used the deployed bundle, not the stale package-local build output.

## Test Matrix

### 1. Connected Baseline

Status: Pass

- `sourceNodeId=rect-right`, `targetNodeId=rect-left`
- DOM path points:
  - `(732.5, 411) -> (480, 411) -> (480, 221) -> (227.5, 221)`
- Endpoint handle error:
  - start: `0.000015`
  - end: `0.000015`
- Midpoint handle errors:
  - `0.000015`, `0.000015`, `0.000015`

Conclusion: fresh connected state is aligned.

### 2. Connected State, Drag Midpoint Once

Status: Fail

- After dragging the middle yellow handle once, DOM path changed to:
  - `(732.5, 411) -> (630, 411) -> (630, 221) -> (227.5, 221)`
- Store updated to:
  - `waypoints=[{x:442.5,y:230},{x:442.5,y:40}]`
  - `points=[{x:545,y:230},{x:442.5,y:230},{x:442.5,y:40},{x:40,y:40}]`
- But midpoint handle errors became:
  - `75`, `150`, `75`

Conclusion: path moved, endpoint anchors stayed correct, but yellow midpoint handles did not stay on the rendered path.

### 3. Connected State, Drag Midpoint Again

Status: Fail

- After second drag, DOM path became:
  - `(732.5, 411) -> (367.5, 411) -> (367.5, 221) -> (227.5, 221)`
- Midpoint handle errors remained large:
  - `56.25`, `112.5`, `56.25`

Conclusion: repeated connected-state routing edits still desync yellow handles from the rendered path.

### 4. Move Connected Node After Custom Routing

Status: Fail

- After moving `rect-right` to `{ x: 620, y: 280 }`, DOM path start moved correctly to the new anchor:
  - start anchor error: `0`
- But midpoint handle errors were still large:
  - `144.697`, `121.353`, `56.25`

Conclusion: bound endpoint follows the node, but custom-routed midpoint overlays remain stale/wrong after node translation.

### 5. Magnetic Detach, Small Drag

Status: Partial Pass

- Small drag kept `sourceNodeId=rect-right`
- Endpoint anchor errors stayed near zero
- Midpoint handle errors were not zero:
  - `2`, `4.472`, `4.472`, `0.000023`

Conclusion: magnetic retention works, but the resulting midpoint geometry still shifts slightly and is not fully clean.

### 6. Magnetic Detach, Large Drag

Status: Fail

- Large drag cleared source binding as expected
- Detached path became:
  - `(420, 124) -> (420, 221.000023) -> (227.5, 221.000023)`
- But start handle error became:
  - `424.294`
- Midpoint errors:
  - `302.608`, `182.863`

Conclusion: detach state writes data, but the free endpoint handle is not aligned with the detached rendered path.

### 7. Reconnect After Detach

Status: Fail

- Reconnect restored:
  - `sourceNodeId=rect-right`
  - `sourceAnchor=left`
- Endpoint anchor errors returned to zero
- Midpoint errors still large:
  - `30`, `60`, `0.000015`

Conclusion: reconnection restores endpoint binding, but midpoint overlays still do not match the rendered path after the reconnect flow.

### 8. Free Baseline

Status: Fail

- With both ends unbound, DOM path was:
  - `(732.5, 411) -> (480, 411) -> (480, 221) -> (227.5, 221)`
- Midpoint errors:
  - `0.000015`, `0.000015`, `30`

Conclusion: even the initial fully free path already has one midpoint handle not sitting on the line.

### 9. Free State, Drag Top Midpoint Once

Status: Fail

- After one free-state midpoint drag, path became:
  - `(732.5, 411) -> (420, 411) -> (420, 221) -> (227.5, 221)`
- Midpoint errors:
  - `30`, `60`, `0.000015`

Conclusion: free-state midpoint editing still leaves multiple midpoint handles off-path.

### 10. Free State, Drag Again

Status: Fail

- After second free-state drag, path became:
  - `(732.5, 411.000023) -> (420, 411.000023) -> (420, 220.25) -> (227.5, 221.000023)`
- Midpoint errors:
  - `30.000000000024254`, `60.00117169667233`, `0.3749732971191406`

Conclusion: repeated free-state editing still accumulates midpoint mismatch.

### 11. Mixed State: One End Detached, Then Drag, Then Move Bound Node

Status: Fail

- Final mixed-state DOM path:
  - `(420, 124) -> (420, 311.25) -> (280, 311.25) -> (280, 260.000023)`
- `targetNodeId=rect-left` remained bound
- Target anchor error stayed near zero
- But:
  - free endpoint handle error: `424.294`
  - bound end handle error: `65.401`
  - midpoint errors: `268.483`, `130.087`, `55.34`

Conclusion: mixed mode is currently unstable and is the closest match to the user-reported “拖动几下就乱套” behavior.

## Summary

### Passed

- Runtime deployment path was verified and fresh bundle was loaded.
- Fresh connected baseline aligns correctly.
- Connected endpoint anchor following works in the untouched baseline.
- Small drag detach threshold keeps binding.

### Failed

- Connected-state midpoint overlays desync after route edits.
- Node translation after custom routing leaves midpoint overlays stale.
- Large detach leaves free endpoint overlay off-path.
- Reconnect restores binding but not midpoint consistency.
- Fully free-state midpoint overlays are already inconsistent.
- Mixed state is unstable after several operations.

## Current Assessment

Overall status: Not accepted

This widget still fails end-to-end acceptance. The main unresolved bug is no longer “blue pipe path fails to move” in the baseline; it is now “overlay midpoint / endpoint handles diverge from the rendered path after non-trivial state transitions,” especially:

- connected route edit
- free route edit
- detach then reconnect
- mixed bound/free state

## Most Likely Fault Zones

- `apps/studio/src/components/tools/PipeConnectionTool.tsx`
  - overlay handle generation and refresh after route commits
- `packages/widgets/industrial/pipe/src/routeWorld.ts`
  - conversion between explicit points, waypoints, and bound-anchor recomputation
- possible stale assumptions in any code path that mixes:
  - connected endpoints
  - stored `waypoints`
  - stored `points`
  - overlay-derived segment handles

