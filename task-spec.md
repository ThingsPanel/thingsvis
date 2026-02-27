# 任务规范 (Task Specification)

## 边界与目标
1. 修复 LayerPanel (图层面板) 上的多语言配置问题。因为未指定命名空间 `useTranslation('editor')`，图层面板上下文菜单（如：置于顶层，上/下移，删除等）始终展示原始 key，而不是来自 `editor.json` 的国际化译文。
2. 修复拖拽排序图层保存失败的问题。图层的显示顺序由 `KernelStore` 中的 `layerOrder` 维护，重新拖拽排序能够通过 `store. getState().reorderLayers` 改变 `layerOrder`，但保存在 `ProjectFile` 序列化时使用了 `Object.values(state.nodesById)`（无保障的映射顺序）而不是按照 `layerOrder` 返回。

## 子任务
- [x] Sub-task 13: 修改 LayerPanel 的国际化引用。
- [x] Sub-task 14: 改变 Editor 的 `getProjectState` 生成方法以保持有序。

## 验收标准
- 页面左侧的“图层”列表中，右侧菜单项名称如 `layersPanel.bringToFront` 及 `common.delete` 能正确呈现中文文本 "置于顶层"、"删除"。
- 在图层列表中拖动不同元素的顺序后进行保存和刷新页面，原顺序应被成功记录。
