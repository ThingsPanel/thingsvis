# Research: Dashboards CRUD API

**Feature**: 015-dashboards-crud-api  
**Date**: 2026-01-22

## Research Questions Resolved

### 1. JSON Storage Strategy

**Decision**: Store canvasConfig, nodes, and dataSources as JSON strings in the database.

**Rationale**: 
- Prisma with SQLite does not support native JSON types
- Maintains dev/prod parity (SQLite dev, PostgreSQL prod)
- String storage is sufficient for retrieval and updates
- JSON parsing happens at the API layer, not database layer

**Alternatives Considered**:
- PostgreSQL-only JSON type: Rejected because it breaks SQLite development workflow
- Separate normalized tables for nodes: Rejected due to complexity; nodes are opaque to the server

### 2. Version History Implementation

**Decision**: Create full snapshots of dashboard state (canvasConfig, nodes, dataSources) on each update.

**Rationale**:
- Simplicity: No diff calculation or merge logic needed
- Exact rollback: Any version can be restored completely
- Storage is acceptable for MVP scale (hundreds of dashboards, tens of versions each)

**Alternatives Considered**:
- Incremental diffs: Rejected due to complexity of JSON diff/patch operations
- Event sourcing: Rejected as overkill for MVP requirements

### 3. API Pattern for Listing

**Decision**: Use query parameter `?projectId=xxx` on `/api/v1/dashboards` endpoint.

**Rationale**:
- Consistent with common REST patterns
- Allows listing all dashboards across projects (admin use case)
- Simpler than nested routes `/projects/:id/dashboards`

**Alternatives Considered**:
- Nested route under projects: Rejected to keep route structure flat and consistent
- Required projectId: Rejected to allow cross-project listing if needed

### 4. Validation Approach

**Decision**: Use Zod schemas with flexible `z.any()` for complex JSON fields (nodes, dataSources).

**Rationale**:
- Server doesn't need to validate node/dataSource internal structure
- Schema validation happens at the schema package level (@thingsvis/schema)
- Keeps API layer simple and forward-compatible

**Alternatives Considered**:
- Full Zod schema for nodes: Rejected because NodeSchema is defined in @thingsvis/schema and would create circular dependency
- No validation: Rejected; still need to validate name, projectId, basic structure

### 5. Multi-tenant Isolation

**Decision**: Filter dashboards through project's tenantId relation.

**Rationale**:
- Dashboard → Project → Tenant relationship enforces isolation
- Consistent with projects API pattern
- Single source of truth for tenant membership

**Alternatives Considered**:
- Direct tenantId on Dashboard: Rejected as redundant; project already has tenantId
- Application-level filtering only: Rejected; database-level filtering is more secure

## Dependencies Confirmed

| Dependency | Version | Purpose | Status |
|------------|---------|---------|--------|
| Next.js | 15.x | App Router, API routes | ✅ Existing |
| Prisma | 5.x | ORM, database access | ✅ Existing |
| Zod | 3.x | Schema validation | ✅ Existing |
| NextAuth | 5.x beta | Session management | ✅ Existing |

## Existing Code Patterns

### Projects API (reference implementation)
- Location: `src/app/api/v1/projects/`
- Patterns: getSessionUser(), prisma queries, Zod validation, pagination
- Response format: `{ data: [...], meta: { page, limit, total, totalPages } }`

### Auth Helpers
- `getSessionUser()` returns user with `id`, `tenantId`, `email`, `name`, `role`
- Returns `null` if no valid session

### Database Client
- Global Prisma client at `@/lib/db`
- Singleton pattern for development hot reload

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large JSON payloads | Medium | Performance | Document size limits; future pagination for nodes |
| Concurrent updates | Low | Data loss | Last-write-wins is acceptable for MVP; future: optimistic locking |
| Version table growth | Medium | Storage | Future: implement version cleanup policy |
