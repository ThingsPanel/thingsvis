# Implementation Plan: User Registration API

**Branch**: `001-user-registration-api` | **Date**: 2026-01-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-user-registration-api/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a user registration API endpoint that allows new users to create accounts with email and password. The system automatically creates a tenant for the first user (assigning OWNER role) or allows joining an existing tenant (with VIEWER role). Passwords are hashed using bcrypt (cost 12) and validated via Zod schemas.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS  
**Primary Dependencies**: Next.js 15 (App Router), Prisma 5.22, bcryptjs 3.x, Zod 3.23, NextAuth.js 5 beta  
**Storage**: SQLite (development) / PostgreSQL (production) via Prisma ORM  
**Testing**: Manual API testing (integration tests can be added later)  
**Target Platform**: Linux server (Docker), local development on Windows  
**Project Type**: Web API (monorepo package)  
**Performance Goals**: Registration completes in < 3 seconds (per SC-001)  
**Constraints**: bcrypt cost factor 12, password minimum 8 characters, email RFC 5322 validation  
**Scale/Scope**: Single API endpoint, 2 new files, integration with existing auth infrastructure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Micro-Kernel & Separation | ✅ PASS | Server package is separate from kernel; no UI dependencies |
| II. Schema-First (Zod) | ✅ PASS | Using Zod for request validation; User/Tenant already in Prisma schema |
| III. Type Safety | ✅ PASS | TypeScript strict mode enabled; typed request/response |
| IV. Backward Compatibility | ✅ PASS | New endpoint; no breaking changes |
| V. Simplicity & Performance | ✅ PASS | Minimal feature slice; single endpoint |
| VI. Plugin Independence | ✅ N/A | Server-side API, not plugin-related |

**Gate Result**: ✅ PASSED - All principles satisfied, no violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-user-registration-api/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI spec)
│   └── register.yaml
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
packages/thingsvis-server/
├── prisma/
│   └── schema.prisma       # Existing - User, Tenant models
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts    # Existing NextAuth handler
│   │       └── v1/
│   │           ├── health/
│   │           │   └── route.ts    # Existing
│   │           └── auth/
│   │               └── register/
│   │                   └── route.ts  # NEW - Registration endpoint
│   ├── lib/
│   │   ├── auth.ts         # Existing NextAuth config
│   │   ├── db.ts           # Existing Prisma singleton
│   │   └── validators/
│   │       └── auth.ts     # NEW - Zod schemas
│   └── types/
│       └── next-auth.d.ts  # Existing type extensions
└── package.json
```

**Structure Decision**: Extends existing thingsvis-server package with new API endpoint under `/api/v1/auth/register`. Validators organized in `src/lib/validators/` following established pattern.

## Complexity Tracking

> No violations requiring justification - all principles passed.
