# Feature Specification: Dashboards CRUD API

**Feature Branch**: `015-dashboards-crud-api`  
**Created**: 2026-01-22  
**Status**: Draft  
**Priority**: P0 (Core functionality)  
**Input**: User description: "Dashboards CRUD API - Users need to create, read, update, and delete dashboards. Dashboards contain canvas configuration, node data, and data source configuration."

## Problem Statement

Users need the ability to manage dashboards within projects. Each dashboard stores the visual canvas configuration, the nodes/widgets placed on the canvas, and the data source configurations that feed data to those widgets. This is a foundational capability required for the dashboard editor to persist and retrieve user work.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List Dashboards in a Project (Priority: P1)

As a user, I can view all dashboards within a specific project so that I can browse and select the dashboard I want to work with.

**Why this priority**: Users must be able to see existing dashboards before they can open, edit, or manage them. This is the entry point for all dashboard interactions.

**Independent Test**: Can be fully tested by making a GET request with a valid projectId and verifying the returned list contains expected dashboard summaries.

**Acceptance Scenarios**:

1. **Given** a project with 3 dashboards exists, **When** I request the dashboard list for that project, **Then** I receive a list containing all 3 dashboards with their basic info (id, name, createdAt, updatedAt)
2. **Given** a project with no dashboards exists, **When** I request the dashboard list for that project, **Then** I receive an empty list with no errors
3. **Given** an invalid projectId is provided, **When** I request the dashboard list, **Then** I receive a 400 Bad Request error with a clear message

---

### User Story 2 - Create a New Dashboard (Priority: P1)

As a user, I can create a new dashboard within a project so that I have a blank canvas to design my visualization.

**Why this priority**: Creating dashboards is equally critical as listing them - users need to be able to start new work. This enables the core creation workflow.

**Independent Test**: Can be fully tested by sending a POST request with dashboard details and verifying the dashboard is created with correct default values.

**Acceptance Scenarios**:

1. **Given** a valid project exists, **When** I create a new dashboard with a name, **Then** the dashboard is created with default canvas configuration and empty nodes/dataSources
2. **Given** a valid project exists, **When** I create a new dashboard with initial canvas configuration, **Then** the dashboard is created with the specified configuration
3. **Given** I provide an invalid projectId, **When** I attempt to create a dashboard, **Then** I receive a 400 Bad Request error
4. **Given** I omit the required name field, **When** I attempt to create a dashboard, **Then** I receive a 400 Bad Request error indicating the missing field

---

### User Story 3 - Retrieve Dashboard Full Data (Priority: P1)

As a user, I can retrieve the complete data for a specific dashboard so that I can load it into the editor for viewing or editing.

**Why this priority**: This is essential for opening dashboards in the editor. Without this, users cannot work on existing dashboards.

**Independent Test**: Can be fully tested by requesting a known dashboard ID and verifying all canvas config, nodes, and data sources are returned correctly.

**Acceptance Scenarios**:

1. **Given** a dashboard exists with canvas config, nodes, and data sources, **When** I request the dashboard by ID, **Then** I receive the complete dashboard data including all three components
2. **Given** a dashboard ID that does not exist, **When** I request the dashboard, **Then** I receive a 404 Not Found error
3. **Given** a valid dashboard exists, **When** I request it, **Then** the canvasConfig, nodes, and dataSources are returned as properly parsed JSON objects (not strings)

---

### User Story 4 - Update Dashboard (Priority: P2)

As a user, I can save my changes to a dashboard so that my work is persisted and I don't lose my progress.

**Why this priority**: While critical for the complete workflow, users must first be able to create and view dashboards before updates become meaningful.

**Independent Test**: Can be fully tested by updating a dashboard's nodes and verifying the changes are persisted and version history is created.

**Acceptance Scenarios**:

1. **Given** an existing dashboard, **When** I update the canvas configuration, **Then** the changes are saved and the updatedAt timestamp is refreshed
2. **Given** an existing dashboard, **When** I update the nodes array, **Then** the new nodes are persisted correctly
3. **Given** an existing dashboard, **When** I update the data sources, **Then** the new data source configurations are persisted
4. **Given** any update to a dashboard, **When** the update succeeds, **Then** a version history entry is automatically created for rollback purposes
5. **Given** a dashboard ID that does not exist, **When** I attempt to update it, **Then** I receive a 404 Not Found error
6. **Given** invalid data format for canvasConfig/nodes/dataSources, **When** I attempt to update, **Then** I receive a 400 Bad Request error with validation details

---

### User Story 5 - Delete Dashboard (Priority: P3)

As a user, I can delete a dashboard so that I can remove dashboards I no longer need.

**Why this priority**: Deletion is important for maintenance but is typically used less frequently than create/read/update operations.

**Independent Test**: Can be fully tested by deleting a dashboard and verifying it no longer appears in the list and cannot be retrieved.

**Acceptance Scenarios**:

