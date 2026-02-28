# ADR-001: Widget 隔离架构设计方案

## 状态
- **状态**: 草案 (Draft)
- **日期**: 2026-02-28
- **作者**: Kimi Code

## 背景与问题陈述

ThingsVis 项目存在严重的组件间耦合问题：

1. **修改一个 Widget 影响其他组件** - 如文本组件双击编辑修复涉及 Moveable、CanvasView、VisualEngine、WidgetRenderer 多层
2. **多人协作冲突** - 缺乏清晰的开发边界，组件开发者互相影响
3. **错误传播** - 单个 Widget 错误可能拖垮整个编辑器
4. **代码风格不一致** - `defineWidget` 和手动实现 `WidgetMainModule` 并存

## 决策目标

| 目标 | 优先级 | 验证方式 |
|------|--------|----------|
| 组件级隔离 | P0 | 修改单个 Widget 不影响其他组件 |
| 开发时隔离 | P0 | 多人可同时开发不同 Widget 零冲突 |
| 运行时隔离 | P0 | Widget 崩溃不拖垮编辑器 |
| 依赖清晰 | P1 | 依赖图自动生成，无循环依赖 |
| 可测试性 | P1 | 每个 Widget 可独立单元测试 |

## 架构设计

### 1. 整体隔离架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Studio 应用层 (Apps)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Editor     │  │   CanvasView │  │  Transform   │  │  PropertyPanel   │ │
│  │   (编排)      │  │   (容器)      │  │  Controls    │  │   (配置)          │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────────────┘ │
└─────────┼────────────────┼────────────────┼─────────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        核心平台层 (Platform)                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     Widget Container (沙箱容器)                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Widget A   │  │  Widget B   │  │  Widget C   │  │  Widget D   │  │  │
│  │  │  (Shadow    │  │  (Shadow    │  │  (Shadow    │  │  (Shadow    │  │  │
│  │  │   DOM)      │  │   DOM)      │  │   DOM)      │  │   DOM)      │  │  │
│  │  │  iframe/    │  │  iframe/    │  │  iframe/    │  │  iframe/    │  │  │
│  │  │  worker     │  │  worker     │  │  worker     │  │  worker     │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                                      │  │
│  │  隔离机制:                                                            │  │
│  │  • Shadow DOM - CSS 隔离                                              │  │
│  │  • MessageChannel - 通信隔离                                          │  │
│  │  • ErrorBoundary - 错误隔离                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      渲染引擎 (VisualEngine)                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Leafer    │  │   GridStack │  │  Connection │  │  Renderer   │  │  │
│  │  │   Canvas    │  │   Layout    │  │   Manager   │  │   Factory   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        状态管理层 (State)                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   NodeStore      │  │  SelectionStore  │  │   CanvasStore    │          │
│  │  (节点状态)       │  │   (选中状态)      │  │   (画布状态)      │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Widget 沙箱隔离机制

#### 2.1 三层隔离模型

```typescript
// 隔离级别枚举
enum IsolationLevel {
  // Level 1: Shadow DOM 隔离（默认）
  // - CSS 完全隔离
  // - DOM 事件不冒泡到宿主
  // - 轻量级，性能好
  SHADOW_DOM = 'shadow-dom',
  
  // Level 2: iframe 隔离（高风险 Widget）
  // - 完全 JS 隔离
  // - 独立的执行上下文
  // - 内存泄漏不扩散
  IFRAME = 'iframe',
  
  // Level 3: Web Worker 隔离（计算密集型）
  // - 独立的 JS 线程
  // - 无 DOM 访问（需配合 OffscreenCanvas）
  // - CPU 密集型任务不影响 UI
  WORKER = 'worker'
}

// Widget 元数据声明隔离级别
defineWidget({
  id: 'custom/heavy-chart',
  isolation: IsolationLevel.IFRAME,  // 声明需要 iframe 隔离
  permissions: ['network', 'storage'], // 声明所需权限
  // ...
});
```

#### 2.2 Shadow DOM 隔离实现

