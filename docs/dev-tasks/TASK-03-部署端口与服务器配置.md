# TASK-03：部署端口与服务器配置

> **优先级**：🔴 P0 发版阻塞
> **预估工时**：1-1.5 人天
> **前置依赖**：TASK-00（端到端修复中的 Nginx 反向代理部分）

---

## 目标端口

| 服务 | 当前 | 目标 |
|------|------|------|
| Server | 容器内 3001，docker `3001:3001` | 容器内 **8000**，docker `8000:8000` |
| Studio | 容器内 Nginx 80，docker `7050:80` | 容器内 Nginx **3000**，docker `3000:3000` |
| Preview | 7051（已废弃） | 删除 |

---

## 3.1 后端 3001 → 8000 修改清单

| 文件 | 位置 | 改动 |
|------|------|------|
| `apps/server/Dockerfile` | L53 `ENV PORT` | 3001 → 8000 |
| `apps/server/Dockerfile` | L70 `EXPOSE` | 3001 → 8000 |
| `apps/server/Dockerfile` | L73 healthcheck | localhost:3001 → :8000 |
| `apps/server/Dockerfile` | L39 `AUTH_URL` | localhost:3001 → :8000 |
| `docker-compose.yml` | L15 端口 | `3001:3001` → `8000:8000` |
| `docker-compose.yml` | L26 healthcheck | localhost:3001 → :8000 |
| `apps/server/src/middleware.ts` | L9,13,20 CORS | :3001 → :8000 |
| `apps/studio/src/lib/api/client.ts` | L9 fallback URL | :3001 → :8000 |
| `apps/studio/src/lib/api/uploads.ts` | L25 API_BASE_URL | :3001 → :8000 |
| `apps/studio/.env.development` | L9 注释 | :3001 → :8000 |
| `.github/workflows/deploy-test.yml` | PM2 启动 | 添加 `PORT=8000` |
| `.github/workflows/release.yml` | release body | 所有端口更新 |

### 任务清单
- [ ] 修改上述所有 12+ 处后端端口引用
- [ ] 验证 Server 在 8000 端口正常启动

---

## 3.2 前端 7050 → 3000 修改清单

| 文件 | 位置 | 改动 |
|------|------|------|
| `apps/studio/Dockerfile` | L30 Nginx `listen 80` | 80 → **3000** |
| `apps/studio/Dockerfile` | L53 `EXPOSE 80` | 80 → **3000** |
| `apps/studio/Dockerfile` | L51 healthcheck | localhost/ → localhost:3000/ |
| `docker-compose.yml` | L38 端口 | `7050:80` → `3000:3000` |
| `.github/workflows/deploy-test.yml` | L182 输出 URL | `:7050` → `:3000` |
| `.github/workflows/release.yml` | release body | `:7050` → `:3000` |

### 任务清单
- [ ] 修改上述所有前端端口引用
- [ ] 验证 Studio 在 3000 端口正常启动

---

## 3.3 CORS 策略重构（middleware.ts）

> **当前问题**：CORS 白名单硬编码了 `localhost:3001`、`47.92.253.145` 等地址。客户部署在自己的服务器上，IP/域名无法提前预知 → 所有跨域请求被拒绝。

**改造方案：CORS 白名单改为环境变量**

```typescript
// middleware.ts — 改造后
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'http://localhost:5173',
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : defaultOrigins;
```

### 任务清单
- [ ] 改造 middleware.ts CORS（删除硬编码白名单 → 环境变量 `ALLOWED_ORIGINS`）
- [ ] `.env.example` 中添加 `ALLOWED_ORIGINS` 说明
- [ ] **P1** 移除硬编码 `AUTH_SECRET` fallback `'thingsvis-dev-secret-key'`

---

## 3.4 部署流程（GitHub Actions → Docker）

**现有 `release.yml` 缺少自动部署步骤**，需添加 deploy job：

```yaml
deploy:
  name: Deploy to Server
  runs-on: ubuntu-latest
  needs: [build-docker, create-release]
  steps:
    - name: Deploy via SSH
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets.DEPLOY_HOST }}
        username: ${{ secrets.DEPLOY_USER }}
        key: ${{ secrets.DEPLOY_SSH_KEY }}
        script: |
          cd /opt/thingsvis
          docker compose pull
          docker compose up -d --remove-orphans
          docker compose ps
```

### 任务清单
- [ ] release.yml 添加 deploy job
- [ ] 修改 release.yml（端口 + 删除 preview 构建）
- [ ] 删除或重写 `deploy-test.yml`（改为 Docker 部署）

---

## 3.5 服务器一次性准备

**目标服务器**：`10.147.17.226`（root / Things）

```bash
# 1. 安装 Docker（如未安装）
curl -fsSL https://get.docker.com | sh

# 2. 创建部署目录 + 配置
mkdir -p /opt/thingsvis && cd /opt/thingsvis

# 3. 创建 .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=8000
AUTH_TRUST_HOST=true
DATABASE_URL=file:./prisma/prod.db
AUTH_SECRET=$(openssl rand -base64 32)
AUTH_URL=http://10.147.17.226:3000
EOF

# 4. 上传 docker-compose.yml
```

### 任务清单
- [ ] 服务器环境配置（Docker + .env + docker-compose.yml）
- [ ] GitHub Secrets 配置（`DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY`）
- [ ] 更新 `.env.development` 注释

---

## 验收标准

1. Server 容器在 8000 端口正常运行
2. Studio 容器在 3000 端口正常运行
3. CORS 通过环境变量配置
4. `git push tag` 后自动部署到 10.147.17.226
5. `http://10.147.17.226:3000` 可正常访问
