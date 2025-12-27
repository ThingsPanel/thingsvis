# Implementation Plan: 多类型数据源集成 (Multi-type Data Source Integration)

**Branch**: `006-multi-source-data` | **Date**: 2025-12-26 | **Spec**: [specs/006-multi-source-data/spec.md](spec.md)
**Input**: Feature specification from `/specs/006-multi-source-data/spec.md`

## Summary

实现一个多类型数据源集成系统，支持 REST API、WebSocket、MQTT 和静态 JSON。该系统采用“内核逻辑与 UI 状态分离”的架构：内核层（`thingsvis-kernel`）负责数据源管理、协议适配和 JS 沙箱转换逻辑；UI 层（`thingsvis-ui` & `apps/studio`）利用 React Query 进行状态管理、缓存和数据绑定。核心能力包括全局数据源注册、属性级别的表达式绑定（`{{ ... }}`）以及安全的高性能数据转换。

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: `zod` (Schema), `zustand` + `immer` (State), `tanstack-query` (Caching/Sync), `mqtt` (Browser-compatible MQTT), `leafer-ui` (Rendering), `SafeExecutor` (Kernel-level sandbox)  
**Storage**: N/A (Runtime state via Zustand & React Query)  
**Testing**: Vitest (Unit/Integration), Playwright (E2E)  
**Target Platform**: Web (Modern Browsers)
**Project Type**: Monorepo (pnpm workspace)  
**Performance Goals**: < 100ms rendering latency for real-time streams, 60 FPS UI stability  
**Constraints**: Core bundle < 800KB, JS transformation < 10ms, sandbox timeout protection  
**Scale/Scope**: Support 20+ simultaneous active data sources per dashboard

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Monorepo layout uses pnpm workspaces + Turborepo with `apps/studio`, `apps/preview`, `packages/thingsvis-kernel`, `packages/thingsvis-schema`, `packages/thingsvis-ui`.  
- [x] Kernel remains UI-free (micro-kernel); plugins do not create reverse deps into kernel.  
- [x] Build strategy uses Rspack + Module Federation 2.0; TS 5.x strict is enabled.  
- [x] Schemas/types live in `packages/thingsvis-schema` with Zod validation; changes planned before implementation.  
- [x] Rendering plan adheres to Leafer (2D) or React Three Fiber (3D); no direct DOM access; state flows via zustand + immer.  
- [x] Performance intent addresses <800KB core bundle and ≥50 FPS targets for relevant surfaces.  
- [x] Plugins/components wrap with React `ErrorBoundary`; styling via TailwindCSS + `shadcn/ui` or rationale provided.

## Project Structure

### Documentation (this feature)

```text
specs/006-multi-source-data/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── interfaces.ts    # Core adapter and manager interfaces
└── tasks.md             # Phase 2 output (to be generated)
```

### Source Code (repository root)

```text
packages/
├── thingsvis-kernel/
│   └── src/
│       ├── datasources/ # DataSourceManager & Adapters
│       └── sandbox/     # SafeExecutor & JS Sandbox
├── thingsvis-schema/
│   └── src/
│       └── datasource/  # Zod schemas for DataSources & Bindings
├── thingsvis-ui/
│   └── src/
│       ├── hooks/       # useDataSource, useDataBinding
│       └── components/  # DataContainer (HOC)
apps/
└── studio/
    └── src/
        └── plugins/     # DataSource configuration UI
```

**Structure Decision**: 遵循单库（Monorepo）多包架构，将逻辑下沉至 `kernel`，类型上浮至 `schema`，展示逻辑保留在 `ui` 和 `apps`。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| JS Sandbox (SafeExecutor) | 需要执行用户自定义转换逻辑 | 直接使用 `eval` 或 `new Function` 存在安全风险且容易导致整个应用崩溃。 |
| React Bypass (Data Flow) | 实时数据高频更新 (WS/MQTT) | 传统的 React Props 传递在 1000+ 组件时会导致严重的性能瓶颈。 |
