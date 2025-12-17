# Feature Specification: Phase 3 — Component Ecosystem (L1)

**Feature Branch**: `001-plugin-ecosystem`  
**Created**: 2025-12-17  
**Status**: Draft  
**Input**: User description: "Start \"Phase 3: Component Ecosystem (L1)\". We are transitioning from the Kernel (L0) to the Plugin Layer (L1). Objectives: plugin loading infrastructure with local caching for offline use, a simple static registry mapping component IDs to remote bundles, a CLI scaffold to generate plugin structure by category, first batch of standard components plus an AI-generated example component, and isolated visual tests per component. Strict constraint: plugins must avoid duplicating core shared dependencies."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use “Standard Parts” in the editor (Priority: P1)

A page author can select a standard component (rectangle, text, image) and see it render on the canvas in the product.

**Why this priority**: This is the smallest end-to-end proof that the plugin layer works and delivers immediate user-visible value.

**Independent Test**: With only the registry + loader + these standard components available, an author can add each component and see it render without any other plugins.

**Acceptance Scenarios**:

1. **Given** the product is running and the component registry is available, **When** the author adds `basic/rect`, **Then** a rectangle renders on the canvas.
2. **Given** the product is running and the component registry is available, **When** the author adds `layout/text`, **Then** text renders on the canvas.
3. **Given** the product is running and the component registry is available, **When** the author adds `media/image` with a valid image source, **Then** the image renders on the canvas.

---

### User Story 2 - Continue working without network after first use (Priority: P2)

A page author can keep using previously used components even when the network is slow or unavailable.

**Why this priority**: Offline resilience is a core differentiator for a plugin ecosystem and reduces disruption during demos and real usage.

**Independent Test**: After a component has been loaded once, the product can render it again with the network disabled.

**Acceptance Scenarios**:

1. **Given** a component was successfully used at least once on this device, **When** the network becomes unavailable, **Then** the product can still render that component in the canvas.
2. **Given** the product attempts to load a component that has never been loaded on this device, **When** the network is unavailable, **Then** the product shows a clear error state and the rest of the page remains usable.

---

### User Story 3 - Create a new plugin quickly (Priority: P3)

A developer can generate a new plugin skeleton for a chosen component category, fill in minimal component details, and validate that it renders in isolation.

**Why this priority**: A fast “time-to-first-plugin” loop is essential for growing a component ecosystem.

**Independent Test**: A new plugin skeleton can be created and contains an isolated render verification that can be run for that plugin alone.

**Acceptance Scenarios**:

1. **Given** the developer provides a valid category and name, **When** they create a plugin skeleton, **Then** a new plugin folder appears with a consistent structure for that category.
2. **Given** the developer adds minimal rendering logic, **When** they run the plugin’s isolated render verification, **Then** the component renders without relying on other plugins.

---

### Edge Cases

- What happens when the registry file is missing, unreachable, or invalid?
- What happens when a component ID is requested but not present in the registry?
- What happens when a remote bundle fails to load or is corrupted?
- What happens when a previously cached component cannot be validated as safe/usable (e.g., incomplete download)?
- What happens when an image source is invalid or unavailable?
- What happens when text content is empty or extremely long?

## Requirements *(mandatory)*

**Constitution Alignment**: Confirm solutions respect the monorepo boundary conventions, strict typing expectations, schema discipline, renderer discipline (no ad-hoc DOM drawing), predictable state management, performance targets for interactive canvas work, and robust error boundaries around third-party/extension code.

### Functional Requirements

- **FR-001**: The product MUST support loading a component implementation dynamically at runtime using a `componentId` resolved from a registry.
- **FR-002**: The product MUST support a simple static registry artifact that maps `componentId` → “component bundle location” and can be served without a backend service.
- **FR-003**: The loader MUST store and reuse previously loaded component bundles locally so the product can render previously used components without network access.
- **FR-004**: When a component cannot be loaded (network, registry, or bundle failure), the product MUST show a clear failure state without crashing the whole canvas/page.
- **FR-005**: The plugin build output MUST be compatible with the host’s plugin loading mechanism and MUST avoid duplicating the host’s core shared libraries (to prevent version skew and bundle bloat).
- **FR-006**: The repository MUST include MVP plugins for `basic/rect`, `layout/text`, and `media/image`, each usable by the host product as “standard parts.”
- **FR-007**: The repository MUST include one “AI generated example” plugin (`custom/cyber-clock`) that can be loaded and rendered like any other component.
- **FR-008**: Each plugin MUST include an isolated render verification (“visual test”) that demonstrates it renders in isolation.
- **FR-009**: The repository MUST include a minimal CLI that can scaffold a new plugin folder for a chosen category and name, producing a consistent starting structure.

#### Functional Requirement Acceptance Criteria (testable checks)

- **FR-001**: Given a valid `componentId` present in the registry, the host can request it and render the component without manual code changes per component.
- **FR-002**: Given only a static file server, the registry can be fetched and used to resolve a known `componentId` to a loadable location.
- **FR-003**: Given a component was loaded successfully once, the same component can be rendered again after disabling network access on the same device.
- **FR-004**: Given the registry is unavailable or a bundle load fails, the host shows an error state for that component and the rest of the page remains interactive.
- **FR-005**: When multiple plugins are loaded together, the host does not run multiple active copies of the same core shared libraries and the canvas remains stable (no crashes due to duplicate core dependencies).
- **FR-006**: The three standard components can be discovered by ID and each renders correctly in the host.
- **FR-007**: The AI example component can be discovered by ID and renders correctly in the host.
- **FR-008**: Each plugin has a single-plugin render verification that can be executed to confirm it renders in isolation.
- **FR-009**: The CLI can generate a plugin skeleton for a given category and name, and the generated output includes the expected structure plus the plugin’s isolated render verification.

### Key Entities *(include if feature involves data)*

- **Component Registry Entry**: Identifies a `componentId` and where its loadable bundle can be retrieved.
- **Plugin Bundle (Loadable Artifact)**: The separately deliverable component implementation that the host can load at runtime.
- **Local Cached Bundle**: A previously retrieved plugin bundle stored on a device for reuse without network.
- **Visual Test Artifact**: A plugin-local verification that the component renders in isolation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add and render each of the three standard components (rectangle, text, image) within 5 minutes from a fresh start.
- **SC-002**: After a component has been loaded once, the same component can be rendered again with the network disabled on the same device.
- **SC-003**: When a component fails to load, the rest of the page remains usable and the failure is visible and understandable to a non-developer.
- **SC-004**: A developer can generate a new plugin skeleton and get an isolated render verification running in under 10 minutes.

## Assumptions

- The host application(s) have an existing place where components are selected and rendered (e.g., editor canvas / preview).
- `componentId` values are globally unique and stable.
- The static registry is versioned and deployed alongside the host in a way that allows safe updates.

## Dependencies

- A deployment location exists for the registry artifact and component bundles.
- The host application has a stable way to surface component load errors to users without losing their work.

## Out of Scope

- A full plugin marketplace (search, ratings, payments, permissions, governance).
- Fine-grained access control/permissions for third-party plugins beyond basic safety isolation and error containment.
