# Implementation Plan: Projects CRUD API

**Branch**: `014-projects-crud-api` | **Date**: 2026-01-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/014-projects-crud-api/spec.md`

## Summary

Implement complete CRUD API for Projects entity. Projects are containers for dashboards and are scoped to tenants for multi-tenant isolation. The API follows REST conventions under `/api/v1/projects` with pagination support for listing, Zod validation for inputs, and cascade delete for associated dashboards.

## Technical Context

**Language/Version**: TypeScript 5.6 (Next.js 15)  
**Primary Dependencies**: Next.js 15, NextAuth 5 (beta), Prisma 5, Zod 3  
**Storage**: SQLite (dev) / PostgreSQL (prod) via Prisma ORM  
**Testing**: Manual API testing (test harness not yet established for server package)  
**Target Platform**: Node.js server (Next.js App Router)  
**Project Type**: Monorepo package (`packages/thingsvis-server`)  
**Performance Goals**: <1s response for list endpoint with 100 projects  
**Constraints**: Multi-tenant isolation mandatory; cascade delete for dashboards  
**Scale/Scope**: Initial MVP, single tenant hundreds of projects

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Micro-Kernel & Separation | ✅ PASS | Server package is separate from kernel; no UI dependencies |
| II. Schema-First Contracts (Zod) | ✅ PASS | Using Zod validators in `lib/validators/` |
| III. Type Safety | ✅ PASS | TypeScript strict mode; proper typing for API responses |
| IV. Backward Compatibility | ✅ PASS | New endpoints; no breaking changes |
| V. Simplicity & Performance | ✅ PASS | Standard CRUD; minimal abstraction |
| VI. Plugin Independence | N/A | Server-side feature; not plugin-related |

**Quality Gates**:
- `pnpm typecheck` must pass for `@thingsvis/server`
- Prisma schema already includes Project model with required fields

## Project Structure

### Documentation (this feature)

```text
specs/014-projects-crud-api/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI spec)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (packages/thingsvis-server)

```text
packages/thingsvis-server/
├── prisma/
│   └── schema.prisma           # Project model already exists
├── src/
│   ├── app/
│   │   └── api/
│   │       └── v1/
│   │           └── projects/
│   │               ├── route.ts        # GET (list), POST (create)
│   │               └── [id]/
│   │                   └── route.ts    # GET, PUT, DELETE
│   ├── lib/
│   │   ├── auth.ts                     # Existing auth setup
│   │   ├── auth-helpers.ts             # NEW: Session helper
│   │   ├── db.ts                       # Existing Prisma client
│   │   └── validators/
│   │       ├── auth.ts                 # Existing
│   │       └── project.ts              # NEW: Project schemas
│   └── types/
│       └── next-auth.d.ts              # Extended session types
```

**Structure Decision**: Follows existing Next.js App Router conventions established in auth routes. Validators in `lib/validators/`, API routes in `app/api/v1/`.

## Complexity Tracking

No constitution violations. Implementation uses established patterns from existing auth endpoints.
