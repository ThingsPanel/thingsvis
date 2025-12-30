# Feature Specification: Superset 风格优先的数据配置与绑定

**Feature Branch**: `007-widget-style`  
**Created**: 2025-12-30  
**Status**: Draft  
**Input**: Upgrade ThingsVis’s data binding UX to be “Superset-style first”: users primarily bind via selecting a data source and fields (no manual expressions), while still supporting `{{ ... }}` as an advanced fallback.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bind text via Field Picker (Priority: P1)

As a Studio user building a canvas/dashboard, I can select a data source and pick a field to drive the **Text** content of the basic text component, without writing expressions.

**Why this priority**: This is the smallest closed loop that proves the “Superset-style first” workflow: data source → field selection → component renders.

**Independent Test**: Can be fully tested by creating one text component, binding its text to a field from a chosen data source, and verifying the canvas renders the expected value and the property panel clearly indicates the binding.

**Acceptance Scenarios**:

1. **Given** a canvas with a basic text component and at least one data source available, **When** the user opens the property panel and binds the text field using a Field Picker, **Then** the text component displays the selected field’s value.
2. **Given** the text field is currently bound, **When** the user changes the selected field (or switches to a different data source) via the Field Picker, **Then** the rendered text updates to reflect the new selection.

---

### User Story 2 - Bind style properties with clear override state (Priority: P2)

As a Studio user, I can keep style properties (e.g., fill color, font size) as static by default, and optionally switch them to a binding mode so they can be driven by a chosen field.

**Why this priority**: It validates the key UX requirement that each property can be static by default yet clearly indicates when a binding overrides it.

**Independent Test**: Can be tested by switching a style property between static and bound states, confirming the panel shows the current mode, and ensuring the canvas rendering matches.

**Acceptance Scenarios**:

1. **Given** a basic text component with default static styles, **When** the user switches `fill` from static to field-bound and selects a field, **Then** the panel shows `fill` is bound and the rendered fill follows the selected field.
2. **Given** a property is bound, **When** the user switches it back to static and sets a value, **Then** the panel shows it is static and the rendered output uses the static value.

---

### User Story 3 - Advanced fallback to expressions (Priority: P3)

As an advanced user, I can use expression syntax `{{ ... }}` as a fallback binding method for cases the Field Picker or mapping cannot express.

**Why this priority**: It protects existing power-user workflows and reduces adoption risk.

**Independent Test**: Can be tested by binding at least one property via `{{ ... }}` and confirming it renders correctly while the panel still communicates that the property is expression-driven.

**Acceptance Scenarios**:

1. **Given** a property that supports expression fallback, **When** the user enters a `{{ ... }}` expression, **Then** the property resolves and the rendered output matches the expression result.

---

### Edge Cases

- Binding references a data source that was deleted or is unavailable.
- Selected field path no longer exists (schema changed, renamed field, etc.).
- Selected field value is missing/empty or has an unexpected type for the target property.
- Data source snapshot updates while the user is editing properties (ensure predictable refresh behavior).
- Expression `{{ ... }}` fails to evaluate (show a clear error state and preserve the last valid rendering if available).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST treat “Data Source” as a global entity that can be referenced by multiple components.
- **FR-002**: System MUST allow a component to consume a stable “data source snapshot” for rendering (no direct coupling to editing-time configuration fields).
- **FR-003**: System MUST provide a Field Picker workflow that lets users bind a property to a selected data source + field without writing expressions.
- **FR-004**: System MUST represent field bindings using a stable, inspectable reference (e.g., a canonical path format such as `ds.<id>.data.<path>`).
- **FR-005**: System MUST support expression syntax `{{ ... }}` as an advanced fallback binding option.
- **FR-006**: System MUST allow each bindable property to declare supported binding strategies, including at minimum: static value, field binding, and expression binding.
- **FR-007**: System MUST allow component authors to declare their editable properties via a “Controls / panel definition” that includes grouping (Content/Style/Data/Advanced), control type (e.g., number/color/select/text), default value, and supported binding strategies.
- **FR-008**: Studio MUST generate the property panel from the component’s declared Controls (not by hand-authoring per-component panel fields).
- **FR-009**: Studio MUST clearly display, for each property, whether it is currently static or overridden by a binding (and which binding strategy is active).
- **FR-010**: System MUST provide a “field mapping” capability so users can map data source fields into component-relevant inputs (starting with the basic text component’s `text` value for the MVP).
- **FR-011**: Existing saved pages/projects MUST continue to render and edit correctly without requiring migration.
- **FR-012**: The new binding and control-declaration capabilities MUST be adoptable incrementally (components can opt in without breaking non-upgraded components).

### Acceptance Criteria

- **AC-001 (FR-001)**: A single data source can be selected and reused across multiple components on the same canvas.
- **AC-002 (FR-002)**: Rendering uses a consistent snapshot view; editing configuration does not require rewriting component properties to embed data directly.
- **AC-003 (FR-003)**: For at least one property (basic text content), a user can bind via Field Picker without entering an expression.
- **AC-004 (FR-004)**: A bound property can be inspected to reveal the chosen data source and field reference.
- **AC-005 (FR-005)**: A property can be bound via `{{ ... }}` and produces a rendered value.
- **AC-006 (FR-006)**: At least one property supports switching between static, field binding, and expression binding.
- **AC-007 (FR-007)**: A component can declare its editable properties with group, control type, defaults, and allowed binding strategies.
- **AC-008 (FR-008)**: The property panel renders controls based on the component’s declared Controls, without per-component hard-coded panel fields for the MVP component.
- **AC-009 (FR-009)**: The property panel indicates binding status for each relevant field (static vs overridden) in a way users can identify at a glance.
- **AC-010 (FR-010)**: The basic text component supports mapping at least one field into its rendered text.
- **AC-011 (FR-011)**: Existing saved pages/projects open and render without requiring user action.
- **AC-012 (FR-012)**: A non-upgraded component still renders and can be edited without the new Controls/binding features.

### Key Entities *(include if feature involves data)*

- **Data Source**: A globally defined source of structured data available for binding.
- **Data Source Snapshot**: The data view consumed by a component during rendering.
- **Field Reference**: A stable pointer to a specific field in a data source (e.g., via a canonical path).
- **Binding**: A rule that determines how a property’s value is derived (static / field / expression / rule).
- **Controls Definition**: A component-declared schema describing editable properties, UI grouping, input control types, defaults, and allowed binding strategies.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can bind the basic text component’s `text` to a data source field in under 60 seconds on first attempt.
- **SC-002**: At least 90% of test users can complete the “bind text via Field Picker” flow without using `{{ ... }}`.
- **SC-003**: For the MVP sample (basic text), the property panel’s “static vs bound” status matches the rendered outcome 100% of the time across the acceptance scenarios.
- **SC-004**: Existing saved pages/projects load and render with no observable regressions attributable to this feature (0 new blocking issues in regression testing).

## Assumptions

- This feature targets Studio users building canvases/dashboards and plugin authors defining component controls.
- “Superset-style first” means the primary workflow does not require expressions; expressions remain available but are not required for the MVP.
- The MVP scope is limited to proving the workflow using the basic text component as the reference implementation.
