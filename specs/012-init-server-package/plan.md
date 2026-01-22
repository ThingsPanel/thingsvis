# Implementation Plan: Initialize thingsvis-server Package

**Branch**: 012-init-server-package | **Date**: January 21, 2026 | **Spec**: [specs/012-init-server-package/spec.md](specs/012-init-server-package/spec.md)
**Input**: Feature specification from [specs/012-init-server-package/spec.md](specs/012-init-server-package/spec.md)

## Summary

Initialize a new `packages/thingsvis-server` Next.js 15 App Router backend package with Prisma (SQLite for development, PostgreSQL for production), TypeScript strict mode, and monorepo integration through pnpm workspaces and Turborepo tasks. Produce minimal app structure, Prisma schema, and developer quickstart documentation.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 LTS)  
**Primary Dependencies**: Next.js 15 (App Router), Prisma ORM, React 19, Zod  
**Storage**: SQLite (development), PostgreSQL (production)  
**Testing**: N/A (no automated tests in this initialization scope)  
**Target Platform**: Node.js server (local dev and production deployments)  
**Project Type**: Web application (backend service package within monorepo)  
**Performance Goals**: N/A (foundation setup only)  
**Constraints**: pnpm workspaces, Turborepo build system, TypeScript strict mode, Prisma client generation required  
**Scale/Scope**: Single new package with minimal layout, Prisma config, and startup scripts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Micro‑Kernel & Separation of Concerns**: PASS (new backend package does not touch kernel/UI boundaries)
- **II. Schema‑First Contracts (Zod)**: PASS (no cross-package runtime schemas in this setup scope)
- **III. Type Safety & Predictability**: PASS (TypeScript strict mode enabled)
- **IV. Backward Compatibility & Incremental Adoption**: PASS (additive package, no breaking changes)
- **V. Simplicity & Performance**: PASS (minimal setup only)
- **VI. Plugin Independence & Third‑Party Development**: PASS (no plugin changes)
- **Additional Constraints**: PASS (fits pnpm/turbo boundaries)
- **Quality Gates**: PASS (typecheck/lint tasks supported by configuration)

## Project Structure

### Documentation (this feature)

```text
specs/012-init-server-package/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/thingsvis-server/
├── package.json
├── tsconfig.json
├── next.config.js
├── prisma/
│   └── schema.prisma
└── src/
    └── app/
        ├── layout.tsx
        └── page.tsx
```

**Structure Decision**: Web application package under packages/thingsvis-server using Next.js App Router with a minimal `src/app` layout and Prisma schema in `prisma/`.

## Phase 0: Research

- Output: [specs/012-init-server-package/research.md](specs/012-init-server-package/research.md)
- Scope: Next.js 15 App Router setup, Prisma with SQLite dev/Postgres prod, Turborepo integration practices

## Phase 1: Design & Contracts

- Data model: [specs/012-init-server-package/data-model.md](specs/012-init-server-package/data-model.md)
- API contracts: [specs/012-init-server-package/contracts/health.openapi.yaml](specs/012-init-server-package/contracts/health.openapi.yaml)
- Quickstart: [specs/012-init-server-package/quickstart.md](specs/012-init-server-package/quickstart.md)

## Post-Design Constitution Check

- **I. Micro‑Kernel & Separation of Concerns**: PASS
- **II. Schema‑First Contracts (Zod)**: PASS
- **III. Type Safety & Predictability**: PASS
- **IV. Backward Compatibility & Incremental Adoption**: PASS
- **V. Simplicity & Performance**: PASS
- **VI. Plugin Independence & Third‑Party Development**: PASS
- **Additional Constraints**: PASS
- **Quality Gates**: PASS

## Complexity Tracking

No constitution violations or complexity exceptions identified for this foundation setup.
