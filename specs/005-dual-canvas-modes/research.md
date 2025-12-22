# research.md — Dual Canvas Modes (Fixed & Infinite)

## Unknowns → Decisions

1. **Canvas engine**  
   - Decision: 使用 Leafer (`leafer-ui`) 作为 2D 渲染引擎（支持 pan/zoom 与高性能渲染）。  
   - Rationale: 轻量、与 React 容器解耦、社区实践在本 repo 已被采用。

2. **Import rule enforcement**  
   - Decision: 所有 editor/run-time 组件通过 `@thingsvis/*` entry points 导入；在 lint/CI 中增加禁止 `packages/thingsvis-ui/src/` 的相对路径规则。  
   - Rationale: 保持 package boundary，简化 构建/联邦加载。

3. **Fixed vs Infinite semantics**  
   - Decision:  
     - Fixed: 以配置的 `width`/`height`（默认 `1920x1080`）作为绘制边界，外部显示为居中并带遮罩（mask）以展示超出区域。  
     - Infinite: 无边界，开启 Leafer 的 pan & zoom，支持无限拖拽并保持坐标系连续。  
   - Rationale: 覆盖大屏（像素复原）与组态（无限布置）两类场景的需求。

4. **Grid & snapping**  
   - Decision: Infinite 模式下绘制点阵背景（基于 `gridSize`），并在交互操作（移动/放置）时以 `gridSize` 为吸附单元（可配置开关）。  
   - Rationale: 满足组态场景的对齐需求，且保持实现简单高效（基于整数运算，避免昂贵布局计算）。

5. **Selection & transform controls**  
   - Decision: 使用 `Selecto` 实现多选与框选，使用 `Moveable` 实现控制点（move/resize/rotate）。  
   - Rationale: 两者互补、成熟、性能可控。

6. **Command pattern & undo/redo**  
   - Decision: 每个用户动作（move/resize/rotate/add/remove/props-change）封装为 `Command`，Push 到 `CmdStack`（环形/可扩展栈），默认容量 50 步（可配置）。  
   - Rationale: 易于序列化/回放与调试。

7. **DnD & schema instantiation**  
   - Decision: 左侧物料库发起 `dragstart`，canvas 接收 `drop` 事件并计算 Leafer 局部坐标 → 根据 `registry.json` 的组件定义实例化 `NodeSchema`（生成唯一 id，注入默认 `transform`），将 node 写入 `nodes` 数组（store action）。  
   - Rationale: 保持数据驱动，PropsSchema 用于右侧属性面板生成控件。

8. **Error isolation**  
   - Decision: 所有 registry 渲染器均包装在 `HeadlessErrorBoundary`（来自 `packages/thingsvis-ui`），并且在外层再套 `SafeExecutor`（kernel-side）以捕获逻辑错误。  
   - Rationale: 防止第三方图表导致编辑器白屏。

## Alternatives Considered

- 使用 Canvas2D 原生 API vs Leafer：Leafer 被选以减少实现复杂度并保持已有集成路径。  
- 手写选择/变换逻辑 vs Moveable+Selecto：使用成熟库以保证兼容度和节约开发时间。

## Implementation Notes

- 在 `apps/studio` 的 `Editor` 组件中，`CanvasView` 应提供 `mode` prop（`fixed|infinite`），以及 `width/height/gridSize` 等配置。  
- 在 `packages/thingsvis-ui` 导出 `HeadlessErrorBoundary` 并确保无样式注入。  
- 性能守卫：把大量帧相关计算放在 Leafer 层或直接在渲染循环中处理，避免在 React 渲染路径中执行大量计算。


