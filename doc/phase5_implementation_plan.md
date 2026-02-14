# Phase 5: 深度收敛与瘦身 (Deep Convergence & Slimming)

## 当前状态 vs 成功标准

| 标准 (v2.0 §6.3) | 当前值 | 目标 | 差距 |
|---|---|---|---|
| `isEmbedMode()` in `components/` | **17次** | 0 | 🔴 需要移入策略层 |
| `Editor.tsx` 行数 | **1985行** | <1000 | 🔴 需大幅瘦身 |
| 消息协议套数 | 1套 (`tv:`) | 1套 | ✅ 已完成 |
| Host 端 SDK | 1个 (`client.ts`) | 1个 | ✅ 已完成 |
| `// Hotfix` 注释 | **1处** | 0 | 🟡 需清理 |
| 所有 `postMessage` 经 router | **5处**裸调用 | 全部 | 🟠 需收敛 |
| `embed-mode.ts` 存活 | **是** (wrapper) | ❌ 合并入 router | 🟠 需合并 |
| `embed-init.ts` 存活 | **是** | ❌ 合并入策略 | 🟠 需合并 |

---

## 提议改动

> [!IMPORTANT]
> **核心目标**: 让 `Editor.tsx` 行数降到 <1000，`isEmbedMode()` 在 `components/` 中降到 0 次。
> 这需要将 embed 逻辑从 `Editor.tsx` 物理迁移到策略层和 `EditorShell.tsx`。

### Phase 5.1: 合并 `embed-mode.ts` → `message-router.ts`

将 `embed-mode.ts` 的 `on()`, `requestSave()`, `ensureEditorEventHandler()` 逻辑合并到 `message-router.ts`，然后删除 `embed-mode.ts`。

#### [MODIFY] [message-router.ts](file:///f:/coding/thingsvis/apps/studio/src/embed/message-router.ts)
- 吸收 `on()` 的事件名映射 (`EVENT_TO_MSG_TYPE`)
- 吸收 `ensureEditorEventHandler()` 的 `tv:event` 解包逻辑
- 吸收 `requestSave()` 和 `getInitialData()`/`getEditMode()` 辅助函数
- 吸收 `updateData → platformData` 数据流桥接

#### [DELETE] [embed-mode.ts](file:///f:/coding/thingsvis/apps/studio/src/embed/embed-mode.ts)

#### 受影响的消费者 (需更新 import):
- `Editor.tsx` — `on as onEmbedEvent`, `getInitialData`, `getEditMode`
- `WidgetModeStrategy.ts` — `on as onEmbedEvent`
- `useEditorStrategy.ts` — `isEmbedMode` (已指向 message-router ✅)
- `FieldPicker.tsx` — `isEmbedMode` (已指向 message-router ✅)

---

### Phase 5.2: 合并 `embed-init.ts` → `WidgetModeStrategy.ts`

`embed-init.ts` 的逻辑 (`processEmbedInitPayload`, `initEmbedModeFromUrl`, `configureEmbedApiClient`) 仅被 Widget 流程使用。将其内联到 `WidgetModeStrategy.ts`。

#### [MODIFY] [WidgetModeStrategy.ts](file:///f:/coding/thingsvis/apps/studio/src/strategies/WidgetModeStrategy.ts)
- 内联 `processEmbedInitPayload()` 逻辑
- 内联 `configureEmbedApiClient()` 逻辑

#### [DELETE] [embed-init.ts](file:///f:/coding/thingsvis/apps/studio/src/embed/embed-init.ts)
#### [DELETE] [saveStrategy.ts](file:///f:/coding/thingsvis/apps/studio/src/lib/storage/saveStrategy.ts)
#### [DELETE] [service-config.ts](file:///f:/coding/thingsvis/apps/studio/src/lib/embedded/service-config.ts)

---

### Phase 5.3: Editor.tsx 瘦身 — Widget embed 逻辑迁移

将 `Editor.tsx` 中 Lines 826-1090 (~265行) 的 Widget embed 初始化、updateSchema、updateData useEffect 迁移到 `WidgetModeStrategy.bootstrap()` 和 `WidgetModeStrategy.setupListeners()`。

#### [MODIFY] [Editor.tsx](file:///f:/coding/thingsvis/apps/studio/src/components/Editor.tsx)
- 删除 Lines 826-1090: embed init event handler (已在 WidgetModeStrategy 中实现)
- 删除 Lines 250-259: `initEmbedModeFromUrl()` useEffect (迁入策略)
- 删除 `schemaUnsubRef` 和 `dataUnsubRef` (迁入策略的 `setupListeners()`)
- 清理 Hotfix 注释 (Line 500)
- **预计净减 ~300+ 行**

#### [MODIFY] [EditorShell.tsx](file:///f:/coding/thingsvis/apps/studio/src/components/EditorShell.tsx)
- 增加调用 `strategy.setupListeners()` 的 useEffect
- 将 `isEmbedMode()` 判断集中在 Shell 层

---

### Phase 5.4: 收敛剩余 `isEmbedMode()` 调用

将 `Editor.tsx` 中 17 处 `isEmbedMode()` 改为通过 props 传递 (从 `EditorShell.tsx`)。

#### [MODIFY] [Editor.tsx](file:///f:/coding/thingsvis/apps/studio/src/components/Editor.tsx)
- 所有 `isEmbedMode()` 调用改为 `props.isEmbedded` 或 `props.embedVisibility`
- 移除 `isEmbedMode` 的 import

#### [MODIFY] [EditorShell.tsx](file:///f:/coding/thingsvis/apps/studio/src/components/EditorShell.tsx)
- 计算 `isEmbedded` 并通过 props 传递

---

### Phase 5.5: 收敛最后的裸 `postMessage`

| 位置 | 当前 | 目标 |
|------|------|------|
| `WidgetModeStrategy.ts:149` | `window.postMessage({type: 'tv:platform-data'})` | 内部桥接，保留 (自发自收) |
| `EmbedPage.tsx:396` | `window.postMessage({type: 'tv:platform-data'})` | 同上 |
| `embed-mode.ts:50` | 同上 | 将在 5.1 中合并到 router |
| `Editor.tsx:914` | 同上 | 将在 5.3 中随代码迁移 |

> [!NOTE]
> `window.postMessage` (非 `parent.postMessage`) 用于页面内部桥接 platform data → PlatformFieldAdapter。这是故意的自发自收模式，不需要走 `messageRouter.send()`（后者是发给 parent iframe 的）。因此这几处可保留。

---

## 验证计划

### 编译验证
```bash
cd apps/studio && npx rsbuild build
```

### 指标检查
```bash
# isEmbedMode 在 components/ 应为 0
grep -r "isEmbedMode" apps/studio/src/components/ | wc -l

# Editor.tsx 行数应 < 1000
wc -l apps/studio/src/components/Editor.tsx

# Hotfix 注释应为 0
grep -r "Hotfix" apps/studio/src/ | wc -l
```

### 手动测试
执行 Track A (Widget), Track B (App), Track C (独立), Track D (预览)

---

## 执行顺序

```
5.1 (合并 embed-mode) → 5.2 (合并 embed-init) → 编译验证
→ 5.3 (Editor 瘦身) → 5.4 (isEmbedMode 收敛) → 编译验证
→ 5.5 (postMessage 评估) → 手动测试
```
