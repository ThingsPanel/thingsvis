# Feature Specification: Load registry components & left-panel DnD

**Feature Branch**: `004-load-registry-components`  
**Created**: 2025-12-22  
**Status**: Draft  
**Input**: User description: "实现编辑器左侧组件列表从@registry.json 加载，然后替换中间的画布，使组件从左侧能够正确拖拽并渲染。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Load components into left panel (Priority: P1)

As a canvas editor user, I want the editor's left-side component list to load entries from `registry.json` so I can discover available components without manual registration.

**Why this priority**: Without a populated component list the editor is not usable for building visual compositions; loading from `registry.json` is the primary discovery mechanism.

**Independent Test**: Start the editor with a known `registry.json` and verify the left panel shows the registry entries (name and icon). This can be tested without any drag-and-drop functionality present.

**Acceptance Scenarios**:
1. **Given** the editor is opened and `registry.json` is reachable, **When** the editor's workspace initializes, **Then** the left panel displays the list of components defined in `registry.json` with their display name and a placeholder/icon.
2. **Given** `registry.json` is missing or contains invalid entries, **When** the editor initializes, **Then** the left panel shows a friendly empty-state message and a console/log entry describing the issue.

---

### User Story 2 - Drag component to canvas (Priority: P1)

As a user, I want to drag a component from the left panel onto the central canvas and have it render so I can build scenes visually.

**Why this priority**: Core UX for composition—dragging and rendering is the essential interaction for creating content.

**Independent Test**: With the left panel populated and canvas present, perform a drag from a component item into the canvas; verify a new component instance appears on the canvas and can be selected.

**Acceptance Scenarios**:
1. **Given** a valid component entry in the left panel, **When** the user drags it onto the canvas and drops, **Then** a new instance appears at the drop location and is rendered using the component's default configuration.
2. **Given** a plugin/component fails to load on drop, **When** the drop occurs, **Then** the UI shows a non-blocking error indicator and the canvas remains stable (no partial DOM artifacts).

---

### User Story 3 - Replace canvas placeholder with rendered instance (Priority: P2)

As a user, I want the editor's middle area (canvas placeholder) to be replaced with the actual rendered canvas when components are placed so the UI reflects live content rather than placeholders.

**Why this priority**: Improves feedback and clarity—users see real output in place of placeholders after adding content.

**Independent Test**: Drop any component when the canvas area currently shows a placeholder; verify the placeholder is replaced by the rendered canvas and the dropped component appears.

**Acceptance Scenarios**:
1. **Given** a canvas placeholder, **When** the first component is dropped, **Then** the placeholder is replaced by the live canvas hosting the new component.

---

### Edge Cases

- What happens when `registry.json` contains duplicate remote names? System should dedupe by `remoteName` and surface a single entry with a de-duplication note in logs.  
- What happens when a plugin remoteEntry URL is unreachable on drop? Show a non-blocking error toast and keep canvas consistent.  
- Drop during in-progress canvas re-render: ensure the drop is queued or rejected with a clear message.

## Requirements *(mandatory)*

**Constitution Alignment**: This feature must respect repository conventions (monorepo boundaries, existing plugin loading approach, error boundaries) and NOT prescribe implementation details in this spec.

### Functional Requirements
- **FR-001**: On editor initialization, the left panel MUST load the component registry from `apps/preview/public/registry.json` (or configured registry source) and display each entry's display name and a visual affordance (icon/thumbnail).
- **FR-002**: The left panel MUST present a clear empty state if the registry is empty or cannot be loaded, and log an explanatory diagnostic entry.
- **FR-003**: Users MUST be able to drag an item from the left panel and drop it onto the central canvas area to create a new canvas instance of that component.
- **FR-004**: On drop, the system MUST replace the placeholder canvas with a rendered canvas if it was previously a placeholder, and instantiate the component at the drop location with default properties.
- **FR-005**: The system MUST gracefully handle component load failures (e.g., remote entry unavailable) by showing a non-blocking error and not leaving the canvas in an inconsistent state.
- **FR-006**: The drag-and-drop interaction MUST be keyboard-accessible or provide an alternate accessible flow for non-pointer users (at minimum: focus + keyboard insert).

- **FR-007 (Undo via Kernel Command)**: Every drop operation that mutates kernel state MUST be performed by creating and dispatching a Kernel `Command` (see `packages/thingsvis-kernel` history API). The drop command MUST implement `execute(state)` and `undo(state)` so that standard Undo/Redo flows (HistoryManager) can revert and reapply the placement. Acceptance test: invoking Undo after a drop restores kernel state and visual scene to the exact pre-drop snapshot.

- **FR-008 (Canvas Mode–aware coordinates)**: Coordinate transformation for drop positioning MUST correctly handle the editor's three canvas modes (`fixed`, `infinite`, `reflow`) as defined in `apps/*` canvas config. The system MUST translate screen-space drop coordinates into kernel `CanvasInstance.position` according to the active mode, zoom, and current canvas offsets. Acceptance test: same screen drop point results in expected world position within a tolerance of ±1px across all three modes for a representative set of zoom/offset values.

