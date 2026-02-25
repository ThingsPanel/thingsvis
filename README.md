# ThingsVis

**English | [中文](README_ZH.md)**

**ThingsVis** is an industrial-grade, low-code visualization platform built as a canvas-based editor for creating interactive visualizations. Designed for desktop consoles, it provides a powerful plugin ecosystem and micro-kernel architecture for building scalable visualization applications.

## 🌟 Features

- **Canvas-Based Editor**: Intuitive drag-and-drop interface for creating visualizations
- **Widget Ecosystem**: Extensible architecture with widget-based component taxonomy
- **Micro-Kernel Design**: Strict separation between UI-free kernel logic and visual components
- **Module Federation 2.0**: Dynamic widget loading with offline caching support
- **High Performance**: Optimized for ≥50 FPS rendering with support for 1000+ nodes
- **Type-Safe**: Built with TypeScript 5.x in strict mode with Zod runtime validation
- **Undo/Redo System**: Full command pattern implementation with history management
- **Advanced Data Source**: Enterprise-grade REST (Auth/Body) and WebSocket (Heartbeat/Reconnect) support

## 🏗️ Architecture

### Monorepo Structure

```
thingsvis/
├── apps/
│   ├── studio/              # Main editor application
│   └── server/              # Backend API server (Next.js)
├── packages/
│   ├── thingsvis-kernel/    # UI-free core logic
│   ├── thingsvis-schema/    # Zod-based type definitions
│   ├── thingsvis-ui/        # Headless visual components
│   ├── thingsvis-utils/     # Shared utilities
│   └── thingsvis-widget-sdk/# Widget development SDK
├── widgets/
│   ├── basic/               # Basic components (rect, text, circle, line)
│   ├── chart/               # Chart components (echarts-line)
│   └── media/               # Media components (image)
├── tools/
│   └── cli/                 # vis-cli for scaffolding widgets
├── configs/                 # Shared build configurations
└── docs/                    # Documentation and dev tasks
```

### Core Technologies

