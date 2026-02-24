#!/bin/sh
set -e

echo "=== ThingsVis Server Starting ==="

# Run database migrations/push on startup
echo ">>> Applying database schema..."
cd apps/server
npx prisma db push --skip-generate
cd /app

echo ">>> Starting Next.js server..."
exec node apps/server/server.js
