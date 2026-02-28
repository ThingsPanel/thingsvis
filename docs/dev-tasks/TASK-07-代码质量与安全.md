# TASK-07：代码质量与安全

> **优先级**：🔴 P0 + 🟡 P1
> **预估工时**：1-1.5 人天
> **前置依赖**：TASK-02（基础设施补全后再做质量检查）

---

## 7.1 代码清理（P0）

- [ ] 移除 `console.log` / `debugger` / `TODO: HACK`
- [ ] 敏感信息扫描（`truffleHog`）
- [ ] `depcheck` 清除无用依赖

---

## 7.2 静态分析 & 测试（P0）

- [ ] `pnpm tsc --noEmit` 通过
- [ ] `pnpm lint` 零错误
- [ ] 冒烟测试（验证矩阵见 `release-checklist.md`）

---

## 7.3 安全加固（P1）

- [ ] `npm audit` 修复高危漏洞
- [ ] CI 中添加 `pnpm test`（现有 9 个 spec 文件但 CI 未运行）
- [ ] Server 添加 API Rate Limiting
- [ ] 验证 `/api/health` 端点存在（Dockerfile healthcheck 依赖）
- [ ] `docker-entrypoint.sh` 迁移前备份 .db

---

## 7.4 README 修复（P0）

| 不一致项 | 修复 |
|----------|------|
| `.env.example` 路径写 `packages/thingsvis-server/` | 改为 `apps/server/` |
| `docs/development/guide.md` 等链接 | 路径可能不存在，需验证/删除 |
| 许可证占位符 | 替换为 Apache-2.0 |
| CONTRIBUTING.md | 创建或删除引用 |
| Plugin vs Widget | 重命名后同步更新 |

### 任务清单
- [ ] 修复 README 中所有不一致项
- [ ] 验证所有文档链接有效

---

## 验收标准

1. `pnpm tsc --noEmit` 零错误
2. `pnpm lint` 零错误
3. 无 `console.log` / `debugger` / 硬编码凭据
4. `npm audit` 无高危漏洞
5. README 中所有路径和链接正确
