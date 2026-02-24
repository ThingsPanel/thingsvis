# Implementation Plan: 栅格布局系统（Gridstack 风格）

**Branch**: `002-grid-layout` | **Date**: 2026-01-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-grid-layout/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

实现 Gridstack 风格的栅格布局系统，在保持现有 Canvas/Leafer 渲染架构不变的前提下，引入 Headless GridLayout 引擎。核心方案：

1. **Schema 扩展**：Page 增加 `layoutMode='grid'` 与 `gridSettings`；Node 增加 `grid{x,y,w,h}` 坐标
2. **Kernel 扩展**：新增 GridSystem 布局引擎，提供 move/resize/compact（碰撞检测+push down+垂直压缩）
3. **UI 层**：新增 grid↔px CoordinateMapper，拖拽/缩放时先转换成 grid 变化再交给 Kernel 产出全量布局
4. **渲染层**：VisualEngine 按 Kernel 计算的 px 结果渲染，增加栅格辅助线和拖拽占位符
5. **兼容性**：fixed/infinite 模式沿用现有 px 逻辑，grid 模式只使用 grid 数据并派生 px 用于绘制

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)  
**Primary Dependencies**: `zod` (Schema), `zustand` + `immer` (State), `leafer-ui` (2D Rendering), `react` (Studio UI)  
**Storage**: JSON schema files (persisted via IPage structure)  
**Testing**: Vitest (unit/integration), Playwright (E2E if applicable)  
**Target Platform**: Web browser (Chrome, Firefox, Edge, Safari)
**Project Type**: Monorepo (pnpm workspaces + Turborepo)  
**Performance Goals**: ≥50 FPS with 50 nodes during grid operations, <50ms placeholder feedback delay  
**Constraints**: Keep kernel UI-free, preserve Leafer/Overlay rendering discipline, <800KB core bundle, no breaking changes to fixed/infinite modes  
**Scale/Scope**: Support up to 100 grid components on single page, 3 canvas modes coexisting

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Compliance Notes |
|-----------|--------|------------------|
| **I. Micro-Kernel & Separation of Concerns** | ✅ PASS | GridSystem engine in `thingsvis-kernel` remains UI-free. All rendering stays in Leafer/VisualEngine. Grid calculations are pure data transformations. |
| **II. Schema-First Contracts (Zod)** | ✅ PASS | New `GridSettingsSchema`, `GridPositionSchema` added to `thingsvis-schema`. Types derived from Zod schemas. Backward compatible (additive only). |
| **III. Type Safety & Predictability** | ✅ PASS | All new interfaces strictly typed. No `any` in public contracts. Grid coordinate constants documented. |
| **IV. Backward Compatibility & Incremental Adoption** | ✅ PASS | Grid layout is opt-in (`layoutMode='grid'`). Fixed/infinite modes unchanged. Migration from px→grid is optional with fallback. |
| **V. Simplicity & Performance** | ✅ PASS | GridSystem is headless/stateless engine. Computation offloaded from UI thread via batched updates. Minimal new abstractions (CoordinateMapper only). |
| **VI. Plugin Independence** | ✅ PASS | Plugins unaffected—they render from props. Grid coordinates resolved to px before reaching widget renderers. |

**Additional Constraints Check:**
- ✅ Fits within existing package boundaries (kernel, schema, ui)
- ✅ Preserves Leafer/Overlay rendering architecture
- ✅ Property resolution remains centralized

**Quality Gates:**
- `pnpm typecheck` for affected packages
- Schema changes maintain backward compatibility
- MVP scenarios demonstrable in Studio

### Post-Design Re-evaluation (Phase 1 Complete)

All constitution principles remain satisfied after Phase 1 design:

| Principle | Post-Design Status | Verification |
|-----------|-------------------|--------------|
| I. Micro-Kernel | ✅ Confirmed | GridSystem in kernel has zero UI imports |
| II. Schema-First | ✅ Confirmed | All schemas defined in data-model.md use Zod |
| III. Type Safety | ✅ Confirmed | All contracts specify TypeScript types |
| IV. Backward Compat | ✅ Confirmed | Schema changes are additive only |
| V. Simplicity | ✅ Confirmed | Single CoordinateMapper abstraction; no global state changes |
| VI. Plugin Independence | ✅ Confirmed | Plugins receive px coordinates, unaware of grid |

**No gate violations detected. Ready for Phase 2 (tasks generation).**

## Project Structure

### Documentation (this feature)

```text
specs/002-grid-layout/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── grid-kernel-api.md
│   └── grid-schema.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/thingsvis-schema/src/
├── page.ts                    # Extended: add layoutMode, gridSettings
├── component.ts               # Extended: add grid position
├── grid/                      # NEW: Grid-specific schemas
│   ├── index.ts
│   ├── grid-settings.ts       # GridSettingsSchema
│   └── grid-position.ts       # GridPositionSchema

packages/thingsvis-kernel/src/
├── store/KernelStore.ts       # Extended: add gridState, grid actions
├── grid/                      # NEW: Grid layout engine
│   ├── index.ts
│   ├── GridSystem.ts          # Core headless layout engine
│   ├── GridCollision.ts       # Collision detection
│   ├── GridCompaction.ts      # Vertical compaction algorithm
│   └── types.ts               # Grid-specific types

packages/thingsvis-ui/src/
├── utils/
│   ├── coords.ts              # Extended: add grid mode support
│   └── grid-mapper.ts         # NEW: Grid ↔ Px coordinate mapper
├── engine/
│   ├── VisualEngine.ts        # Extended: grid placeholder rendering
│   └── grid/                  # NEW: Grid rendering helpers
│       ├── GridOverlay.ts     # Background grid lines
│       └── GridPlaceholder.ts # Drag placeholder
├── hooks/
│   └── useGridLayout.ts       # NEW: React hook for grid interactions

apps/studio/src/
├── components/
│   ├── CanvasView.tsx         # Extended: grid mode handling
│   └── tools/
│       └── GridTransformControls.tsx  # NEW: Grid-aware transform controls
├── pages/
│   └── settings/
│       └── GridSettingsPanel.tsx      # NEW: Grid configuration UI
```

**Structure Decision**: Uses existing monorepo package boundaries. New grid logic distributed across schema (contracts), kernel (engine), and ui (rendering/interaction) following established separation of concerns.

## Complexity Tracking

> **No constitution violations. All principles pass.**

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| New GridSystem module | Added to kernel | Required for headless layout computation; keeps UI-free principle |
| CoordinateMapper utility | Added to UI | Necessary translation layer; minimal new abstraction |
| Schema extensions | Additive fields only | Backward compatible; existing pages unaffected |
