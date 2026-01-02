# Contributing to ThingsVis

**[English](CONTRIBUTING.md) | [中文](CONTRIBUTING_ZH.md)**

Thank you for your interest in contributing to ThingsVis! Whether you are coding manually or using AI assistants, please follow these guidelines to keep the project healthy.

## 🤖 AI Collaboration Policy

ThingsVis imposes strict boundaries on AI-generated code to protect the core stability.

### 1. The "No Fly Zone" (Kernel)
The following directories are **OFF-LIMITS** for AI generation (unless supervised by a senior maintainer):
-   ❌ `packages/thingsvis-kernel`
-   ❌ `packages/thingsvis-schema`
-   ❌ `packages/thingsvis-ui`

### 2. The "Safe Zone" (Plugins)
You are encouraged to use AI to build features here:
-   ✅ `plugins/**`
-   ✅ `apps/preview/**`

### 3. Setup Your AI
Before starting a session, please configure your assistant:
-   **Chatbots (Claude/ChatGPT)**: Copy the "System Prompt" from [AI Governance](docs/development/ai-governance.md).
-   **Cursor**: Ensure `.cursorrules` is present in the root.
-   **Copilot**: The project includes `.github/copilot-instructions.md` which is loaded automatically.

---

## 🛠️ Development Workflow

1.  **Fork & Clone**:
    ```bash
    git clone https://github.com/your-username/thingsvis.git
    pnpm install
    ```
2.  **Create a Plugin**:
    ```bash
    pnpm vis-cli create <category> <name>
    ```
3.  **Test**:
    Run `pnpm typecheck` before pushing.

## 📝 Pull Request Process

1.  Update documentation for any new features.
2.  Ensure CI passes.
3.  For Kernel changes, you MUST assign a reviewer from the Core Team.
