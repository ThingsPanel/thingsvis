#!/bin/sh
set -e

echo "=== ThingsVis Server Starting ==="

# Run database migrations/push on startup
echo ">>> Applying database schema..."
cd apps/server
npx prisma db push --skip-generate

# 核心：自动判断并生成默认管理员种子数据
echo ">>> Seeding initial data (if necessary)..."
npx prisma db seed

cd /app

echo ">>> Starting Next.js server..."
exec node apps/server/server.js
