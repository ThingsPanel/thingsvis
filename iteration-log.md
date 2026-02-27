# 迭代日志

## UI 优化迭代 - 2026-02-27

### 任务 1: 左侧面板可折叠功能
- **实现内容**: 
  - 添加 `showLeftPanel` 状态，默认值为 `false`
  - 在顶部工具栏添加左侧面板切换按钮（使用 PanelLeftOpen 图标）
  - 左侧面板添加关闭按钮
  - 底部栏根据左侧面板状态动态调整位置
  
- **修改文件**:
  - `apps/studio/src/components/Editor.tsx` - 添加状态管理和面板渲染逻辑
  - `apps/studio/src/components/EditorTopNav.tsx` - 添加切换按钮和 props
  - `apps/studio/src/components/EditorBottomBar.tsx` - 调整位置逻辑
  
- **翻译更新**:
  - `apps/studio/src/i18n/locales/zh/editor.json` - 添加 `topNav.showLibrary`
  - `apps/studio/src/i18n/locales/en/editor.json` - 添加 `topNav.showLibrary`

### 任务 2: 背景色与画布色彩协调
- **实现内容**:
  - 采用 Excalidraw 风格的柔和灰蓝色调
  - Light 主题: `--background: 220 20% 96%` (柔和的浅灰蓝)
  - Dark 主题: `--background: 220 15% 18%` (柔和的深灰蓝)
  - 画布网格点颜色调整为与背景协调的色调
  - Dawn/Midnight 主题同步更新
  
- **修改文件**:
  - `apps/studio/src/index.css` - 更新所有 CSS 变量

### 任务 3: 按钮和面板边缘效果优化
- **实现内容**:
  - 圆角从 `rounded-md` (0.375rem) 增加到 `rounded-lg` (0.625rem) 或 `rounded-xl` (0.75rem)
  - 阴影效果更柔和，添加多层阴影
  - Glass 效果 backdrop-filter 增加到 16px
  - 边框透明度降低 (`border-border/50`, `border-border/60`)
  - 按钮添加点击缩放效果 (`transform: scale(0.97)`)
  - 输入框焦点状态更柔和
  
- **修改文件**:
  - `apps/studio/src/index.css` - 更新 glass 效果和全局样式
  - `apps/studio/src/components/EditorTopNav.tsx` - 更新顶部栏样式
  - `apps/studio/src/components/EditorBottomBar.tsx` - 更新底部栏样式
  - `apps/studio/src/components/Editor.tsx` - 更新左右面板样式

### 验证结果
- ✅ 构建成功，无错误
- ✅ 所有 TypeScript 类型检查通过
- ✅ 翻译键值完整

### 设计参考
- Excalidraw 的柔和阴影和圆角风格
- 减少色彩对比度，使整体视觉更协调
- 按钮和面板边缘更柔和，消除硬朗感

---

## 背景颜色修改 - 2026-02-27

### MPE1: 修改工作区背景颜色为 #ff3b30 (红色)
- **需求**: 将编辑器工作区背景从灰色 (#999999) 改为红色 (#ff3b30)
- **实现内容**:
  - 在 `index.css` 中添加新的 CSS 变量 `--workspace-bg`
  - Light 主题: `--workspace-bg: 0 100% 60%` (HSL 格式)
  - Dark 主题: `--workspace-bg: 4 100% 59%` (HSL 格式)
  - 修改 `CanvasView.tsx` 容器背景使用 `--workspace-bg` 替代 `--w-canvas-bg`
  
- **修改文件**:
  - `apps/studio/src/index.css` - 添加 `--workspace-bg` CSS 变量
  - `packages/thingsvis-ui/src/components/CanvasView.tsx` - 容器背景使用新变量

- **验证**:
  - ✅ CSS 变量正确定义
  - ✅ 容器背景颜色指向正确变量

---

## 网格显示修复 - 2026-02-27

### MPE2: 修复网格只在画布区域显示
- **需求**: 网格不应该在整个工作区背景显示，只应该在画布（artboard）区域内显示
- **实现内容**:
  - 修改 `drawGrid` 函数，根据模式决定网格绘制区域
  - **Fixed/Grid 模式**: 只在画布区域内绘制网格（通过计算 artboard 的位置和尺寸）
  - **Infinite 模式**: 保持原有行为，在整个容器绘制网格
  - 使用 `vOffset.x/y` 和 `width/height * vZoom` 计算画布边界
  - 使用 `Math.max/min` 确保绘制范围不超出容器边界
  
- **修改文件**:
  - `packages/thingsvis-ui/src/components/CanvasView.tsx` - 重写 `drawGrid` 函数

- **技术细节**:
  - 添加 `mode`, `width`, `height` 到依赖数组
  - 计算 `startX/Y` 和 `endX/Y` 作为绘制边界
  - 循环绘制时检查坐标是否在边界内

- **验证**:
  - ✅ 代码逻辑正确
  - ✅ Rspack 构建成功
  - ✅ 修改的代码通过 TypeScript 检查（已有错误与本次修改无关）

