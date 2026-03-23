#!/bin/sh
set -e

echo "=== ThingsVis Server Starting ==="

# Apply database schema (create tables if not exist)
echo ">>> Applying database schema..."
cd apps/server
prisma db push --skip-generate

# Seed default admin account (idempotent upsert)
echo ">>> Seeding initial data..."
tsx scripts/seed.ts

cd /app

export AUTH_TRUST_HOST="${AUTH_TRUST_HOST:-true}"

echo ">>> Starting Next.js server..."
exec node apps/server/server.js
