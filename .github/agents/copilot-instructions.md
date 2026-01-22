# thingsvis Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-21

## Active Technologies
- TypeScript 5.6+, Node.js 20 LTS + Prisma 5.22+, @prisma/client 5.22+ (013-prisma-schema)
- SQLite (development), PostgreSQL (production) (013-prisma-schema)
- TypeScript 5.x, Node.js 20 LTS + Next.js 15 (App Router), NextAuth.js v5 (Auth.js), Prisma ORM, bcryptjs, zod (001-nextauth-config)
- SQLite (dev) / PostgreSQL (prod) via Prisma - User and Tenant models already exist (001-nextauth-config)
- TypeScript 5.x (strict mode), Node.js 20 LTS + Next.js 15 (App Router), Prisma 5.22, bcryptjs 3.x, Zod 3.23, NextAuth.js 5 beta (001-user-registration-api)
- SQLite (development) / PostgreSQL (production) via Prisma ORM (001-user-registration-api)
- TypeScript 5.6 (Next.js 15) + Next.js 15, NextAuth 5 (beta), Prisma 5, Zod 3 (014-projects-crud-api)
- SQLite (dev) / PostgreSQL (prod) via Prisma ORM (014-projects-crud-api)
- SQLite (dev) / PostgreSQL (prod) via Prisma ORM; JSON fields stored as strings (015-dashboards-crud-api)

- TypeScript 5.x (Node.js 20 LTS) + Next.js 15 (App Router), Prisma ORM, React 19, Zod (012-init-server-package)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x (Node.js 20 LTS): Follow standard conventions

## Recent Changes
- 015-dashboards-crud-api: Added TypeScript 5.6 (Next.js 15) + Next.js 15, NextAuth 5 (beta), Prisma 5, Zod 3
- 014-projects-crud-api: Added TypeScript 5.6 (Next.js 15) + Next.js 15, NextAuth 5 (beta), Prisma 5, Zod 3
- 001-user-registration-api: Added TypeScript 5.x (strict mode), Node.js 20 LTS + Next.js 15 (App Router), Prisma 5.22, bcryptjs 3.x, Zod 3.23, NextAuth.js 5 beta


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
