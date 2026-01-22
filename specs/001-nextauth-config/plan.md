# Implementation Plan: Configure NextAuth.js for Authentication

**Branch**: `001-nextauth-config` | **Date**: January 22, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-nextauth-config/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement NextAuth.js v5 (Auth.js) authentication for thingsvis-server with email/password credentials provider, JWT-based sessions, and middleware protection for API routes. Session tokens will include user id, email, role, and tenantId for multi-tenant authorization.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS  
**Primary Dependencies**: Next.js 15 (App Router), NextAuth.js v5 (Auth.js), Prisma ORM, bcryptjs, zod  
**Storage**: SQLite (dev) / PostgreSQL (prod) via Prisma - User and Tenant models already exist  
**Testing**: Manual API testing (no test harness for server yet)  
**Target Platform**: Node.js server (Next.js App Router)
**Project Type**: Monorepo package (packages/thingsvis-server)  
**Performance Goals**: Login completion < 3 seconds, 401 response < 100ms  
**Constraints**: JWT strategy only (no database sessions), bcrypt cost factor 12  
**Scale/Scope**: Single-tenant MVP, extensible to SSO providers later

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Micro-Kernel & Separation | ✅ PASS | Auth is server-side only, no kernel dependencies |
| II. Schema-First Contracts | ✅ PASS | User/Tenant models exist in Prisma schema, session types defined in next-auth.d.ts |
| III. Type Safety | ✅ PASS | TypeScript strict mode, next-auth.d.ts type augmentation for Session/JWT/User |
| IV. Backward Compatibility | ✅ PASS | New capability, no existing auth to break |
| V. Simplicity & Performance | ✅ PASS | Minimal viable auth slice, standard NextAuth.js patterns |
| VI. Plugin Independence | ✅ N/A | Server package, not plugin-related |

**Gate Result**: ✅ All gates pass

**Post-Design Re-evaluation (Phase 1)**:
- ✅ No new dependencies on kernel packages
- ✅ OpenAPI contract defined in `contracts/auth-api.yaml`
- ✅ Type augmentation pattern follows NextAuth.js official documentation
- ✅ No breaking changes to existing functionality

## Project Structure

### Documentation (this feature)

```text
specs/001-nextauth-config/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── auth-api.yaml    # OpenAPI spec for auth endpoints
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/thingsvis-server/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts    # NextAuth API handler
│   │   └── (existing pages)
│   ├── lib/
│   │   ├── db.ts                   # Prisma client singleton
│   │   └── auth.ts                 # NextAuth configuration
│   └── types/
│       └── next-auth.d.ts          # Type augmentation for session
├── middleware.ts                    # Auth middleware for route protection
├── prisma/
│   └── schema.prisma               # (existing) User/Tenant models
└── .env                            # AUTH_SECRET, AUTH_URL
```

**Structure Decision**: Adding auth files to existing thingsvis-server package structure. Uses Next.js App Router conventions with `src/lib/` for shared utilities and `src/types/` for type declarations.

## Complexity Tracking

> No constitution violations - table not required.
