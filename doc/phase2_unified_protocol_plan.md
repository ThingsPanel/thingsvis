# Phase 2: 统一消息协议

## 目标

将 `message-router.ts` 从 Phase 0 的纯日志工具升级为**类型安全的消息路由中心**，并将 `embed-mode.ts` 的消息处理逻辑合并进来。

> [!IMPORTANT]
> **注意**: 架构文档建议将 `thingsvis:*` 改名为 `tv:*`，但这是跨两个仓库的**破坏性变更**。本次采用**保守策略**：保留现有消息类型名，只做架构统一。`tv:` 前缀重命名推迟到 Phase 3。
> 
> `canvasConfig` 状态去重 (ADR-3) 同样推迟到 Phase 3 — 改动范围太大，需要单独规划。

## Proposed Changes

### Guest 端 (ThingsVis)

---

#### [MODIFY] [message-router.ts](file:///f:/coding/thingsvis/apps/studio/src/embed/message-router.ts)

从纯日志 → 完整的消息路由中心:

1. 新增 `MessageRouter` class，包含:
   - `on(type, handler)` — 注册消息处理器 (返回 unsubscribe)
   - `send(type, payload)` — 发送消息给 Host (自动包装格式和日志)
   - `dispose()` — 清理所有监听器
2. 内置消息类型枚举 (`MSG_TYPES`)
3. 全局单例 `messageRouter` 替代 `messageLogger`
4. 保留原有日志功能

---

#### [MODIFY] [embed-mode.ts](file:///f:/coding/thingsvis/apps/studio/src/embed/embed-mode.ts)

将内部实现改为委托给 `messageRouter`:

- `on()` → `messageRouter.on()` (保持 API 签名不变)
- `requestSave()` → `messageRouter.send('thingsvis:host-save', ...)`
- `isEmbedMode()` / `getEditMode()` — 保留不变

这样所有消费者 (`Editor.tsx`, `EditorShell.tsx`, `WidgetModeStrategy.ts`) 无需改动。

---

#### [MODIFY] [WidgetModeStrategy.ts](file:///f:/coding/thingsvis/apps/studio/src/strategies/WidgetModeStrategy.ts)

直接使用 `messageRouter.send()` 代替手动 `window.parent.postMessage()`

---

#### [MODIFY] [EditorShell.tsx](file:///f:/coding/thingsvis/apps/studio/src/components/EditorShell.tsx)

将 `request-save` 的直接 `window.addEventListener('message', ...)` 替换为 `messageRouter.on('thingsvis:request-save', ...)`

---

### Host 端 (ThingsPanel)

**本阶段不改动** — 保持现有消息类型名，Host SDK 无需修改。

## 执行顺序

```
1. 升级 message-router.ts (新增 MessageRouter class)     [低风险]
2. 改写 embed-mode.ts (委托给 messageRouter)              [低风险]
3. 改写 EditorShell.tsx request-save handler              [低风险]
4. 改写 WidgetModeStrategy.ts save()                     [低风险]
5. TypeScript 编译验证                                    [验证]
```

## Verification

同 Phase 1 的 Track A/B/C/D 手动测试。
