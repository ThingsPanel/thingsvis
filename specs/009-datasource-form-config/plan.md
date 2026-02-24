# Implementation Plan: 数据源表单配置增强 (REST & WebSocket Form Configuration)

**Branch**: `009-datasource-form-config` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-datasource-form-config/spec.md`

## Summary

增强 REST 和 WebSocket 数据源的表单配置能力，让用户能够通过可视化界面完整配置企业级 API 连接，包括认证方式、请求体、超时、重连策略、心跳保活和初始订阅消息，无需手写 JSON。

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React 18, Zod (schema validation), Zustand + Immer (state), CodeMirror (JSON editor)  
**Storage**: N/A (配置持久化复用现有 DataSource 存储机制)  
**Testing**: Vitest (unit tests)  
**Target Platform**: Web (Chrome/Firefox/Edge modern browsers)  
**Project Type**: Monorepo (pnpm + Turbo)  
**Performance Goals**: Form validation < 200ms, UI interactions 60fps  
**Constraints**: Schema 扩展必须向后兼容（新字段设置默认值）  
**Scale/Scope**: 支持 20+ 并发数据源连接

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Micro-Kernel & Separation | ✅ PASS | Kernel 层 (Adapters) 保持 UI-free；UI 层仅在 apps/studio |
| II. Schema-First Contracts | ✅ PASS | 新字段先定义在 `packages/thingsvis-schema`，使用 Zod 验证 |
| III. Type Safety | ✅ PASS | TypeScript strict mode，避免 any，使用 z.infer 派生类型 |
| IV. Backward Compatibility | ✅ PASS | 所有新字段设置 `.optional()` 和 `.default()` 确保旧配置可用 |
| V. Simplicity & Performance | ✅ PASS | 增量增强现有组件，不引入新的全局抽象 |
| VI. Plugin Independence | ✅ PASS | 此功能属于 host 层，不影响插件开发约定 |

**Additional Constraints Check**:
- ✅ pnpm + Turbo monorepo 边界遵守
- ✅ 不修改渲染层 (Leafer/Overlay)
- ✅ 表达式/属性解析保持单一来源

## Project Structure

### Documentation (this feature)

```text
specs/009-datasource-form-config/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (TypeScript interfaces)
│   ├── rest-config.ts
│   └── ws-config.ts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/thingsvis-schema/src/
├── datasource/
│   └── index.ts              # 扩展 RESTConfigSchema, WSConfigSchema
│   └── auth-config.ts        # 新增 AuthConfigSchema (认证配置)
│   └── reconnect-config.ts   # 新增 ReconnectPolicySchema (重连策略)
│   └── heartbeat-config.ts   # 新增 HeartbeatConfigSchema (心跳配置)

packages/thingsvis-kernel/src/datasources/
├── RESTAdapter.ts            # 增强：body, timeout (AbortController), auth 注入
├── WSAdapter.ts              # 增强：重连策略、心跳定时器、initMessage 发送

apps/studio/src/
├── components/ui/
│   ├── KeyValueEditor.tsx    # 新增：可复用键值对编辑器
│   └── AuthSelector.tsx      # 新增：认证方式选择器
├── plugins/DataSourceConfig/
│   ├── RESTForm.tsx          # 重构：分区布局，集成新组件
│   ├── WSForm.tsx            # 重构：分区布局，集成新组件
│   └── sections/             # 新增：表单分区组件
│       ├── HeadersSection.tsx
│       ├── BodySection.tsx
│       ├── AuthSection.tsx
│       ├── ReconnectSection.tsx
│       ├── HeartbeatSection.tsx
│       └── InitMessagesSection.tsx
```

**Structure Decision**: 遵循现有 monorepo 结构，Schema 层扩展在 `packages/thingsvis-schema`，Kernel 层增强在 `packages/thingsvis-kernel`，UI 层新组件在 `apps/studio/src/components/ui` (可复用) 和 `apps/studio/src/widgets/DataSourceConfig` (表单专用)。

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

