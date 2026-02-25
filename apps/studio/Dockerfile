# ===================================
# Stage 1: Build Studio + Widgets
# ===================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@8

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/studio/package.json ./apps/studio/
COPY packages/ ./packages/
COPY widgets/ ./widgets/
COPY configs/ ./configs/

RUN pnpm install --frozen-lockfile

COPY apps/studio ./apps/studio

# Build Studio
WORKDIR /app/apps/studio
RUN pnpm build

# Build Widgets
WORKDIR /app
RUN pnpm run build:widgets || echo "Warning: some widgets failed to build"

# ===================================
# Stage 2: Serve with Nginx
# ===================================
FROM nginx:alpine

# Copy Studio SPA
COPY --from=builder /app/apps/studio/dist /usr/share/nginx/html

# Copy Widget build outputs
COPY --from=builder /app/widgets /tmp/widgets-src

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

# Nginx config template: SPA fallback + API reverse proxy + static cache
RUN printf 'server {\n\
    listen ${STUDIO_PORT};\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    \n\
    # Gzip\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;\n\
    \n\
    # API reverse proxy\n\
    location /api/ {\n\
    proxy_pass http://${SERVER_HOST}:${SERVER_PORT};\n\
    proxy_set_header Host $$host;\n\
    proxy_set_header X-Real-IP $$remote_addr;\n\
    proxy_set_header X-Forwarded-For $$proxy_add_x_forwarded_for;\n\
    proxy_set_header X-Forwarded-Proto $$scheme;\n\
    proxy_read_timeout 300s;\n\
    client_max_body_size 50m;\n\
    }\n\
    \n\
    # SPA fallback\n\
    location / {\n\
    try_files $$uri $$uri/ /index.html;\n\
    }\n\
    \n\
    # Cache static assets\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$$ {\n\
    expires 1y;\n\
    add_header Cache-Control "public, immutable";\n\
    }\n\
    }\n' > /etc/nginx/conf.d/default.conf.template

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

ENV STUDIO_PORT=3000
ENV SERVER_HOST=thingsvis-server
ENV SERVER_PORT=8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${STUDIO_PORT}/ || exit 1

EXPOSE ${STUDIO_PORT}

CMD ["/bin/sh", "-c", "envsubst '$$STUDIO_PORT $$SERVER_HOST $$SERVER_PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
