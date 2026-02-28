# TaskLoop × Widget Creator 自动化集成方案

## 概述

本方案描述如何将隔离设计、TaskLoop 工作流和 Widget Creator 技能自动化结合，实现**问题的自动发现、修复和验证**。

## 架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         自动化流水线 (Automation Pipeline)                     │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
  │   代码提交    │────►│  智能分析     │────►│  自动修复     │────►│ 验证报告  │
  │  (git push)  │     │  (Analysis)  │     │  (Fix/Refactor)│    │ (Report) │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────┘
                              │                    │
                              ▼                    ▼
                    ┌──────────────────┐  ┌──────────────────┐
                    │  问题检测引擎     │  │   TaskLoop       │
                    │  - AST 分析       │  │   工作流调度      │
                    │  - 依赖扫描       │  │   - 拆分 MPE     │
                    │  - 安全审计       │  │   - DAG 构建     │
                    │  - 性能剖析       │  │   - 自动执行     │
                    └──────────────────┘  └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Widget Creator  │
                    │  技能触发        │
                    │  - 自动补全      │
                    │  - 代码生成      │
                    │  - 最佳实践检查  │
                    └──────────────────┘
```

## 1. 问题自动发现层

### 1.1 自动化分析触发器

```yaml
# .github/workflows/smart-analysis.yml
name: Smart Analysis

on:
  push:
    branches: [main, dev]
  pull_request:
    types: [opened, synchronize]
  # 定时全量扫描
  schedule:
    - cron: '0 2 * * 1'  # 每周一凌晨 2 点

jobs:
  analyze:
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Run Isolation Analyzer
        id: analyzer
        run: |
          npx @thingsvis/isolation-analyzer \
            --config .isolationrc.json \
            --output analysis-report.json
            
      - name: Trigger TaskLoop if Issues Found
        if: steps.analyzer.outputs.issue_count > 0
        run: |
          curl -X POST "${{ secrets.TASKLOOP_WEBHOOK }}" \
            -H "Content-Type: application/json" \
            -d @analysis-report.json
```

### 1.2 问题检测引擎实现

```typescript
// tools/isolation-analyzer/src/index.ts
import { IsolationAnalyzer } from './IsolationAnalyzer';
import { SecurityScanner } from './scanners/SecurityScanner';
import { PerformanceScanner } from './scanners/PerformanceScanner';
import { DependencyScanner } from './scanners/DependencyScanner';

const analyzer = new IsolationAnalyzer({
  scanners: [
    new SecurityScanner({
      rules: ['xss-innerHTML', 'eval-usage', 'prototype-pollution']
    }),
    new PerformanceScanner({
      rules: ['memory-leak', 'inefficient-rendering', 'large-bundle']
    }),
    new DependencyScanner({
      rules: ['version-mismatch', 'circular-dependency', 'missing-peer']
    }),
    new IsolationScanner({
      rules: ['shadow-dom-missing', 'error-boundary-missing', 'direct-store-access']
    })
  ]
});

