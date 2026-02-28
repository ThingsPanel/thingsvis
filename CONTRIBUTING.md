# Contributing to ThingsVis

Thank you for your interest in contributing to ThingsVis! This guide explains how to set up your environment, submit changes, and follow the project conventions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Architecture Constraints](#architecture-constraints)
- [Widget Development](#widget-development)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)

---

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+ (`npm install -g pnpm`)
- **Git** 2.30+

### Setup

```bash
# 1. Fork the repository on GitHub and clone your fork
git clone https://github.com/<your-username>/thingsvis.git
cd thingsvis

# 2. Install dependencies
pnpm install

# 3. Set up the backend server (optional for widget-only work)
cp apps/server/.env.example apps/server/.env
pnpm --filter @thingsvis/server db:push
pnpm --filter @thingsvis/server seed

# 4. Build all widgets (required before first run)
pnpm build:widgets

# 5. Start the studio
pnpm dev --filter ./apps/studio
```

---

## Development Workflow

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable release branch |
| `dev` | Integration branch for in-progress work |
| `feature/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation-only changes |

Always branch from `dev` unless patching a critical release bug.

### Typical Flow

```bash
# Create a feature branch
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# Make changes and verify
pnpm typecheck
pnpm build

# Commit using conventional commits
git commit -m "feat(kernel): add widget event subscription helper"

# Push and open a PR targeting `dev`
git push origin feature/my-feature
```

---

## Architecture Constraints

ThingsVis enforces strict separation between layers. Violating these rules will result in a PR rejection:

1. **Kernel stays UI-free**: `@thingsvis/kernel` must never import React, DOM APIs, or any visual library.
2. **Widget isolation**: Widgets must never import from `@thingsvis/kernel` directly; use the Widget SDK (`@thingsvis/widget-sdk`).
3. **No circular dependencies**: Run `pnpm build` and check for circular dependency errors before submitting.
4. **Schema as contracts**: All inter-package data shapes must be defined in `@thingsvis/schema` with Zod validation.

---

## Widget Development

Use the CLI to scaffold a new widget:

```bash
pnpm vis-cli create <category> <widget-name>
# Example:
pnpm vis-cli create chart bar-chart
```

Each widget must:

- Export a `Main` object conforming to `WidgetMainModule` from `@thingsvis/schema`
- Include a `Spec` component (`spec.tsx`) for isolated visual testing
- Be self-contained — no imports from other widgets
- Use peer dependencies for shared libraries (React, LeaferJS)

### Widget Categories

| Category | Description |
|----------|-------------|
| `basic` | Shapes, text, lines |
| `chart` | ECharts-based data visualization |
| `media` | Images, videos |
| `custom` | Specialized/domain-specific widgets |
| `data` | Data binding & display widgets |
| `interaction` | Buttons, sliders, form elements |

### Testing a Widget

```bash
# Start your widget dev server
cd widgets/<category>/<widget-name>
pnpm dev

# In another terminal, start the studio
pnpm dev --filter ./apps/studio

# Add your widget from the component panel and verify rendering
```

---

## Coding Standards

### TypeScript

- **Strict mode** is enabled — no `any`, no implicit returns on non-void functions
- Prefer `type` over `interface` for public API shapes
- Always provide explicit return types for exported functions

### File Naming

| Context | Convention |
|---------|-----------|
| React components | `PascalCase.tsx` |
| Utility files | `kebab-case.ts` |
| Test files | `*.test.ts` / `*.spec.tsx` |
| Constants | `UPPER_SNAKE_CASE` |

### Console Output

- Do **not** add `console.log` for debugging — use the message router's log system or remove before committing
- `console.error` / `console.warn` in error handlers are acceptable with `// eslint-disable-next-line no-console`

### Styling

- Use **TailwindCSS** utility classes
- Use **CSS Variables** (e.g., `--w-bg`, `--w-fg`) for theme-aware colors — never hardcode hex values in components
- Keep widget styles scoped to the widget's overlay div

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change without feature/fix |
| `perf` | Performance improvement |
| `chore` | Build, tooling, dependencies |
| `test` | Adding/fixing tests |

**Scope examples:** `kernel`, `schema`, `ui`, `studio`, `sdk`, `widget/echarts-line`

**Examples:**
```
feat(sdk): add defineWidget lifecycle hooks
fix(studio): resolve white screen on widget render error
docs(readme): sync Chinese README with English version
chore(deps): upgrade rspack to 1.4.0
```

---

## Pull Request Process

1. **Target branch**: `dev` (not `main`)
2. **PR title**: Must follow the commit convention format
3. **Checklist** before requesting review:
   - [ ] `pnpm typecheck` passes with no errors
   - [ ] `pnpm build` succeeds
   - [ ] No `console.log` debug statements left in code
   - [ ] New widgets have a `Spec` component
   - [ ] Architecture constraints are respected (kernel stays UI-free)
   - [ ] CHANGELOG.md updated if adding a user-facing feature or fixing a bug
4. **Review**: At least one maintainer approval required before merge
5. **Squash merge**: PRs are squash-merged to keep a clean history

---

## Reporting Bugs

Open an issue with the following information:

- **Environment**: OS, Node.js version, browser
- **Steps to reproduce**: Minimal reproducible steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots/logs**: If applicable

For security vulnerabilities, **do not open a public issue** — email the maintainers directly.

---

Thank you for contributing to ThingsVis! 🎉
