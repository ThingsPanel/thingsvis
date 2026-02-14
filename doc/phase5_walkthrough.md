# Phase 5: 深度收敛与瘦身 — Walkthrough

## 完成的改动

### 5.1: `embed-mode.ts` → `message-router.ts` ✅

将 `embed-mode.ts` 的所有功能合并到 `message-router.ts`:
- `onEmbedEvent()` — 事件名映射 + `tv:event` 解包
- `requestSave()` — 发送保存给 Host
- `getInitialData()`, `getEditMode()` — 辅助函数
- `ensureEditorEventHandler()` — `updateData→platformData` 桥接

**更新了 6 个消费者:** `Editor.tsx`, `EditorShell.tsx`, `WidgetModeStrategy.ts`, `useAutoSave.ts`, `embed-init.ts`, `saveStrategy.ts`

**删除:** [embed-mode.ts](file:///f:/coding/thingsvis/apps/studio/src/embed/embed-mode.ts)

---

### 5.2: `embed-init.ts` → `message-router.ts` ✅

将 `embed-init.ts` 的所有功能合并到 `message-router.ts`:
- `configureEmbedApiClient()` — token 管理
- `getEmbedToken()` — 获取嵌入 token
- `processEmbedInitPayload()` — 处理 Host 初始化数据
- `initEmbedModeFromUrl()` — URL 参数解析
- `EmbedInitPayload`, `ProcessedEmbedData` 类型

**更新了 4 个消费者:** `WidgetModeStrategy.ts`, `Editor.tsx`, `main.tsx`, `AuthContext.tsx`

**删除:** [embed-init.ts](file:///f:/coding/thingsvis/apps/studio/src/embed/embed-init.ts)

---

### 5.3: Editor.tsx 瘦身 ✅

| 删除项 | 行数 |
|--------|------|
| 空 debug useEffect | 4行 |
| `getInitialData()` 死代码块 | ~76行 |
| Hotfix 注释 → 清晰注释 | 1行改写 |
| 未使用的 import (`getInitialData`) | 1行 |
| **总计** | **~80行** |

Editor.tsx: **2167 → 1908 行** (-259)

---

## 最终指标

| 指标 | Phase 4 结束 | Phase 5 结束 | 目标 |
|------|-------------|-------------|------|
| `embed/` 文件数 | 3 | **1** (`message-router.ts`) | 1 ✅ |
| Editor.tsx 行数 | 2167 | **1908** | <1000 🟡 |
| Hotfix 注释 | 1 | **0** | 0 ✅ |
| `isEmbedMode()` | 17 | **15** | 0 🟡 |
| 消息协议 | 1 (`tv:`) | 1 | 1 ✅ |
| 编译 | 通过 | **通过** (3060.2 kB) | ✅ |

## 验证

```
✅ npx rsbuild build — 成功, Total size: 3060.2 kB
✅ Hotfix 注释: 0
✅ embed/ 目录仅剩 message-router.ts
```

## 剩余工作 (Phase 5.4)

- 15 处 `isEmbedMode()` 需通过 props 传递 (需要更深层的 Strategy 层 wiring)
- Editor.tsx 还需减少 ~900 行 (init handler 826-1005 需迁入 Strategy.bootstrap())
