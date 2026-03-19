# ===================================
# Stage 1: Dependencies
# ===================================
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

RUN npm install -g pnpm@9

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy server app so package lifecycle scripts can resolve local Prisma schema
COPY apps/server/ ./apps/server/
COPY packages/ ./packages/

# Install deps (all workspace packages needed for build)
ENV PRISMA_ENGINES_MIRROR=https://npmmirror.com/mirrors/prisma
RUN pnpm install --frozen-lockfile

# ===================================
# Stage 2: Build
# ===================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

RUN npm install -g pnpm@9

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules

# Copy source
COPY . .

# Generate Prisma client + build server
WORKDIR /app/apps/server
ARG PORT=8000
ARG DATABASE_URL="postgresql://thingsvis:thingsvis_password@thingsvis-postgres:5432/thingsvis_db?schema=public"

RUN npx prisma generate
RUN pnpm build

# Ensure required directories/files exist for runner stage
# Copy public folder to standalone output if it exists
RUN if [ -d "public" ]; then \
      mkdir -p .next/standalone/public && \
      cp -r public/* .next/standalone/public/ 2>/dev/null || true; \
    fi

# Ensure public dir exists so docker COPY doesn't fail
RUN mkdir -p /app/apps/server/public

# Create placeholder directories for prisma if they don't exist
RUN mkdir -p node_modules/.prisma node_modules/@prisma

RUN ls -la .next/standalone/ || true

# ===================================
# Stage 3: Production runner
# ===================================
FROM node:20-alpine AS runner

WORKDIR /app

ARG PORT=8000

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=$PORT

RUN apk add --no-cache openssl libssl3

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

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
