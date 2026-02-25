# Contributing to ThingsVis

Thank you for your interest in contributing to ThingsVis! This guide will help you get started.

## Development Setup

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+ (`npm install -g pnpm`)
- **Git**

### Getting Started

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/thingsvis.git
cd thingsvis

# 2. Install dependencies
pnpm install

# 3. Set up the backend
cp apps/server/.env.example apps/server/.env
# Edit apps/server/.env with your database credentials

# 4. Initialize the database
pnpm --filter @thingsvis/server db:push

# 5. Start development
pnpm dev
```

The studio will be available at `http://localhost:3000`.

## Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run quality checks:
   ```bash
   pnpm typecheck   # TypeScript type checking
   pnpm build       # Verify build passes
   ```
4. Commit using conventional commits (see below)
5. Push and create a Pull Request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, no code change |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `perf:` | Performance improvement |
| `test:` | Adding/updating tests |
| `chore:` | Build process, dependencies, CI |

**Examples:**
```
feat: add dark mode toggle to editor
fix: prevent white screen on widget load error
docs: update README with Docker quick start
```

## Widget Development

To contribute a new widget:

```bash
# Scaffold a new widget
pnpm vis-cli create <category> <widget-name>

# Develop with hot reload
cd widgets/<category>/<widget-name>
pnpm dev
```

See the [README](README.md#-widget-development) for detailed widget development docs.

## Code Style

- **TypeScript**: Strict mode, no `any` unless absolutely necessary
- **Naming**: kebab-case for files, PascalCase for components
- **Imports**: Use package names (`@thingsvis/kernel`) not relative paths across packages
- **Comments**: Document complex logic and public APIs in JSDoc

## Reporting Issues

Use [GitHub Issues](https://github.com/ThingsPanel/thingsvis/issues) to report bugs or request features. Please include:

- Clear title and description
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Environment info (OS, Node.js version, browser)

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
