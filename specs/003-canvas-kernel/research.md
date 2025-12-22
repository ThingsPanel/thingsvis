# Research: Canvas Kernel — decisions and trade-offs

## Decision: 2D renderer — LeaferJS
- Decision: Use LeaferJS (via `leafer-ui` adapter) as the primary 2D renderer.
- Rationale: Leafer is lightweight, designed for high-performance scene graphs, and easier to drive outside React's reconciliation loop. It fits the "React Bypass" pattern in the constitution.
- Alternatives considered: Canvas2D hand-rolled renderer (higher maintenance), PixiJS (good performance but heavier and less scene-graph-centric).

## Decision: 3D renderer — React Three Fiber (R3F) as a layered/embedded scene
- Decision: Use R3F for 3D content; embed R3F scenes as isolated layers inside the VisualEngine. Support two integration patterns:
  1. Overlay/Layer: R3F renders to a separate canvas composited above/below Leafer layer; use shared camera transforms for coordinated pan/zoom.
  2. Render-to-texture: R3F renders to an offscreen target that Leafer can draw as a texture for tight local embedding.
- Rationale: R3F provides declarative React-friendly 3D with a mature ecosystem (three.js). Keeping R3F instances isolated preserves micro-kernel constraints.
- Alternatives: Pure three.js imperative integration (more manual lifecycle handling).

## Decision: 2D/3D interaction model & Moveable
- Decision: Keep Moveable as canonical 2D transform controller for screen-space transforms. For 3D-enabled components, provide a mapping layer:
  - Map Moveable 2D transforms to 3D affine transforms where applicable (translate/scale in XY mapped to object position/scale; rotation mapped to yaw or local axis rotations).
  - For complex 3D rotations, expose R3F-native transform controls (e.g., TransformControls) and a UX affordance to toggle 2D/3D edit mode.
- Rationale: Preserves consistent UX for designers; avoids forcing 3D transform mental model for purely 2D tasks.

## Decision: State & Sync (Zustand + Immer + Dirty flags)
- Decision: Kernel holds a vanilla Zustand store with Immer for mutations. Each visual consumer (VisualEngine) subscribes and processes a batched render loop driven by per-entity dirty flags.
- Rationale: Minimizes reconciliation churn; only changed nodes are re-pushed into renderer. Ensures "Data is Truth" where the store is authoritative.
- Implementation notes:
  - Mutations done via typed actions in kernel; actions set node.dirty = true (or mark subtree) and push minimal patches to a ring buffer consumed by VisualEngine.
  - VisualEngine runs requestAnimationFrame loop and consumes batched patches; apply throttling/debouncing for mass updates.

## Decision: ETL Worker and Data Ingress
- Decision: External IO → ETL Web Worker(s) → postMessage → Kernel action that validates (Zod) and injects into store.
- Rationale: Offloads parsing/validation and heavy transformations off main thread; structured cloning and Transferable objects used for large buffers.
- Alternatives: In-process parsing (simpler but blocks main thread).

## Decision: Sandbox & Error Isolation
- Decision: Visual plugins run in a combination of strategies:
  - UI/runtime plugin logic runs in main thread but wrapped by `HeadlessErrorBoundary` in UI and kernel-level `SafeExecutor` for plugin lifecycle hooks.
  - For user-supplied or untrusted code, support running logic in Web Workers (Future/opt-in).
- Rationale: Immediate isolation via ErrorBoundary + SafeExecutor satisfies constitution; workers provide extra safety when needed.

## Performance & Rendering Patterns
- Use instance rendering / batching for repeated primitives (icons, primitives).
- Spatial indexing (quad-tree or RBush) for hit-testing and viewport culling.
- Virtualize offscreen nodes: keep them in store but skip expensive render work until in viewport.
- Use GPU-accelerated compositing and avoid per-frame React updates.

## Unknowns / Follow-ups (research tasks)
- Integration pattern chosen for R3F (overlay vs render-to-texture) will require prototyping for latency and compositing artifacts.
- Precise API surface for plugin registration / lifecycle (mount/update/unmount) — generate contract in Phase1.
- Benchmark targets: define representative PageSchema fixtures (1k, 5k, 10k nodes) for tuning.

## Summary
- Proceed with LeaferJS for 2D, R3F for 3D (layered integration), Zustand+Immer + dirty-flag render loop, ETL web worker ingestion, and ErrorBoundary + SafeExecutor isolation. Phase1 will produce concrete contracts and data-model to implement these decisions.


