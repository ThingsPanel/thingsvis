# Implementation Plan: Define Database Schema with Prisma

**Branch**: `013-prisma-schema` | **Date**: January 22, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/013-prisma-schema/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Define core Prisma data models (Tenant, User, Project, Dashboard, DashboardVersion) to support multi-tenant architecture, project management, and dashboard storage. The schema must support SQLite for development and PostgreSQL for production, using String types for enums and JSON storage to maintain cross-database compatibility.

## Technical Context

**Language/Version**: TypeScript 5.6+, Node.js 20 LTS  
**Primary Dependencies**: Prisma 5.22+, @prisma/client 5.22+  
**Storage**: SQLite (development), PostgreSQL (production)  
**Testing**: Manual verification via `pnpm db:push` and Prisma Studio  
**Target Platform**: Node.js server (Next.js 15 backend)
**Project Type**: Monorepo package (packages/thingsvis-server)  
**Performance Goals**: Schema operations complete in <10 seconds  
**Constraints**: Must support SQLite (no enum, no JSONB, no array types)  
**Scale/Scope**: Multi-tenant SaaS supporting multiple dashboards per project

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-Design | Post-Design | Notes |
|-----------|------------|-------------|-------|
| I. Micro-Kernel & Separation | ✅ PASS | ✅ PASS | Database schema is backend-only, no UI dependencies |
| II. Schema-First Contracts | ✅ PASS | ✅ PASS | Prisma schema defines data contracts; runtime validation via Zod at API layer |
| III. Type Safety | ✅ PASS | ✅ PASS | Prisma generates TypeScript types; strict mode enabled |
| IV. Backward Compatibility | ✅ PASS | ✅ PASS | New schema, no existing data to migrate |
| V. Simplicity & Performance | ✅ PASS | ✅ PASS | Minimal viable models for MVP; no over-engineering |
| VI. Plugin Independence | N/A | N/A | Database schema not used by plugins |

**Gate Status**: ✅ PASSED (Pre-Design) → ✅ PASSED (Post-Design)

**Post-Design Verification**:
- Data model follows Prisma best practices for SQLite/PostgreSQL compatibility
- No new dependencies or abstractions introduced beyond Prisma
- Schema is minimal and focused on MVP requirements
- All JSON fields documented with TypeScript interfaces for type safety at API layer

## Project Structure

### Documentation (this feature)

```text
specs/013-prisma-schema/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output - N/A for this feature (Prisma IS the contract)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/thingsvis-server/
├── prisma/
│   └── schema.prisma    # PRIMARY: Prisma schema definition (this feature)
├── src/
│   ├── app/             # Next.js App Router
│   └── lib/             # Shared utilities (future: db.ts client singleton)
├── package.json         # Scripts: db:generate, db:push, db:migrate, db:studio
├── tsconfig.json
└── .env                 # DATABASE_URL configuration
```

**Structure Decision**: This feature modifies the existing `packages/thingsvis-server/prisma/schema.prisma` file. The server package was created in a previous setup task (P0-1). No new directories needed.

## Complexity Tracking

> No complexity violations. Feature is straightforward schema definition.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | - | - |
