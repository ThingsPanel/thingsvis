---

description: "Task list for Multi-type Data Source Integration implementation"
---

# Tasks: 多类型数据源集成 (Multi-type Data Source Integration)

**Input**: Design documents from `/specs/006-multi-source-data/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/interfaces.ts

**Organization**: 任务按用户故事分组，以支持每个故事的独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行运行（不同文件，无依赖关系）
- **[Story]**: 该任务所属的用户故事（如 US1, US2, US3）
- 描述中包含确切的文件路径

## Path Conventions

- **Monorepo (ThingsVis)**: `apps/studio/`, `apps/preview/`, `packages/thingsvis-kernel/`, `packages/thingsvis-schema/`, `packages/thingsvis-ui/`

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 [P] 在 `packages/thingsvis-schema/src/datasource/` 中创建基础 Zod Schema 文件
- [x] T002 [P] 在 `packages/thingsvis-kernel/src/datasources/` 中创建目录结构
- [x] T003 [P] 在 `packages/thingsvis-ui/src/hooks/` 中初始化数据源相关的 Hook 骨架

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 [P] 在 `packages/thingsvis-schema/src/datasource/index.ts` 中实现 `DataSourceSchema` 和 `DataBindingSchema`
- [x] T005 [P] 在 `packages/thingsvis-kernel/src/sandbox/SafeExecutor.ts` 中实现基础 JS 沙箱执行器
- [x] T006 在 `packages/thingsvis-kernel/src/datasources/DataSourceManager.ts` 中实现 `DataSourceManager` 核心逻辑
- [x] T007 [P] 在 `packages/thingsvis-kernel/src/datasources/BaseAdapter.ts` 中定义 `BaseAdapter` 基类
- [x] T008 [P] 在 `packages/thingsvis-ui/src/hooks/useDataRegistry.ts` 中建立 UI 层与内核 Store 的直接订阅机制（遵循 React Bypass 模式）
- [x] T008.1 [US2] 在 `packages/thingsvis-ui/src/hooks/useRealtimeData.ts` 中实现跳过 React 渲染的直接 DOM/Leafer 更新逻辑
- [x] T028 [P] 在 `packages/thingsvis-schema` 中将 `DataBindingSchema` 集成到 `NodeSchema` 核心定义

---

## Phase 3: User Story 1 - 快速原型开发 (Priority: P1) 🎯 MVP

- [x] T009 [P] [US1] 在 `packages/thingsvis-kernel/src/datasources/StaticAdapter.ts` 中实现静态 JSON 适配器
- [x] T010 [US1] 在 `packages/thingsvis-kernel/src/datasources/DataSourceManager.ts` 中注册 `StaticAdapter`
- [x] T011 [P] [US1] 在 `packages/thingsvis-ui/src/hooks/useDataSource.ts` 中实现基本的异步数据获取 Hook
- [x] T012 [P] [US1] 在 `packages/thingsvis-ui/src/components/DataContainer.tsx` 中实现数据注入高阶组件 (HOC)
- [x] T013 [US1] 在 `apps/studio/src/widgets/DataSourceConfig/StaticForm.tsx` 中实现静态数据源配置界面

---

## Phase 4: User Story 2 - 实时监控大屏 (Priority: P1)

- [x] T014 [P] [US2] 在 `packages/thingsvis-kernel/src/datasources/WSAdapter.ts` 中实现 WebSocket 适配器
- [x] T016 [US2] 在 `packages/thingsvis-kernel/src/datasources/DataSourceManager.ts` 中支持流式数据更新推送至全局 Store
- [x] T017 [P] [US2] 在 `packages/thingsvis-ui/src/hooks/useRealtimeData.ts` 中实现针对流式数据的订阅 Hook
- [x] T018 [US2] 在 `apps/studio/src/widgets/DataSourceConfig/RealtimeForm.tsx` 中实现实时数据源配置界面

---

## Phase 5: User Story 3 - 复杂数据结构转换 (Priority: P2)

- [x] T019 [P] [US3] 在 `packages/thingsvis-kernel/src/datasources/RESTAdapter.ts` 中实现支持轮询的 REST 适配器
- [x] T020 [US3] 在 `packages/thingsvis-kernel/src/datasources/BaseAdapter.ts` 中集成 `SafeExecutor` 调用逻辑
- [x] T021 [P] [US3] 在 `packages/thingsvis-ui/src/hooks/useExpressionEvaluator.ts` 中实现 `{{ ... }}` 表达式解析 Hook
- [x] T022 [US3] 在 `apps/studio/src/widgets/DataSourceConfig/RESTForm.tsx` 中实现带有代码编辑器的转换脚本配置界面

---

## Phase 6: UI Refactoring & Polish (UI 重构与完善)

- [x] T029 **UI 架构重构**：将数据源管理从侧边栏移至顶部菜单，并实现 `DataSourceDialog` 弹窗。
- [x] T030 **组件规范化**：重构 `basic/text` 组件并补全 `docs/vis/component-development.md` 开发规范。
- [x] T031 **vis-cli 更新**：更新工具链模板以符合 V2 架构。
- [x] T032 **通用属性流水线**：实现 `PropertyResolver` 并集成到 `VisualEngine` 中。
- [x] T033 **持久化存储**：在 `DataSourceManager` 中实现 IndexedDB 持久化存储。

---

## Phase 7: Verification (最终验证)

- [ ] T025 针对 20+ 并发数据源进行性能压力测试
- [ ] T026 运行 `specs/006-multi-source-data/quickstart.md` 中的验证流程
- [ ] T027 [P] 对 JS 沙箱进行 1MB JSON 转换性能基准测试，验证 SC-005 指标