const report = await analyzer.run('./thingsvis-internal');
console.log(JSON.stringify(report, null, 2));
```

### 1.3 检测规则定义

```typescript
// tools/isolation-analyzer/src/rules/index.ts
export const ISOLATION_RULES = {
  // 安全规则
  'xss-innerHTML': {
    severity: 'error',
    category: 'security',
    check: (node: ASTNode) => {
      return node.type === 'CallExpression' &&
        node.callee.property?.name === 'innerHTML' &&
        !hasSanitizer(node);
    },
    fix: 'replace-with-textContent-or-purify',
    autoFixable: true
  },
  
  // 性能规则
  'memory-leak-event-listener': {
    severity: 'warning',
    category: 'performance',
    check: (node: ASTNode, context: Context) => {
      const hasAddListener = findAddEventListener(node);
      const hasRemoveListener = findRemoveEventListener(context.destroyMethod);
      return hasAddListener && !hasRemoveListener;
    },
    fix: 'add-cleanup-in-destroy',
    autoFixable: true
  },
  
  // 隔离规则
  'missing-shadow-dom': {
    severity: 'error',
    category: 'isolation',
    check: (widget: WidgetConfig) => {
      return widget.isolation === undefined;
    },
    fix: 'add-shadow-dom-container',
    autoFixable: true
  },
  
  // 依赖规则
  'react-version-mismatch': {
    severity: 'error',
    category: 'dependency',
    check: (packages: PackageJSON[]) => {
      const versions = packages.map(p => p.dependencies?.react);
      return new Set(versions).size > 1;
    },
    fix: 'unify-react-version',
    autoFixable: true
  }
};
```

## 2. TaskLoop 自动化集成

### 2.1 自动任务拆分

当分析器发现问题后，自动生成 TaskLoop 任务：

```typescript
// tools/isolation-analyzer/src/TaskLoopIntegration.ts
export class TaskLoopIntegration {
  generateTasks(report: AnalysisReport): TaskLoopPayload {
    const tasks: MPE[] = [];
    
    for (const issue of report.issues) {
      if (issue.autoFixable) {
        tasks.push({
          id: `fix-${issue.id}`,
          type: 'auto-fix',
          description: `自动修复: ${issue.description}`,
          input: {
            filePath: issue.location.file,
            lineNumber: issue.location.line,
            fixType: issue.fix
          },
          config: {
            timeout: 60000,
            retryCount: 3
          },
          verification: {
            type: 'test',
            command: `npm test -- ${issue.location.file}`
          }
        });
      } else {
        tasks.push({
          id: `manual-${issue.id}`,
          type: 'manual-review',
          description: `需要人工审查: ${issue.description}`,
          assignee: this.findBestAssignee(issue),
          blocking: issue.severity === 'error'
        });
      }
    }
    
    // 构建 DAG
    const dag = this.buildDAG(tasks);
    
    return {
      project: 'thingsvis-isolation-fixes',
      acceptanceCriteria: [
        '所有 auto-fixable 问题已修复',
        '所有 manual-review 问题已分配',
        'CI 检查通过'
      ],
      tasks,
      dag
    };
  }
  
  private buildDAG(tasks: MPE[]): DAG {
    const dag = new DAG();
    
    // 安全修复优先
    const securityTasks = tasks.filter(t => t.category === 'security');
    const otherTasks = tasks.filter(t => t.category !== 'security');
    
    // 安全修复必须在其他修复之前
    for (const task of otherTasks) {
      for (const secTask of securityTasks) {
        dag.addEdge(secTask.id, task.id);
      }
    }
    
    // 依赖关系：widget 修复依赖 SDK 修复
    const sdkTasks = tasks.filter(t => t.filePath?.includes('widget-sdk'));
    const widgetTasks = tasks.filter(t => t.filePath?.includes('widgets/'));
    
    for (const widgetTask of widgetTasks) {
      for (const sdkTask of sdkTasks) {
        dag.addEdge(sdkTask.id, widgetTask.id);
      }
    }
    
    return dag;
  }
}
```

### 2.2 TaskLoop 状态块自动生成

每个修复任务自动附加 TaskLoop 状态块：

```markdown
<!-- iteration-log.md 自动追加 -->
## Sub-task N: 修复 XSS 漏洞 (widgets/chart/echarts-line)
- **What was done**: 将 innerHTML 替换为 DOMPurify.sanitize()
- **What was tried & failed**: 尝试用 textContent，但需要保留 HTML 标签
- **What succeeded**: DOMPurify 方案通过所有测试
- **How it was tested**: 
  - 单元测试: `npm test -- XSSSanitizer.test.ts` ✅
  - 集成测试: 输入恶意 payload，验证被过滤 ✅
  - 安全扫描: `npm run security:audit` ✅
- **Key decisions & rationale**: 
  - 选择 DOMPurify 而非 textContent，因为需要支持富文本
  - 在 SDK 层统一处理，而非每个 Widget 自己处理
- **Time/Iteration count**: 2 次迭代（第一次遗漏了属性检查）

<taskloop_status>
  <phase>EXECUTION</phase>
  <current_task>XSS 漏洞修复</current_task>
  <progress>Task 3 of 15</progress>
  <docs_updated>iteration-log.md, project-context.md</docs_updated>
  <confidence_score>9</confidence_score>