- **FR-009 (Runtime Sandbox for dropped components — A1)**: All instantiated runtime components created by drop MUST be executed inside the Kernel's logic sandbox / SafeExecutor (or equivalent runtime sandbox) and rendered through the UI's visual sandbox boundary. This ensures that plugin/component runtime errors are contained (acceptance standard A1). Acceptance test: if a dropped component throws during render or initialization, the Kernel and host app remain responsive, an error boundary is shown for the component instance, and no kernel-level exception escapes.

### Key Entities

- **ComponentRegistryEntry**: Represents an item in `registry.json` (attributes: `remoteName`, `remoteEntryUrl`, `exposedModule`, `version`, `displayName`, optional `iconUrl`).
- **CanvasInstance**: Represents an instance placed on the canvas (attributes: `id`, `componentType`, `position`, `props`).
- **Command (Kernel)**: Conceptual command object with `id`, `type`, `payload`, `execute(state)` and `undo(state)` methods as used by the kernel history manager (`packages/thingsvis-kernel`).
- **CanvasMode**: Enum describing active canvas layout: `fixed` | `infinite` | `reflow` (see `apps/*` canvasConfig).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When `registry.json` is valid, the left panel shows all registry entries within 2 seconds of editor start in a typical local development environment.
- **SC-002**: Dragging an item from the left panel and dropping it onto the canvas results in a rendered instance visible within 500ms of drop in typical dev environment (accounts for network plugin load).
- **SC-003**: 100% of successful drops create an interactable canvas instance (selectable, focusable) in acceptance tests.
- **SC-004**: When `registry.json` is missing or invalid, the editor surfaces an empty-state message and no uncaught exceptions occur.
- **SC-005**: Accessibility: keyboard/assistive-flow for adding a component is available and automated accessibility checks pass for the new flows.
- **SC-006 (Undo/Redo correctness)**: After dropping a component and then invoking Undo, the kernel state and rendered canvas must match the pre-drop state (node absent, selection restored); Redo must reapply the drop. Automated acceptance tests must assert state equality for KernelState snapshots.
- **SC-007 (Coordinate accuracy across modes)**: For a representative matrix of zoom/offset values and for each canvas mode (`fixed`, `infinite`, `reflow`), the translated kernel `CanvasInstance.position` must place the instance within ±1px of the expected world position when verified in a rendered acceptance test.
- **SC-008 (Sandbox containment — A1)**: When a dropped component throws during initialization or runtime, the error must be contained by the Kernel SafeExecutor and UI HeadlessErrorBoundary: the editor remains responsive, the faulty instance shows an error state, and logs capture diagnostics. This behavior satisfies acceptance standard A1.

## Assumptions

- `registry.json` location is `apps/preview/public/registry.json` in the dev preview environment; production/configured locations may differ and will be handled by implementation configuration (out of scope for this spec).
- The component entries in `registry.json` contain the minimal required fields (`remoteName`, `remoteEntryUrl`, `exposedModule`) to request and instantiate components.
- Network/plugin loading failures are possible and should be surfaced gracefully; retries and caching strategies are implementation details.
- The kernel exposes a command/history API (`packages/thingsvis-kernel` HistoryManager/Command types) and a SafeExecutor sandbox; implementations will use these kernel primitives to satisfy FR-007 and FR-009.

## Testing Notes

- Unit tests should validate parsing `registry.json` into `ComponentRegistryEntry` instances and left-panel rendering of entries.  
- Integration/e2e tests should cover: successful load + drag-drop flow, registry missing/invalid handling, plugin remote failure on drop, and keyboard insertion flow.
- Kernel-level tests must assert that drop actions are dispatched as Kernel `Command` instances and pushed into the HistoryManager; unit tests should exercise `undo()`/`redo()` to validate state snapshots before/after operations.
- Coordinate transformation tests must verify screen→kernel position translation under `fixed`, `infinite`, and `reflow` modes at multiple zoom/offset combinations (include edge zooms like 25%, 100%, 400%).
- Sandbox/A1 tests: intentionally inject a misbehaving component that throws on mount/initialization and assert Kernel SafeExecutor and UI HeadlessErrorBoundary contain the failure (no uncaught exceptions, instance shows error state, logs include diagnostic payload).

## Dependencies

- A reachable `registry.json` fixture (for tests).  
- Existing plugin loading infrastructure (plugin host / MF loader) will be used by implementation (not specified here).
- `packages/thingsvis-kernel` HistoryManager/Command types and SafeExecutor (logic sandbox) for implementing FR-007 and FR-009.
- `packages/thingsvis-ui` HeadlessErrorBoundary or equivalent for rendering sandbox containment.

## Out of scope

- How plugins are fetched, cached, or resolved at runtime beyond the observable behavior; implementation details like caching, bundler configuration, or specific remote loader APIs are intentionally out of scope.


