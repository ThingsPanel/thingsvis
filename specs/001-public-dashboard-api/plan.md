# Implementation Plan: Public Dashboard Access API

**Branch**: `001-public-dashboard-api` | **Date**: January 22, 2026 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-public-dashboard-api/spec.md`

## Summary

Implement public dashboard sharing capability allowing authenticated users to publish dashboards and generate share links that enable anonymous visitors to view dashboard content. The implementation uses Next.js API routes with Prisma ORM, leveraging existing Dashboard model fields (`isPublished`, `shareToken`, `shareConfig`).

## Technical Context

**Language/Version**: TypeScript 5.6+ / Node.js 20+
**Primary Dependencies**: Next.js 15, Prisma 5.22, Zod 3.23, nanoid (for token generation)
**Storage**: PostgreSQL via Prisma (existing Dashboard model with sharing fields)
**Testing**: Manual API testing (no test framework configured yet)
**Target Platform**: Next.js API routes (server-side)
**Project Type**: Monorepo - `packages/thingsvis-server`
**Performance Goals**: < 200ms API response time for public dashboard access
**Constraints**: Must work without authentication for public access endpoint
**Scale/Scope**: Support 100+ concurrent visitors per shared dashboard

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Micro-Kernel & Separation of Concerns | ✅ PASS | API routes in server package, no kernel dependencies |
| II. Schema-First Contracts (Zod) | ✅ PASS | Using Zod for request validation schemas |
| III. Type Safety & Predictability | ✅ PASS | TypeScript strict mode, typed Prisma models |
| IV. Backward Compatibility | ✅ PASS | New endpoints, no breaking changes to existing APIs |
| V. Simplicity & Performance | ✅ PASS | Minimal viable feature slice, direct DB queries |
| VI. Plugin Independence | N/A | Server-side feature, not plugin-related |

**Pre-Phase 0 Gate**: ✅ PASSED - No violations

**Post-Phase 1 Re-check**: ✅ PASSED
- OpenAPI contract defined in `contracts/public-dashboard-api.yaml`
- Data model documented using existing Prisma schema
- No new abstractions introduced
- Follows existing API patterns from dashboards CRUD

## Project Structure

### Documentation (this feature)

```text
specs/001-public-dashboard-api/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   └── public-dashboard-api.yaml
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
packages/thingsvis-server/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── v1/
│   │           ├── dashboards/
│   │           │   └── [id]/
│   │           │       ├── route.ts          # Existing CRUD
│   │           │       ├── publish/
│   │           │       │   └── route.ts      # NEW: Publish/unpublish
│   │           │       └── share/
│   │           │           └── route.ts      # NEW: Generate share link
│   │           └── public/
│   │               └── dashboard/
│   │                   └── [token]/
│   │                       └── route.ts      # NEW: Public access
│   └── lib/
│       ├── db.ts                             # Existing Prisma client
│       ├── auth-helpers.ts                   # Existing session helper
│       └── validators/
│           ├── dashboard.ts                  # Existing validators
│           └── share.ts                      # NEW: Share validators
├── prisma/
│   └── schema.prisma                         # Dashboard model (already has sharing fields)
└── package.json                              # Add nanoid dependency
```

**Structure Decision**: Extend existing `thingsvis-server` package with new API routes following established Next.js App Router conventions.

## Complexity Tracking

> No constitution violations - table not required.
