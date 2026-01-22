# Phase 0 Research: Initialize thingsvis-server Package

## Decision 1: Use Next.js 15 App Router with minimal `src/app` layout
- **Decision**: Create a minimal App Router structure with `src/app/layout.tsx` and `src/app/page.tsx` and keep UI minimal.
- **Rationale**: App Router requires a root layout and supports route handlers for future APIs. A minimal page confirms the server is running without introducing UI scope creep.
- **Alternatives considered**:
  - API-only setup without a root page (less clear operational signal for devs).
  - Pages Router (legacy, not aligned with Next.js 15 default).

## Decision 2: Enable standalone output in Next.js config
- **Decision**: Set `output: 'standalone'` in `next.config.js`.
- **Rationale**: Standalone output produces a minimal production server bundle and is suitable for containerized or isolated deployments.
- **Alternatives considered**:
  - Default output with `next start` (requires full `node_modules` at runtime).
  - Static export (not compatible with server APIs).

## Decision 3: Prisma with SQLite for development; plan for PostgreSQL in production
- **Decision**: Configure Prisma with SQLite datasource for development and document PostgreSQL as the production target.
- **Rationale**: SQLite offers fast local iteration with zero infrastructure; PostgreSQL remains the production standard.
- **Alternatives considered**:
  - Use PostgreSQL in dev for full parity (more setup overhead).
  - Maintain separate Prisma schemas per provider (adds maintenance cost).

## Decision 4: Prisma client generation as part of build workflow
- **Decision**: Include `db:generate` script and ensure Prisma client is generated before build in the Turborepo pipeline.
- **Rationale**: Prisma client must exist for TypeScript to compile and for runtime imports to resolve.
- **Alternatives considered**:
  - Commit generated Prisma client (risk of drift).
  - Generate only in CI (breaks local workflows).

## Decision 5: TypeScript strict mode with `@/*` path alias
- **Decision**: Enable strict mode and define `@/*` path alias pointing to `./src/*`.
- **Rationale**: Strict typing improves correctness; path aliases keep imports consistent and maintainable.
- **Alternatives considered**:
  - Disable strict mode initially (increases future refactor cost).
  - Use relative imports exclusively (lower maintainability).

## Decision 6: Turborepo integration using standard build/dev tasks
- **Decision**: Keep `build`, `dev`, `lint`, and `typecheck` tasks compatible with existing Turborepo pipeline.
- **Rationale**: Aligns with monorepo conventions and keeps the package in the shared task graph.
- **Alternatives considered**:
  - Custom task names (would require pipeline updates and reduce standardization).
