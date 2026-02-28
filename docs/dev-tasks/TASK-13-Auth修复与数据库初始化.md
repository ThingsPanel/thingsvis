# TASK-13：Auth 修复与数据库初始化

> **优先级**：🔴 P0
> **预估工时**：2-3 小时
> **前置依赖**：无
> **阻塞**：TASK-06（新组件）、TASK-14（SDK 升级）

---

## 背景

登录和注册接口返回 500 错误，原因是三个问题叠加：数据库连接失败、AUTH_SECRET 不一致、错误日志被吞噬。

---

## 根因

| 问题 | 文件 | 影响 |
|------|------|------|
| `schema.prisma` 声明 PostgreSQL 但无 `.env` 配置 | `prisma/schema.prisma` | 数据库连接失败 |
| `middleware.ts` 不允许 AUTH_SECRET 为空但 `login/route.ts` 有 fallback | `middleware.ts` / `login/route.ts` | token 签发成功但验证失败 |
| catch 块为空，500 无任何日志 | `login/route.ts` / `register/route.ts` | 无法调试 |

---

## 任务清单

### 数据库初始化
- [ ] 修改 `prisma/schema.prisma` provider 为 `sqlite`
- [ ] 创建 `apps/server/.env.example`（DATABASE_URL / AUTH_SECRET / NEXTAUTH_URL 等）
- [ ] 创建 `apps/server/.env`（从 .env.example 复制，加入 .gitignore）
- [ ] 在 `apps/server/package.json` 添加 `"dev:setup": "prisma generate && prisma db push && tsx scripts/seed.ts"`
- [ ] 运行 `pnpm dev:setup` 验证数据库初始化成功

### AUTH_SECRET 统一
- [ ] `middleware.ts` 添加 fallback `|| 'thingsvis-dev-secret-key'`
- [ ] 添加生产环境缺失 AUTH_SECRET 的警告日志

### Error Logging
- [ ] `login/route.ts` catch 块添加 `console.error('[Auth] Login error:', error)`
- [ ] `register/route.ts` catch 块添加 `console.error('[Auth] Register error:', error)`

---

## 验收标准

1. `pnpm dev:setup` 一键完成数据库初始化 + 种子数据
2. `POST /api/v1/auth/register` 返回 201（新用户注册成功）
3. `POST /api/v1/auth/login` 返回 200 + JWT token
4. 错误场景（错误密码/不存在用户）返回 401 而非 500
5. 服务端日志可见具体错误信息

---

## 风险评估

- **零破坏性**：只改 3 个文件约 20 行，全部为 additive 改动
- **可回滚**：git revert 即可
