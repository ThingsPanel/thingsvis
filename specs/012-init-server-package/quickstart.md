# Quickstart: thingsvis-server

## Prerequisites
- Node.js 20 LTS
- pnpm

## Install
From repo root:

1. Install dependencies:
   - `pnpm install`

## Run Development Server
From repo root:

1. Start the server:
   - `pnpm dev --filter @thingsvis/server`
2. Open: http://localhost:3001

## Prisma (Development)
From the package directory:

1. Create a local env file:
   - Copy `.env.example` to `.env`
2. Generate Prisma client:
   - `pnpm db:generate`
3. Initialize database:
   - `pnpm db:push`

## Build
From repo root:

1. Build the package:
   - `pnpm build --filter @thingsvis/server`

## Notes
- SQLite is used for development; PostgreSQL is the production target.
- The minimal Prisma model is a placeholder until the database schema feature is implemented.
