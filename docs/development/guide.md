# Project Development Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-31

Welcome to the ThingsVis project! This guide is designed to help you get started quickly with the development environment and workflows.

## 📋 Table of Contents

- [Environment Setup](#environment-setup)
- [Project Startup](#project-startup)
- [AI-Assisted Workflow](#ai-assisted-workflow)
- [Troubleshooting](#troubleshooting)
- [Git Conventions](#git-conventions)

---

## Environment Setup

### 1. Prerequisites

| Software | Version | Description |
|----------|---------|-------------|
| **Node.js** | 18+ | [Download](https://nodejs.org/) (LTS recommended) |
| **pnpm** | 8+ | Run `npm install -g pnpm` |
| **VS Code** | Latest | [Download](https://code.visualstudio.com/) |
| **Git** | Latest | [Download](https://git-scm.com/) |

### 2. Recommended VS Code Extensions

Install these extensions for the best development experience:

- **GitHub Copilot** - AI coding assistant.
- **ESLint** - Code linting.
- **Prettier** - Code formatting.
- **TypeScript Vue Plugin (Volar)** - TypeScript support for Vue/features.
- **Tailwind CSS IntelliSense** - Intelligent Tailwind CSS tooling.

### 3. Installation

```bash
# Clone the repository
git clone <repository-url>
cd thingsvis

# Install dependencies (may take a few minutes)
pnpm install
```

---

## Project Startup

### Common Commands

| Action | Command |
|--------|---------|
| Start Studio (Main Editor) | `pnpm dev` |
| Start Preview App | `pnpm dev --filter ./apps/preview` |
| Build All Packages | `pnpm -w build` |
| Build Specific Package | `pnpm build --filter @thingsvis/kernel` |
| Create New Component | `pnpm vis-cli create <category> <name>` |
| Type Check | `pnpm typecheck` |

### Starting the Development Environment

1.  **Start Studio**:
    ```bash
    pnpm dev
    ```
2.  **Open Browser**:
    Navigate to `http://localhost:3000`.

---

## AI-Assisted Workflow

ThingsVis adopts a **Spec-Driven Development** model using **SpecKit**. You can use AI tools (like Copilot Chat or Claude) to accelerate development from requirements to implementation.

### SpecKit Workflow

| Command | Description |
|---------|-------------|
| `/speckit.course` | Understand project principles. |
| `/speckit.specify` | Define requirements (What & Why). |
| `/speckit.plan` | Design technical implementation (How). |
| `/speckit.tasks` | Break down into actionable tasks. |
| `/speckit.implement` | execute the implementation. |

**Example Process:**

1.  **Specify**: `/speckit.specify Add a new Data Source Manager...`
2.  **Plan**: `/speckit.plan Use React 18 + Zustand...`
3.  **Tasks**: `/speckit.tasks` (Generates checklist)
4.  **Implement**: `/speckit.implement`

### Manual Spec-Driven Development

If not using the CLI commands, follow this pattern:
1.  **Read Specs**: Check `specs/` for relevant feature specifications.
2.  **Contextualize AI**: Provide `spec.md` and `plan.md` to your AI assistant.
3.  **Generate Code**: Ask AI to implement features based on the specs.
4.  **Verify**: Run tests and manual checks.

---

## Troubleshooting

### COMMON ISSUES

#### 🔴 `pnpm install` Fails
**Fix**:
```bash
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 🔴 Port 3000 Already in Use
**Fix**:
```bash
# Windows (PowerShell)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### 🔴 TypeScript Errors
**Fix**:
1.  Run `pnpm -w build` to rebuild dependencies.
2.  Restart VS Code TS Server (`Ctrl+Shift+P` -> "TypeScript: Restart TS Server").

---

## Git Conventions

We follow **Conventional Commits**:

```
<type>(<scope>): <description>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Build/tooling

### Scopes
`kernel`, `schema`, `ui`, `utils`, `studio`, `plugin`, `docs`, etc.

### Branching
- **Feature**: `feature/<issue-id>-<description>`
- **Fix**: `fix/<issue-id>-<description>`

---

*For further assistance, check the `specs/` directory or ask in the team channel.*
