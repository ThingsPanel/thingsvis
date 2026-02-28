# Widget 迭代日志

---

## 2026-02-27 - Widget Registry 全面检查与修复

**用户请求**: 使用 taskloop 和 thingsvis 的卡片创建技能，逐个检查编辑器的每个组件的功能是否有问题，如果有问题就逐个形成任务文件，逐个修改并验证。

**执行流程**:
1. ✅ Requirement Check - 确认需求和验收标准
2. ✅ Preflight - 确认仓库路径和组件范围
3. ✅ Inventory - 扫描所有 widgets 并检查 registry.json
4. ✅ Implement - 修复发现的问题
5. ✅ Validate - 运行验证脚本确认修复成功
6. ✅ Report - 生成任务文件和总结报告

**发现的问题**:
1. `basic/line` - 缺少 icon 字段（通过重新生成 registry 修复）
2. `indicator/number-card` - package.json name 有 "deleted-" 前缀
3. `media/image` - i18n.en 翻译错误（"图片" → "Image"）
4. `media/video-player` - metadata.ts name 不正确（"网络视频流" → "视频播放器"）

**修复的文件**:
- `widgets/indicator/number-card/package.json`
- `widgets/media/image/package.json`
- `widgets/media/video-player/src/metadata.ts`
- `apps/studio/public/registry.json`

**验证结果**: ✅ Registry validated OK

**任务文件**: `.agents/tasks/widget-registry-fix-20260227.md`

---

## 2026-02-27 - Text Widget 编辑体验优化

**用户请求**: 检查一下文本 Widget 的问题并修复，现在存在编辑使用问题。无法方便的编辑使用。

**问题分析**:
1. WidgetMainModule 类型缺少 `resizable` 字段，导致编辑器无法正确识别组件尺寸特性
2. Text widget 的 create() 函数使用完全透明填充，导致在画布上难以选中
3. Metadata 中缺少 `defaultSize`，编辑器无法获知默认尺寸

**修复内容**:
1. 在 `packages/thingsvis-schema/src/widget-module.ts` 中添加 `resizable` 和 `defaultSize` 类型定义
2. 修改 `widgets/basic/text/src/index.ts` 中的 create() 函数，添加轻微背景色和边框便于选择
3. 在 `widgets/basic/text/src/metadata.ts` 中添加 `defaultSize`
4. 重新构建 text widget 并更新到 studio

**验证结果**: ✅ Registry validated OK

**任务文件**: `.agents/tasks/text-widget-fix-20260227.md`

---

## 2026-02-28 - Iframe Widget 拖拽修复

**用户请求**: @[f:\coding\thingsvis] 我发现网页组件添加之后无法拖动，你使用组件技能修复一下

**问题分析**:
1. Iframe 组件在 `src/index.ts` 中强制设置了 `element.style.pointerEvents = 'auto'`。
2. 这导致在编辑器中，鼠标事件被 Iframe 本身拦截，而无法冒泡到 ThingsVis 的网格画布交互层，从而无法拖动。
3. 编辑器层（`VisualEngine`）本身已经对 `overlayBox` 做了模式判断，在编辑模式下 `pointerEvents` 会设为 `none`，在预览模式下为 `auto`。所以组件只需继承父元素的特性即可。

**修复内容**:
1. 移除 `widgets/media/iframe/src/index.ts` 中多余的 `element.style.pointerEvents = 'auto'`。
2. 重新编译 `@thingsvis/widget-media-iframe` 模块（运行了 `npm run build`）。

**验证结果**: ✅ 修复成功，继承父节点的 pointerEvents，在编辑模式下不会遮挡拖拽事件。

3. **附加修复**: `widgets/media/video-player/src/index.ts` 中也存在相同问题，一并移除了强制的 `pointerEvents` 并重新编译，确保视频播放组件在编辑器中也能正常拖拽。

4. **追溯网格模式 (Grid模式) 拖拽修复**：
   - 之前仅针对“自由布局”模式 (`VisualEngine.ts`) 的 `overlayBox` 做了编辑模式响应。
   - 在网格模式下，使用的是 `@thingsvis/ui` 包中的 `GridStackCanvas.tsx`，由于 `grid-stack.js` 所依赖的拖拽事件是在 `grid-stack-item` 层监听，如果子组件内部具有可交互属性（如 `iframe`/`video`），依旧会吞掉事件。
   - **修复内容**：修改了 `packages/thingsvis-ui/src/components/GridStackCanvas.tsx`，为其动态添加了 `.gs-interactive-container` 的类名并在交互模式（`interactive=true`）时输出全局注入样式，通过 `pointer-events: none !important` 强行阻断所有内容子组件的内部交互，确保所有鼠标拖拽和点击完全交给网格排版系统处理。
