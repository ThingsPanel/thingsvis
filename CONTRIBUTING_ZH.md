# 贡献指南 (Contributing to ThingsVis)

**[English](CONTRIBUTING.md) | [中文](CONTRIBUTING_ZH.md)**

感谢你对 ThingsVis 的关注！无论你是手动编码还是使用 AI 辅助，请遵循以下指南以维护项目的健康。

## 🤖 AI 协作策略 (AI Policy)

为了保护核心系统稳定性，ThingsVis 对 AI 生成代码有严格的边界限制。

### 1. "禁飞区" (Kernel)
以下目录 **禁止** 使用 AI 生成代码 (除非有高级维护者监督)：
-   ❌ `packages/thingsvis-kernel`
-   ❌ `packages/thingsvis-schema`
-   ❌ `packages/thingsvis-ui`

### 2. "安全区" (Plugins)
我们鼓励在以下区域使用 AI 构建新功能：
-   ✅ `plugins/**`
-   ✅ `apps/preview/**`

### 3. 配置你的 AI
在开始编码前，请配置你的助手：
-   **对话机器人 (Claude/ChatGPT)**: 请复制 [AI 治理文档](docs/development/ai-governance.md) 中的 "System Prompt"。
-   **Cursor**: 确保根目录下包含 `.cursorrules` 文件。
-   **Copilot**: 项目包含 `.github/copilot-instructions.md`，会自动加载。

---

## 🛠️ 开发工作流

1.  **Fork & Clone**:
    ```bash
    git clone https://github.com/your-username/thingsvis.git
    pnpm install
    ```
2.  **创建插件**:
    ```bash
    pnpm vis-cli create <category> <name>
    ```
3.  **测试**:
    提交前请运行 `pnpm typecheck`。

## 📝 Pull Request 流程

1.  为新功能更新文档。
2.  确保 CI 通过。
3.  对于 Kernel 修改，**必须** 指定核心团队成员进行 Code Review。
