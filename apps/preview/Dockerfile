# ===================================
# Stage 1: Build
# ===================================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm@8

# 复制package文件
COPY package.json pnpm-lock.yaml* ./
COPY ../../pnpm-workspace.yaml ../../

# 复制依赖的packages
COPY ../../packages ./packages

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建生产版本
RUN pnpm run build

# ===================================
# Stage 2: Production
# ===================================
FROM nginx:alpine

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从builder阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建插件目录
RUN mkdir -p /usr/share/nginx/html/plugins

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
