# Feature Specification: Canvas Kernel & Studio Render View

**Feature Branch**: `003-canvas-kernel`  
**Created**: 2025-12-19  
**Status**: Draft  
**Input**: User description: "核心目标：在 packages/thingsvis-kernel 中实现高性能画布内核，并提供 apps/studio 可消费的渲染视图 。多模式支持：根据 PageSchema 的 mode 字段，支持 Fixed (固定大屏)、Infinite (无限组态) 和 Reflow (自适应看板) 三种模式 。性能指标：首屏冷启动 < 1.5s，支持万级图元渲染稳定在 50FPS+ 。隔离原则：使用 React ErrorBoundary 包装每个渲染插件，确保单个组件 JS 报错不导致画布白屏 。交互规范：实现基于 Moveable 的 2D/3D 混合操作逻辑，支持多选、框选、吸附和成组 。"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 设计者在 Studio 中搭建高性能多模式画布 (Priority: P1)

作为大屏/看板设计者，我希望在 Studio 中打开任意 PageSchema（mode 可为 Fixed / Infinite / Reflow），都能在画布视图中被正确渲染和缩放，并在首屏 1.5 秒内可见，便于我快速搭建和调整页面布局。

**Why this priority**: 这是画布内核的基础能力，没有可靠的渲染视图，Studio 无法为设计者提供可视化搭建体验。

**Independent Test**: 仅接入新的 canvas kernel 和渲染视图（不改其它业务逻辑），在 Studio 中加载不同模式的 PageSchema，验证是否在规定时间内完成首屏渲染，并支持基础浏览（缩放、平移）。

**Acceptance Scenarios**:

1. **Given** 设计者在 Studio 中打开一个 Fixed 模式的大屏页面 **When** 页面 schema 加载完成 **Then** 画布在 1.5 秒内渲染出完整首屏，并以合适缩放展示全屏内容。  
2. **Given** 设计者在 Studio 中打开一个 Infinite 模式的组态画布 **When** 页面 schema 加载完成 **Then** 画布以无限画布形式呈现，可通过滚轮/拖拽自由移动视野，节点始终保持清晰可见。  
3. **Given** 设计者在 Studio 中打开一个 Reflow 模式的自适应看板 **When** 调整浏览器窗口尺寸 **Then** 画布中的组件按规则自适应重排，不卡顿、不出现重叠或遮挡异常。  

---

### User Story 2 - 设计者在画布中对单个或多个组件进行精细编辑 (Priority: P2)

作为大屏/看板设计者，我希望在画布中可以对一个或多个组件进行选中、拖拽、缩放、旋转、成组/解组，并且支持吸附、对齐和层级调整，从而高效完成复杂布局调整。

**Why this priority**: 交互编辑能力是设计工作流的核心，直接影响搭建效率和画布体验。

**Independent Test**: 在接入新 canvas kernel 后，仅验证画布层的选中、多选、框选、拖拽、缩放、旋转、成组/解组、吸附等操作是否可用且流畅，而不依赖其它业务功能。

**Acceptance Scenarios**:

1. **Given** 设计者在画布中选中单个组件 **When** 拖拽组件并靠近其它组件的边或中心线 **Then** 出现明显的吸附/对齐辅助线，并以 50FPS+ 的流畅度完成拖动。  
2. **Given** 设计者按住 Shift 在画布中点击多个组件 **When** 通过框选或点击完成多选后拖拽 **Then** 所有选中组件作为整体移动，且保持彼此相对位置不变。  
3. **Given** 设计者选中若干组件 **When** 执行成组操作 **Then** 这些组件形成一个逻辑组，可整体选中、移动和调整变换；再次执行解组后，各组件恢复为独立元素。  

---

### User Story 3 - 运营/开发在运行态安全消费画布视图 (Priority: P3)

作为运营或嵌入 Studio 渲染视图的应用开发者，我希望运行态的画布中任意插件或组件抛出 JS 异常时，不会导致整块画布白屏，而是被隔离并提供可观测的错误信息，保证大屏整体展示稳定。

**Why this priority**: 大屏常用于生产环境展示，单个插件崩溃不应拖垮整体画布，否则会影响业务展示和品牌形象。

**Independent Test**: 在不改动业务配置的前提下，使用故意抛错的插件或组件渲染画布，验证错误是否被局部捕获、主画布是否保持可见和交互。

**Acceptance Scenarios**:

1. **Given** 页面中包含一个会在渲染时抛出 JS 异常的插件 **When** 打开运行态画布 **Then** 只有该插件区域显示错误占位或提示，其余组件保持正常渲染与交互。  
2. **Given** 运行态画布中某个插件在交互过程中抛出异常 **When** 异常发生 **Then** 交互被安全终止、错误被记录，画布不会整体刷新或陷入不可用状态。  

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- 当 PageSchema 中包含万级图元（如 10,000+ 个节点或形状）时，首次加载和拖拽/缩放是否仍能保持 50FPS 左右的交互流畅度？  
- 当浏览器窗口尺寸极小或极大时（例如超宽屏/竖屏展示），三种 mode 下的画布缩放与 Reflow 排版是否会出现留白过大、内容被裁剪或重叠？  
- 当插件抛出同步异常、异步异常或在副作用中抛错时，ErrorBoundary 是否都能正确捕获并隔离？  
- 当同时选中大量组件（例如 200+ 元素）进行成组、拖拽或批量变换时，是否会出现明显卡顿或操作延迟？  
- 在 Infinite 模式下长时间平移、缩放和频繁编辑后，内存是否稳定且不会出现明显泄漏？  

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

