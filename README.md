# ThingsVis

**A data visualization engine and dashboard workspace purpose-built for the modern Web and IoT.**

[中文](./README_ZH.md) · [Documentation](./apps/docs/guide/introduction.md) · [Widget Development Guide](./apps/docs/development/quick-start.md)

![ThingsVis Showcase Dashboard](./apps/docs/public/images/showcase/city-ops-editor.png)

## Why ThingsVis?

### AI-Native Root Protocol (AI-Native)
**Pain point**: Traditional visualization platforms rely on tightly-coupled, discrete internal config formats, making it extremely difficult to connect with Large Language Models for "natural language dashboard generation."
**Rebuilt**: The core utilizes Zod to converge a strictly typed visualization contract (Schema). The system natively supports parsing 100% structured JSON view blueprints, providing perfect machine-readability that paves the way for AI to generate industrial dashboards directly via dialogue.

### Zero-Coupling Component Sandbox (Sandbox)
**Pain point**: To add just a simple pie chart, developers often have to pull gigabytes of core engine source code and endure long, error-prone full builds.
**Rebuilt**: Our exclusive CLI and SDK offer a pure, micro-frontend-level independent development experience. External components can be developed, debugged, and built standalone just like a regular React NPM package, enabling dynamic hot-plugging without polluting the core codebase.

### Headless & Backend-Free Integration (Embed)
**Pain point**: When you just want to add a dashboard module to an existing project, you're frequently forced to deploy a heavy, bulky Java backend and microservice infrastructure.
**Rebuilt**: By distilling the core down to a pure frontend runtime (Kernel), we achieve true zero-backend dependency. With just a few lines of SDK or iframe code, you can seamlessly embed this visualization infrastructure into any third-party SaaS projects.

### Interactive IoT Viewport (IoT-Ready)
**Pain point**: Many open-source frontend "competitors" are built strictly for rigid scaled-display scenarios—they are read-only and become useless when real bidirectional "device control" or command dispatch is required.
**Rebuilt**: We natively injected reactive device communication channels and action triggers based on subscriptions. Whether it's responsive grid dashboards or device switch operations, ThingsVis elevates read-only screens into actionable industrial IoT control panels.

---

## Quick Start

### Requirements
- Node.js `>= 20.10.0`
- pnpm `>= 9.0.0`

### Start Local Frontend Environment

Experience an isolated, pure-frontend developer sandbox (including Studio canvas and Kernel engine) in just 3 steps:

```bash
pnpm install
pnpm build:widgets
pnpm dev
```

If you need to experience the full-stack flow, including real authentication and project management:

```bash
pnpm dev:app
```

> **Useful Commands**:
> - `pnpm docs:dev`: Run the docs site locally.
> - `pnpm typecheck` & `pnpm lint`: Run workspace TypeScript checks and linting rules.
> - `pnpm test`: Execute unit test suites.

---

## Developer Experience: Build a Widget in 5 Minutes

We redefined the technical experience of extending code in a visualization platform. Creating an independent widget is as simple as bootstrapping a React app:

```bash
pnpm vis-cli create <YourCategory> <YourWidgetName>
```

Based on the scaffolding, we provide a crystal-clear 3-step authoring path:
1. **Schema Contract**: Define strict data prop validations using Zod in `schema.ts`.
2. **Controls Panel**: Register and mount the interactive properties panel in `controls.ts`.
3. **Render View**: Use React's `defineWidget` to implement the actual logic and styling in `index.tsx`.

To dive deep into this isolated plugin mechanism, refer to: [CLI Reference](./tools/cli/README.md) or [Widget SDK Reference](./packages/thingsvis-widget-sdk/README.md).

---

## Architecture

ThingsVis is a modern Monorepo (powered by Turborepo) that cleanly separates the core state machine, shared protocols, and runtimes:

- **`apps/studio/`**: The visual Studio editor entry and main view.
- **`packages/thingsvis-kernel/`**: Extremely decoupled headless runtime environment and state management core.
- **`packages/thingsvis-schema/`**: Global contracts and types defining the platform runtime lifecycle and cross-component communication.
- **`tools/cli/`**: Built-in developer toolkit — the powerful `vis-cli` scaffolding tool.

> Further design references:
> - [Global Variables Guide](./apps/docs/guide/variables.md)
> - [Integration and Embed Guide](./docs/thingspanel-integration-guide.md)
> - [Showcase Dashboard Analysis](./apps/docs/guide/showcase-dashboard.md)

---

## Contributing

ThingsVis is eager to see ideas collide from open-source developers! Before you submit your first PR, please read our [Contributing Guide (CONTRIBUTING.md)](./CONTRIBUTING.md).

- 🐞 **Report Bugs**: Please use the unified [Bug Report Template](./.github/ISSUE_TEMPLATE/bug-report.yml).
- ✨ **Request Features**: If you have exciting ideas, use the [Feature Request Template](./.github/ISSUE_TEMPLATE/feature-request.yml) to discuss with us.
- 📝 **Commit Convention**: We strictly follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). If your PR involves user-facing UI or interaction changes, we highly expect you to include **screenshots** or **recordings**.

> For reporting any potential security design vulnerabilities, please refer to our [Official Security Policy (SECURITY.md)](./SECURITY.md).

---

## License

ThingsVis is open-sourced under the [Apache-2.0 License](./LICENSE).