```typescript
// packages/thingsvis-widget-sdk/src/container/ShadowContainer.ts
export class ShadowContainer {
  private host: HTMLElement;
  private shadowRoot: ShadowRoot;
  private styleSheet: CSSStyleSheet;
  
  constructor(host: HTMLElement, widgetId: string) {
    this.host = host;
    // 创建 Closed Shadow Root，外部无法访问
    this.shadowRoot = host.attachShadow({ mode: 'closed' });
    
    // 注入基础样式隔离
    this.styleSheet = new CSSStyleSheet();
    this.styleSheet.replaceSync(`
      :host {
        all: initial; /* CSS 重置 */
        display: block;
        width: 100%;
        height: 100%;
      }
      
      /* 隔离外部样式 */
      * {
        box-sizing: border-box;
      }
      
      /* Widget 命名空间 */
      [data-widget-id="${widgetId}"] {
        /* Widget 特定样式 */
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [this.styleSheet];
  }
  
  mount(element: HTMLElement): void {
    this.shadowRoot.appendChild(element);
  }
  
  unmount(): void {
    this.shadowRoot.innerHTML = '';
  }
  
  // 安全地更新样式
  updateStyles(css: string): void {
    this.styleSheet.replaceSync(css);
  }
}
```

#### 2.3 iframe 隔离实现

```typescript
// packages/thingsvis-widget-sdk/src/container/IframeContainer.ts
export class IframeContainer {
  private iframe: HTMLIFrameElement;
  private channel: MessageChannel;
  
