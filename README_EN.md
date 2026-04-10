# ThingsVis

**A data visualization engine and dashboard workspace purpose-built for the modern Web and IoT.**

[中文](./README.md) · [Documentation](./apps/docs/guide/introduction.md) · [Widget Development Guide](./apps/docs/development/quick-start.md)

<p align="center">
  <img src="./apps/docs/public/images/readme/Snipaste_2026-04-10_16-16-50.png" alt="ThingsVis Screenshot 1" width="48%" />
  <img src="./apps/docs/public/images/readme/Snipaste_2026-04-10_16-17-34.png" alt="ThingsVis Screenshot 2" width="48%" />
</p>
<p align="center">
  <img src="./apps/docs/public/images/readme/Snipaste_2026-04-10_16-21-04.png" alt="ThingsVis Screenshot 3" width="48%" />
  <img src="./apps/docs/public/images/readme/Snipaste_2026-04-10_16-21-29.png" alt="ThingsVis Screenshot 4" width="48%" />
</p>

## What Is ThingsVis?

ThingsVis is a data visualization engine and dashboard workspace for modern Web and IoT scenarios. It is designed for industrial dashboards, monitoring screens, digital twin pages, device control panels, and embeddable visualization modules. Unlike traditional BI tools that focus more on reporting and business analysis, ThingsVis emphasizes complex visual interfaces, real-time interaction, engineering extensibility, and seamless integration into business systems.

ThingsVis advantages:

- AI-friendly: a unified Schema contract built on Zod makes views structured, validated, and naturally suitable for AI generation, editing, and replay.
- Flexible extension: Widget sandboxing plus CLI/SDK tooling lets developers build and publish business components as independently as regular React packages.
- Lightweight integration: the core capability is distilled into a frontend runtime Kernel that can be embedded into existing Web systems and SaaS products through SDKs, components, or iframes.
- Interaction-first: beyond real-time display, ThingsVis supports subscriptions, linkage, action triggers, and device control for IoT scenarios that require operational feedback loops.
- Engineering-ready: the Monorepo architecture cleanly separates Studio, Kernel, Schema, and tooling for secondary development, maintenance, and continuous delivery.

ThingsVis is suitable for:

- real-time large-screen scenarios such as industrial monitoring, production dashboards, and operation centers;
- energy, building, and IoT device management scenarios that require state linkage and control loops;
- integration scenarios where SaaS products, low-code platforms, or industry systems need embedded visualization capabilities;
- intelligent scenarios where visualization pages need to be generated, adjusted, and orchestrated by AI.

---

## Quick Start

### Requirements
- Node.js `>= 20.10.0`
- pnpm `>= 9.0.0`

### Start the local frontend environment

Get an isolated frontend developer sandbox, including the Studio canvas and Kernel engine, in just three steps:

```bash
pnpm install
pnpm build:widgets
pnpm dev
```

If you need the full-stack workflow with real authentication and project management:

```bash
pnpm dev:app
```

### Initialize the database and admin account before the first full-stack startup

`pnpm dev:app` starts Studio, Kernel, and Server together, but it does not create the first administrator in your local PostgreSQL database. Before first use, complete the following steps:

1. Copy `apps/server/.env.example` to `apps/server/.env`, then fill in required variables such as `DATABASE_URL` and `AUTH_SECRET`.
2. Make sure PostgreSQL is running locally and that `DATABASE_URL` points to a writable database.
3. Run the schema push and seed scripts in `apps/server`:

```bash
cd apps/server
pnpm db:push
pnpm seed
```

The default admin account is:

- Email: `admin@thingsvis.io`
- Password: `admin123`

To customize the seeded account, override the following variables in `apps/server/.env` and run `pnpm seed` again:

```bash
SEED_ADMIN_EMAIL=admin@thingsvis.io
SEED_ADMIN_PASSWORD=admin123
SEED_ADMIN_NAME=Admin
```

Then return to the repository root and start the full development environment:

```bash
pnpm dev:app
```

> If the login page shows "Server error, please try again later", the usual causes are that `apps/server` failed to start, `pnpm db:push` was not executed, or `pnpm seed` has not created the initial administrator yet.

> **Useful commands**:
> - `pnpm docs:dev`: run the documentation site locally.
> - `pnpm typecheck` and `pnpm lint`: run workspace-wide TypeScript checks and lint rules.
> - `pnpm test`: run the unit test suites.

---

## Developer Experience: Build Your Own Widget in Five Minutes

We redefine the experience of extending a visualization platform. Creating an independent Widget is as straightforward as bootstrapping a basic React project:

```bash
pnpm vis-cli create <YourCategory> <YourWidgetName>
```

The scaffold gives you a clear three-step development path:
1. **Schema contract**: define strict data property validation in `schema.ts` with Zod.
2. **Visual panel**: register and mount the interactive properties panel in `controls.ts`.
3. **Render view**: implement the actual content logic and styles in `index.tsx` with React `defineWidget`.

To explore this isolation and plug-in mechanism in depth, see the [CLI Guide](./tools/cli/README.md) or the [Widget SDK Guide](./packages/thingsvis-widget-sdk/README.md).

---

## Architecture

ThingsVis is a modern Monorepo built on Turborepo, with clear separation between the core state machine, shared contracts, and runtimes:

- **`apps/studio/`**: the entry and main view of the visual Studio canvas editor.
- **`packages/thingsvis-kernel/`**: the highly decoupled headless runtime and its state management core.
- **`packages/thingsvis-schema/`**: the global contracts and types that define platform lifecycle and cross-component communication.
- **`tools/cli/`**: the built-in developer toolchain, including the `vis-cli` scaffolding tool.

> Further references:
> - [Global Variables Guide](./apps/docs/guide/variables.md)
> - [Third-Party Integration and Embed Guide](./docs/thingspanel-integration-guide.md)
> - [Showcase Dashboard Analysis](./apps/docs/guide/showcase-dashboard.md)

---

## Contributing

ThingsVis welcomes ideas and contributions from open-source developers. Before submitting your first PR, please read our [Contributing Guide](./CONTRIBUTING.md).

- 🐞 **Report bugs**: use the standard [bug report template](./.github/ISSUE_TEMPLATE/bug-report.yml).
- ✨ **Request features**: discuss new ideas through the [feature request template](./.github/ISSUE_TEMPLATE/feature-request.yml).
- 📝 **Commit convention**: we follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). If your PR changes user-facing UI or interactions, include screenshots or recordings.

> For any potential security issue related to the framework design, please follow our [Security Policy](./SECURITY.md).

---

## License

ThingsVis is released under the [Apache-2.0 License](./LICENSE).
