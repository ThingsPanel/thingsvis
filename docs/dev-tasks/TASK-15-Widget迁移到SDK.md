# TASK-15：现有 Widget 迁移到 SDK

> **优先级**：🔴 P0
> **预估工时**：0.5-1 人天
> **前置依赖**：TASK-14（SDK 核心升级完成后）
> **阻塞**：TASK-06（新组件使用 SDK 开发）

---

## 背景

现有 6 个 Widget 各自复制了 237 行的 `lib/types.ts`（含 `generateControls` 等工具函数），只支持 6 种控件类型。`@thingsvis/widget-sdk` 已有完整实现且 API 签名兼容。迁移为机械操作。

---

## 待迁移 Widget

| Widget | 目录 | 改动 |
|--------|------|------|
| text | `widgets/basic/text/` | 改 import + 删 `lib/types.ts` + 加 locales |
| rectangle | `widgets/basic/rectangle/` | 同上 |
| circle | `widgets/basic/circle/` | 同上 |
| line | `widgets/basic/line/` | 同上 |
| image | `widgets/media/image/` | 同上 |
| echarts-line | `widgets/chart/echarts-line/` | 同上 |

---

## 每个 Widget 迁移步骤

### Step 1: 替换 import（2 行改动）

```diff
 // controls.ts
-import { generateControls } from './lib/types';
+import { generateControls } from '@thingsvis/widget-sdk';

 // index.ts
-import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from './lib/types';
+import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from '@thingsvis/widget-sdk';
```

### Step 2: 删除 `src/lib/types.ts`

### Step 3: `package.json` 添加 SDK 为 devDependency

```json
{ "devDependencies": { "@thingsvis/widget-sdk": "workspace:*" } }
```

### Step 4: 添加 locales 翻译文件

```typescript
// 在 Main 导出中添加
export const Main = {
  ...metadata,
  schema: PropsSchema,
  controls,
  createOverlay,
  locales: {
    zh: { /* 从 schema.describe() 和 controls 中提取 */ },
    en: { /* 对应英文翻译 */ },
  },
};
```

---

## 任务清单

- [ ] 迁移 `text` Widget（改 import + 删 types + 加 locales）
- [ ] 迁移 `rectangle` Widget
- [ ] 迁移 `circle` Widget
- [ ] 迁移 `line` Widget
- [ ] 迁移 `image` Widget
- [ ] 迁移 `echarts-line` Widget
- [ ] `pnpm build` 全量构建验证
- [ ] 在 Studio 中逐个打开、配置、预览验证

---

## 验收标准

1. 所有 `widgets/*/src/lib/types.ts` 文件已删除（净删 ~1400 行）
2. `pnpm build` 零错误
3. 每个 Widget 在 Studio 中可正常拖拽、配置、渲染
4. 属性面板控件行为与迁移前完全一致

---

## 风险评估

- **低风险**：`generateControls` 签名完全一致，属于纯机械替换
- **回滚方式**：git revert 恢复 `lib/types.ts`
