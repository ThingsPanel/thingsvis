# Contributing to ThingsVis

This guide covers local setup, contribution expectations, and review requirements for the open-source repository.

## Before You Start

- Read the project overview in [README.md](./README.md)
- Use the issue templates for bugs and feature requests
- Keep pull requests focused; avoid mixing refactors, docs, and feature work in one PR unless they are tightly coupled

## Local Setup

Requirements:

- Node.js `>=20.10.0`
- pnpm `>=9`
- Git

Install and start the workspace:

```bash
pnpm install
pnpm build:widgets
pnpm dev
```

This is enough for frontend-only work.

If your change requires the backend service:

```bash
pnpm dev:app
```

Docs site:

```bash
pnpm docs:dev
```

## Common Commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Use the narrowest command that proves your change.

## Contribution Areas

Typical contribution areas in this repository:

- Studio editor
- Embed runtime and host integration
- Data source adapters and bindings
- Widget SDK and `vis-cli`
- Built-in widgets
- Documentation

## Development Rules

### Contracts First

- Shared data contracts belong in `@thingsvis/schema`
- Kernel logic stays in `@thingsvis/kernel`
- UI-specific behavior stays out of the kernel

### Widget Authoring

The current widget authoring path is:

1. scaffold with `pnpm vis-cli create <category> <name>`
2. define props in `schema.ts`
3. define controls in `controls.ts`
4. implement runtime behavior with `defineWidget`

Do not introduce or document legacy widget entry patterns as the primary path.

### Documentation Changes

Update docs when you change:

- embed message behavior
- CLI commands or generated structure
- widget authoring APIs
- user-visible Studio flows

### Scope Discipline

- Keep changes targeted
- Avoid unrelated formatting churn
- Do not rewrite adjacent files unless the change requires it

## Branching and Commits

- Create a topic branch from the branch requested by maintainers
- Use Conventional Commits for commit messages and PR titles

Examples:

- `feat(studio): add datasource timeout help text`
- `fix(embed): normalize viewer ready handshake`
- `docs(readme): simplify open source quick start`

## Pull Requests

Before opening a PR:

- run the relevant checks for your change
- remove debug-only code
- update docs for user-facing changes
- include screenshots or recordings for UI, embed, or docs UX changes when helpful

PRs should include:

- what changed
- why it changed
- affected areas, such as `studio`, `embed`, `datasource`, `widget-sdk`, `cli`, or `docs`
- validation notes

## Reporting Bugs

A good bug report includes:

- a minimal reproduction
- expected behavior
- actual behavior
- environment details
- whether the issue happens in standalone mode, embed mode, or both

## Security

Do not report security issues in public issues. Follow [SECURITY.md](./SECURITY.md).

## Code of Conduct

Be respectful, direct, and constructive. By participating, you agree to follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
