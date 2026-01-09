# Feature Specification: Studio Toolbar Basic Tools

**Feature Branch**: `001-toolbar-basic-nodes`  
**Created**: 2026-01-09  
**Status**: Draft  
**Input**: User description: "实现编辑器 app/studio 工具栏的四个基础组件：矩形、圆形、文本、图片；支持点击工具后在画布上拖拽创建；矩形/圆形/文本归类 basic，图片归类 media；需要参考竞品交互并进行解耦后择优方案。"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Create basic shapes from toolbar (Priority: P1)

As a canvas editor user, I can choose Rectangle or Circle from the Studio toolbar and create an element by dragging on the canvas, so I can quickly build a layout.

**Why this priority**: Shapes are the most common building blocks and unlock immediate value for layout and composition.

**Independent Test**: Can be fully tested by selecting Rectangle/Circle and creating one or more shapes on a blank canvas with correct size/position behavior.

**Acceptance Scenarios**:

1. **Given** an open canvas, **When** I click the Rectangle tool and drag on the canvas, **Then** a rectangle is created within the dragged bounds and is selected after creation.
2. **Given** an open canvas with the Circle tool active, **When** I click on the canvas without dragging, **Then** a circle is created at the click location with a reasonable default size and is selected.
3. **Given** the Rectangle tool is active, **When** I press Escape before releasing the mouse button during a drag, **Then** creation is canceled and no new element is added.
4. **Given** the Rectangle tool is active, **When** I drag on the canvas, **Then** I see a live preview of the rectangle bounds before I release the mouse button.
5. **Given** the Rectangle tool is active, **When** I create a rectangle and then immediately drag again, **Then** a second rectangle is created without re-selecting the tool.
6. **Given** the component catalog is visible, **When** I browse the “Basic” category, **Then** I can find Rectangle, Circle, and Text tools/components; **And When** I browse the “Media” category, **Then** I can find Image.

---

### User Story 2 - Create and edit text (Priority: P2)

As a canvas editor user, I can choose Text from the Studio toolbar and create a text element, so I can label and annotate the visualization.

**Why this priority**: Text is essential for readability, labeling, and UI-like layouts.

**Independent Test**: Can be fully tested by creating a text element and verifying its default content is visible and editable via the standard property panel flow.

**Acceptance Scenarios**:

1. **Given** an open canvas, **When** I click the Text tool and click on the canvas, **Then** a text element is created at the click location with default content visible and is selected after creation.
2. **Given** the Text tool is active, **When** I drag to create a text box area, **Then** the text element uses the dragged area as its initial bounds.
3. **Given** a text element is selected, **When** I update its text content via the standard property panel, **Then** the text on the canvas updates accordingly.

---

### User Story 3 - Place an image on the canvas (Priority: P3)

As a canvas editor user, I can choose Image from the Studio toolbar and place an image element on the canvas, so I can compose visuals with external assets.

**Why this priority**: Images are common in dashboards and presentations, but depend on asset input; this is slightly more complex than shapes/text.

**Independent Test**: Can be fully tested by selecting an image asset and placing an image element on the canvas with correct placement behavior.

**Acceptance Scenarios**:

1. **Given** an open canvas, **When** I click the Image tool and choose a valid image asset, **Then** I can place the image on the canvas by clicking or dragging, and the image element is created and selected.
2. **Given** the Image tool is active, **When** I cancel the image selection flow, **Then** no image element is created and the editor remains usable.
3. **Given** an image element is created, **When** I undo the last action, **Then** the image element is removed from the canvas.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Drag area is extremely small (near-zero width/height): creation results in a minimum usable size or is treated as a click-to-create default size.
- Creation is started but canceled (Escape) mid-drag: no partial element remains.
- Tool is active and user clicks on UI chrome (toolbar/panels) instead of canvas: no canvas element is created.
- Image selection fails (unsupported format, corrupted file, permission denied): a clear, user-facing error is shown and no element is created.
- Very large images: placement still succeeds and editor remains responsive for the initial placement action.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

#### Tool Catalog & Categorization

- **FR-001**: Studio toolbar MUST provide four creation tools: Rectangle, Circle, Text, and Image.
- **FR-002**: Rectangle, Circle, and Text MUST appear in the editor’s “Basic” component category.
- **FR-003**: Image MUST appear in the editor’s “Media” component category.

#### Shared Creation Interaction Model

- **FR-004**: When a creation tool is selected, the editor MUST enter a creation mode where user input on the canvas creates the corresponding element.
- **FR-005**: In creation mode, click-and-drag on the canvas MUST create an element whose initial position and size correspond to the dragged bounds.
- **FR-006**: In creation mode, clicking on the canvas without dragging MUST create an element at the click location using a defined default size.
- **FR-006a**: Default size for Rectangle MUST be 120×80 (canvas units).
- **FR-006b**: Default size for Circle MUST be 100×100 (canvas units).
- **FR-006c**: Default size for Text MUST be 200×40 (canvas units).
- **FR-006d**: Default size for Image MUST fit within a 240×240 bounding box while preserving the asset’s aspect ratio.
- **FR-007**: During click-and-drag creation, the editor MUST provide a visible preview of the element being created.
- **FR-008**: Pressing Escape during an in-progress creation gesture MUST cancel the creation and MUST NOT add an element.
- **FR-009**: After an element is successfully created, that element MUST become the current selection.
- **FR-010**: The editor MUST allow repeated creation of elements with the currently selected tool without requiring re-selecting the tool.

#### Text-Specific Behavior

- **FR-011**: The Text element MUST render a visible default text string when created (so it is discoverable).
- **FR-012**: Users MUST be able to change the Text element’s content via the editor’s existing property editing workflow.

#### Image-Specific Behavior

- **FR-013**: When the Image tool is used, the editor MUST provide a user flow to choose an image asset before placement on the canvas.
- **FR-014**: If the user cancels image asset selection, the editor MUST NOT create an image element.
- **FR-015**: If image asset selection fails due to invalid/unsupported input, the editor MUST show a user-facing error and MUST NOT create an image element.

#### Undo/Redo Integration

- **FR-016**: Creating Rectangle, Circle, Text, or Image MUST be undoable as a single user action.
- **FR-017**: Undoing a creation MUST remove the created element; redoing MUST restore it.

### Key Entities *(include if feature involves data)*

- **Creation Tool**: A selectable toolbar option representing an element type (Rectangle, Circle, Text, Image) and its creation behavior.
- **Canvas Element**: A visual object placed on the canvas with attributes such as position, size, and type.
- **Text Content**: The user-editable string content associated with a Text element.
- **Image Asset Reference**: A reference to a chosen image resource used by an Image element.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: A first-time user can create a rectangle, a circle, and a text element on a blank canvas in under 60 seconds without external guidance.
- **SC-002**: At least 95% of creation attempts result in exactly one correctly placed element (no duplicates, no partial artifacts) during manual QA of the primary flows.
- **SC-003**: Users can cancel an in-progress creation gesture (Escape) with zero residual elements in 100% of tested cases.
- **SC-004**: Users can place an image (select asset → place on canvas) in under 30 seconds for a typical image file during manual QA.

## Assumptions

- The editor already has a concept of a “canvas”, “selection”, and “undo/redo”.
- “Circle” refers to a circular/elliptical shape tool; the creation gesture defines the initial bounds.
- The image tool’s “choose asset” flow is available to end-users in the Studio environment (exact source may vary), and cancellation is supported.
- Out of scope: advanced typography controls, shape/image cropping, asset management libraries, keyboard shortcut design beyond Escape-to-cancel.
