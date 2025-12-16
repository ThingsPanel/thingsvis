# Implementation Plan: Core Data Protocol and Kernel Interfaces

**Branch**: `001-core-data-protocol` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-core-data-protocol/spec.md`

## Summary

Implement the core data protocol schemas and kernel interfaces for ThingsVis. This establishes the "Source of Truth" in `packages/thingsvis-schema` using Zod for runtime validation, and defines abstract contracts in `packages/thingsvis-kernel` for component lifecycle management. The implementation will create separate schema files (`page.ts`, `component.ts`) with automatic TypeScript type inference via `z.infer`, and define strict kernel interfaces in `src/interfaces/` with no `any` types allowed.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)  
**Primary Dependencies**: Zod 3.22.4 (schema validation), tsup 7.2.0 (build tool)  
**Storage**: N/A (in-memory schemas and types only)  
**Testing**: TypeScript type checking (`tsc --noEmit`), manual schema validation tests  
**Target Platform**: Web (ES2020+), Node.js (for build tooling)  
**Project Type**: Monorepo packages (schema definitions and kernel interfaces)  
**Performance Goals**: Schema validation completes in <1ms per object, type inference at compile-time (zero runtime cost)  
**Constraints**: 
- No `any` types in core interfaces (strict type safety)
- Schemas must validate at runtime with clear error messages
- Types must be inferred automatically from Zod schemas
- Kernel interfaces must be UI-free (micro-kernel principle)
- No circular dependencies between packages
**Scale/Scope**: 
- 2 schema files (page.ts, component.ts)
- 2 kernel interface files (visual-component.ts, plugin-factory.ts)
- ~200-300 lines of schema definitions
- ~50-100 lines of interface definitions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Monorepo layout uses pnpm workspaces + Turborepo with `apps/studio`, `apps/preview`, `packages/thingsvis-kernel`, `packages/thingsvis-schema`, `packages/thingsvis-ui`.  
- ✅ Kernel remains UI-free (micro-kernel); interfaces define contracts only, no UI dependencies.  
- ✅ Build strategy uses Rspack + Module Federation 2.0 (via tsup); TS 5.x strict is enabled.  
- ✅ Schemas/types live in `packages/thingsvis-schema` with Zod validation; changes planned before implementation.  
- ✅ Rendering plan: N/A for this feature (interfaces only, no rendering logic).  
- ✅ Performance intent: Schema validation is lightweight (<1ms), types are compile-time only (zero runtime cost).  
- ✅ Plugins/components: Interfaces defined here will be used by plugins wrapped with React `ErrorBoundary` in future features.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-data-protocol/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── visual-component.md
│   └── plugin-factory.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── thingsvis-schema/
│   ├── src/
│   │   ├── index.ts          # Aggregates exports from page.ts and component.ts
│   │   ├── page.ts           # PageSchema with Meta, Config, Content
│   │   └── component.ts      # VisualComponentSchema with Identity, Transform, Data, Props, Events
│   ├── package.json
│   ├── tsconfig.json
│   └── tsup.config.ts
│
└── thingsvis-kernel/
    ├── src/
    │   ├── index.ts          # Aggregates exports from interfaces/
    │   ├── interfaces/
    │   │   ├── visual-component.ts    # IVisualComponent interface
    │   │   └── plugin-factory.ts      # IPluginFactory interface
    │   └── event-bus.ts      # Existing EventBus (unchanged)
    ├── package.json
    ├── tsconfig.json
    └── tsup.config.ts
```

**Structure Decision**: 
- Schema package: Separate files (`page.ts`, `component.ts`) for maintainability, aggregated in `index.ts` for clean public API
- Kernel package: New `src/interfaces/` folder to organize interface contracts, keeping them separate from implementation
- Both packages use existing tsup build configuration with TypeScript declaration generation
- Kernel package will add `@thingsvis/schema` as a dependency to import types

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. This feature aligns with all constitution principles:
- Schemas in dedicated package ✅
- Kernel interfaces are UI-free ✅
- TypeScript strict mode ✅
- Zod validation ✅
- No circular dependencies ✅

