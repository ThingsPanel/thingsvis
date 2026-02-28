# Changelog

All notable changes to ThingsVis will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.1.0] - 2025-07-14

### Added

#### Core Platform
- Canvas-based low-code editor (Studio) built on LeaferJS for ≥50 FPS rendering
- Micro-kernel architecture (`@thingsvis/kernel`) — pure UI-free state management with Zustand + Immer
- Zod-based runtime schema validation (`@thingsvis/schema`)
- Full undo/redo system via command pattern with `HistoryManager`
- Node lifecycle management with proxy-layer hit detection

#### Widget System
- Module Federation 2.0 dynamic widget loading with offline IndexedDB caching
- `vis-cli` scaffolding tool for new widget creation
- Widget SDK (`@thingsvis/widget-sdk`) with `defineWidget()` API
- Widget registry (`registry.json`) with static / local / remote load modes
- Error isolation: widget crashes show red placeholder instead of white screen
- Built-in widgets: `basic/rect`, `basic/text`, `basic/circle`, `basic/line`, `chart/echarts-line`, `media/image`

#### Data Sources
- REST data source with Auth header and request body support
- WebSocket data source with heartbeat ping and auto-reconnect
- Platform data source type for ThingsPanel integration

#### Editor Features
- Drag-and-drop node placement with Moveable + Selecto
- Canvas modes: infinite, fixed, grid layout
- Layer panel with Z-order management
- Image upload with `/uploads` proxy support
- Theme system with CSS Variables (Light / Dark / Dawn / Midnight)
- Collapsible left panel (component library)
- i18n support (English + Chinese)

#### Integration
- Embed mode for ThingsPanel host integration via `postMessage` protocol
- Widget mode: bidirectional data sync between ThingsPanel and ThingsVis canvas
- Message router with structured log levels (silent / normal / verbose)
- Guest (sandbox) mode for no-login local preview

#### Infrastructure
- pnpm workspaces + Turborepo monorepo build
- Rspack + Module Federation 2.0 widget builds
- Next.js backend server with Prisma ORM
- SQLite default database (zero-dependency local dev)
- Docker Compose setup (studio + server + database)
- Global React ErrorBoundary with retry/reload UI

### Fixed
- `.env.example` defaulted to PostgreSQL; changed to SQLite for zero-friction local dev
- Widget overlay crash caused silent white-screen; now shows visible red error placeholder
- Grid layout canvas panning and alignment issues
- Layer panel display bugs
- Image upload path proxy in development

### Changed
- Renamed all internal "Plugin" terminology to "Widget" (TASK-05 naming unification)
- README.md paths corrected: `plugins/` → `widgets/`, `apps/preview/` removed

---

[Unreleased]: https://github.com/your-org/thingsvis/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/thingsvis/releases/tag/v0.1.0
