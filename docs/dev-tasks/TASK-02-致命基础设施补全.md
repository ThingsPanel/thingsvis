# TASK-02：致命基础设施补全

> **优先级**：🔴 P0 发版阻塞
> **预估工时**：0.5-1 人天
> **前置依赖**：TASK-01（仓库迁移后操作）
> **状态**：✅ 已完成（2026-02-24）— LICENSE(Apache-2.0)、.env.example、ErrorBoundary、版本号→0.1.0、preview 删除、release.yml 修复

---

## 2.1 LICENSE 文件

| 现状 | 根目录无 `LICENSE`，README 写 `[Add your license information here]` |
|------|------|
| **影响** | 无 LICENSE = 不是开源项目，推广全部失效 |
| **决策** | **Apache-2.0** |

### 任务清单
- [ ] 创建根目录 `LICENSE` 文件（Apache-2.0）
- [ ] 更新 README.md 许可证章节
- [ ] **P1** `license-checker` 依赖兼容性检查

---

## 2.2 `.env.example` 缺失

| 现状 | 整个仓库无 `.env.example`，`.gitignore` 排除所有 `.env*` |
|------|------|
| **影响** | `release.yml` 第 116 行引用此文件 → **打包必定失败** |

### 任务清单
- [ ] 创建 `apps/server/.env.example`（含 `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `PORT`）
- [ ] `.gitignore` 添加 `!.env.example`

---

## 2.3 React ErrorBoundary 缺失

| 现状 | Studio 中无 `ErrorBoundary`，README 声称有错误隔离但代码未实现 |
|------|------|
| **影响** | 任何 Widget JS 错误 → 整个编辑器白屏崩溃 |

### 任务清单
- [ ] Widget 渲染区添加 `<ErrorBoundary>` 包裹
- [ ] **P1** Fallback UI（"组件加载失败" + 重试按钮）

---

## 2.4 版本号 `0.0.0`

- [ ] 所有 `package.json` 版本号更新为 `0.1.0`

---

## 2.5 Preview 引用不存在

| 现状 | `docker-compose.yml` 和 `release.yml` 引用 `apps/preview/`，**该目录不存在** |
|------|------|
| **影响** | Docker 构建必定失败 |

### 任务清单
- [ ] 决策：删除 preview 相关配置 or 恢复 `apps/preview/`
- [ ] 同步更新 docker-compose.yml + release.yml

---

## 2.6 `.gitignore` / `.dockerignore`

- [ ] `.gitignore` 添加 `excalidraw-analysis/`、`specs/`、`.specify/`
- [ ] `.dockerignore` 确认排除大目录

---

## 2.7 `release.yml` 隐患

| 问题 | Plugin/Preview 构建设 `continue-on-error: true` → 构建失败静默跳过 → tar.gz 中 plugins/ 为空 |
|------|------|

- [ ] 移除 `continue-on-error` 或添加产物完整性校验

---

## 验收标准

1. 根目录有 `LICENSE` 文件（Apache-2.0）
2. `apps/server/.env.example` 存在且包含必要变量
3. Widget 渲染区有 ErrorBoundary，单个 Widget 报错不会导致白屏
4. 所有 `package.json` 版本号为 `0.1.0`
5. docker-compose.yml 和 release.yml 中无 preview 相关配置（或 preview 目录已恢复）
6. `.gitignore` 和 `.dockerignore` 已更新
7. `release.yml` 无静默失败的 `continue-on-error`
