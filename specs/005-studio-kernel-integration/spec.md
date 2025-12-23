# Feature Specification: Studio–Kernel Deep Integration

**Feature Branch**: `005-studio-kernel-integration`  
**Created**: 2025-12-22  
**Status**: Draft  
**Input**: 核心目标：将已有的 L2 Studio 静态页面与 L0 Kernel 渲染引擎深度整合，实现可交互的工业大屏与组态编辑器。

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

### User Story 1 - 大屏模式（Fixed）像素级还原与稳定交互 (Priority: P1)

作为大屏展示人员，我希望以“基准尺寸”（如 1920×1080）打开项目，并在不同屏幕/窗口下仍能保持像素级一致的渲染结果，以便现场投放与验收。

**Why this priority**: 这是“工业大屏”的核心交付物；没有稳定还原与可预期的显示行为，后续编辑能力没有落点。

**Independent Test**: 导入一个包含多组件布局的示例项目，在 Fixed 模式下指定基准尺寸并渲染；验证画面与设计坐标一致、尺寸锁定、交互不被编辑器能力干扰。

**Acceptance Scenarios**:

1. **Given** 一个已保存的项目与基准尺寸 1920×1080，**When** 用户以 Fixed 模式打开，**Then** 渲染坐标系与基准尺寸一致，组件位置与尺寸相对基准尺寸的误差不超过 1px。
2. **Given** Fixed 模式正在展示，**When** 用户调整浏览器窗口或显示区域大小，**Then** 系统以保持宽高比的方式适配（可出现留白），且不改变项目的基准坐标与组件布局数据。

---

### User Story 2 - 组态模式（Infinite）无限画布编辑 (Priority: P2)

作为组态工程师，我希望在“无限画布”上进行平移缩放、网格吸附、对齐与组件编排，以便高效搭建工业画面。

**Why this priority**: 这是将“静态页面”升级为“可组态编辑器”的关键能力。

**Independent Test**: 新建项目并进入 Infinite 模式，在空白画布上添加多个组件；测试平移/缩放/网格吸附/拖拽与旋转缩放控制，并确认布局变化可保存。

**Acceptance Scenarios**:

1. **Given** Infinite 模式画布，**When** 用户通过鼠标/触控板操作平移与缩放，**Then** 视图在不丢失选中态的前提下平滑移动/缩放，且组件世界坐标不因视图缩放而被修改。
2. **Given** 已启用网格吸附，**When** 用户拖拽组件移动，**Then** 组件最终位置会吸附到网格上（误差不超过 1px），并可一键关闭/开启吸附。

---

### User Story 3 - 工业拓扑连线与可编辑关系 (Priority: P3)

作为组态工程师，我希望在组件/节点之间创建“连线关系”（工业拓扑），并能在画布缩放与节点移动时保持连线正确附着，以便表达工艺流向、信号链路或设备关系。

**Why this priority**: 工业场景里“关系”与“连线”通常与组件同等重要；没有连线就难以满足拓扑/工艺组态。

**Independent Test**: 在 Infinite 模式中放置多个节点，创建多条连线；移动、缩放与删除节点，验证连线更新与异常处理。

**Acceptance Scenarios**:

1. **Given** 两个可连线节点，**When** 用户从节点 A 的连接点拖拽到节点 B 的连接点并松开，**Then** 系统创建一条连线并在画布缩放/平移/节点移动后仍正确连接到对应节点。
2. **Given** 节点被删除或其连接点无效，**When** 系统刷新画布，**Then** 相关连线要么被一并删除，要么标记为断开状态（可被用户修复），且不会导致编辑器崩溃。

---

### User Story 4 - 全量撤销/重做与稳定性隔离 (Priority: P4)

作为组态工程师，我希望所有编辑操作都可以撤销/重做，并且即使某个组件渲染或交互出错，也不影响其他组件与整体编辑体验。

**Why this priority**: 没有可靠的 Undo/Redo，编辑器难以生产可用；没有隔离，单点崩溃会破坏全局交互与用户信任。

**Independent Test**: 连续执行添加/移动/缩放/旋转/连线/删除等操作并进行 Undo/Redo；同时制造一个组件异常，验证只有该组件降级显示且其余交互不受影响。

**Acceptance Scenarios**:

1. **Given** 用户执行了一系列编辑操作，**When** 用户连续点击 Undo 直到栈底再点击 Redo 回到栈顶，**Then** 项目状态可在历史节点间往返且结果一致（包含布局与连线）。
2. **Given** 某个组件在渲染或交互时发生异常，**When** 异常被触发，**Then** 该组件被降级为可识别的占位状态并提示错误，其它组件与画布交互保持可用。

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- **超大工程**：组件数量达到 1,000+ 或连线达到 2,000+ 时，平移/缩放/选中仍保持可用（不出现“卡死”或输入失效）。
- **极端缩放**：缩放到最小/最大限制时，交互与命中测试仍可预期（例如仍能选中、仍能框选/拖拽）。
- **模式切换**：从 Infinite 切换到 Fixed（或反向）时，坐标、布局与视觉结果保持一致；不引入隐式变形。
- **无效数据**：导入缺失字段/未知组件类型/损坏连线的数据时，系统应给出可理解的错误与可恢复的降级结果。
- **组件崩溃**：单个组件持续抛错时，不应导致全局交互失效、Undo 栈损坏或无法保存。

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

