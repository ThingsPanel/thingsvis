# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-25

### 🎉 Initial Release

ThingsVis v0.1.0 — Industrial-grade, low-code visualization platform built as a canvas-based editor for creating interactive IoT dashboards.

### Added

- **Canvas Editor** — Drag-and-drop visual editor with fixed, infinite, and grid layout modes
- **Widget Architecture** — Module Federation 2.0-based widget loading with offline caching
- **Micro-Kernel Design** — Strict separation between UI-free kernel (`@thingsvis/kernel`) and visual components (`@thingsvis/ui`)
- **Widget SDK** — `@thingsvis/widget-sdk` for building custom widgets with control panels
- **Built-in Widgets** — Rectangle, Circle, Line, Text, Image, ECharts Line chart
- **Command System** — Full undo/redo support with keyboard shortcuts
- **Data Sources** — REST API (with Auth/Headers/Body) and WebSocket (Heartbeat/Reconnect) adapters
- **Platform Integration** — Embeddable editor mode via postMessage for ThingsPanel IoT platform
- **Authentication** — Email/password auth with SSO support for platform integration
- **Project Management** — Cloud and local storage with auto-save
- **Dark Theme** — Dark mode UI with CSS custom properties
- **Docker Deployment** — Full Docker + docker-compose setup with PostgreSQL
- **CI/CD** — GitHub Actions workflows for build, lint, and deployment
- **vis-cli** — CLI tool for scaffolding new widgets

### Architecture

- **Monorepo** — Turborepo + pnpm workspaces
- **Packages** — `thingsvis-kernel`, `thingsvis-schema`, `thingsvis-ui`, `thingsvis-utils`, `thingsvis-widget-sdk`
- **Apps** — `studio` (React 18 + Rspack), `server` (Next.js + Prisma + PostgreSQL)
- **TypeScript** — Strict mode with Zod runtime validation
