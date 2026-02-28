# TASK-00：端到端可行性修复（致命阻塞项）

> **优先级**：🔴 P0 致命阻塞
> **预估工时**：1-2 人天
> **前置依赖**：无（最先做）
> **状态**：✅ 已完成（2026-02-24）

---

## 背景

模拟 Docker 部署和本地开发两条路径后，发现以下致命问题会导致用户完全无法使用。

---

## 🔴 致命问题 1：Studio → Server API 通信断裂 ✅

| 项目 | 说明 |
|------|------|
| **问题** | `client.ts` 用 `window.location.origin` 拼 API URL → `http://host:3000/api/v1`，但 Server 在 8000 端口 → 404 |
| **原因** | Studio 容器 Nginx **只做 SPA fallback，没有 `/api/` 反向代理** |
| **修复** | `apps/studio/Dockerfile` Nginx 配置加 `/api/` → `proxy_pass http://thingsvis-server:8000` |

### 完成情况

- [x] Studio Dockerfile 的 Nginx 配置中加入 `/api/` 反向代理
- [x] Nginx 配置包含 Host / X-Real-IP / X-Forwarded-For / X-Forwarded-Proto headers
- [x] 配置 client_max_body_size 50m、proxy_read_timeout 300s

---

## 🔴 致命问题 2：Widget 文件不在 Docker 镜像中 ✅

| 项目 | 说明 |
|------|------|
| **问题** | Studio Dockerfile 只 `COPY apps/studio/dist` → **widgets/ 目录完全不在镜像中** |
| **修复** | 采用方案 A：Studio Dockerfile 构建阶段 COPY `widgets/` + `configs/`，执行 `pnpm run build:widgets`，然后将 dist 产物复制到 Nginx html |

### 完成情况

- [x] 决策 Widget 打包方案 → 方案 A（推荐）
- [x] 修改 Studio Dockerfile，COPY widgets/ 和 configs/ 目录
- [x] 构建阶段执行 `pnpm run build:widgets`
- [x] 用 shell 循环将每个 widget 的 `dist/` 复制到 `/usr/share/nginx/html/widgets/`

---

## 🟡 问题 3：registry.json 需同步清理 ✅

| 清理前（8 个） | 已删除（3 个） | 保留（6 个） |
|-------------|------------|------------|
| text, rectangle, circle, line, indicator, image, echarts-line, water-tank | **indicator, water-tank**, pm25-card | text, rectangle, circle, line, image, echarts-line |

### 完成情况

- [x] 删除 `plugins/basic/indicator/` 目录
- [x] 删除 `plugins/basic/pm25-card/` 目录
- [x] 删除 `plugins/custom/` 目录（整个目录）
- [x] `registry.json` 移除 indicator、water-tank 条目（保留 6 个有效 widget）
- [x] `pnpm-workspace.yaml` 确认无残留引用

---

## 🟡 问题 4：首次部署无法登录 — 没有默认用户 ✅

| 项目 | 说明 |
|------|------|
| **修复** | 添加 `apps/server/scripts/seed.ts`，创建默认 Tenant + admin 用户 |

### 完成情况

- [x] 创建 `apps/server/scripts/seed.ts` — 默认用户 `admin@thingsvis.io` / `admin123`
- [x] 支持环境变量覆盖：`SEED_ADMIN_EMAIL`、`SEED_ADMIN_PASSWORD`、`SEED_ADMIN_NAME`
- [x] `package.json` 添加 `prisma.seed` 配置
- [x] 幂等设计：已存在则跳过

---

## 验收标准

1. ✅ `docker compose up -d` 后，用户能正常注册/登录
2. ✅ 登录后编辑器工具栏能显示所有 Widget
3. ✅ 没有残留的无效 Widget 注册
4. ✅ 首次部署有明确的用户创建/注册路径
