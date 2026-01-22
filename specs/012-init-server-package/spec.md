# Feature Specification: Initialize thingsvis-server Package

**Feature Branch**: `012-init-server-package`  
**Created**: January 21, 2026  
**Status**: Draft  
**Input**: User description: "Initialize thingsvis-server Package - Create Next.js 15 backend service with Prisma ORM, supporting REST API, database persistence, and user authentication foundation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Backend Development Server (Priority: P1)

As a developer, I can navigate to the thingsvis-server package and run `pnpm dev` to start the backend development server, allowing me to immediately begin API development.

**Why this priority**: This is the foundational capability - without a working dev server, no other backend features can be developed or tested.

**Independent Test**: Can be fully tested by running `cd packages/thingsvis-server && pnpm dev` and verifying the server starts and responds to HTTP requests on the configured port.

**Acceptance Scenarios**:

1. **Given** the thingsvis-server package is properly configured, **When** I run `pnpm dev` in the package directory, **Then** the Next.js development server starts successfully and displays the startup message with the local URL.
2. **Given** the development server is running, **When** I access the root URL in a browser, **Then** I see a welcome page confirming the server is operational.
3. **Given** the development server is running, **When** I make changes to source files, **Then** the server hot-reloads automatically.

---

### User Story 2 - Monorepo Build Integration (Priority: P1)

As a developer, the server package integrates seamlessly with the existing Turborepo build system, so I can build all packages together using standard monorepo commands.

**Why this priority**: Critical for maintaining consistent development workflow across the entire ThingsVis project - developers expect unified build commands.

**Independent Test**: Can be fully tested by running `pnpm build` from the root directory and verifying thingsvis-server is included in the build pipeline.

**Acceptance Scenarios**:

1. **Given** I am in the monorepo root, **When** I run `pnpm build`, **Then** thingsvis-server is built along with other packages in the correct dependency order.
2. **Given** thingsvis-server has dependencies on other workspace packages, **When** I run `turbo run build`, **Then** dependencies are built before thingsvis-server.
3. **Given** I am in the monorepo root, **When** I run `pnpm dev --filter=thingsvis-server`, **Then** only the server package starts in development mode.

---

### User Story 3 - Database Connection Verification (Priority: P2)

As a developer, I can verify that the Prisma ORM is properly configured and can connect to the SQLite database for local development.

**Why this priority**: Database connectivity is essential for any data persistence features, but comes after basic server functionality.

**Independent Test**: Can be fully tested by running `pnpm prisma db push` and verifying the schema is applied to the database.

**Acceptance Scenarios**:

1. **Given** the Prisma schema is defined, **When** I run `pnpm prisma generate`, **Then** the Prisma client is generated without errors.
2. **Given** the SQLite database does not exist, **When** I run `pnpm prisma db push`, **Then** the database file is created and schema is applied.
3. **Given** the database is initialized, **When** I run `pnpm prisma studio`, **Then** I can browse the database schema in the Prisma Studio UI.

---

### User Story 4 - TypeScript Strict Mode Development (Priority: P2)

As a developer, I work with TypeScript strict mode enabled and proper path aliases, ensuring code quality and maintainable imports.

**Why this priority**: Type safety prevents bugs but is secondary to having a working server foundation.

**Independent Test**: Can be fully tested by running TypeScript type checking and verifying strict mode catches type errors.

**Acceptance Scenarios**:

1. **Given** the tsconfig.json has strict mode enabled, **When** I write code with implicit `any` types, **Then** the TypeScript compiler reports an error.
2. **Given** path aliases are configured, **When** I import using `@/` prefix, **Then** the import resolves correctly to the src directory.
3. **Given** the TypeScript configuration is complete, **When** I run `pnpm tsc --noEmit`, **Then** type checking passes with no errors.

---

### Edge Cases

- What happens when the port 3001 is already in use? The server should display a clear error message and suggest an alternative port.
- How does the system handle missing environment variables? The server should fail fast with a descriptive error listing missing required variables.
- What happens when the SQLite database file is corrupted? Prisma should report the error and the developer can delete the file to recreate it.
- How does the system handle Prisma schema migration conflicts? The developer should run `prisma migrate reset` for development or resolve conflicts manually.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Package MUST be located at `packages/thingsvis-server` within the monorepo structure.
- **FR-002**: Package MUST be registered in `pnpm-workspace.yaml` for proper monorepo integration.
- **FR-003**: Package MUST include a `dev` script that starts the Next.js development server.
- **FR-004**: Package MUST include a `build` script that creates a production build.
- **FR-005**: Package MUST use Next.js 15 with App Router architecture (using `src/app` directory).
- **FR-006**: Package MUST have Prisma ORM configured with a schema file at `prisma/schema.prisma`.
- **FR-007**: Package MUST use SQLite as the default development database.
- **FR-008**: Package MUST have TypeScript strict mode enabled in `tsconfig.json`.
- **FR-009**: Package MUST configure path alias `@/*` to resolve to `./src/*`.
- **FR-010**: Package MUST be included in `turbo.json` with appropriate build and dev pipeline tasks.
- **FR-011**: Package MUST include a basic health check endpoint accessible at the root path.
- **FR-012**: Package MUST use Node.js 20 LTS compatible configurations.
- **FR-013**: Package MUST include Prisma client generation as part of the build process.

### Key Entities

- **Package Configuration**: Defines the package metadata, scripts, and dependencies required for the backend service.
- **Database Schema**: The Prisma schema defining the data model structure (initially minimal, to be extended).
- **Application Layout**: The root Next.js layout component that wraps all pages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can start the development server within 30 seconds of cloning the repository (after dependencies are installed).
- **SC-002**: Running `pnpm dev` in packages/thingsvis-server successfully starts the server and the root page is accessible.
- **SC-003**: Running `pnpm build` from monorepo root successfully builds thingsvis-server along with other packages.
- **SC-004**: Prisma client can be generated and database can be initialized using standard Prisma commands.
- **SC-005**: TypeScript compilation with `tsc --noEmit` passes with zero errors and zero warnings.
- **SC-006**: Path aliases work correctly - imports using `@/` prefix compile without errors.
- **SC-007**: The package appears in Turborepo's dependency graph and respects build order.

## Assumptions

- The monorepo already uses pnpm as the package manager.
- Turborepo is already configured as the build orchestration tool.
- Developers have Node.js 20 LTS installed locally.
- The default development server port will be 3001 (to avoid conflicts with frontend apps typically on 3000).
- SQLite is acceptable for local development; PostgreSQL configuration for production is out of scope for this initialization task.
- Authentication implementation is out of scope - this feature only sets up the foundation for future auth work.
