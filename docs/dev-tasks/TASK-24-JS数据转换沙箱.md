# TASK-24：JS 数据转换沙箱（Web Worker）

> **优先级**：🟢 P2（v0.2.0 后期，锦上添花）
> **预估工时**：1-2 人天
> **前置依赖**：TASK-21（DSP v2 ScriptAdapter）、TASK-23（ActionSystem RunScriptAction）

---

## 背景

GoView 的"数据过滤器"是用户最爱的功能，允许写自定义 JS 处理 API 返回的复杂数据。ThingsVis 提供更安全的方案：在 **Web Worker** 中执行，主线程零风险。

---

## 功能范围

| 使用场景 | 入口 |
|---------|------|
| 数据源 transform 脚本 | TASK-21 ScriptAdapter / FieldMapping transform |
| 动作 RunScriptAction | TASK-23 ActionSystem |

---

## 安全设计

```
主线程                    Web Worker（沙箱）
   │                          │
   ├── postMessage(script) ──→│ eval(script)  ← 无DOM，无网络，无文件
   │                          │   ↓
   │←── postMessage(result) ──│ return result
   │                          │
   ├── 超时 5s → terminate() ←─┘  // 强制杀死
   └── 错误 → 降级为原始数据
```

**限制**（自动生效，无需配置）：
- 无 `document` / `window` / `fetch` 访问
- 执行时间上限 5s
- 内存上限通过 Worker 隔离

---

## 编辑器 UI

- 数据源配置面板：可选「脚本」模式
- Monaco Editor 嵌入（轻量，只加载 JS 语言包）
- 右侧实时预览：输入数据 → 脚本输出

```
┌────────────────────────────────────────┐
│ 数据转换脚本（可选）                    │
│ ┌──────────────────────────────────┐  │
│ │ // data 是原始响应               │  │
│ │ (data) => ({                     │  │
│ │   value: data.results[0].temp,   │  │
│ │   items: data.results.map(...)   │  │
│ │ })                               │  │
│ └──────────────────────────────────┘  │
│                                        │
│ 预览输入:  { "results": [...] }        │
│ 预览输出:  { "value": 25.3, "items":  │
│             [...] }           ✅ 正常  │
└────────────────────────────────────────┘
```

---

## 子任务清单

- [ ] `packages/thingsvis-kernel/src/sandbox/worker.ts` — Web Worker 脚本
- [ ] `packages/thingsvis-kernel/src/sandbox/executor.ts` — 主线程执行器（超时+错误处理）
- [ ] ScriptAdapter 集成（TASK-21 预留接口）
- [ ] RunScriptAction 集成（TASK-23 预留接口）
- [ ] Studio 编辑器：Monaco Editor 轻量集成 + 实时预览面板

---

## 验收标准

1. 脚本 `(data) => data.results[0].value` 正确执行并返回数值
2. 死循环脚本（`while(true){}`）5 秒后自动终止，不影响主线程
3. 脚本中访问 `window` 报错，不污染主线程
4. 编辑器实时预览：修改脚本后 500ms 内刷新预览输出
5. 脚本报错时，Widget 降级显示原始数据，控制台输出错误信息
