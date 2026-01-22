# Feature Specification: Define Database Schema with Prisma

**Feature Branch**: `013-prisma-schema`  
**Created**: January 22, 2026  
**Status**: Draft  
**Input**: User description: "Define core data models for multi-tenant, project management, dashboard storage with SQLite/PostgreSQL dual mode support"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define Core Data Models (Priority: P1)

As a developer, I can define tenants, users, projects, and dashboards in Prisma schema so that the application has a solid data foundation for multi-tenancy and dashboard management.

**Why this priority**: This is the foundational data layer. Without defined data models, no other backend functionality (authentication, APIs, storage) can be built. Every subsequent feature depends on these models existing.

**Independent Test**: Can be fully tested by running `pnpm db:push` and verifying all tables are created in the database. Delivers a working database schema that other features can build upon.

**Acceptance Scenarios**:

1. **Given** the Prisma schema file exists, **When** a developer runs `pnpm db:push`, **Then** all tables (tenants, users, projects, dashboards, dashboard_versions) are created successfully
2. **Given** the schema defines relationships, **When** inspected via Prisma Studio, **Then** foreign key relationships between entities are correctly established

---

### User Story 2 - Run Database Migrations (Priority: P2)

As a developer, I can run migrations to create or update the database so that schema changes are applied consistently across development and production environments.

**Why this priority**: Migrations enable iterative schema changes and ensure consistency between environments. This is essential for team collaboration and deployment workflows.

**Independent Test**: Can be fully tested by running `pnpm db:push` (development) or migration commands. Delivers a versioned, repeatable database setup process.

**Acceptance Scenarios**:

1. **Given** a fresh development environment, **When** a developer runs `pnpm db:push`, **Then** the SQLite database file is created with all defined tables
2. **Given** an existing database, **When** schema changes are pushed, **Then** the database structure is updated without data loss (where possible)

---

### User Story 3 - Support JSON Storage for Canvas Data (Priority: P3)

As a developer, the schema supports JSON-like storage for canvas configuration and nodes data so that complex nested structures can be persisted without rigid column definitions.

**Why this priority**: Dashboard data (canvas config, nodes, data sources) is inherently flexible and nested. JSON storage allows storing this without complex relational decomposition.

**Independent Test**: Can be fully tested by inserting a dashboard record with JSON strings for canvasConfig and nodes fields, then retrieving and parsing them. Delivers flexible data storage for visualization data.

**Acceptance Scenarios**:

1. **Given** a Dashboard model with JSON string fields, **When** canvas configuration is saved as a JSON string, **Then** the data is stored and can be retrieved and parsed correctly
2. **Given** SQLite database (development), **When** JSON data is stored, **Then** it is saved as a plain string (since SQLite lacks native JSONB)

---

### Edge Cases

- What happens when SQLite is used but enum types are expected? → Use String type with application-level validation instead of database enums
- How does system handle JSONB storage on SQLite? → Store as plain String and serialize/deserialize JSON in application code
- What happens when a tenant is deleted? → Cascade delete all related users, projects, and dashboards
- What happens when a project is deleted? → Cascade delete all related dashboards and their versions
- How are unique constraints handled? → Email must be unique globally; tenant slug must be unique; SSO provider+subject combination must be unique

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Schema MUST define a Tenant model with id, name, slug, plan, settings, and timestamps
- **FR-002**: Schema MUST define a User model with id, email, name, passwordHash, avatar, role, SSO fields, tenant relationship, and timestamps
- **FR-003**: Schema MUST define a Project model with id, name, description, thumbnail, tenant relationship, creator relationship, and timestamps
- **FR-004**: Schema MUST define a Dashboard model with id, name, version, canvasConfig, nodes, dataSources, publishing fields, sharing fields, project relationship, creator relationship, and timestamps
- **FR-005**: Schema MUST define a DashboardVersion model for version history with id, version, canvas data, dashboard relationship, and timestamp
- **FR-006**: Schema MUST use String type instead of enum for fields like plan, role (to support SQLite)
- **FR-007**: Schema MUST use String type for JSON data storage (canvasConfig, nodes, dataSources, settings, shareConfig)
- **FR-008**: Schema MUST define proper indexes on frequently queried fields (tenantId, projectId, shareToken)
- **FR-009**: Schema MUST configure cascade delete for parent-child relationships (Tenant→Users/Projects, Project→Dashboards, Dashboard→Versions)
- **FR-010**: Schema MUST define unique constraints on email, tenant slug, shareToken, and SSO provider+subject combination
- **FR-011**: Schema MUST use cuid() for generating unique identifiers
- **FR-012**: Schema MUST support both SQLite (development) and PostgreSQL (production) through datasource configuration

### Key Entities

- **Tenant**: Represents an organization/workspace for multi-tenant isolation. Contains name, unique slug, subscription plan, and custom settings. Has many Users and Projects.
- **User**: Represents a person who can access the system. Belongs to one Tenant. Has email (unique), optional password hash, role within tenant (OWNER, ADMIN, EDITOR, VIEWER), optional SSO credentials. Can create Projects and Dashboards.
- **Project**: Represents a container/folder for organizing dashboards. Belongs to one Tenant, created by one User. Has name, description, thumbnail. Contains many Dashboards.
- **Dashboard**: Represents a single visualization/screen. Belongs to one Project, created by one User. Stores canvas configuration, nodes array, and data sources as JSON strings. Supports versioning, publishing status, and sharing via token. Has many DashboardVersions.
- **DashboardVersion**: Represents a historical snapshot of a Dashboard. Stores version number and complete canvas/nodes/dataSources data at that point in time. Enables rollback and version comparison.

## Assumptions

- Development environment uses SQLite for simplicity and zero-config setup
- Production environment will use PostgreSQL for better performance and native JSONB support
- User roles (OWNER, ADMIN, EDITOR, VIEWER) are validated at application level, not database level
- Plan types (FREE, PRO, ENTERPRISE) are validated at application level
- JSON fields are serialized/deserialized in application code, not at database layer
- The database URL is provided via environment variable (DATABASE_URL)
- First user in a tenant automatically becomes OWNER (handled by application logic, not schema)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can run `pnpm db:push` and have all 5 tables created within 10 seconds
- **SC-002**: Developer can view all tables and their relationships in Prisma Studio within 5 seconds of running `pnpm db:studio`
- **SC-003**: All foreign key relationships pass integrity checks when inserting related records
- **SC-004**: 100% of defined models are queryable via Prisma Client after running `pnpm db:generate`
- **SC-005**: Schema supports storing and retrieving JSON data (as strings) for dashboard configuration without data corruption