</taskloop_status>
```

## 3. Widget Creator 技能集成

### 3.1 自动 Widget 修复

```typescript
// 当检测到 Widget 不符合隔离规范时，自动触发 Widget Creator
// .agents/skills/thingsvis-widget-creator/SKILL.md 扩展

{
  "name": "isolation-fix",
  "description": "自动修复 Widget 隔离问题",
  "trigger": {
    "type": "analyzer-issue",
    "conditions": ["category:isolation", "autoFixable:true"]
  },
  "actions": [
    {
      "type": "add-shadow-dom",
      "condition": "rule:missing-shadow-dom",
      "template": "shadow-dom-container.ts"
    },
    {
      "type": "add-error-boundary",
      "condition": "rule:missing-error-boundary",
      "template": "error-boundary-wrapper.tsx"
    },
    {
      "type": "refactor-defineWidget",
      "condition": "rule:manual-widget-implementation",
      "transform": "convert-to-defineWidget"
    }
  ]
}
```

### 3.2 Widget 模板自动升级

```typescript
// tools/cli/src/commands/upgrade-widget.ts
export class WidgetUpgrader {
  async upgrade(widgetPath: string, targetVersion: string) {
    const widget = await this.loadWidget(widgetPath);
    
    // 检查当前合规性
    const compliance = await this.checkCompliance(widget);
    
    // 自动应用修复
    for (const issue of compliance.issues) {
      if (issue.fixable) {
        await this.applyFix(widget, issue);
      } else {
        // 触发 Widget Creator 人工审查
        await this.requestCreatorReview(widget, issue);
      }
    }
    
    // 更新 package.json
    await this.updatePackageJson(widget, targetVersion);
    
    // 生成迁移报告
    return this.generateReport(widget, compliance);
  }
  
  private async applyFix(widget: Widget, issue: ComplianceIssue) {
    switch (issue.type) {
      case 'missing-shadow-dom':
        await this.addShadowDOM(widget);
        break;
      case 'missing-error-boundary':
        await this.wrapWithErrorBoundary(widget);
        break;
      case 'direct-store-access':
        await this.refactorToMessageChannel(widget);
        break;
      case 'memory-leak':
        await this.addCleanupLogic(widget);
        break;
    }
  }
}
```

### 3.3 智能代码补全

```typescript
// VS Code 扩展或 IDE 集成
// 当开发者编写 Widget 时，实时检测并提供修复建议

// 示例：开发者输入
render: (el, props, ctx) => {
  el.innerHTML = props.content;  // ← 实时检测到 XSS 风险
}

// IDE 提示
// ⚠️ 安全风险: 使用 innerHTML 可能导致 XSS
// 快速修复:
// [ ] 替换为 DOMPurify.sanitize()
// [ ] 替换为 textContent
// [ ] 查看安全文档
```

## 4. 持续监控与反馈

### 4.1 运行时监控

```typescript
// packages/thingsvis-kernel/src/monitoring/IsolationMonitor.ts
export class IsolationMonitor {
  private metrics: IsolationMetrics = {
    widgetErrors: new Map(),
    memoryUsage: new Map(),
    renderTime: new Map()
  };
  
  startMonitoring() {
    // 监控 Widget 错误
    window.addEventListener('error', (e) => {
      const widgetId = this.extractWidgetId(e);
      if (widgetId) {
        this.metrics.widgetErrors.set(widgetId, {
          error: e.message,
          timestamp: Date.now(),
          stack: e.error?.stack
        });
        
        // 自动上报
        this.reportViolation({
          type: 'widget-crash',
          widgetId,
          error: e.message
        });
      }
    });
    
    // 监控内存使用
    setInterval(() => {
      for (const [widgetId, instance] of this.activeWidgets) {
        const usage = this.measureMemory(instance);
        this.metrics.memoryUsage.set(widgetId, usage);
        
        // 内存泄漏检测
        if (this.detectMemoryLeak(widgetId, usage)) {
          this.reportViolation({
            type: 'memory-leak',
            widgetId,
            usage
          });
        }
      }
    }, 30000);
  }
  
