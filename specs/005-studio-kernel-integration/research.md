# Research: Studio–Kernel Deep Integration

## Decisions & Rationales

### Decision 1: L0 -> L2 Store Connectivity
- **Choice**: Shared Zustand-based `KernelStore`.
- **Rationale**: `thingsvis-kernel` provides a vanilla Zustand store (with `immer` and `zundo` for temporal history). Using `useSyncExternalStore` in `apps/studio` allows React to reactively update the UI, while `packages/thingsvis-ui`'s `VisualEngine` can subscribe to the same store instance directly (vanilla subscription) to drive non-React rendering (LeaferJS).
- **Alternatives**: Redux (too boilerplate), Context API (performance issues with frequent canvas updates).

### Decision 2: Hybrid Rendering (2D Leafer + 3D R3F)
- **Choice**: Multi-layer stacking.
- **Rationale**: 
  - **2D (LeaferJS)**: Primary renderer for most components due to high performance with thousands of nodes and built-in support for standard transforms.
  - **3D (R3F)**: Injected via the `VisualEngine`'s `overlayRoot`. Components with `type: '3d/*'` will trigger a renderer that mounts a Three.js canvas in an overlay div positioned to match the 2D node's bounds.
- **Integration**: The `VisualEngine` manages an `instanceMap`. For 3D components, it creates an `overlayBox` (div) and mounts the R3F app inside it.

### Decision 3: Interaction via Moveable
- **Choice**: `Moveable` + `Selecto`.
- **Rationale**: These libraries are industry standards for handles, rotation, scaling, and multi-selection. They operate on DOM elements. For Canvas nodes, we will use "proxy" DOM elements or transparent overlay elements that match the canvas node bounds to allow `Moveable` to attach.
- **Command Pattern**: Interaction events from `Moveable` will dispatch `Command` objects to the `KernelStore` via `actionStack`, ensuring all edits are undoable.

### Decision 4: Material Distribution (MF 2.0)
- **Choice**: Module Federation 2.0 with dynamic remote loading.
- **Rationale**: Allows plugins to be developed and deployed independently. `registry.json` serves as the index. The `dynamicLoader` in `thingsvis-ui` handles fetching the remote entry and initializing the widget.

## Best Practices
- **Isolation**: Use `SafeExecutor` in the kernel to wrap plugin lifecycle calls.
- **Performance**: Bypass React for frequent canvas updates (use direct Leafer/Three.js APIs).
- **Coordinate Consistency**: Maintain a single "World Coordinate" system in the kernel; translate to "View Coordinates" only at the rendering/interaction layer.

## Needs Clarification (Resolved)
- *How to handle Moveable on Canvas?* -> Use invisible DOM proxies that sync with Canvas node positions.
- *How to share store between packages?* -> The store instance is created in the app (L2) and passed down to L1 components.

