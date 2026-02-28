# 隔离设计快速开始

## 1. 立即执行的安全修复（10分钟）

### 修复 React 版本不一致

```bash
# 在 root package.json 中添加
npm pkg set pnpm.overrides.react="^18.2.0"
npm pkg set pnpm.overrides.react-dom="^18.2.0"

# 重新安装
rm -rf node_modules **/node_modules
pnpm install
```

### 修复 XSS 漏洞（innerHTML）

```bash
# 安装 DOMPurify
pnpm add dompurify
pnpm add -D @types/dompurify

# 替换所有 innerHTML
# 之前
el.innerHTML = userInput;

# 之后
import DOMPurify from 'dompurify';
el.innerHTML = DOMPurify.sanitize(userInput);
```

### 添加全局缓存限制

```typescript
// packages/thingsvis-kernel/src/loader/UniversalLoader.ts
import { LRUCache } from 'lru-cache';

private moduleCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60, // 1小时
});
```

## 2. 启用自动化检查

### 安装分析器

```bash
cd tools/isolation-analyzer
npm install
npm run build
```

### 运行检查

```bash
# 分析整个项目
npm run analyze -- --path ../../

# 仅检查安全问题
npm run analyze -- --path ../../ --security

# 自动修复（试运行）
npm run fix -- --path ../../ --dry-run

# 自动修复（正式）
npm run fix -- --path ../../
```

### 集成到 Git Hooks

```bash
# 安装 husky
pnpm add -D husky

# 添加 pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/bash
cd tools/isolation-analyzer
npm run analyze -- --path ../../ --security
if [ $? -ne 0 ]; then
  echo "❌ 安全检查失败，请修复后再提交"
  exit 1
fi
EOF

chmod +x .husky/pre-commit
```

## 3. 迁移现有 Widget

### 使用自动升级工具

```bash
# 升级单个 Widget
vis-cli widget:upgrade widgets/chart/echarts-line

# 批量升级所有 Widget
vis-cli widget:upgrade --all
```

### 手动迁移步骤

1. **添加 Shadow DOM**

```typescript
// 之前
export const Main = defineWidget({
  id: 'basic/text',
  render: (el, props, ctx) => {
    el.innerHTML = props.text;  // ❌ XSS 风险
  }
});

// 之后
export const Main = defineWidget({
  id: 'basic/text',
  isolation: 'shadow-dom',  // ✅ 添加隔离
  render: (el, props, ctx) => {
    const shadow = el.attachShadow({ mode: 'closed' });
    const div = document.createElement('div');
    div.textContent = props.text;  // ✅ 安全
    shadow.appendChild(div);
  }
});
```

2. **添加 Error Boundary**

```typescript
import { WidgetErrorBoundary } from '@thingsvis/widget-sdk';

render: (el, props, ctx) => {
  const container = document.createElement('div');
  
  // 使用 Error Boundary 包裹
  const safeRender = () => {
    try {
      // 渲染逻辑
    } catch (err) {
      container.innerHTML = '<div class="widget-error">渲染失败</div>';
    }
  };
  
  safeRender();
  return {
    update: safeRender,
    destroy: () => { /* 清理 */ }
  };
}
```

3. **迁移到 MessageChannel 通信**

```typescript
// 之前
ctx.emit('edit:start', data);

// 之后
import { createMessageBus } from '@thingsvis/widget-sdk';

const bus = createMessageBus(ctx.port);
bus.emit('widget:edit:start', data);
```

## 4. 验证隔离性

### 运行测试

```bash
# 单元测试
pnpm test

# 隔离性测试
pnpm test:isolation

# 端到端测试
pnpm test:e2e
```

### 手动验证

1. **样式隔离**
   - 打开浏览器 DevTools
   - 检查 Widget 是否在 Shadow DOM 中
   - 验证外部样式不影响 Widget

2. **错误隔离**
   - 故意在一个 Widget 中抛出错误
   - 验证其他 Widget 正常工作

3. **内存泄漏检测**
   - 打开 Chrome DevTools Memory 面板
   - 重复创建/删除 Widget
   - 验证内存不持续增长

## 5. 监控与维护

### 配置监控

```typescript
// apps/studio/src/main.tsx
import { IsolationMonitor } from '@thingsvis/kernel';

const monitor = new IsolationMonitor();
monitor.startMonitoring();
```

### 查看报告

```bash
# 生成完整报告
npm run analyze -- --output report.html --format html

# 打开报告
open report.html
```

### CI 集成

GitHub Actions 已配置，每次 PR 会自动：
1. 运行安全检查
2. 运行隔离检查
3. 生成报告
4. 阻止有严重问题的 PR 合并

## 常见问题

### Q: Shadow DOM 影响第三方库（如 ECharts）怎么办？

A: 有两种解决方案：

1. **适配层**（推荐）
```typescript
// 创建适配容器
const adapter = document.createElement('div');
document.body.appendChild(adapter); // 放 body 上绕过 Shadow DOM

// 渲染 ECharts
const chart = echarts.init(adapter);

// 同步尺寸
const ro = new ResizeObserver(() => {
  chart.resize();
});
ro.observe(el);
```

2. **降级到 iframe**（高风险组件）
```typescript
defineWidget({
  id: 'chart/heavy',
  isolation: 'iframe',  // 完全隔离
  permissions: ['eval'] // 允许 ECharts 使用 eval
});
```

### Q: 自动修复会破坏现有功能吗？

A: 所有自动修复都会：
1. 先运行测试
2. 生成 diff 供审查
3. 通过 CI 验证后才合并

建议先在测试环境验证。

### Q: 迁移成本有多高？

A: 根据我们的分析：
- **简单 Widget**（如 number-card）：15分钟
- **中等 Widget**（如 echarts-line）：2小时
- **复杂 Widget**（如 text 编辑器）：1天

平均每个 Widget 约 2-4 小时。

## 下一步

1. ✅ 完成本快速开始
2. 📖 阅读 [ADR-001: 隔离架构设计](./adr-001-widget-isolation-design.md)
3. 📖 阅读 [实施路线图](./isolation-implementation-roadmap.md)
4. 🔧 开始迁移优先级最高的 Widget
