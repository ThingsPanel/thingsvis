# 📦 隔离架构设计方案 - 移交清单

**移交日期**: 2026-02-28  
**移交人**: Kimi Code  
**接收人**: [同事姓名]  
**项目**: ThingsVis Widget 隔离架构改造

---

## 📂 交付物清单

### 1. 架构设计文档（5个）

| 文件 | 路径 | 内容概述 | 优先级 |
|------|------|----------|--------|
| ADR-001 隔离架构设计 | `docs/architecture/adr-001-widget-isolation-design.md` | 三层隔离模型、Shadow DOM、iframe、通信协议 | P0 |
| ADR-002 安全与稳定性 | `docs/architecture/adr-002-critical-security-and-safety-issues.md` | XSS、代码注入、内存泄漏等 P0 问题 | P0 |
| 实施路线图 | `docs/architecture/isolation-implementation-roadmap.md` | 9周分阶段实施计划 | P1 |
| 自动化集成方案 | `docs/architecture/automation-integration-spec.md` | TaskLoop + Widget Creator 结合方案 | P2 |
| 快速开始指南 | `docs/architecture/ISOLATION-QUICKSTART.md` | 10分钟快速上手 | P0 |

### 2. 自动化工具（7个文件）

| 文件 | 路径 | 用途 | 状态 |
|------|------|------|------|
| package.json | `tools/isolation-analyzer/package.json` | 分析器包配置 | ✅ 完整 |
| tsconfig.json | `tools/isolation-analyzer/tsconfig.json` | TypeScript 配置 | ✅ 完整 |
| CLI 入口 | `tools/isolation-analyzer/src/index.ts` | 命令行入口 | ✅ 完整 |
| 分析器核心 | `tools/isolation-analyzer/src/IsolationAnalyzer.ts` | 主分析逻辑 | ✅ 完整 |
| 修复引擎 | `tools/isolation-analyzer/src/FixEngine.ts` | 自动修复 | ✅ 完整 |
| 安全扫描器 | `tools/isolation-analyzer/src/scanners/SecurityScanner.ts` | XSS、代码注入检测 | ✅ 完整 |
| 性能扫描器 | `tools/isolation-analyzer/src/scanners/PerformanceScanner.ts` | 性能问题检测 | ✅ 完整 |
| 隔离扫描器 | `tools/isolation-analyzer/src/scanners/IsolationScanner.ts` | 隔离合规检测 | ✅ 完整 |
| 依赖扫描器 | `tools/isolation-analyzer/src/scanners/DependencyScanner.ts` | 版本一致性检测 | ✅ 完整 |

### 3. CI/CD 配置（2个文件）

| 文件 | 路径 | 用途 | 状态 |
|------|------|------|------|
| CI 工作流 | `.github/workflows/isolation-check.yml` | PR 自动检查 | ✅ 完整 |
| 配置文件 | `.isolationrc.json` | 分析器规则配置 | ✅ 完整 |

### 4. 项目上下文更新

| 文件 | 路径 | 更新内容 |
|------|------|----------|
| 项目上下文 | `project-context.md` | 新增 Isolation Architecture 章节 |

---

## 🚀 快速开始（接收后立即执行）

### 步骤 1: 查看核心问题（5分钟）

```bash
# 阅读最关键的问题补充文档
cat docs/architecture/adr-002-critical-security-and-safety-issues.md
```

**关键发现**（必须由同事了解）：
1. **XSS 漏洞** - `innerHTML` 多处使用未过滤
2. **React 版本不一致** - server 用 19，其他用 18.2
3. **全局缓存无过期** - UniversalLoader 内存泄漏
4. **表达式求值无沙箱** - 可执行任意代码

### 步骤 2: 运行分析器（5分钟）

```bash
cd tools/isolation-analyzer
npm install
npm run build

# 分析整个项目
npm run analyze -- --path ../../ --security

# 查看报告
cat isolation-report.json
```

### 步骤 3: 立即修复 P0 问题（10分钟）

```bash
# 1. 修复 React 版本不一致
# 在 root package.json 添加 pnpm.overrides

# 2. 试运行自动修复
npm run fix -- --path ../../ --dry-run

# 3. 确认无误后正式修复
npm run fix -- --path ../../ --category security --max 5
```

---

## 📋 任务分解（由同事接手）

### Phase 1: 紧急修复（本周）

- [ ] **修复 React 版本不一致** (ADR-002 第3条)
  - 修改 root package.json pnpm.overrides
  - 重新安装依赖
  - 验证 `npm ls react` 输出一致

- [ ] **修复 XSS 漏洞** (ADR-002 第1条)
  - 安装 DOMPurify: `pnpm add dompurify`
  - 全局替换未受保护的 innerHTML
  - 文件列表见 ADR-002

