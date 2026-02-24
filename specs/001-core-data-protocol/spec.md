# Feature Specification: Core Data Protocol and Kernel Interfaces

**Feature Branch**: `001-core-data-protocol`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "I need to implement the **Core Data Protocol** and **Kernel Interfaces** for ThingsVis."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define Page Structure Schema (Priority: P1)

Platform engineers and visualization developers need a standardized way to define page configurations with metadata, display settings, and component layouts so that pages can be serialized, validated, and shared across the platform.

**Why this priority**: Without a well-defined page schema, the platform cannot reliably store, validate, or exchange page definitions. This is the foundation for all visualization pages in the system.

**Independent Test**: Create a page definition object conforming to the schema, validate it against the schema definition, and confirm it passes validation with all required fields present and correctly typed. The schema should reject invalid configurations and accept valid ones.

**Acceptance Scenarios**:

1. **Given** a developer wants to create a new page, **When** they provide page metadata (id, name, scope), **Then** the system validates and accepts the page definition with a default version of "1.0.0".
2. **Given** a page definition includes display configuration (mode, dimensions, theme), **When** the configuration is validated, **Then** the system accepts valid enum values and numeric dimensions, rejecting invalid modes or negative dimensions.
3. **Given** a page definition includes a nodes array, **When** the nodes are validated, **Then** each node must conform to the component schema structure.

---

### User Story 2 - Define Component Structure Schema (Priority: P1)

Visualization developers need a standardized way to define visual components with identity, positioning, data bindings, properties, and event handlers so that components can be consistently created, configured, and rendered.

**Why this priority**: Components are the building blocks of visualizations. Without a standardized component schema, components cannot be reliably serialized, validated, or composed into pages.

**Independent Test**: Create a component definition object conforming to the schema, validate it against the schema definition, and confirm it includes all required fields (id, type, transform properties, data configuration). The schema should accept valid component definitions and reject those missing required fields.

**Acceptance Scenarios**:

1. **Given** a developer defines a visual component, **When** they provide identity fields (id, type, name), **Then** the system validates and accepts the component with optional locked and hidden flags defaulting to false.
2. **Given** a component includes transform properties (position, size, rotation), **When** the transform is validated, **Then** the system accepts numeric values for x, y, width, height, and rotation.
3. **Given** a component includes data configuration, **When** the data object is validated, **Then** the system accepts sourceId, topic, and transform script string.
4. **Given** a component includes props and events, **When** these are validated, **Then** the system accepts props as a flexible object and events as an array of trigger-action-payload objects.

---

### User Story 3 - Define Kernel Component Interface (Priority: P2)

Plugin developers need a standardized interface contract for visual components so they can create components that integrate seamlessly with the kernel's lifecycle management, rendering pipeline, and event system.

**Why this priority**: The kernel interface defines how components interact with the platform. Without this contract, plugins cannot reliably mount, update, resize, or unmount components, leading to inconsistent behavior and integration issues.

**Independent Test**: Create a component class that implements the kernel interface, instantiate it, and verify it exposes the required methods (mount, update, resize, unmount) with correct signatures. The interface should be type-safe and enable the kernel to manage component lifecycles.

**Acceptance Scenarios**:

1. **Given** a widget developer creates a visual component, **When** they implement the kernel interface, **Then** the component exposes mount, update, resize, and unmount methods that the kernel can call.
2. **Given** the kernel needs to mount a component, **When** it calls the mount method with an element and props, **Then** the component initializes and attaches to the provided element.
3. **Given** component properties change, **When** the kernel calls the update method, **Then** the component reflects the new property values.
4. **Given** the viewport or container size changes, **When** the kernel calls the resize method, **Then** the component adjusts its layout accordingly.
5. **Given** a component needs to be removed, **When** the kernel calls the unmount method, **Then** the component cleans up resources and detaches from the DOM.

---

### User Story 4 - Define Plugin Factory Interface (Priority: P2)

Plugin system developers need a standardized factory interface for creating component instances so that plugins can be dynamically loaded and instantiated by type identifier without requiring kernel recompilation.

**Why this priority**: The factory interface enables the widget architecture. Without it, the kernel cannot dynamically create component instances from loaded widgets, preventing the extensible plugin system from functioning.

**Independent Test**: Create a factory class that implements the widget factory interface, register it with the kernel, and verify the kernel can call the create method with a component type string to obtain a new component instance. The factory should return components that conform to the kernel interface.

**Acceptance Scenarios**:

1. **Given** a widget provides a factory implementation, **When** the kernel requests a component by type, **Then** the factory returns a component instance conforming to the kernel interface.
2. **Given** the kernel attempts to create an unknown component type, **When** the factory cannot create the component, **Then** the system handles the error gracefully without crashing.

---

### Edge Cases

