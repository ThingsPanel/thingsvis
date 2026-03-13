# ===================================
# Stage 1: Build Studio + Widgets
# ===================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/studio/package.json ./apps/studio/
COPY scripts/ ./scripts/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

COPY apps/studio ./apps/studio

# Build Studio
WORKDIR /app/apps/studio
RUN pnpm build

# Build Widgets
WORKDIR /app
RUN pnpm run build:widgets
RUN node scripts/generate-registry.js && cp apps/studio/public/registry.json apps/studio/dist/registry.json
RUN node scripts/validate-widget-release.js apps/studio/dist/registry.json

# ===================================
# Stage 2: Serve with Nginx
# ===================================
FROM nginx:alpine

# Copy Studio SPA
COPY --from=builder /app/apps/studio/dist /usr/share/nginx/html

# Copy Widget build outputs
COPY --from=builder /app/packages/widgets /tmp/widgets-src

# Copy only dist folders from widgets into nginx html
RUN mkdir -p /usr/share/nginx/html/widgets && \
    for dir in /tmp/widgets-src/*/*/; do \
    if [ -d "${dir}dist" ]; then \
    rel_path="${dir#/tmp/widgets-src/}"; \
    rel_path="${rel_path%/}"; \
    mkdir -p "/usr/share/nginx/html/widgets/${rel_path}"; \
    cp -r "${dir}dist" "/usr/share/nginx/html/widgets/${rel_path}/"; \
    fi; \
    done && \
    rm -rf /tmp/widgets-src

COPY apps/studio/nginx.conf.template /etc/nginx/conf.d/default.conf.template
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

ENV STUDIO_PORT=3000
ENV SERVER_HOST=thingsvis-server
ENV SERVER_PORT=8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${STUDIO_PORT}/ || exit 1

EXPOSE ${STUDIO_PORT}

CMD ["/bin/sh", "-c", "envsubst '$STUDIO_PORT $SERVER_HOST $SERVER_PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