**Constitution Alignment**: 方案必须尊重现有单仓库边界与构建约束、保持类型与数据模型一致性、遵守渲染层纪律（避免绕开渲染引擎的“直接操作”导致状态失真）、满足编辑交互性能目标，并对组件/插件提供错误隔离与可恢复降级。

### Functional Requirements

- **FR-001（双模式）**：系统 MUST 在同一项目数据之上提供 Fixed 与 Infinite 两种模式，且两种模式的坐标/布局含义一致，模式切换不会隐式改写组件的布局数据。
- **FR-002（Fixed 基准尺寸）**：系统 MUST 支持配置并锁定基准尺寸（至少包含 1920×1080），并以基准坐标系渲染；在任意显示区域下均保持宽高比一致的适配策略，且不改变基准布局数据。
- **FR-003（像素级一致性）**：系统 MUST 保证 Fixed 模式下关键视觉属性（位置、尺寸、旋转）在同一基准尺寸内可复现，回放同一项目时误差不超过 1px。
- **FR-004（Infinite 视图变换）**：系统 MUST 支持无限画布的平移与缩放；视图变换只影响“视口”，不改变组件的世界坐标。
- **FR-005（网格与吸附）**：系统 MUST 提供可开关的网格显示与吸附规则；吸附结果可预测（误差不超过 1px），并能明确告知当前吸附状态。
- **FR-006（组件控制）**：系统 MUST 为选中组件提供拖拽、缩放、旋转的可视化控制体验（控制柄/边框/旋转把手），并在操作过程中实时反馈变换结果。
- **FR-007（多选与编组）**：系统 MUST 支持多选（框选/点选叠加）与统一变换（移动/缩放/旋转），并支持将多个组件编组以便整体编辑。
- **FR-008（工业拓扑连线）**：系统 MUST 支持在节点之间创建、删除、重连连线；节点移动或视图缩放时连线应保持附着且可读。
- **FR-009（命中与选择）**：系统 MUST 在缩放/旋转/重叠等复杂场景下提供可预期的命中与选择规则（例如：顶层优先、锁定不可选、列表选择等），避免“点不到/误选”。
- **FR-010（事务管理）**：所有会改变项目状态的用户操作 MUST 进入 Undo/Redo 历史栈；Undo/Redo 必须可逆且可重放，且不会产生额外副作用（例如重复创建对象）。
- **FR-011（连续操作合并）**：拖拽/缩放/旋转等连续交互 MUST 以合理粒度合并为可理解的历史步骤（避免一次拖拽产生数百条历史记录）。
- **FR-012（沙箱隔离）**：单个组件在渲染或交互期间发生异常时，系统 MUST 将影响限制在该组件范围内，展示可识别的降级占位，并保持全局交互、历史栈与保存功能可用。
- **FR-013（可保存与可恢复）**：系统 MUST 支持保存与再次加载项目，使布局、模式配置、连线关系与关键交互配置可恢复。
- **FR-014（导入兼容）**：系统 MUST 能将现有 L2 Studio 静态页面产物映射为同一项目数据模型并可渲染；对无法识别的组件应提供可追踪的降级结果，而不是中断加载。

### Key Entities *(include if feature involves data)*

- **Project（项目）**：一个可加载/保存的工业大屏工程，包含画布配置、组件实例集合与连线关系。
- **Canvas/View（画布与视图）**：包含模式（Fixed/Infinite）、基准尺寸、缩放与平移等视图参数。
- **Component Instance（组件实例）**：一个可渲染的可视组件，包含唯一标识、类型、布局（位置/尺寸/旋转/层级）与配置数据。
- **Connection（连线/关系）**：描述两个节点（或其连接点）之间的关系，包含端点、样式/语义与状态（正常/断开）。
- **Command（命令）**：可撤销/可重做的状态变更单元（例如添加组件、移动组件、创建连线）。
- **History（历史栈）**：命令序列与当前位置指针，用于 Undo/Redo。

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001（像素级还原）**：在基准尺寸 1920×1080 下，同一项目重复加载 10 次，抽样检查的组件布局（位置/尺寸）与基准数据偏差均 ≤ 1px。
- **SC-002（编辑可用性）**：在包含 200 个组件与 200 条连线的项目中，用户可在 5 分钟内完成“新增组件 → 调整布局 → 添加连线 → 保存 → 重新打开验证”的闭环流程。
- **SC-003（Undo/Redo 覆盖率）**：对本 spec 定义的所有会改变状态的操作类型，Undo/Redo 覆盖率为 100%，且任意 50 步随机操作序列可完整撤销并重做回到一致状态。
- **SC-004（隔离稳定性）**：当任一组件发生异常时，编辑器与大屏仍可继续完成至少 10 次交互（选择、拖拽、缩放、Undo/Redo、保存）且不出现全局崩溃。