1. **Given** an existing dashboard, **When** I delete it, **Then** the dashboard is removed and no longer appears in the project's dashboard list
2. **Given** a dashboard ID that does not exist, **When** I attempt to delete it, **Then** I receive a 404 Not Found error
3. **Given** I delete a dashboard, **When** the deletion succeeds, **Then** the associated version history records are also removed

---

### Edge Cases

- What happens when the projectId does not exist? → Return 400 Bad Request with "Project not found" message
- What happens when JSON data (canvasConfig/nodes/dataSources) exceeds storage limits? → Return 400 Bad Request with "Payload too large" message
- What happens when canvasConfig/nodes/dataSources contain malformed JSON? → Return 400 Bad Request with validation error details
- What happens when concurrent updates occur to the same dashboard? → Last write wins (standard behavior), updatedAt reflects most recent change
- What happens when a user tries to create a dashboard with a duplicate name in the same project? → Allow duplicates (names are not unique identifiers)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an endpoint to list all dashboards for a given project (GET /api/v1/dashboards?projectId=xxx)
- **FR-002**: System MUST provide an endpoint to create a new dashboard (POST /api/v1/dashboards)
- **FR-003**: System MUST provide an endpoint to retrieve a single dashboard with full data (GET /api/v1/dashboards/:id)
- **FR-004**: System MUST provide an endpoint to update a dashboard (PUT /api/v1/dashboards/:id)
- **FR-005**: System MUST provide an endpoint to delete a dashboard (DELETE /api/v1/dashboards/:id)
- **FR-006**: System MUST store canvasConfig, nodes, and dataSources as JSON strings in the database
- **FR-007**: System MUST parse JSON strings to objects when returning dashboard data to clients
- **FR-008**: System MUST validate request payloads using Zod schema validation
- **FR-009**: System MUST automatically create a version history entry when a dashboard is updated
- **FR-010**: System MUST return appropriate HTTP status codes (200, 201, 400, 404, 500)
- **FR-011**: System MUST validate that the referenced projectId exists before creating a dashboard
- **FR-012**: System MUST update the updatedAt timestamp on every successful update

### Non-Functional Requirements

- **NFR-001**: All endpoints MUST require valid authentication (session-based)
- **NFR-002**: Responses MUST be returned within acceptable web application response times
- **NFR-003**: Error messages MUST be user-friendly and not expose internal system details

### Key Entities

- **Dashboard**: Represents a single dashboard screen containing visualization configuration
  - id: Unique identifier
  - name: Human-readable name for the dashboard
  - projectId: Reference to the parent project
  - canvasConfig: JSON object containing canvas settings (mode, width, height, background)
  - nodes: JSON array of NodeSchema objects representing widgets/components on the canvas
  - dataSources: JSON array of DataSourceConfig objects for data bindings
  - createdAt: Timestamp of creation
  - updatedAt: Timestamp of last modification

- **DashboardVersion**: Historical snapshot of dashboard state for version control
  - id: Unique identifier
  - dashboardId: Reference to the parent dashboard
  - snapshot: Complete dashboard data at time of save
  - createdAt: Timestamp when version was created

- **CanvasConfig**: Configuration object for the dashboard canvas
  - mode: Display mode (e.g., "fixed", "responsive")
  - width: Canvas width in pixels
  - height: Canvas height in pixels
  - background: Background color or image reference

## Data Format Reference

### Canvas Configuration
```json
{
  "mode": "fixed",
  "width": 1920,
  "height": 1080,
  "background": "#1a1a2e"
}
```

### Nodes (from @thingsvis/schema NodeSchema[])
An array of node/widget objects as defined in the thingsvis-schema package.

### Data Sources (DataSourceConfig[])
An array of data source configuration objects defining data bindings for widgets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new dashboard and see it in the project's dashboard list within 2 seconds
- **SC-002**: Users can retrieve a dashboard with 100 nodes and 10 data sources within 3 seconds
- **SC-003**: Users can save dashboard changes and receive confirmation within 2 seconds
- **SC-004**: All CRUD operations return appropriate error messages for invalid inputs with 100% coverage
- **SC-005**: Version history is automatically created for every update, enabling future rollback capability
- **SC-006**: Dashboard list endpoint supports projects with up to 100 dashboards without pagination issues

## Assumptions

- Authentication and session management are already implemented (via NextAuth)
- The Project entity and CRUD operations already exist (from 014-projects-crud-api)
- The Prisma schema already includes the Dashboard model or will be extended
- The NodeSchema type is available from @thingsvis/schema package
- Version history implementation stores complete snapshots (not incremental diffs)
- No soft delete requirement - dashboards are permanently removed on deletion

## Out of Scope

- Dashboard sharing or collaboration features
- Real-time collaborative editing
- Dashboard templates or cloning
- Export/import functionality
- Dashboard access permissions beyond project membership
- Pagination for dashboard list (can be added later if needed)
- Dashboard search or filtering by name
