# 实现计划 (Implementation Plan)

## 修复 LayerPanel 多语言配置问题
1. 定位 `f:\coding\thingsvis\apps\studio\src\components\LeftPanel\LayerPanel.tsx`，找到 `useTranslation()` 钩子调用点。
2. 由于所引用的 `layersPanel` 及 `common` 对象存在于 `editor.json` 内（但 `i18n` 配置的默认命名空间是 `common`，加载了 `common.json`），使用 `const { t } = useTranslation('editor')` 指定命名空间。

## 修复拖拽后图层排序保存问题
1. 深入分析 `packages/thingsvis-kernel` 及 `Editor.tsx`，核对持久化（保存）机制。发现由 `Editor.tsx` 中的 `getProjectState` 生成被保存的节点数据 (`ProjectFile.nodes`)。
2. 旧代码逻辑使用无序的 `Object.values(state.nodesById)` 导出。
3. 改为按照拖拽及新建维护的全局顺序参考 `state.layerOrder` 数组来执行映射：`state.layerOrder.map(id => state.nodesById[id]?.schemaRef).filter(...)`，从而确保 `nodes` 数组成员带有准确且稳定的视图依赖顺序。

## 验证与测试
- 在本地热更新或刷新后，启动工作台并在左面板观察中文图层菜单列表无误。
- 加入三个新组件（如基础模块或图表），通过鼠标拖拽将其顺序随意置换后，观察触发是否能写入项目文件，直接刷新验证位置是否稳定复原。
