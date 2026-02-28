# Widget 隔离设计实施路线图

## 概览

本文档提供从当前架构迁移到完全隔离架构的详细实施路线图。

**目标日期**: 9 周内完成全部实施
**负责团队**: Platform Team + Widget Developers
**影响范围**: 所有 packages 和 widgets

---

## 当前状态评估

### 耦合问题清单

| 优先级 | 问题 | 影响范围 | 当前状态 |
|--------|------|----------|----------|
| P0 | KernelStore 单体结构 | 整个应用 | 🔴 高风险 |
| P0 | Widget ctx 可修改 | 所有 Widget | 🔴 高风险 |
| P0 | 无 CSS 隔离 | 所有 Widget | 🔴 高风险 |
| P1 | emit 函数多处定义 | VisualEngine | 🟡 中风险 |
| P1 | 两种 Widget 实现方式 | SDK + Widgets | 🟡 中风险 |
| P2 | editingNodeId 全局状态 | KernelStore | 🟢 低风险 |

### 现有 Widget 迁移矩阵

| Widget | 当前实现 | 隔离级别 | 迁移复杂度 |
|--------|----------|----------|------------|
| basic/text | 手动实现 | 无 | 高（事件复杂） |
| basic/table | 手动实现 | 无 | 中 |
| chart/echarts-* | 手动实现 | 无 | 中（echarts 集成） |
| indicator/number-card | defineWidget | 无 | 低 |
| media/video-player | 手动实现 | 无 | 高（需要 iframe） |

---

## 实施阶段

### 🔵 阶段 1: 基础隔离（第 1-2 周）

**目标**: 建立基础隔离机制，阻止最明显的耦合问题

#### Week 1: Shadow DOM 基础

**Day 1-2: SDK 增强**
```typescript
// packages/thingsvis-widget-sdk/src/container/
- ShadowContainer.ts      // Shadow DOM 容器
- createIsolatedWidget.ts // 隔离包装器
- types.ts                // 隔离相关类型
```

**Day 3-4: Error Boundary**
```typescript
// packages/thingsvis-widget-sdk/src/
- error/WidgetErrorBoundary.tsx
- error/safeCallbacks.ts
- error/ErrorReporter.ts
```

**Day 5: 冻结上下文**
```typescript
// 在 defineWidget 中自动冻结 ctx
const frozenCtx = Object.freeze({ ...ctx });
// 使用 Proxy 检测修改尝试
const protectedCtx = new Proxy(frozenCtx, {
  set() {
    console.warn('Widget context is readonly');
    return false;
  }
});
```

#### Week 2: Widget 迁移第一波

**迁移目标**: `indicator/number-card`（defineWidget 实现，复杂度低）

**步骤**:
1. 更新 SDK 版本
2. 启用 Shadow DOM 容器
3. 添加 Error Boundary
4. 验证功能

**验证清单**:
- [ ] 样式不影响其他 Widget
- [ ] 错误被正确捕获
- [ ] 事件正常传递
- [ ] 性能无显著下降

**Week 1-2 交付物**:
- [ ] PR: SDK 隔离基础设施
- [ ] PR: number-card 迁移示例
- [ ] 文档: Shadow DOM 最佳实践

---

### 🟢 阶段 2: 通信隔离（第 3-4 周）

**目标**: 建立安全的跨边界通信机制

#### Week 3: MessageChannel 协议

**Day 1-2: 协议设计**
```typescript
// packages/thingsvis-widget-sdk/src/protocol/
- WidgetProtocol.ts       // 消息类型定义
- MessageBus.ts           // 消息总线
- RPCClient.ts            // RPC 封装
```

**Day 3-4: 宿主端实现**
```typescript
// packages/thingsvis-ui/src/engine/
- WidgetHostBridge.ts     // 宿主侧桥接
- MessagePortManager.ts   // Port 管理
```

**Day 5: Widget 端实现**
```typescript
// packages/thingsvis-widget-sdk/src/protocol/
- WidgetGuestBridge.ts    // Widget 侧桥接
- createGuestAPI.ts       // 创建 Widget API
```

#### Week 4: 事件系统迁移

**迁移目标**: 将现有事件系统迁移到新协议

**事件映射**:
```typescript
// 旧事件 → 新协议
emit('edit:start')      →  bus.emit('widget:edit:start')
emit('edit:end')        →  bus.emit('widget:edit:end')
KernelStore 订阅        →  MessageBus 订阅
```