  private reportViolation(violation: Violation) {
    // 发送到分析平台
    fetch('/api/monitoring/violations', {
      method: 'POST',
      body: JSON.stringify(violation)
    });
    
    // 严重问题触发自动修复任务
    if (violation.type === 'widget-crash') {
      this.triggerAutoFix(violation);
    }
  }
}
```

### 4.2 修复效果度量

```typescript
// tools/isolation-analyzer/src/metrics/IsolationMetrics.ts
export class IsolationMetrics {
  // 生成修复前后对比报告
  async generateComparisonReport(
    before: AnalysisReport,
    after: AnalysisReport
  ): Promise<ComparisonReport> {
    return {
      security: {
        before: before.securityIssues.length,
        after: after.securityIssues.length,
        improvement: this.calculateImprovement(before, after, 'security')
      },
      performance: {
        before: before.performanceIssues.length,
        after: after.performanceIssues.length,
        improvement: this.calculateImprovement(before, after, 'performance')
      },
      isolation: {
        before: before.isolationIssues.length,
        after: after.isolationIssues.length,
        improvement: this.calculateImprovement(before, after, 'isolation')
      },
      overallScore: this.calculateOverallScore(after)
    };
  }
}
```

## 5. 实施步骤

### 阶段 1: 基础设施（2 周）

```bash
# 1. 创建分析器包
mkdir -p tools/isolation-analyzer
npm init -y
npm install @typescript-eslint/parser @typescript-eslint/traverse

# 2. 集成到 CI
# .github/workflows/smart-analysis.yml

# 3. 配置规则集
# .isolationrc.json
{
  "rules": {
    "security": "error",
    "performance": "warning",
    "isolation": "error"
  },
  "autoFix": {
    "enabled": true,
    "maxPerRun": 10
  }
}
```

### 阶段 2: TaskLoop 集成（1 周）

```bash
# 1. 创建 Webhook 服务
# apps/server/src/routes/taskloop-webhook.ts

# 2. 配置自动任务生成
# tools/isolation-analyzer/src/TaskLoopIntegration.ts

# 3. 测试集成
npm run test:taskloop-integration
```

### 阶段 3: Widget Creator 增强（2 周）

```bash
# 1. 扩展 Widget Creator 技能
# .agents/skills/thingsvis-widget-creator/isolation-rules/

# 2. 创建修复模板
# tools/cli/templates/isolation-fixes/

# 3. 集成到 CLI
vis-cli widget:check --fix
vis-cli widget:upgrade --to-isolation-v2
```

### 阶段 4: 监控部署（1 周）

```bash
# 1. 部署监控服务
# packages/thingsvis-kernel/src/monitoring/

# 2. 配置告警
# .github/workflows/isolation-alert.yml

# 3. 上线验证
npm run isolation:validate
```

## 6. 预期效果

| 指标 | 当前 | 目标（3个月后） | 自动化方式 |
|------|------|----------------|-----------|
| XSS 漏洞 | 多个 | 0 | 静态分析 + 自动修复 |
| 内存泄漏 | 多处 | <3 | 运行时监控 + 自动检测 |
| 隔离合规率 | 0% | 100% | 自动修复 + 强制检查 |
| Widget 崩溃影响 | 整个画布 | 单个 Widget | Error Boundary |
| 新 Widget 开发时间 | 2天 | 4小时 | 模板 + 代码生成 |

## 附录

### A. 触发条件矩阵

| 场景 | 检测方式 | 自动修复 | 人工审查 |
|------|---------|---------|---------|
| innerHTML 使用 | AST 分析 | ✅ | |
| React 版本不一致 | package.json 扫描 | ✅ | |
| 缺少 Shadow DOM | Widget 元数据检查 | ✅ | |
| 复杂竞态条件 | 动态分析 | | ✅ |
| 架构级重构 | 依赖图分析 | | ✅ |

### B. 自动化级别

- **L1 - 检测**: 发现问题，报告给人
- **L2 - 建议**: 提供修复建议，人确认后应用
- **L3 - 自动修复**: 自动应用修复，人审查 PR
- **L4 - 全自动**: 自动修复、验证、合并

当前目标: L3（大部分问题），L2（复杂问题）
