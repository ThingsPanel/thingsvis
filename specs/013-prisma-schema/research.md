# Research: Prisma Schema Definition

**Feature**: 013-prisma-schema  
**Date**: January 22, 2026  
**Status**: Complete

## Research Tasks

### 1. SQLite Limitations for Cross-Database Compatibility

**Task**: Research SQLite limitations and workarounds for Prisma schema that must support both SQLite and PostgreSQL.

**Decision**: Use String types for enum-like fields; use String for JSON storage

**Rationale**:
- SQLite does not support native `enum` types - Prisma would fail on `db push`
- SQLite does not support `JSONB` - must use plain `String` and handle serialization in application code
- SQLite does not support native array types - must serialize arrays as JSON strings

**Alternatives Considered**:
- Use PostgreSQL-only features with conditional schema → Rejected: Adds complexity, breaks local dev simplicity
- Use separate schema files per database → Rejected: Maintenance burden, drift risk
- Use database-agnostic types only → **Selected**: Simple, works everywhere

**Implementation Notes**:
- `plan` field: Use `String @default("FREE")` instead of `enum Plan { FREE PRO ENTERPRISE }`
- `role` field: Use `String @default("VIEWER")` instead of `enum Role { OWNER ADMIN EDITOR VIEWER }`
- JSON fields (`canvasConfig`, `nodes`, `dataSources`, `settings`, `shareConfig`): Use `String` type
- Application layer must handle JSON.stringify/JSON.parse

### 2. Prisma Best Practices for Multi-Tenant Architecture

**Task**: Research Prisma patterns for multi-tenant data isolation.

**Decision**: Use `tenantId` foreign key on all tenant-scoped models with application-level filtering

**Rationale**:
- Row-Level Security (RLS) is PostgreSQL-specific, not portable to SQLite
- Separate databases per tenant adds operational complexity for MVP
- Schema-based multi-tenancy requires PostgreSQL `search_path` manipulation
- Application-level filtering is simplest and works on all databases

**Alternatives Considered**:
- PostgreSQL RLS policies → Rejected: SQLite incompatible
- Database-per-tenant → Rejected: Operational overhead for MVP
- Schema-per-tenant → Rejected: PostgreSQL-specific
- Application-level filtering via `tenantId` → **Selected**: Portable, simple

**Implementation Notes**:
- All queries must include `WHERE tenantId = :tenantId` or equivalent Prisma filter
- Create helper functions to inject tenant context automatically
- Index `tenantId` on all tenant-scoped tables for query performance

### 3. Prisma Cascade Delete Configuration

**Task**: Research referential actions for parent-child relationships.

**Decision**: Use `onDelete: Cascade` for ownership relationships

**Rationale**:
- Tenant → Users: When tenant is deleted, all users should be removed
- Tenant → Projects: When tenant is deleted, all projects should be removed
- Project → Dashboards: When project is deleted, all dashboards should be removed
- Dashboard → Versions: When dashboard is deleted, version history should be removed
- This maintains data integrity and prevents orphaned records

**Alternatives Considered**:
- `onDelete: SetNull` → Rejected: Would orphan records, requires nullable FKs
- `onDelete: Restrict` → Rejected: Would require manual cascading in application
- `onDelete: Cascade` → **Selected**: Automatic cleanup, maintains integrity

**Implementation Notes**:
- User → Project/Dashboard uses no cascade (creator reference should not delete content if user is deleted)
- Consider soft deletes for audit trails in future iterations (out of scope for MVP)

### 4. Prisma ID Generation Strategy

**Task**: Research ID generation options for Prisma.

**Decision**: Use `cuid()` for all primary keys

**Rationale**:
- `cuid()` generates collision-resistant, URL-safe IDs without coordination
- Works identically on SQLite and PostgreSQL
- Shorter than UUIDs (25 chars vs 36 chars)
- Sortable by creation time (roughly)

**Alternatives Considered**:
- Auto-increment integers → Rejected: Exposes record count, not portable
- UUID v4 (`uuid()`) → Rejected: Longer, not sortable
- ULID → Rejected: Not built into Prisma
- cuid() → **Selected**: Built-in, portable, URL-safe

### 5. Index Strategy for Query Performance

**Task**: Research which fields need database indexes.

**Decision**: Index foreign keys and frequently queried fields

**Rationale**:
- `tenantId` on Project: All project queries filter by tenant
- `projectId` on Dashboard: Dashboard listings filter by project
- `shareToken` on Dashboard: Public access lookups by token
- `email` on User: Already has `@unique` which creates an index
- `slug` on Tenant: Already has `@unique` which creates an index

**Alternatives Considered**:
- Index everything → Rejected: Slows writes, uses space unnecessarily
- No explicit indexes → Rejected: Query performance degrades at scale
- Selective indexing on query patterns → **Selected**: Balanced approach

## Summary

All research tasks complete. No NEEDS CLARIFICATION items remain in Technical Context.

| Topic | Decision | Confidence |
|-------|----------|------------|
| Enum handling | String with app validation | High |
| JSON storage | String with app serialization | High |
| Multi-tenancy | Application-level filtering | High |
| Cascade deletes | onDelete: Cascade for ownership | High |
| ID generation | cuid() | High |
| Indexing | FKs + query patterns | High |