## Phase Breakdown & Tasks

### Phase 0: Research & Design Decisions

**Goal**: Resolve any technical unknowns and establish design patterns.

**Research Tasks**:
1. **Zod Schema Patterns**: Review best practices for nested schemas, enums, defaults, and type inference
2. **TypeScript Interface Design**: Review patterns for strict interfaces without `any` types
3. **UUID Validation**: Determine Zod validation approach for UUID v4 format
4. **Component Props Type Safety**: Design approach for flexible props while maintaining type safety

**Output**: `research.md` with design decisions

### Phase 1: Schema & Interface Implementation

**Goal**: Implement schemas and interfaces according to specification.

**Tasks**:

1. **Schema Package - Page Schema** (`packages/thingsvis-schema/src/page.ts`):
   - Define `PageMetaSchema` with id (uuid), version (default "1.0.0"), name, scope enum
   - Define `PageConfigSchema` with mode enum, width/height (defaults 1920x1080), theme enum
   - Define `PageSchema` combining Meta, Config, and Content (nodes array)
   - Export `PageSchema` and inferred `Page` type

2. **Schema Package - Component Schema** (`packages/thingsvis-schema/src/component.ts`):
   - Define `ComponentIdentitySchema` with id, type, name, locked, hidden
   - Define `ComponentTransformSchema` with x, y, width, height, rotation
   - Define `ComponentDataSchema` with sourceId, topic, transform (script string)
   - Define `ComponentEventSchema` with trigger, action, payload
   - Define `VisualComponentSchema` combining all sub-schemas
   - Export `VisualComponentSchema` and inferred `VisualComponent` type
   - Handle props as `Record<string, unknown>` (not `any`) for type safety

3. **Schema Package - Index** (`packages/thingsvis-schema/src/index.ts`):
   - Export all schemas and types from `page.ts` and `component.ts`
   - Re-export types with `IPage`, `IVisualComponent` naming convention for consistency

4. **Kernel Package - Visual Component Interface** (`packages/thingsvis-kernel/src/interfaces/visual-component.ts`):
   - Define `IVisualComponent` interface with strict method signatures
   - Use types from `@thingsvis/schema` for props parameter
   - Ensure no `any` types in interface definition
   - Document method contracts and expected behavior

5. **Kernel Package - Plugin Factory Interface** (`packages/thingsvis-kernel/src/interfaces/plugin-factory.ts`):
   - Define `IPluginFactory` interface with `create(type: string)` method
   - Return type must be `IVisualComponent` or throw error
   - Ensure no `any` types in interface definition
   - Document factory contract and error handling

6. **Kernel Package - Index** (`packages/thingsvis-kernel/src/index.ts`):
   - Export interfaces from `interfaces/` folder
   - Re-export existing `EventBus` and `EventHandler` types
   - Add `@thingsvis/schema` as dependency in `package.json`

7. **Type Safety Verification**:
   - Run `tsc --noEmit` on both packages
   - Verify no `any` types in exported interfaces
   - Verify types are properly inferred from Zod schemas
   - Verify kernel can import and use schema types without errors

**Output**: 
- `data-model.md` - Entity relationships and validation rules
- `contracts/visual-component.md` - IVisualComponent contract specification
- `contracts/plugin-factory.md` - IPluginFactory contract specification
- `quickstart.md` - Usage examples and integration guide

### Phase 2: Validation & Documentation

**Goal**: Ensure implementation meets specification requirements.

**Tasks**:
1. Verify all functional requirements (FR-001 through FR-012) are met
2. Create usage examples demonstrating schema validation
3. Create usage examples demonstrating interface implementation
4. Verify type inference works correctly in consuming code
5. Document edge cases and validation behavior

**Output**: Complete implementation ready for `/speckit.tasks`
