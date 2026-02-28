# TASK-01：开源仓库迁移（发版前第一步）

> **优先级**：🔴 P0 发版阻塞
> **预估工时**：1-2 小时
> **前置依赖**：无

---

## 背景

当前私有仓库 **`ThingsPanel/thingsvis`** 已占用该名称，需要先重命名旧仓库，再创建干净的公开仓库。

私有仓库存在以下问题，不能直接转为公开：

| 风险 | 详情 |
|------|------|
| **凭据泄露** | 历史 commit 有 `remove hardcoded credentials`，`git log -p` 可能泄露密钥 |
| **体积膨胀** | `excalidraw-analysis/`（1185 文件）在 git 中 |
| **分支混乱** | `18fedc0`、`9ec89ca` 等 hash 命名分支 |
| **内部文件** | `specs/`（28 个需求规格书）、`.specify/`（AI 工具数据）不应公开 |

---

## 任务清单

### 1. 重命名旧仓库
- [ ] GitHub 上将 `ThingsPanel/thingsvis` 重命名为 `ThingsPanel/thingsvis-internal`（或 `thingsvis-legacy`）
  - 路径：GitHub → 仓库 Settings → General → Repository name
  - > ⚠️ 重命名后 GitHub 会自动做 URL 重定向，但建议通知团队更新本地 remote

### 2. 创建新的公开仓库
- [ ] 新建 GitHub 公开仓库 `ThingsPanel/thingsvis`

### 3. 复制代码并排除内部内容

| 🔴 必须排除 | 理由 |
|-------------|------|
| `excalidraw-analysis/` | 竞品分析，1185 文件 |
| `.specify/` | AI 辅助工具数据 |
| `specs/` | 28 个内部需求规格书 |
| `.tmp/` / `.deploy/` | 临时文件 / 含服务器地址 |
| `docs/release-checklist.md` / `release-task-list.md` | 内部文档 |
| `.env*`（除 `.env.example`） | 环境变量 |
| `*.db` / `*.sqlite*` | 数据库文件 |
| `.cursor/` / `.cursorrules` / `.claude/` | AI 工具配置 |
| `.github/agents/` / `.github/prompts/` / `.github/skills/` | 内部 AI 配置 |

### 4. 提交与发布
- [ ] Squash 到单个 commit：`feat: initial release of ThingsVis v0.1.0`
- [ ] Push 并打 tag `v0.1.0`

### 5. 团队同步
- [ ] 通知团队成员更新本地 git remote 到新仓库地址
  ```bash
  git remote set-url origin git@github.com:ThingsPanel/thingsvis.git
  ```

---

## 验收标准

1. 旧仓库已重命名为 `ThingsPanel/thingsvis-internal`
2. 新公开仓库 `ThingsPanel/thingsvis` 中无内部文件或敏感信息
3. Git 历史只有一个干净的 commit
4. `v0.1.0` tag 已创建
