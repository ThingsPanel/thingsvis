# ===================================
# Stage 1: Dependencies
# ===================================
FROM node:20-alpine AS deps

WORKDIR /app

RUN npm install -g pnpm@8

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all package.json files for workspace resolution
COPY apps/server/package.json ./apps/server/
COPY packages/ ./packages/

# Install deps (all workspace packages needed for build)
RUN pnpm install --frozen-lockfile

# ===================================
# Stage 2: Build
# ===================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@8

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules

# Copy source
COPY . .

# Generate Prisma client + build server
WORKDIR /app/apps/server
ARG DATABASE_URL="file:./prisma/dev.db"
ARG AUTH_SECRET="build-placeholder-secret-replace-in-production"
ARG AUTH_URL="http://localhost:8000"

RUN npx prisma generate
RUN pnpm build

# ===================================
# Stage 3: Production runner
# ===================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8000
ENV AUTH_TRUST_HOST=true

# Copy Next.js standalone output
COPY --from=builder /app/apps/server/.next/standalone ./
COPY --from=builder /app/apps/server/.next/static ./apps/server/.next/static
COPY --from=builder /app/apps/server/public ./apps/server/public

# Copy Prisma schema + client for runtime migrations
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/apps/server/node_modules/.prisma ./apps/server/node_modules/.prisma
COPY --from=builder /app/apps/server/node_modules/@prisma ./apps/server/node_modules/@prisma

# Copy seed script + dependencies for first-run seeding
COPY --from=builder /app/apps/server/scripts ./apps/server/scripts

# Entrypoint script: run prisma db push then start server
COPY apps/server/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