**Week 3-4 交付物**:
- [ ] PR: MessageChannel 通信协议
- [ ] PR: 事件系统迁移
- [ ] 文档: 通信协议规范

---

### 🟡 阶段 3: 高级隔离（第 5-7 周）

**目标**: 实现 iframe 隔离和依赖管理

#### Week 5: iframe 容器

**Day 1-3: iframe 容器实现**
```typescript
// packages/thingsvis-widget-sdk/src/container/
- IframeContainer.ts      // iframe 沙箱
- IframeSandbox.ts        // 沙箱管理
- CSPPolicy.ts            // CSP 策略
```

**Day 4-5: 权限系统**
```typescript
// packages/thingsvis-widget-sdk/src/permissions/
- PermissionManager.ts    // 权限管理
- PermissionRequest.ts    // 权限请求 UI
- defaultPolicies.ts      // 默认策略
```

#### Week 6: 依赖共享

**Day 1-2: 共享依赖管理器**
```typescript
// packages/thingsvis-kernel/src/dependency/
- SharedDependencyManager.ts
- VersionResolver.ts
- ModuleLoader.ts
```

**Day 3-4: Widget 依赖声明**
```json
// widgets/chart/echarts-line/package.json
{
  "thingsvis": {
    "isolation": "shadow-dom",
    "permissions": ["network"],
    "sharedDependencies": {
      "echarts": "^5.5.0"
    }
  }
}
```

**Day 5: 依赖分析工具**
```typescript
// tools/cli/src/commands/
- analyze-deps.ts         // 依赖分析命令
- check-isolation.ts      // 隔离检查命令
```

#### Week 7: Widget 迁移第二波

**迁移目标**: `chart/echarts-line`, `chart/echarts-bar`

**迁移步骤**:
1. 添加共享依赖声明
2. 启用 Shadow DOM
3. 验证 echarts 在 Shadow DOM 中的运行
4. 处理 ResizeObserver 适配

**Week 5-7 交付物**:
- [ ] PR: iframe 容器实现
- [ ] PR: 依赖共享系统
- [ ] PR: echarts Widget 迁移
- [ ] 工具: 依赖分析 CLI

---

### 🟠 阶段 4: 工具与测试（第 8-9 周）

**目标**: 完善开发体验和测试基础设施

#### Week 8: 开发工具

**Day 1-3: Widget 独立开发服务器**
```typescript
// packages/thingsvis-widget-sdk/src/dev/
- WidgetDevServer.ts      // 开发服务器
- MockContext.ts          // 模拟上下文
- HotReload.ts            // 热更新
```

**Day 4-5: CLI 增强**
```bash
# 新增 CLI 命令
vis-cli widget:dev       # 启动独立开发服务器
vis-cli widget:test      # 运行 Widget 测试
vis-cli widget:analyze   # 分析依赖和隔离性
```

#### Week 9: 测试基础设施

**Day 1-3: 测试工具**
```typescript
// packages/thingsvis-widget-sdk/src/testing/
- WidgetTestHarness.ts    // 测试支架
- MockContextFactory.ts   // 上下文工厂
- assertions.ts           // 自定义断言
```

**Day 4-5: 隔离性测试**
```typescript
// 测试示例
// packages/thingsvis-widget-sdk/__tests__/isolation.test.ts
describe('Widget Isolation', () => {
  it('should not leak styles to other widgets', () => {});
  it('should not crash when sibling widget crashes', () => {});
  it('should not access unauthorized APIs', () => {});
});
```

**Week 8-9 交付物**:
- [ ] PR: 开发服务器
- [ ] PR: 测试基础设施
- [ ] 文档: 开发指南
- [ ] 文档: 测试最佳实践

---

## 迁移策略

### 渐进式迁移路径

```
Phase 1: 新 Widget 必须使用隔离架构
         ↓
Phase 2: 现有 Widget 逐步迁移（按优先级）
         ↓
Phase 3: 废弃非隔离 API
         ↓
Phase 4: 完全隔离架构
```

### Widget 迁移优先级

```
高优先级（第一阶段）:
├── indicator/number-card    ✓ defineWidget，简单
├── basic/switch             ✓ 简单交互
└── basic/table              ✓ 中等复杂度

中优先级（第二阶段）:
├── chart/echarts-line       ⚠ echarts 集成
├── chart/echarts-bar        ⚠ echarts 集成
├── chart/echarts-pie        ⚠ echarts 集成
└── chart/echarts-gauge      ⚠ echarts 集成

低优先级（第三阶段）:
├── basic/text               ⚠ 复杂交互（编辑模式）
├── basic/rectangle          ⚠ 基础形状
├── basic/circle             ⚠ 基础形状
├── basic/line               ⚠ 基础形状
└── chart/uplot-line         ⚠ uplot 集成

特殊处理:
└── media/video-player       🔴 需要 iframe 隔离
```