**Constitution Alignment**: Confirm solutions respect monorepo boundaries (pnpm+Turbo), Rspack+MF2 builds, TS 5.x strict typing, schemas in `packages/thingsvis-schema` validated with Zod, renderer discipline (Leafer/React Three Fiber; no direct DOM), state via zustand+immer, performance targets (<800KB core bundle, ≥50 FPS where applicable), and ErrorBoundary wrapping for plugins/components.

### Functional Requirements

- **FR-001 模式感知渲染**：系统 MUST 根据 PageSchema 的 `mode` 字段渲染三种画布模式：  
  - Fixed：将页面视为固定分辨率大屏，支持全局缩放以完整展示画布；  
  - Infinite：提供无限画布体验，可在任意方向平移并放置节点；  
  - Reflow：根据容器尺寸自动重排和缩放布局，保证内容易读、布局美观。  
- **FR-002 首屏性能**：系统 MUST 保证在常规业务规模（包含插件初始化）下，Studio 中打开任意 PageSchema 时，首屏画布在 1.5 秒内完成可视渲染（从加载 schema 到首帧可见）。  
- **FR-003 万级图元渲染性能**：系统 MUST 在包含万级图元（例如 10,000+ 个基础图元或节点）的情况下，保持常规交互（拖拽画布、缩放、单选/多选）的平均帧率在 50FPS 以上。  
- **FR-004 插件隔离与容错**：系统 MUST 为每个渲染插件/组件提供独立错误边界，使得任一插件在渲染或交互过程中抛出异常时，不会影响整个画布的渲染与交互。  
- **FR-005 交互选中与多选**：系统 MUST 支持单选、多选和框选组件，包括：点击单个元素选中、按住修饰键进行多选、拖拽框选指定区域内的元素。  
- **FR-006 2D/3D 变换控制**：系统 MUST 提供基于 Moveable 能力的 2D/3D 变换控制手柄，支持对选中组件进行平移、缩放、旋转等操作；对于有 3D 语义的组件，还需支持基础 3D 旋转/透视控制。  
- **FR-007 吸附与对齐**：系统 MUST 在拖拽和缩放过程中，提供对齐/吸附能力（含到画布网格、页面安全区、其它组件的边界和中心线），并以可视化参考线形式提示。  
- **FR-008 成组与解组**：系统 MUST 支持将多个组件成组、解组，并在组层级上统一处理选中、移动、缩放和变换，同时保持组内组件的相对布局关系。  
- **FR-009 Studio 集成**：系统 MUST 在 `apps/studio` 中以可复用视图组件的方式被消费，使得 Studio 可以将 PageSchema、当前缩放/视口状态、交互事件等传入画布内核并接收回调。  
- **FR-010 错误可观测性**：系统 MUST 为被 ErrorBoundary 捕获的插件异常提供可观测通路（例如在 Studio 中显示友好提示、对接日志系统等），以便设计者或开发者在不刷新画布的情况下理解问题来源。  
- **FR-011 运行态稳定性**：系统 MUST 在连续运行和频繁交互场景下（如 1 小时以上持续编辑与查看），保持内存和 CPU 使用稳定，无明显资源泄露导致的性能衰减。  
- **FR-012 可扩展插件生态**：系统 SHOULD 允许后续新增更多渲染插件和交互工具，而不破坏现有页面的兼容性和性能指标。  

### Key Entities *(include if feature involves data)*

- **PageSchema**：代表整个页面/大屏的结构和配置，包含 `mode` 字段（Fixed/Infinite/Reflow）、页面尺寸/缩放策略、节点树、图层信息等，是画布渲染的唯一输入源。  
- **Node / Component Instance**：代表画布上的单个可视组件实例，包含唯一标识、位置、尺寸、层级、变换信息（2D/3D）、成组关系及插件配置等。  
- **Selection State**：代表当前画布中被选中的一个或多个组件或组，包括选中集合、当前变换手柄状态、多选/框选范围等，用于驱动 Moveable 控件。  
- **Group**：代表由多个组件组成的逻辑集合，持有成员组件 ID 列表和组级别的变换/对齐信息，用于支持整体操作。  
- **Error Boundary Context**：代表单个插件/组件的错误隔离单元，记录插件标识、错误状态、降级展示信息及可选的错误元数据。  

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001 首屏加载时间**：在 Studio 中打开典型 PageSchema（包含若干插件与组件）时，从发起加载到画布首帧可见的时间，95% 的请求不超过 1.5 秒。  
- **SC-002 万级图元交互帧率**：在包含万级图元的页面上进行拖拽、缩放、单选、多选等操作时，测得的平均帧率不低于 50FPS，且不会出现超过 200ms 的明显卡顿。  
- **SC-003 隔离稳定性**：在包含至少 3 个刻意抛错插件的页面上，画布整体仍保持可见和可交互，单个插件错误仅影响自身区域，页面整体可用率达到 99.9%。  
- **SC-004 编辑效率感知**：在可用性测试中，80% 以上的设计者认为选中、多选、成组与对齐操作“流畅且可控”，并能在 5 分钟内完成指定复杂布局任务。  
- **SC-005 集成便捷性**：Studio 团队在不修改 thingsvis-kernel 内部实现的前提下，能够在 1 个 iteration 内完成渲染视图集成，并通过上述性能与稳定性测试。  
