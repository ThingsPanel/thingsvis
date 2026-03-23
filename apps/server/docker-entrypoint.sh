#!/bin/sh
set -e

echo "=== ThingsVis Server Starting ==="

# Run database migrations/push on startup
echo ">>> Applying database schema..."
cd apps/server
prisma db push --skip-generate

# 自动检测并执行初始化SQL脚本
echo ">>> Checking for init.sql..."
if [ -f "prisma/init.sql" ]; then
    echo ">>> Running init.sql..."
    psql "${DATABASE_URL}" --set=ON_ERROR_STOP=1 -f prisma/init.sql \
        && echo ">>> init.sql executed successfully" \
        || echo ">>> init.sql execution failed (table may not exist yet - this is normal on first run)"
fi

# 核心：自动判断并生成默认管理员种子数据
echo ">>> Seeding initial data (if necessary)..."
tsx scripts/seed.ts || echo "Seed failed or skipped"

cd /app

export AUTH_TRUST_HOST="${AUTH_TRUST_HOST:-true}"

echo ">>> Starting Next.js server..."
exec node apps/server/server.js