  constructor(container: HTMLElement, widgetUrl: string, permissions: string[]) {
    this.iframe = document.createElement('iframe');
    this.iframe.sandbox.add('allow-scripts');
    
    // 根据权限添加沙箱权限
    if (permissions.includes('same-origin')) {
      this.iframe.sandbox.add('allow-same-origin');
    }
    if (permissions.includes('forms')) {
      this.iframe.sandbox.add('allow-forms');
    }
    
    // 使用 srcdoc + CSP 进一步限制
    this.iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="Content-Security-Policy" 
                content="default-src 'none'; 
                         script-src 'unsafe-inline' 'unsafe-eval'; 
                         style-src 'unsafe-inline';
                         connect-src ${this.getAllowedOrigins()}">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; overflow: hidden; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script>
            // 初始化 MessageChannel 通信
            const channel = new MessageChannel();
            window.parent.postMessage({ type: 'WIDGET_READY', port: channel.port2 }, '*', [channel.port2]);
            
            // 暴露安全的 API
            window.widgetAPI = {
              emit: (event, data) => channel.port1.postMessage({ type: 'EMIT', event, data }),
              on: (event, handler) => { /* ... */ },
            };
          </script>
        </body>
      </html>
    `;
    
    // 建立通信通道
    this.channel = new MessageChannel();
    this.iframe.addEventListener('load', () => {
      this.iframe.contentWindow?.postMessage(
        { type: 'INIT_CHANNEL' },
        '*',
        [this.channel.port2]
      );
    });
    
    container.appendChild(this.iframe);
  }
  
  postMessage(message: unknown): void {
    this.channel.port1.postMessage(message);
  }
  
  destroy(): void {
    this.channel.port1.close();
    this.iframe.remove();
  }
}
```

### 3. 通信隔离设计

#### 3.1 MessageChannel 通信协议

```typescript
// packages/thingsvis-widget-sdk/src/protocol/WidgetProtocol.ts

// 宿主 → Widget 的消息
interface HostToWidgetMessage {
  type: 'PROPS_UPDATE';
  payload: {
    props: Record<string, unknown>;
    context: WidgetContext;
  };
}

// Widget → 宿主的消息
interface WidgetToHostMessage {
  type: 'EVENT_EMIT' | 'ERROR_REPORT' | 'PERMISSION_REQUEST';
  payload: unknown;
}

// 通信管理器
export class WidgetMessageBus {
  private port: MessagePort;
  private handlers: Map<string, Set<Function>> = new Map();
  
  constructor(port: MessagePort) {
    this.port = port;
    this.port.onmessage = (event) => this.handleMessage(event.data);
  }
  
  emit(event: string, payload: unknown): void {
    this.port.postMessage({ type: 'EVENT', event, payload });
  }
  
  on(event: string, handler: Function): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    
    // 返回取消订阅函数
    return () => this.handlers.get(event)?.delete(handler);
  }
  
  private handleMessage(message: HostToWidgetMessage | WidgetToHostMessage): void {
    const { type, event, payload } = message as any;
    
    if (type === 'EVENT' && event) {
      this.handlers.get(event)?.forEach(h => {
        try {
          h(payload);
        } catch (err) {
          console.error(`Widget event handler error: ${err}`);
        }
      });
    }
  }
}
```

#### 3.2 类型安全的 RPC 封装

```typescript
// packages/thingsvis-widget-sdk/src/protocol/RPCClient.ts
export class WidgetRPCClient<TDefinitions extends RPCDefinitions> {
  async call<K extends keyof TDefinitions>(
    method: K,
    ...args: Parameters<TDefinitions[K]>
  ): Promise<ReturnType<TDefinitions[K]>> {
    return new Promise((resolve, reject) => {
      const requestId = generateId();
      
      const timeout = setTimeout(() => {
        reject(new Error(`RPC call timeout: ${String(method)}`));
      }, 5000);
      
      const handler = (event: MessageEvent) => {
        if (event.data.requestId === requestId) {
          clearTimeout(timeout);
          this.port.removeEventListener('message', handler);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };
      
      this.port.addEventListener('message', handler);
      this.port.postMessage({
        type: 'RPC_CALL',
        requestId,
        method,
        args
      });
    });
  }
}
```

### 4. 错误隔离设计

#### 4.1 Widget 级 Error Boundary

```typescript
// packages/thingsvis-widget-sdk/src/container/WidgetErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  widgetId: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(`Widget ${this.props.widgetId} crashed:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
    
    // 上报错误到监控系统
    reportWidgetError({
      widgetId: this.props.widgetId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }
  
  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="widget-error-fallback" data-widget-id={this.props.widgetId}>
          <div className="widget-error-icon">⚠️</div>
          <div className="widget-error-title">组件加载失败</div>
          <div className="widget-error-message">{this.state.error?.message}</div>
          <button onClick={() => this.setState({ hasError: false })}>
            重试
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

#### 4.2 异步错误捕获

```typescript
// packages/thingsvis-widget-sdk/src/utils/safeCallbacks.ts
export function createSafeCallbacks(widgetId: string) {
  return {
    wrap<T extends (...args: any[]) => any>(fn: T, context: string): T {
      return ((...args: Parameters<T>): ReturnType<T> => {
        try {
          return fn(...args);
        } catch (error) {
          console.error(`[Widget ${widgetId}] Error in ${context}:`, error);
          // 不抛出，防止传播到宿主
          return undefined as ReturnType<T>;
        }
      }) as T;
    },
    
    asyncWrap<T extends (...args: any[]) => Promise<any>>(fn: T, context: string): T {
      return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
          return await fn(...args);
        } catch (error) {
          console.error(`[Widget ${widgetId}] Async error in ${context}:`, error);
          return undefined as ReturnType<T>;
        }
      }) as T;
    }
  };
}
```

### 5. 依赖管理设计

#### 5.1 Widget 依赖声明

```typescript
// widgets/chart/echarts-line/package.json
{
  "name": "thingsvis-widget-chart-echarts-line",
  "thingsvis": {
    "displayName": "折线图",
    "isolation": "shadow-dom",  // 声明隔离级别
    "permissions": ["network"],  // 声明所需权限
    "dependencies": {
      // 声明运行时依赖
      "echarts": {
        "version": "^5.5.0",
        "global": "echarts",  // 从全局获取，不打包
        "singleton": true     // 确保单例
      }
    },
    "externals": ["react", "react-dom", "@thingsvis/widget-sdk"]
  }
}
```

#### 5.2 依赖共享机制

```typescript
// packages/thingsvis-kernel/src/dependency/SharedDependencyManager.ts
export class SharedDependencyManager {
  private sharedModules: Map<string, SharedModule> = new Map();
  
  registerSharedModule(name: string, version: string, factory: () => unknown): void {
    this.sharedModules.set(name, {
      name,
      version,
      factory,
      instance: null,
      loaded: false
    });
  }
  
  async loadSharedModule(name: string, requestedVersion: string): Promise<unknown> {
    const module = this.sharedModules.get(name);
    if (!module) {
      throw new Error(`Shared module not found: ${name}`);
    }
    
    // 版本兼容性检查
    if (!satisfies(module.version, requestedVersion)) {
      console.warn(`Version mismatch for ${name}: ` +
        `requested ${requestedVersion}, available ${module.version}`);
    }
    
    if (!module.loaded) {
      module.instance = await module.factory();
      module.loaded = true;
    }
    
    return module.instance;
  }
}

// 在应用启动时注册共享依赖
const sharedManager = new SharedDependencyManager();
sharedManager.registerSharedModule('react', '18.2.0', () => import('react'));
sharedManager.registerSharedModule('echarts', '5.5.0', () => import('echarts'));
```

### 6. 开发时隔离设计

#### 6.1 Widget 独立开发模式

```typescript
// packages/thingsvis-widget-sdk/src/dev/WidgetDevServer.ts
export class WidgetDevServer {
  private mockContext: WidgetOverlayContext;
  
  constructor(widgetConfig: WidgetConfig) {
    this.mockContext = this.createMockContext(widgetConfig);
  }
  
  private createMockContext(config: WidgetConfig): WidgetOverlayContext {
    return {
      mode: 'edit',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      props: this.generateMockProps(config.schema),
      theme: this.loadMockTheme(),
      emit: (event, payload) => {
        console.log(`[Dev] Widget emitted: ${event}`, payload);
      },
      on: (event, handler) => {
        console.log(`[Dev] Widget subscribed to: ${event}`);
        return () => {};
      }
    };
  }
  
  mount(container: HTMLElement): void {
    // 在独立环境中挂载 Widget，不依赖 Studio
    const widget = this.createWidgetInstance();
    widget.render(container, this.mockContext.props, this.mockContext);
  }
}

// 使用方式：每个 Widget 项目运行独立开发服务器
// widgets/chart/echarts-line/dev.ts
import { WidgetDevServer } from '@thingsvis/widget-sdk/dev';
import { Main } from './src';

const server = new WidgetDevServer(Main);
server.mount(document.getElementById('root')!);
```

#### 6.2 Widget 测试工具

```typescript
// packages/thingsvis-widget-sdk/src/testing/WidgetTestHarness.ts
export class WidgetTestHarness<TProps> {
  private widget: WidgetInstance<TProps>;
  private container: HTMLElement;
  private emittedEvents: Array<{ event: string; payload: unknown }> = [];
  
  async mount(config: WidgetConfig<TProps>, props: TProps): Promise<void> {
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    
    const mockContext: WidgetOverlayContext = {
      mode: 'edit',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      props,
      theme: defaultTheme,
      emit: (event, payload) => {
        this.emittedEvents.push({ event, payload });
      },
      on: () => () => {}
    };
    
    this.widget = config.render(this.container, props, mockContext);
  }
  
  updateProps(newProps: Partial<TProps>): void {
    this.widget.update?.({ ...this.widget.props, ...newProps }, this.mockContext);
  }
  
  getEmittedEvents(): Array<{ event: string; payload: unknown }> {
    return this.emittedEvents;
  }
  
  unmount(): void {
    this.widget.destroy?.();
    this.container.remove();
  }
}

// 测试示例
// widgets/chart/echarts-line/__tests__/index.test.ts
import { WidgetTestHarness } from '@thingsvis/widget-sdk/testing';
import { Main } from '../src';

describe('ECharts Line Widget', () => {
  let harness: WidgetTestHarness;
  
  afterEach(() => harness?.unmount());
  
  it('should render chart with initial data', async () => {
    harness = new WidgetTestHarness();
    await harness.mount(Main, {
      dataSource: { type: 'static', data: [{ x: 1, y: 10 }] }
    });
    
    expect(harness.container.querySelector('canvas')).toBeTruthy();
  });
  
  it('should emit dataChange event on interaction', async () => {
    // 模拟用户交互，验证事件发射
  });
});
```

## 实施计划

### 阶段 1: 基础隔离（2 周）

- [ ] 实现 Shadow DOM 容器
- [ ] 添加 Widget 级 Error Boundary
- [ ] 统一使用 `defineWidget` API
- [ ] 废弃手动实现 `WidgetMainModule` 的方式

### 阶段 2: 通信隔离（2 周）

- [ ] 实现 MessageChannel 通信协议
- [ ] 封装 WidgetRPCClient
- [ ] 迁移现有事件系统到新协议
- [ ] 添加通信超时和错误处理

### 阶段 3: 高级隔离（3 周）

- [ ] 实现 iframe 容器
- [ ] 实现依赖共享管理器
- [ ] 添加权限控制系统
- [ ] 开发 Widget 独立开发服务器

### 阶段 4: 工具与测试（2 周）

- [ ] 开发 WidgetTestHarness
- [ ] 添加依赖分析工具
- [ ] 编写隔离性测试用例
- [ ] 更新文档和示例

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Shadow DOM 性能开销 | 中 | 基准测试，必要时降级到轻量模式 |
| iframe 通信延迟 | 中 | 批量消息，使用 SharedArrayBuffer |
| 第三方库不兼容 Shadow DOM | 高 | 提供适配层，维护兼容库列表 |
| 迁移成本高 | 中 | 渐进式迁移，提供自动化工具 |

## 决策记录

| 决策 | 原因 | 替代方案 |
|------|------|----------|
| 默认 Shadow DOM 隔离 | CSS 隔离完善，性能好 | iframe（太重）|
| MessageChannel 通信 | 标准 API，可跨 iframe | postMessage（不够安全）|
| 三级隔离模型 | 平衡安全性与性能 | 统一 iframe（性能差）|
| 显式权限声明 | 最小权限原则 | 隐式权限（不安全）|

## 附录

### A. 术语表

- **Shadow DOM**: 浏览器提供的 DOM 封装机制
- **MessageChannel**: 浏览器提供的双向通信通道
- **Widget Container**: 承载 Widget 运行的隔离容器
- **Shared Module**: 多个 Widget 共享的依赖模块

### B. 参考实现

- [Micro-frontend Architecture](https://micro-frontends.org/)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Web Components Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
