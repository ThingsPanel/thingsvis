# Text Widget 修复任务

**日期**: 2026-02-27  
**执行者**: AI Agent  
**任务类型**: fix
**关联 Widget**: `basic/text`

---

## 用户反馈问题

文本 Widget 存在编辑使用问题，无法方便地编辑使用。

---

## 问题分析与修复

### 问题 1: WidgetMainModule 类型缺少 resizable 字段

**影响**: 编辑器无法正确识别组件是否可调整大小

**修复文件**: `packages/thingsvis-schema/src/widget-module.ts`

**变更**:
```typescript
export type WidgetMainModule = {
  id: string;
  name?: string;
  category?: string;
  icon?: string;
  version?: string;
+  /**
+   * Whether the widget supports resizing.
+   * - true: widget can be resized by user (default)
+   * - false: widget size is determined by content (e.g., text)
+   */
+  resizable?: boolean;
+  /**
+   * Default size for the widget when created
+   */
+  defaultSize?: { width: number; height: number };
  locales?: Record<string, any>;
  // ...
}
```

---

### 问题 2: Text Widget 选择困难

**影响**: 文本组件在画布上难以选中，因为填充完全透明

**修复文件**: `widgets/basic/text/src/index.ts`

**变更**:
```typescript
// Before:
function create(): Rect {
  return new Rect({
    width: 200,
    height: 40,
    fill: 'transparent',  // 完全透明，难以选中
    draggable: true,
    cursor: 'pointer',
  });
}

// After:
function create(): Rect {
  return new Rect({
    width: 160,
    height: 40,
    fill: 'rgba(200,200,200,0.05)', // 轻微透明背景便于选择
    stroke: {
      width: 1,
      color: 'rgba(150,150,150,0.2)', // 轻微边框便于识别
    },
    draggable: true,
    cursor: 'pointer',
  });
}
```

---

### 问题 3: Metadata 缺少 defaultSize

**影响**: 编辑器无法获知组件的默认尺寸

**修复文件**: `widgets/basic/text/src/metadata.ts`

**变更**:
```typescript
export const metadata = {
  id: 'basic-text',
  name: '基础文本',
  category: 'basic',
  icon: 'Type',
  version: '1.0.0',
  resizable: false,
+ defaultSize: { width: 160, height: 40 },
} as const;
```

---

## 构建与部署

```bash
# 1. 构建 text widget
cd widgets/basic/text
npm run build

# 2. 复制到 studio
cp -r dist/* ../../../apps/studio/public/widgets/basic/text/dist/

# 3. 重新生成 registry
node scripts/generate-registry.js

# 4. 验证
node scripts/validate-registry.js apps/studio/public/registry.json
```

---

## 验证结果

✅ Registry validated OK

---

## 修改的文件列表

1. `packages/thingsvis-schema/src/widget-module.ts` - 添加 resizable 和 defaultSize 类型定义
2. `widgets/basic/text/src/metadata.ts` - 添加 defaultSize
3. `widgets/basic/text/src/index.ts` - 优化选择交互
4. `widgets/basic/text/dist/*` - 重新构建产物
5. `apps/studio/public/widgets/basic/text/dist/*` - 复制到 studio
6. `apps/studio/public/registry.json` - 重新生成

---

## 改进效果

1. **类型安全**: `resizable` 和 `defaultSize` 现在在类型系统中有正式定义
2. **选择体验**: 文本组件现在有更明显的视觉反馈，便于选中
3. **默认尺寸**: 编辑器可以正确获取组件的默认尺寸

---

## 后续建议

1. 考虑添加双击编辑功能，让用户可以直接在画布上编辑文本
2. 考虑在文本选中时显示虚线边框提示
3. 添加文本组件的快捷键支持（如 Ctrl+B 加粗）
