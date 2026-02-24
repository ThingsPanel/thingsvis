# TASK-00：端到端可行性修复（致命阻塞项）

> **优先级**：🔴 P0 致命阻塞
> **预估工时**：1-2 人天
> **前置依赖**：无（最先做）

---

## 背景

模拟 Docker 部署和本地开发两条路径后，发现以下致命问题会导致用户完全无法使用。

---

## 🔴 致命问题 1：Studio → Server API 通信断裂

| 项目 | 说明 |
|------|------|
| **问题** | `client.ts` 用 `window.location.origin` 拼 API URL → `http://host:3000/api/v1`，但 Server 在 8000 端口 → 404 |
| **原因** | Studio 容器 Nginx **只做 SPA fallback，没有 `/api/` 反向代理** |
| **结果** | 所有 API 请求 404 → **登录、注册、加载项目全部失败** |
| **修复** | Studio Dockerfile Nginx 配置加 `/api/` → `proxy_pass http://thingsvis-server:8000` |

**Nginx 配置参考：**

```nginx
# 在 Studio Dockerfile 中补充
location /api/ {
    proxy_pass http://thingsvis-server:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### 任务清单

- [ ] Studio Dockerfile 的 Nginx 配置中加入 `/api/` 反向代理
- [ ] 验证 Docker Compose 环境下前端能成功调用后端 API

---

## 🔴 致命问题 2：Widget 文件不在 Docker 镜像中

| 项目 | 说明 |
|------|------|
| **问题** | Studio Dockerfile 只 `COPY apps/studio/dist` → **plugins/ 目录完全不在镜像中** |
| **原因** | `registry.json` 里 `staticEntryUrl` 指向 `/plugins/basic/text/dist/remoteEntry.js`，但镜像内没这个文件 |
| **结果** | **编辑器工具栏空白，拖不出任何组件** |
| **修复方案** | 方案 A（推荐）：Studio Dockerfile 构建阶段也构建 plugins，COPY 到 nginx html；方案 B：docker-compose 挂载 volume |

### 任务清单

- [ ] 决策 Widget 打包方案（A or B）
- [ ] 修改 Studio Dockerfile，确保 plugins（或 widgets）构建产物包含在镜像中
- [ ] 验证编辑器工具栏能正常显示和拖拽组件

---

## 🟡 问题 3：registry.json 需同步清理

| 当前注册（8 个） | 需删除（3 个） | 保留（5 个） |
|-------------|------------|----------|
| text, rectangle, circle, line, indicator, image, echarts-line, water-tank | **indicator, water-tank**, pm25-card（未注册但目录存在） | text, rectangle, circle, line, image, echarts-line |

### 任务清单

- [ ] 删除 `plugins/basic/indicator/` 目录
- [ ] 删除 `plugins/basic/pm25-card/` 目录
- [ ] 删除 `plugins/custom/water-tank/` 目录（整个 `plugins/custom/` 可删）
- [ ] `registry.json` 移除 indicator、water-tank 条目
- [ ] `pnpm-workspace.yaml` / `turbo.json` 确认无残留引用

---

## 🟡 问题 4：首次部署无法登录 — 没有默认用户

| 项目 | 说明 |
|------|------|
| **问题** | 无 Prisma seed，首次 `docker compose up` 后数据库为空 |
| **修复** | 推荐方案 A：添加 `prisma/seed.ts` 创建默认 admin/admin123 用户 |

### 任务清单

- [ ] 决策默认用户方案
- [ ] 实现 seed 脚本或首页重定向注册页
- [ ] 验证首次部署后用户可以正常登录

---

## 验收标准

1. `docker compose up -d` 后，用户能正常注册/登录
2. 登录后编辑器工具栏能显示所有 Widget
3. 没有残留的无效 Widget 注册
4. 首次部署有明确的用户创建/注册路径
