#!/bin/sh
set -e

echo "=== ThingsVis Server Starting ==="

# Run database migrations/push on startup
echo ">>> Applying database schema..."
cd apps/server
npx prisma@5.22.0 db push --skip-generate

# 核心：自动判断并生成默认管理员种子数据
echo ">>> Seeding initial data (if necessary)..."
npx prisma@5.22.0 db seed || echo "Seed failed or skipped"

cd /app

echo ">>> Starting Next.js server..."
exec node apps/server/server.js