- [ ] **添加全局缓存限制** (ADR-002 第4条)
  - 修改 `packages/thingsvis-kernel/src/loader/UniversalLoader.ts`
  - 使用 LRUCache 替换普通 Map

- [ ] **修复表达式沙箱** (ADR-002 第2条)
  - 评估使用 filtrex 或 JSONPath 替换 new Function

### Phase 2: 基础隔离（第2-3周）

- [ ] **实现 Shadow DOM 容器**
  - 参考 ADR-001 2.2 节代码
  - 添加到 `@thingsvis/widget-sdk`

- [ ] **添加 Widget Error Boundary**
  - 参考 ADR-001 4.1 节代码
  - 确保所有 Widget 被包裹

- [ ] **冻结 Widget Context**
  - 在 defineWidget 中使用 Object.freeze + Proxy
  - 防止 ctx 被修改

- [ ] **迁移第一个 Widget** (number-card)
  - 作为示例给其他开发者参考

### Phase 3: 通信隔离（第4-5周）

- [ ] **实现 MessageChannel 协议**
  - 参考 ADR-001 第3节
  - 替换现有的 emit 机制

- [ ] **迁移事件系统**
  - VisualEngine.ts 中的 emit 逻辑
  - widgetRenderer.ts 中的 emit 逻辑

### Phase 4: 高级隔离（第6-8周）

- [ ] **实现 iframe 容器**
  - 用于高风险 Widget (video-player)

- [ ] **实现依赖共享管理器**
  - 减少包体积
  - 版本冲突检测

- [ ] **完成所有 Widget 迁移**
  - 按照路线图优先级

### Phase 5: 工具与测试（第9周）

- [ ] **完成分析器开发**
  - 补全所有扫描器规则
  - 添加更多自动修复规则

- [ ] **添加 WidgetTestHarness**
  - 测试基础设施

- [ ] **CI 集成验证**
  - 确保 GitHub Actions 正常工作

---

## 🔍 关键文件位置

### 需要修改的源代码文件

| 文件 | 路径 | 修改内容 | 优先级 |
|------|------|----------|--------|
| UniversalLoader.ts | `packages/thingsvis-kernel/src/loader/` | 添加 LRU 缓存 | P0 |
| VisualEngine.ts | `packages/thingsvis-ui/src/engine/` | innerHTML 过滤、错误边界 | P0 |
| define-widget.ts | `packages/thingsvis-widget-sdk/src/` | 冻结 ctx、添加 Shadow DOM | P1 |
| package.json (root) | `./` | 统一 React 版本 | P0 |
| text/index.ts | `widgets/basic/text/src/` | XSS 修复 | P0 |
| echarts-line/index.ts | `widgets/chart/echarts-line/src/` | ResizeObserver 清理 | P1 |

---

## ⚠️ 已知限制与风险

### 分析器限制

1. **无法检测复杂的数据流问题**
   - 需要人工审查异步竞态条件
   - 需要人工确认状态管理合理性

2. **自动修复范围**
   - 仅支持简单替换（innerHTML → DOMPurify）
   - 复杂的架构重构需要人工处理

3. **误报可能性**
   - 某些 innerHTML 使用可能是安全的（纯内部生成）
   - 需要人工审查确认

### 实施风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Shadow DOM 影响第三方库 | 高 | 准备 iframe 降级方案 |
| 迁移过程引入新 Bug | 中 | 每个 Widget 迁移后完整测试 |
| 性能下降 | 低 | 基准测试对比 |
| 团队学习成本 | 低 | 培训文档 + 示例代码 |

---

## 📞 需要支持时

### 内部资源

1. **架构问题**: 参考 ADR-001 文档
2. **安全问题**: 参考 ADR-002 文档
3. **实施顺序**: 参考路线图文档
4. **快速修复**: 参考 QUICKSTART 文档

### 外部参考

- [Shadow DOM MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [Module Federation](https://module-federation.io/)
- [DOMPurify](https://github.com/cure53/DOMPurify)

---

## ✅ 移交检查清单

接收人请确认：

- [ ] 已阅读 HANDOVER.md
- [ ] 已阅读 ADR-001、ADR-002
- [ ] 已成功运行分析器
- [ ] 已了解 P0 问题清单
- [ ] 已明确 Phase 1 任务
- [ ] 有访问所有相关文件的权限
- [ ] 知道如何联系移交人（如有疑问）

---

**移交完成确认**

| 项目 | 移交人确认 | 接收人确认 | 日期 |
|------|-----------|-----------|------|
| 文档完整性 | ✅ | ⬜ | 2026-02-28 |
| 代码可运行 | ✅ | ⬜ | 2026-02-28 |
| 任务清晰 | ✅ | ⬜ | 2026-02-28 |

**备注**: 如有任何问题，请随时联系。