- **TypeScript 5.x** - Strict mode enabled for type safety
- **Rspack + Module Federation 2.0** - Fast builds and dynamic plugin loading
- **React 18** - UI rendering layer
- **LeaferJS** - High-performance 2D canvas rendering
- **Zustand + Immer** - State management with immutable updates
- **Zod** - Runtime schema validation
- **TailwindCSS** - Utility-first styling
- **Turborepo** - Monorepo build orchestration
- **pnpm** - Fast, disk-efficient package manager

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **pnpm** 8+ (install via `npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd thingsvis

# Install dependencies
pnpm install
```

### Development

#### Run the Studio App

```bash
# Start the main editor
pnpm dev --filter ./apps/studio

# Or use the shorthand
pnpm dev
```

The studio will be available at `http://localhost:3000` (or the port shown in terminal).

#### Quick Start with Docker

```bash
# Start all services (studio + server + database)
docker-compose up -d
```

#### Run the Backend Server

The backend server is required for features like authentication and project management.

1. Setup environment variables:
   Copy `.env.example` to `.env` in `apps/server/`.

2. Initialize the database:
   ```bash
   pnpm --filter @thingsvis/server db:migrate
   # or
   pnpm --filter @thingsvis/server db:push
   ```

3. Start the server:
   ```bash
   pnpm dev --filter @thingsvis/server
   ```

   The server will be available at `http://localhost:8000`.

### Building

```bash
# Build all packages and apps (recommended)
pnpm -w build

# Alternative: Build using turbo
pnpm build

# Build specific package
pnpm build --filter @thingsvis/kernel
pnpm build --filter @thingsvis/schema
pnpm build --filter @thingsvis/ui

# Build all plugins
pnpm build:widgets

# Build studio app
pnpm build --filter ./apps/studio
```

### Type Checking

```bash
# Type check all packages
pnpm typecheck

# Type check specific package
pnpm typecheck --filter @thingsvis/kernel
```

## 🔌 Widget Development

ThingsVis uses a powerful CLI tool to scaffold new widgets quickly.

### Create a New Widget

```bash
# Scaffold a new widget
pnpm vis-cli create <category> <widget-name>

# Example: Create a basic button component
pnpm vis-cli create basic button

# Example: Create a custom chart
pnpm vis-cli create chart line-chart
```

**Available Categories:**
- `basic` - Basic UI components
- `layout` - Layout components
- `media` - Media components (images, videos)
- `chart` - Chart and data visualization
- `custom` - Custom components
- `data` - Data-related components
- `interaction` - Interactive components

### Widget Structure

Each generated widget includes:

```
widgets/<category>/<name>/
├── package.json          # Widget package configuration
├── rspack.config.js      # Build configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # Widget documentation
├── public/
│   └── index.html        # Dev server landing page
└── src/
    ├── index.ts          # Main widget entry (exports Main module)
    └── spec.tsx          # Visual isolation test component
```

### Develop a Widget

```bash
# Navigate to your widget directory
cd widgets/<category>/<name>

# Start the dev server (serves Module Federation remote)
pnpm dev

# The widget will be available at http://localhost:<port>/remoteEntry.js
```

### Widget API

Each widget must export a `Main` module conforming to the `WidgetMainModule` interface:

```typescript
import type { WidgetMainModule } from '@thingsvis/schema';

export const Main: WidgetMainModule = {
  componentId: 'category/name',
  create: () => {
    // Return a Leafer-compatible element
    return new Rect({ width: 100, height: 100, fill: '#ff0000' });
  },
  Spec: SpecComponent, // Optional: Visual test component
};
```

### Register Your Widget

Add your widget to the registry file (`apps/studio/public/registry.json`):

```json
{
  "remoteName": "thingsvis-widget-basic-button",
  "remoteEntryUrl": "http://localhost:3100/remoteEntry.js",
  "componentId": "basic/button",
  "version": "0.0.1"
}
```

### Visual Testing

Each widget includes a `spec.tsx` file for isolated visual testing:

1. Start your widget dev server: `pnpm dev`
2. Open the studio app: `pnpm dev --filter ./apps/studio`
3. Add your widget from the component panel
4. Verify rendering and error isolation

## 📦 Package Overview

### @thingsvis/kernel

The UI-free core engine providing:

- State management (Zustand + Immer)
- Command pattern with undo/redo
- Event bus for plugin communication
- History management
- Node lifecycle management

**Key APIs:**

```typescript
import {
  createNodeDropActionCommand,
  getPage,
  eventBus,
  HistoryManager
} from '@thingsvis/kernel';
```

### @thingsvis/schema

Zod-based runtime type validation and TypeScript types:

- `PageSchema` - Page structure validation
- `NodeSchema` - Node/component validation
- `WidgetMainModule` - Plugin interface definition
- Runtime schema validation for all data structures

### @thingsvis/ui

Headless visual components and rendering utilities:

- Plugin loader with Module Federation
- Registry management
- Offline caching (IndexedDB)
- Component isolation and error boundaries

### @thingsvis/utils

Shared utilities across packages:

- Common helper functions
- Type utilities
- Constants and enums

## 🛠️ Development Workflow

### Typical Development Flow

1. **Start the Studio**
   ```bash
   pnpm dev --filter ./apps/studio
   ```

2. **Create a New Plugin**

   ```bash
   pnpm vis-cli create custom my-widget
   ```

3. **Develop the Plugin**

   ```bash
   cd plugins/custom/my-widget
   pnpm dev
   ```

4. **Test in Preview**
   - Open preview app
   - Load your plugin via registry
   - Test visual rendering and interactions

5. **Build for Production**

   ```bash
   pnpm build
   ```

### Working with Packages

When modifying core packages (`kernel`, `schema`, `ui`):

```bash
# 1. Make changes to the package
# 2. Rebuild the package
pnpm build --filter @thingsvis/kernel

# 3. The changes will be automatically available to apps via workspace linking
# 4. Restart your dev server to see changes
```

### Code Quality

```bash
# Type checking
pnpm typecheck

# Lint (when configured)
pnpm lint

# Run all checks
pnpm typecheck && pnpm lint
```

## 🏛️ Architecture Principles

### Micro-Kernel Design

- **Kernel** (`@thingsvis/kernel`): Pure logic, no UI dependencies
- **UI Layer** (`@thingsvis/ui`): Visual components, no business logic
- **Schema** (`@thingsvis/schema`): Shared contracts and validation
- **Plugins**: Self-contained, isolated components

### Constitution-Driven Development

ThingsVis follows strict architectural constraints:

1. **Separation of Concerns**: Kernel remains UI-free
2. **Plugin Isolation**: Plugins cannot create reverse dependencies into kernel
3. **Type Safety**: TypeScript strict mode + Zod runtime validation
4. **Performance Targets**:
   - Core bundle < 800KB
   - ≥50 FPS rendering
   - Support for 1000+ nodes
5. **Build Strategy**: Rspack + Module Federation 2.0
6. **State Management**: Zustand + Immer for immutable updates

### Widget Ecosystem

**Widget Categories:**

1. **Basic** - Fundamental UI elements (rectangle, text, circle, line)
2. **Chart** - Data visualization (ECharts line, bar, pie)
3. **Media** - Images, videos, and media players

**Widget Features:**

- Dynamic loading via Module Federation
- Offline caching with IndexedDB
- Error isolation (failures don't crash host)
- Visual testing in isolation
- Hot module replacement in development

## 📚 Documentation

Documentation is available in the `docs/` directory. See `docs/dev-tasks/` for the release task list and development roadmap.

## 🤝 Contributing

**Please read our [Contributing Guide](CONTRIBUTING.md) before starting.**

### Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Create a feature branch: `git checkout -b feature/my-feature`
4. Make your changes
5. Run type checking: `pnpm typecheck`
6. Build to verify: `pnpm build`
7. Commit and push your changes
8. Create a pull request

### Coding Standards

- **TypeScript**: Strict mode enabled, no implicit any
- **Naming**: Use kebab-case for files, PascalCase for components
- **Imports**: Use absolute imports from package names
- **Comments**: Document complex logic and public APIs
- **Testing**: Add tests for new features (when test framework is configured)

### Widget Development Guidelines

1. Use the `vis-cli` to scaffold new widgets
2. Follow the category taxonomy
3. Export a valid `WidgetMainModule`
4. Include a `Spec` component for visual testing
5. Keep widgets self-contained and isolated
6. Use peer dependencies for shared libraries (React, LeaferJS)

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).

## 🙏 Acknowledgments

Built with:

- [React](https://react.dev/) - UI library
- [LeaferJS](https://www.leaferjs.com/) - Canvas rendering
- [Rspack](https://www.rspack.dev/) - Fast bundler
- [Module Federation](https://module-federation.io/) - Micro-frontend architecture
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Zod](https://zod.dev/) - Schema validation
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Turborepo](https://turbo.build/) - Monorepo tooling

---

**ThingsVis** - Industrial-grade visualization platform for the modern web.
