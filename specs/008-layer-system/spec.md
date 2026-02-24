# Feature Specification: 编辑器图层系统 (Layer System)

**Feature Branch**: `008-layer-system`  
**Created**: 2025-12-30  
**Status**: Draft  
**Author**: ThingsVis Team

---

## 1. 背景与目标

### 1.1 问题陈述

当前 ThingsVis Studio 的图层面板是一个**静态硬编码的 UI Mock**（见 [Editor.tsx](../../apps/studio/src/components/Editor.tsx#L224-L241)），并没有与 Kernel 中的 `nodesById` 数据进行真正绑定。用户无法：

- 查看画布上实际的组件层级结构
- 调整组件的 z-index 堆叠顺序
- 进行组件的可见性、锁定状态管理
- 通过图层面板进行组件选择和定位
- 创建和管理图层分组

### 1.2 目标

实现一个完整的、符合宪法原则的图层系统，使设计者能够：

1. 在图层面板中查看画布上的所有组件（与 Kernel 状态实时同步）
2. 调整组件的层叠顺序（z-index）
3. 控制组件的可见性和锁定状态
4. 通过图层面板快速选择和定位组件
5. 创建、管理和操作图层分组
6. 支持拖拽重排序和跨组移动

---

## 2. 行业最佳实践对比分析

### 2.1 对比矩阵

| 特性 | Figma | Adobe XD | DataV | Superset | 建议方案 |
|------|-------|----------|-------|----------|----------|
| **层级结构** | 无限嵌套帧+自动布局 | 画布+画板层级 | 平铺+分组 | 平铺无分组 | 平铺+单层分组 |
| **排序方式** | 拖拽+右键菜单 | 拖拽+快捷键 | 拖拽 | N/A | 拖拽+右键+快捷键 |
| **可见性控制** | 眼睛图标 | 眼睛图标 | 眼睛图标 | N/A | 眼睛图标 |
| **锁定控制** | 锁图标 | 锁图标 | 锁图标 | N/A | 锁图标 |
| **多选** | Shift/Cmd点击 | Shift/Ctrl点击 | Ctrl点击 | N/A | Shift/Ctrl点击 |
| **重命名** | 双击名称 | 双击名称 | 双击名称 | N/A | 双击名称 |
| **搜索过滤** | 支持 | 支持 | 部分 | N/A | 支持 |
| **缩略图预览** | 支持 | 支持 | 不支持 | N/A | V2考虑 |
| **分组逻辑** | Frame/Group | Group | 分组 | N/A | Group |

### 2.2 设计决策

基于以上对比和宪法原则（简洁性、性能、向后兼容），我们选择：

1. **平铺+单层分组**：避免过度复杂的嵌套结构，保持性能和易用性
2. **Kernel-First**：图层状态存储在 Kernel Store 中，UI 层仅作为视图
3. **增量采用**：不破坏现有 PageSchema 结构，新增字段可选
4. **响应式更新**：使用 Zustand 订阅机制，确保 UI 与 Kernel 同步

---

## 3. 用户场景与测试

### User Story 1 - 查看真实图层列表 (Priority: P1)

作为设计者，我希望在图层面板中看到画布上所有组件的实时列表，以便快速了解页面结构。

**为何优先**：这是图层功能的基础闭环，没有真实数据绑定，其他功能都无法验证。

**独立测试**：在画布上添加/删除组件后，验证图层面板是否实时反映变化。

**验收场景**：

1. **Given** 设计者在画布上添加了一个文本组件 **When** 打开图层面板 **Then** 面板中显示该文本组件的条目
2. **Given** 设计者删除画布上的一个组件 **When** 查看图层面板 **Then** 对应条目消失
3. **Given** 设计者选中画布上的组件 **When** 查看图层面板 **Then** 对应条目显示选中高亮状态

---

### User Story 2 - 调整组件层叠顺序 (Priority: P1)

作为设计者，我希望能通过拖拽或菜单调整组件的前后层叠顺序（z-index），以便控制组件的遮挡关系。

**为何优先**：层叠控制是图层面板的核心价值，直接影响设计效率。

**独立测试**：创建两个重叠组件，通过图层面板调整顺序，验证画布渲染顺序变化。

**验收场景**：

1. **Given** 画布上有 A、B 两个重叠组件，A 在 B 上面 **When** 设计者在图层面板中将 B 拖拽到 A 上方 **Then** 画布上 B 显示在 A 上面
2. **Given** 选中组件 A **When** 使用右键菜单"置于顶层" **Then** A 移动到所有组件的最上层
3. **Given** 选中组件 A **When** 使用右键菜单"置于底层" **Then** A 移动到所有组件的最下层

---

### User Story 3 - 控制可见性和锁定 (Priority: P2)

作为设计者，我希望能在图层面板中切换组件的可见性和锁定状态，以便在复杂画布中专注编辑。

**为何优先**：编辑复杂大屏时，临时隐藏/锁定部分组件是常见工作流。

**独立测试**：验证可见性切换后组件在画布上的显隐状态，锁定后组件不可选中和移动。

**验收场景**：

1. **Given** 组件处于可见状态 **When** 点击图层面板上的眼睛图标 **Then** 组件在画布上隐藏，眼睛图标变为斜线状态
2. **Given** 组件处于解锁状态 **When** 点击图层面板上的锁图标 **Then** 组件在画布上无法选中和移动，锁图标显示锁定状态
3. **Given** 一个分组包含多个组件 **When** 隐藏该分组 **Then** 分组内所有组件都在画布上隐藏

---

### User Story 4 - 通过图层面板选择组件 (Priority: P2)

作为设计者，我希望点击图层面板中的条目时能选中对应的画布组件，以便快速定位和编辑。

**为何优先**：双向联动是专业设计工具的标配体验。

**独立测试**：点击图层面板条目，验证画布组件选中状态和属性面板显示。

**验收场景**：

1. **Given** 图层面板显示组件列表 **When** 点击某组件条目 **Then** 画布上该组件被选中，属性面板显示其配置
2. **Given** 按住 Shift 键 **When** 点击多个图层条目 **Then** 画布上对应的多个组件被多选
3. **Given** 组件在画布视口外 **When** 双击图层条目 **Then** 画布自动平移使该组件居中可见

---

### User Story 5 - 创建和管理分组 (Priority: P3)

作为设计者，我希望能将多个组件归入一个分组进行统一管理，以便组织复杂页面结构。

**为何优先**：分组是进阶功能，在基础能力稳定后再实现。

**独立测试**：选中多个组件后创建分组，验证分组折叠/展开和整体操作。

**验收场景**：

1. **Given** 选中多个组件 **When** 使用右键菜单"成组" **Then** 这些组件归入一个新分组，图层面板显示分组节点
2. **Given** 分组处于展开状态 **When** 点击分组的折叠箭头 **Then** 分组收起，子组件隐藏
3. **Given** 选中一个分组 **When** 使用"解组"操作 **Then** 分组解散，子组件恢复为独立图层

---

### User Story 6 - 图层重命名 (Priority: P3)

作为设计者，我希望能为组件/分组重命名，以便维护清晰的图层结构。

**验收场景**：

1. **Given** 图层面板显示组件列表 **When** 双击组件名称 **Then** 进入编辑模式，可输入新名称
2. **Given** 正在编辑名称 **When** 按回车或失去焦点 **Then** 名称保存，图层面板和属性面板同步更新

---

### Edge Cases

- 画布上有 1000+ 组件时，图层面板的滚动和渲染性能
- 快速连续拖拽排序时的状态一致性
- 嵌套分组（如果未来支持）的层级限制
- Undo/Redo 对图层操作的支持
- 图层操作与画布交互的冲突（如同时拖拽）
- 锁定分组后尝试选中其子组件的行为

---

## 4. 需求规格

### 4.1 功能需求

| ID | 需求描述 | 优先级 |
|----|----------|--------|
| FR-001 | 系统 MUST 在图层面板中显示 Kernel Store 中所有 nodes 的列表 | P1 |
| FR-002 | 系统 MUST 支持通过拖拽调整 nodes 的 zIndex 顺序 | P1 |
| FR-003 | 系统 MUST 支持置顶/置底/上移一层/下移一层的层级操作 | P1 |
| FR-004 | 系统 MUST 支持切换 node 的 visible 属性 | P2 |
| FR-005 | 系统 MUST 支持切换 node 的 locked 属性 | P2 |
| FR-006 | 系统 MUST 在点击图层条目时选中对应的画布组件 | P2 |
| FR-007 | 系统 MUST 支持 Shift/Ctrl 多选图层条目 | P2 |
| FR-008 | 系统 SHOULD 支持双击图层条目使组件居中显示 | P2 |
| FR-009 | 系统 SHOULD 支持图层分组（成组/解组） | P3 |
| FR-010 | 系统 SHOULD 支持分组的折叠/展开 | P3 |
| FR-011 | 系统 SHOULD 支持双击重命名图层 | P3 |
| FR-012 | 系统 SHOULD 支持右键上下文菜单 | P3 |
| FR-013 | 系统 MUST 支持图层操作的 Undo/Redo | P1 |
| FR-014 | 系统 SHOULD 支持按名称搜索/过滤图层 | P3 |

### 4.2 非功能需求

| ID | 需求描述 |
|----|----------|
| NFR-001 | 图层面板在包含 500+ 组件时，滚动和操作响应时间 < 100ms |
| NFR-002 | 图层排序操作完成后，画布更新延迟 < 50ms |
| NFR-003 | 所有图层操作必须支持 Undo/Redo |

### 4.3 宪法对齐

- ✅ **微内核分离**：图层逻辑放在 Kernel Store 中，UI 组件仅负责渲染
- ✅ **Schema-First**：扩展 NodeSchema 支持 zIndex/visible/locked/groupId
- ✅ **类型安全**：所有新 API 使用 TypeScript 严格类型
- ✅ **向后兼容**：新字段使用 optional + default，不破坏现有数据
- ✅ **简洁性能**：采用虚拟滚动处理大量图层，避免 DOM 性能问题

---

## 5. 技术设计

### 5.1 数据模型扩展

#### 5.1.1 NodeSchema 扩展（packages/thingsvis-schema）

```typescript
// canvas-schema.ts 扩展
export const NodeSchema = z.object({
  // ... 现有字段 ...
  id: z.string(),
  widgetId: z.string(),
  // ...
  
  // 图层相关字段（已存在，需确保正确使用）
  zIndex: z.number().optional().default(0),
  visible: z.boolean().optional().default(true),
  groupId: z.string().optional(), // 所属分组ID
  
  // 新增：图层显示名称
  displayName: z.string().optional(), // 用户自定义名称
});

// 新增：分组 Schema
export const LayerGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  expanded: z.boolean().default(true),
  locked: z.boolean().default(false),
  visible: z.boolean().default(true),
  parentGroupId: z.string().optional(), // 预留嵌套分组
});
```

#### 5.1.2 KernelState 扩展（packages/thingsvis-kernel）

```typescript
// KernelStore.ts 扩展
export type KernelState = {
  // ... 现有字段 ...
  nodesById: Record<string, NodeState>;
  
  // 新增：图层分组
  layerGroups: Record<string, LayerGroup>;
  
  // 新增：有序图层ID列表（按渲染顺序，从底到顶）
  layerOrder: string[]; // node ids in render order
};

export type KernelActions = {
  // ... 现有方法 ...
  
  // 图层排序操作
  reorderLayers: (nodeIds: string[], targetIndex: number) => void;
  bringToFront: (nodeIds: string[]) => void;
  sendToBack: (nodeIds: string[]) => void;
  bringForward: (nodeIds: string[]) => void;
  sendBackward: (nodeIds: string[]) => void;
  
  // 可见性/锁定
  setNodeVisible: (nodeId: string, visible: boolean) => void;
  setNodeLocked: (nodeId: string, locked: boolean) => void;
  
  // 分组操作
  createGroup: (nodeIds: string[], groupName?: string) => string; // returns groupId
  ungroup: (groupId: string) => void;
  toggleGroupExpanded: (groupId: string) => void;
  
  // 重命名
  renameNode: (nodeId: string, name: string) => void;
  renameGroup: (groupId: string, name: string) => void;
};
```

### 5.2 组件架构

```
apps/studio/src/components/
├── LeftPanel/
│   ├── LayerPanel/
│   │   ├── LayerPanel.tsx        # 主容器
│   │   ├── LayerList.tsx         # 虚拟滚动列表
│   │   ├── LayerItem.tsx         # 单个图层条目
│   │   ├── LayerGroup.tsx        # 分组条目
│   │   ├── LayerContextMenu.tsx  # 右键菜单
│   │   └── useLayerDragDrop.ts   # 拖拽排序 Hook
│   └── ComponentsList.tsx        # 现有组件库
```

### 5.3 核心流程

#### 5.3.1 图层排序流程

```
用户拖拽图层 → LayerPanel 计算目标位置 
  → store.reorderLayers(ids, targetIndex)
  → Kernel 更新 layerOrder + 各 node.zIndex
  → CanvasView 订阅变化 → 重新渲染
```

#### 5.3.2 选择同步流程

```
用户点击图层条目 → LayerPanel 调用 store.selectNode(id)
  → Kernel 更新 selection.nodeIds
  → CanvasView 显示选中框
  → PropsPanel 显示属性

用户在画布选中组件 → CanvasView 调用 store.selectNode(id)
  → Kernel 更新 selection.nodeIds
  → LayerPanel 高亮对应条目
```

### 5.4 性能优化策略

1. **虚拟滚动**：使用 `@tanstack/react-virtual` 仅渲染可见区域
2. **选择性订阅**：使用 Zustand selector 避免无关更新
3. **防抖拖拽**：拖拽过程中使用 debounce 减少 store 更新频率
4. **批量操作**：多选操作使用单次 store 更新

---

## 6. 实现计划

### Phase 1: 基础数据绑定 (P1) - 预计 2 天

- [ ] 移除 Editor.tsx 中的硬编码 layers 状态
- [ ] 创建 LayerPanel 组件，订阅 kernelState.nodesById
- [ ] 实现基础图层列表渲染（id, type, 选中状态）
- [ ] 实现点击选择联动

### Phase 2: 层级控制 (P1) - 预计 2 天

- [ ] 在 KernelStore 中添加 layerOrder 和相关 actions
- [ ] 实现拖拽排序（使用 dnd-kit 或原生拖拽）
- [ ] 实现置顶/置底/上移/下移
- [ ] 确保 Undo/Redo 支持

### Phase 3: 可见性与锁定 (P2) - 预计 1 天

- [ ] 实现 visible 切换 UI 和逻辑
- [ ] 实现 locked 切换 UI 和逻辑
- [ ] CanvasView 响应 visible/locked 状态

### Phase 4: 分组功能 (P3) - 预计 2 天

- [ ] 在 Schema 中添加 LayerGroupSchema
- [ ] 在 KernelStore 中添加 layerGroups 和相关 actions
- [ ] 实现分组 UI（成组/解组/折叠/展开）
- [ ] 实现跨组拖拽

### Phase 5: 增强功能 (P3) - 预计 1 天

- [ ] 实现双击重命名
- [ ] 实现右键上下文菜单
- [ ] 实现搜索过滤
- [ ] 实现双击居中显示

---

## 7. 验收标准

### 7.1 可度量指标

| ID | 指标 | 目标值 |
|----|------|--------|
| AC-001 | 图层列表与 Kernel 同步延迟 | < 16ms (1帧) |
| AC-002 | 500 组件时滚动帧率 | ≥ 60 FPS |
| AC-003 | 层级调整后画布更新延迟 | < 50ms |
| AC-004 | 所有层级操作支持 Undo/Redo | 100% |

### 7.2 功能验收清单

- [ ] 图层列表显示所有画布组件
- [ ] 拖拽可调整图层顺序，画布立即反映变化
- [ ] 置顶/置底/上移/下移正常工作
- [ ] 可见性切换后组件正确显隐
- [ ] 锁定后组件不可选中和移动
- [ ] 点击图层条目可选中画布组件
- [ ] 多选（Shift/Ctrl）正常工作
- [ ] 分组/解组正常工作
- [ ] 重命名正常工作
- [ ] Undo/Redo 覆盖所有操作

---

## 8. 设计决策确认

| 决策项 | 确认结果 | 理由 |
|--------|----------|------|
| 分组嵌套 | **单层分组** | 简化实现，符合大屏场景 |
| 缩略图预览 | **不需要** | 减少复杂度，V2 可考虑 |
| 快捷键定义 | **暂不定义** | 后续根据用户反馈添加 |
| 锁定行为 | **允许图层面板选中** | 仅禁止画布拖拽/变换 |

---

## 9. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 大量组件性能问题 | 卡顿 | 虚拟滚动 + 选择性订阅 |
| 与现有画布交互冲突 | UX 混乱 | 明确焦点管理规则 |
| Schema 变更导致兼容问题 | 旧数据无法加载 | 使用 optional + default |
| 拖拽排序状态不一致 | 数据错误 | 原子化更新 + 乐观锁 |

---

## 9. 附录

### 9.1 参考资源

- [Figma Layers Panel](https://www.figma.com/developers/api)
- [React DnD Kit](https://dndkit.com/)
- [TanStack Virtual](https://tanstack.com/virtual/latest)

### 9.2 相关规范

- [003-canvas-kernel](../003-canvas-kernel/spec.md) - 画布内核规范
- [001-core-data-protocol](../001-core-data-protocol/spec.md) - 数据协议规范

---

**文档版本**: 1.0.0 | **最后更新**: 2025-12-30
