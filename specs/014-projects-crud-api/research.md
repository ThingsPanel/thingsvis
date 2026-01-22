# Research: Projects CRUD API

**Feature**: 014-projects-crud-api  
**Date**: 2026-01-22

## Research Summary

All technical context items resolved. No external research required - implementation uses established patterns from existing codebase.

## Decisions

### 1. Session Helper Pattern

**Decision**: Create `auth-helpers.ts` with `getSessionUser()` function  
**Rationale**: Centralizes session retrieval and null-checking; consistent with patterns in other projects  
**Alternatives considered**:
- Inline `auth()` calls in each route → rejected (code duplication, inconsistent null handling)
- Middleware-only authentication → rejected (need user context in route handlers)

### 2. Validation Schema Location

**Decision**: Create `lib/validators/project.ts` alongside existing `auth.ts`  
**Rationale**: Follows established pattern in codebase; keeps validators colocated by domain  
**Alternatives considered**:
- Inline Zod schemas in route files → rejected (not reusable, harder to test)
- Separate `schemas/` directory → rejected (overkill for current scale; existing pattern uses `validators/`)

### 3. Pagination Implementation

**Decision**: Query params `page` (1-indexed) and `limit` with defaults (page=1, limit=20)  
**Rationale**: Standard REST convention; matches spec requirements  
**Alternatives considered**:
- Cursor-based pagination → rejected (unnecessary complexity for current scale)
- Offset-based with `skip`/`take` → decided (aligns with Prisma API)

### 4. Multi-tenant Isolation

**Decision**: Filter by `tenantId` from session in all queries; return 404 for cross-tenant access  
**Rationale**: Prevents information disclosure (existence leakage); follows security best practice  
**Alternatives considered**:
- Return 403 for cross-tenant access → rejected (reveals resource exists)
- Separate tenant validation middleware → rejected (simpler inline in route)

### 5. Cascade Delete Implementation

**Decision**: Rely on Prisma schema `onDelete: Cascade` for Dashboard→Project relationship  
**Rationale**: Database-level cascade is atomic and reliable; already configured in schema  
**Alternatives considered**:
- Application-level cascade in transaction → rejected (Prisma cascade already handles this)

### 6. Response Format

**Decision**: 
- List: `{ data: Project[], meta: { page, limit, total, totalPages } }`
- Single: Direct Project object
- Error: `{ error: string, details?: any }`

**Rationale**: Matches spec requirements; consistent with existing auth endpoints  
**Alternatives considered**:
- Wrap single responses in `{ data: Project }` → rejected (unnecessary nesting; spec allows direct object)

### 7. Next.js 15 Dynamic Route Params

**Decision**: Use `{ params }: { params: Promise<{ id: string }> }` pattern  
**Rationale**: Next.js 15 requires async params in App Router  
**Alternatives considered**:
- Synchronous params → incompatible with Next.js 15

## Existing Infrastructure Verified

| Component | Location | Status |
|-----------|----------|--------|
| Prisma Project model | `prisma/schema.prisma` | ✅ Complete with all required fields |
| Prisma Dashboard model | `prisma/schema.prisma` | ✅ Has `onDelete: Cascade` to Project |
| Auth setup | `lib/auth.ts` | ✅ Session includes `tenantId` and `id` |
| Prisma client | `lib/db.ts` | ✅ Singleton pattern |
| Validator pattern | `lib/validators/auth.ts` | ✅ Zod schema example |
| API route pattern | `app/api/v1/auth/register/route.ts` | ✅ Example for error handling |

## Open Questions

None - all technical decisions resolved.