- What happens when a page schema is missing required fields (id, version, name)?
- How does the system handle invalid enum values in page config (e.g., mode set to "invalid-mode")?
- What happens when component transform values are negative or exceed reasonable bounds?
- How does the system handle missing or malformed data configuration in components?
- What happens when a component type string doesn't match any registered widget factory?
- How does the system handle component mount failures (e.g., invalid element provided)?
- What happens when update or resize methods are called before mount?
- How does the system handle unmount being called multiple times on the same component?

## Requirements *(mandatory)*

**Constitution Alignment**: Confirm solutions respect monorepo boundaries (pnpm+Turbo), Rspack+MF2 builds, TS 5.x strict typing, schemas in `packages/thingsvis-schema` validated with Zod, renderer discipline (Leafer/React Three Fiber; no direct DOM), state via zustand+immer, performance targets (<800KB core bundle, ≥50 FPS where applicable), and ErrorBoundary wrapping for plugins/components.

### Functional Requirements

- **FR-001**: System MUST define a PageSchema that validates page metadata including id (uuid), version (default "1.0.0"), name, and scope (enum: 'app' | 'template').
- **FR-002**: System MUST define a PageSchema that validates page configuration including mode (enum: 'fixed' | 'infinite' | 'reflow'), width and height (numbers, default 1920x1080), and theme (enum: 'dark' | 'light' | 'auto').
- **FR-003**: System MUST define a PageSchema that validates page content as an array of VisualComponentSchema objects.
- **FR-004**: System MUST define a VisualComponentSchema that validates component identity including id, type (string), name, locked (boolean), and hidden (boolean).
- **FR-005**: System MUST define a VisualComponentSchema that validates component transform including x, y, width, height, and rotation (all numbers).
- **FR-006**: System MUST define a VisualComponentSchema that validates component data including sourceId, topic, and transform (script string).
- **FR-007**: System MUST define a VisualComponentSchema that validates component props as a flexible object (Record<string, any>).
- **FR-008**: System MUST define a VisualComponentSchema that validates component events as an array of objects with trigger, action, and payload fields.
- **FR-009**: System MUST export TypeScript types inferred from Zod schemas (e.g., IPage, IVisualComponentData) from the schema package.
- **FR-010**: System MUST define an IVisualComponent interface in the kernel package with methods: mount(el, props), update(props), resize(w, h), and unmount().
- **FR-011**: System MUST define an IWidgetFactory interface in the kernel package with a create(type) method that returns a component instance conforming to IVisualComponent.
- **FR-012**: System MUST ensure the kernel package imports and uses types from the schema package for type safety.

### Key Entities *(include if feature involves data)*

- **Page**: Represents a complete visualization page configuration containing metadata (id, version, name, scope), display configuration (mode, dimensions, theme), and an array of visual components. Pages can be serialized, validated, and shared across the platform.

- **Visual Component**: Represents a single visual element within a page, containing identity information (id, type, name, visibility flags), spatial transform (position, size, rotation), data binding configuration (source, topic, transform script), component-specific properties, and event handlers. Components are the building blocks that compose pages.

- **Component Instance**: A runtime instance of a visual component that implements the kernel interface, enabling the kernel to manage its lifecycle (mount, update, resize, unmount). Instances are created by plugin factories and managed by the kernel.

- **Plugin Factory**: A factory object that creates component instances by type identifier. Factories enable dynamic plugin loading and component instantiation without kernel recompilation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can create valid page definitions that pass schema validation on first attempt 95% of the time when following documented examples.
- **SC-002**: Developers can create valid component definitions that pass schema validation on first attempt 95% of the time when following documented examples.
- **SC-003**: Schema validation rejects invalid page definitions (missing required fields, invalid enum values, wrong types) with clear error messages in 100% of test cases.
- **SC-004**: Schema validation rejects invalid component definitions (missing required fields, invalid transform values, malformed data config) with clear error messages in 100% of test cases.
- **SC-005**: TypeScript types inferred from schemas provide compile-time type safety, catching type errors before runtime in 100% of cases where types are used correctly.
- **SC-006**: Kernel interfaces enable plugin developers to create components that integrate with kernel lifecycle management without requiring kernel modifications.
- **SC-007**: All exported types from the schema package are usable by the kernel package without circular dependencies or import errors.

## Assumptions

- UUID format for page and component IDs follows standard UUID v4 specification.
- Component type strings are case-sensitive identifiers (e.g., 'echarts-bar', 'custom-widget').
- Transform rotation values are in degrees (0-360 range).
- Data transform scripts are provided as strings and will be evaluated by a separate runtime system (not part of this feature).
- Component props are flexible key-value pairs that vary by component type.
- Event trigger strings are component-specific and will be defined by individual component implementations.
- Default page dimensions (1920x1080) represent a standard desktop/console display resolution.
- The kernel will handle element mounting/unmounting, but component implementations are responsible for their own rendering logic.
- Plugin factories will be registered with the kernel through a separate mechanism (not part of this feature).