---

## 验证策略

### 每个阶段的验收标准

#### 阶段 1 验收
- [ ] Shadow DOM 正确创建（closed mode）
- [ ] Widget 样式不影响外部
- [ ] 外部样式不影响 Widget
- [ ] Error Boundary 捕获所有错误
- [ ] number-card 功能无损迁移

#### 阶段 2 验收
- [ ] MessageChannel 通信正常
- [ ] RPC 调用超时处理正确
- [ ] 事件系统无内存泄漏
- [ ] 现有功能 100% 回归通过

#### 阶段 3 验收
- [ ] iframe 容器正确加载 Widget
- [ ] CSP 策略阻止未授权操作
- [ ] 依赖共享减少包体积 >30%
- [ ] echarts Widget 性能无下降

#### 阶段 4 验收
- [ ] 独立开发服务器正常启动
- [ ] Widget 可独立测试
- [ ] 所有 Widget 有基础测试覆盖
- [ ] CI 包含隔离性检查

### 自动化测试策略

```yaml
# .github/workflows/isolation-check.yml
name: Isolation Check

on: [pull_request]

jobs:
  isolation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check CSS Leakage
        run: pnpm vis-cli widget:check-css --all
        
      - name: Check Dependency Isolation
        run: pnpm vis-cli widget:check-deps --all
        
      - name: Run Widget Isolation Tests
        run: pnpm test:isolation
        
      - name: Performance Regression
        run: pnpm benchmark:widget-render
```

---

## 风险管理

### 主要风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Shadow DOM 性能问题 | 中 | 高 | 基准测试，准备降级方案 |
| echarts 不兼容 Shadow DOM | 中 | 高 | 预研适配方案，准备 iframe 备选 |
| 迁移进度延迟 | 高 | 中 | 分阶段交付，MVP 优先 |
| 团队学习成本 | 中 | 低 | 培训，文档，示例代码 |
| 第三方 Widget 不兼容 | 低 | 高 | 向后兼容 API，渐进废弃 |

### 回滚策略

每个阶段都有明确的回滚点：

```
阶段 1 回滚 → 恢复 defineWidget 到无 Shadow DOM 版本
阶段 2 回滚 → 恢复旧的事件系统
阶段 3 回滚 → 禁用 iframe，回退到 Shadow DOM
阶段 4 回滚 → 移除新 CLI 命令
```

---

## 成功指标

### 技术指标

| 指标 | 当前值 | 目标值 | 测量方式 |
|------|--------|--------|----------|
| Widget 错误影响范围 | 整个画布 | 单个 Widget | 错误注入测试 |
| CSS 样式泄漏 | 有 | 0 | 自动化视觉回归 |
| 跨 Widget 直接依赖 | 存在 | 0 | 依赖分析工具 |
| Widget 独立测试覆盖率 | 0% | >80% | 测试报告 |
| 包体积（共享依赖后） | 100% | <70% | 构建分析 |

### 业务指标

| 指标 | 当前值 | 目标值 | 测量方式 |
|------|--------|--------|----------|
| 多人开发冲突频率 | 高 | 低 | 团队反馈 |
| 新 Widget 开发时间 | 基准 | -30% | 时间跟踪 |
| 线上 Widget 相关 Bug | 基准 | -50% | Bug 统计 |
| 第三方 Widget 集成时间 | 基准 | -40% | 时间跟踪 |

---

## 附录

### A. 术语表

- **Shadow DOM**: Web Components 提供的 DOM 封装机制
- **MessageChannel**: 浏览器标准 API，提供双向通信通道
- **CSP**: Content Security Policy，内容安全策略
- **Widget Container**: 承载 Widget 的隔离容器
- **RPC**: Remote Procedure Call，远程过程调用

### B. 参考文档

- [Shadow DOM MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [MessageChannel MDN](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel)
- [Iframe Sandbox MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox)
- [Module Federation](https://module-federation.io/)

### C. 相关 ADR

- ADR-001: Widget 隔离架构设计方案（本文档）
- ADR-002: 通信协议设计（待创建）
- ADR-003: 依赖共享策略（待创建）
