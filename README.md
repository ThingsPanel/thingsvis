# ThingsVis

**ThingsVis** is an industrial-grade, low-code visualization platform built as a canvas-based editor for creating interactive visualizations. Designed for desktop consoles, it provides a powerful plugin ecosystem and micro-kernel architecture for building scalable visualization applications.

## 🌟 Features

- **Canvas-Based Editor**: Intuitive drag-and-drop interface for creating visualizations
- **Plugin Ecosystem**: Extensible architecture with 7-category component taxonomy
- **Micro-Kernel Design**: Strict separation between UI-free kernel logic and visual components
- **Module Federation 2.0**: Dynamic plugin loading with offline caching support
- **High Performance**: Optimized for ≥50 FPS rendering with support for 1000+ nodes
- **Type-Safe**: Built with TypeScript 5.x in strict mode with Zod runtime validation
- **Undo/Redo System**: Full command pattern implementation with history management

## 🏗️ Architecture

### Monorepo Structure

```
thingsvis/
├── apps/
│   ├── studio/          # Main editor application
│   └── preview/         # Simple host for testing plugins
├── packages/
│   ├── thingsvis-kernel/    # UI-free core logic
│   ├── thingsvis-schema/    # Zod-based type definitions
│   ├── thingsvis-ui/        # Headless visual components
│   └── thingsvis-utils/     # Shared utilities
├── plugins/
│   ├── basic/           # Basic components (rect, text, etc.)
│   ├── layout/          # Layout components
│   ├── media/           # Media components (image, video)
│   ├── chart/           # Chart components
│   ├── custom/          # Custom components
│   ├── data/            # Data components
│   └── interaction/     # Interaction components
├── tools/
│   └── cli/             # vis-cli for scaffolding plugins
├── configs/             # Shared build configurations
└── specs/               # Feature specifications and documentation
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

#### Run the Preview App

```bash
# Start the preview/testing app
pnpm dev --filter ./apps/preview
```

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
pnpm build:plugins

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

## 🔌 Plugin Development

ThingsVis uses a powerful CLI tool to scaffold new plugins quickly.

### Create a New Plugin

```bash
# Scaffold a new plugin
pnpm vis-cli create <category> <plugin-name>

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

### Plugin Structure

Each generated plugin includes:

```
plugins/<category>/<name>/
├── package.json          # Plugin package configuration
├── rspack.config.js      # Build configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # Plugin documentation
├── public/
│   └── index.html        # Dev server landing page
└── src/
    ├── index.ts          # Main plugin entry (exports Main module)
    └── spec.tsx          # Visual isolation test component
```

### Develop a Plugin

```bash
# Navigate to your plugin directory
cd plugins/<category>/<name>

# Start the dev server (serves Module Federation remote)
pnpm dev

# The plugin will be available at http://localhost:<port>/remoteEntry.js
```

### Plugin API

Each plugin must export a `Main` module conforming to the `PluginMainModule` interface:

```typescript
import type { PluginMainModule } from '@thingsvis/schema';

export const Main: PluginMainModule = {
  componentId: 'category/name',
  create: () => {
    // Return a Leafer-compatible element
    return new Rect({ width: 100, height: 100, fill: '#ff0000' });
  },
  Spec: SpecComponent, // Optional: Visual test component
};
```

### Register Your Plugin

Add your plugin to the registry file (`apps/preview/public/registry.json` or `apps/studio/public/registry.json`):

```json
{
  "remoteName": "thingsvis-plugin-basic-button",
  "remoteEntryUrl": "http://localhost:3100/remoteEntry.js",
  "componentId": "basic/button",
  "version": "0.0.1"
}
```

### Visual Testing

Each plugin includes a `spec.tsx` file for isolated visual testing:

1. Start your plugin dev server: `pnpm dev`
2. Open the preview app: `pnpm dev --filter ./apps/preview`
3. Select your plugin from the spec runner
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
- `PluginMainModule` - Plugin interface definition
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

### Plugin Ecosystem

**7-Category Taxonomy:**

1. **Basic** - Fundamental UI elements (rect, text, circle)
2. **Layout** - Layout and container components
3. **Media** - Images, videos, and media players
4. **Chart** - Data visualization and charts
5. **Custom** - Custom/specialized components
6. **Data** - Data-related components
7. **Interaction** - Interactive elements and controls

**Plugin Features:**

- Dynamic loading via Module Federation
- Offline caching with IndexedDB
- Error isolation (failures don't crash host)
- Visual testing in isolation
- Hot module replacement in development

## 📚 Documentation

## 🤝 Contributing

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

### Plugin Development Guidelines

1. Use the `vis-cli` to scaffold new plugins
2. Follow the category taxonomy
3. Export a valid `PluginMainModule`
4. Include a `Spec` component for visual testing
5. Keep plugins self-contained and isolated
6. Use peer dependencies for shared libraries (React, LeaferJS)

## 📄 License

[Add your license information here]

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
