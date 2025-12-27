# 基于AI SDD多人协同开发说明文档

## 1. 执行摘要：重构软件工程的“无人驾驶”闭环

本体系借鉴了**Google Critique**的自动化评审机制 1、**Meta TestGen-LLM**的测试生成过滤漏斗 3 以及**Microsoft Copilot Workspace**的代理工作流 5，提出了一种基于“多智能体协作”（Multi-Agent Collaboration）的研发架构。

本报告将详细阐述如何通过**GitHub Spec + Kit**模式实现架构与实现的解耦，如何利用**LLM-as-a-Judge**技术构建能够自我进化的代码审查系统，以及如何搭建具备**自我修复（Self-Healing）**能力的CI/CD流水线，从而实现从需求文档到生产部署的无缝闭环。

------

## 2. 第一阶段：基础设施与上下文工程（The Foundation）

AI参与开发的深度取决于上下文的质量。大多数AI开发项目的失败，归根结底是因为AI缺乏对项目全貌的理解，导致生成了孤立的、无法集成的代码片段。在启动任何开发之前，必须构建一套能够被AI理解的“数字宪法”。

### 2.1 上下文即代码（Context as Code）：AI协作的基石

在传统多人协作中，隐性知识流转于Slack对话、口头会议和零散的Wiki中。对于AI Agent而言，这些不可见的上下文等同于不存在。为了实现多人与多Agent的混合协作，所有的隐性知识必须显性化为结构化的配置文件。这不仅是文档，更是AI的运行内存。

我们定义了三个层级的上下文文件，它们构成了AI开发的“长期记忆”与“短期记忆”：

| **上下文层级** | **文件名/位置**          | **功能描述**                                               | **对应大厂实践**      |
| -------------- | ------------------------ | ---------------------------------------------------------- | --------------------- |
| **宪法层**     | `.cursorrules`           | 定义全局编码规范、技术栈限制、提交格式。                   | Google Style Guides   |
| **项目层**     | `docs/project_config.md` | 定义架构模式（如Clean Architecture）、目录结构、核心依赖。 | Google Design Docs 7  |
| **状态层**     | `workflow_state.md`      | 记录当前任务进度、AI的思考链（CoT）、上下文暂存区。        | Cursor Agent Memory 8 |



#### 2.1.1 深度解析 `.cursorrules`：AI的行为准则

`.cursorrules` 不仅仅是一个Prompt，它应当被视为项目的“静态分析配置”。它决定了AI生成的代码是否符合团队标准。一个工业级的配置必须包含对“幻觉”的抑制和对“安全”的强制要求。

在实践中，我们发现有效的规则文件包含以下关键指令：

1. **上下文优先原则**：强制AI在生成代码前，必须先读取 `project_config.md`。这解决了AI在长对话中遗忘项目架构的问题 9。
2. **依赖管理红线**：严禁AI引入未在 `package.json` 中声明的第三方库。AI倾向于为了解决一个小问题而引入一个巨大的库（如lodash），这在生产环境中是不可接受的 10。
3. **测试驱动开发（TDD）强制**：要求AI在编写实现代码之前，必须先生成测试文件。这不仅提高了代码质量，也为后续的“自我修复”提供了基准 8。

#### 2.1.2 `workflow_state.md`：多智能体协作的同步原语

在多人/多Agent协作中，最大的挑战是“状态同步”。当Agent A完成了API定义，Agent B如何知道可以开始写前端了？`workflow_state.md` 充当了异步通信的黑板。

该文件应当包含一个动态更新的 `Current Phase` 字段（如：PLANNING, CODING, REVIEWING）和一个 `Context Scratchpad`（上下文暂存区）。当Agent A完成工作后，它会将关键决策（如“决定使用JWT而不是Session”）写入暂存区，Agent B读取后即可无缝接手，无需重复推理 8。

### 2.2 预备文档体系：Spec-Driven Development (SDD)

为了让AI开发形成闭环，必须改变“先写代码后补文档”的陋习。AI时代的核心方法论是**Spec-Driven Development**（规格驱动开发）。

#### 2.2.1 这里的 "Spec" 是什么？

Spec不是模糊的Word文档，而是机器可读的契约。

- **API Spec**: OpenAPI (Swagger) 3.0 YAML文件。这是前后端协作的唯一真理。
- **Database Spec**: Mermaid 格式的ER图或 Prisma Schema。
- **UI Spec**: 包含组件层级和状态定义的JSON文件。

通过维护这些Spec文件，我们将软件工程从“命令式”（告诉AI怎么写代码）转变为“声明式”（告诉AI我们要什么结果）。AI Architect Agent的职责就是生成这些Spec，并由人类Tech Lead进行审核 7。

------

## 3. 第二阶段：架构设计与规格定义（The Architecture Phase）

此阶段是“最牛逼流程”的大脑。我们将引入 **GitHub Spec + Kit** 模式，结合 **AI Architect Agent**，实现从自然语言需求到工程骨架的自动化转换。

### 3.1 智能规格生成：AI Architect Agent 的工作流

这一步模仿了Google的工程文化，即在写任何代码之前，必须有一份经过评审的 Design Doc 7。

1. **需求输入**：用户在 Issue 或 Markdown 中描述业务需求（如“实现一个支持RBAC权限管理的后台用户模块”）。
2. **反向质询（Critique Mode）**：AI Architect（建议使用 Claude 3.5 Sonnet 或 GPT-4-Turbo）不应立即生成方案，而是进入“质询模式”。
   - *AI*: “由于您提到了RBAC，请确认：我们需要支持动态权限分配吗？是否需要行级安全（Row-Level Security）？用户规模预估是多少？”
   - 这种交互式对话确保了需求的完整性，避免了后期的返工 6。
3. **Spec 生成**：确认需求后，AI生成两份关键文档：
   - `docs/specs/user_module_tdd.md`（技术设计文档）：包含系统边界、时序图（Mermaid）、边缘情况分析。
   - `src/api/openapi.yaml`（接口契约）：精确定义API路径、请求体类型、错误码。

### 3.2 GitHub Spec + Kit：多人协作的解耦神器

为了支持多人（或多Agent）并行开发，我们采用 **Spec + Kit** 模式。这一模式解决了“前端等后端接口”的经典瓶颈。

- **Spec (Source of Truth)**: 即上述生成的 `openapi.yaml`。
- **Kit (The Bridge)**: 这是一个自动生成的SDK包。
  - 当 Spec 更新并合并到主分支时，GitHub Actions 触发 `openapi-generator` 或 AI 脚本。
  - 自动生成 TypeScript 类型的定义（`types.ts`）、API Client 代码（`api.ts`）以及 **Mock Server** 的数据。
  - 这个 Kit 被打包发布（或作为 Monorepo 的包），供前端 Agent 和 后端 Agent 同时引用。

**协作闭环的形成**：

- **Backend Agent** 的任务：实现代码，使其行为符合 Spec 的定义。
- **Frontend Agent** 的任务：直接调用 Kit 中的 API Client 进行 UI 开发，使用 Mock 数据进行预览。
- **结果**：由于双方基于同一份 Spec，联调时的成功率接近 100%，极大地减少了沟通成本。

------

## 4. 第三阶段：多智能体开发与执行（The Execution Phase）

进入编码阶段，我们不再追求“一键生成整个App”，而是追求**可控的、分步的、可验证的**执行流程。这需要结合 **Cursor Composer** 或 **GitHub Copilot Workspace** 的 Agent 模式。

### 4.1 核心循环：Plan-Execute-Verify

为了防止AI“写飞了”（产生大量不可用的代码），我们强制执行一个微观的闭环流程。

#### 4.1.1 规划（Plan）

Agent 读取 `project_config.md` 和 Spec，在 `workflow_state.md` 中生成详细的实施计划（Step-by-step Plan）。

- *Plan Item 1*: 创建数据库 Migration 文件。
- *Plan Item 2*: 生成 ORM 模型代码。
- *Plan Item 3*: 实现 Service 层逻辑。
- 此计划必须经过人类或高级 Agent 的确认（Approve）才能继续 8。

#### 4.1.2 执行（Execute）与工具链集成

Agent 在此阶段不仅仅是生成文本，它必须具备**使用工具**的能力 11。

- **文件操作**：Agent 可以创建、读取、修改文件。
- **终端操作**：Agent 可以运行 `ls` 查看目录结构，运行 `npm install` 安装 Spec 中定义的依赖。
- **AST 分析**：高级 Agent 会使用 Tree-sitter 等工具分析现有的代码抽象语法树（AST），确保新生成的代码引用了正确的类和函数，而不是凭空捏造 13。

#### 4.1.3 即时验证（Micro-Verification）

这是区别于传统 Copilot 的关键点。Agent 每完成一个小的步骤（如写完一个函数），必须**立即**编写一个微型测试并运行它。

- *Agent Action*: 运行 `npm test specific_file.test.ts`。
- *Feedback*: 如果失败，Agent 读取 Stderr，分析错误，自我修正代码，直到测试通过。
- 这个微循环确保了提交到代码库的每一行代码都是“可编译、可运行”的 14。

------

## 5. 第四阶段：全自动闭环验证与自我修复（The Verification & Closed Loop）

这是用户最关心的“第三阶段”，也是目前大多数 AI 流程中最薄弱的环节。通常，AI 生成的代码包含微妙的 Bug（逻辑错误、安全漏洞、性能陷阱）。为了构建“最牛逼”的流程，我们必须引入**对抗性审查（Adversarial Review）**和**自我修复（Self-Healing）**机制。

### 5.1 架构设计：漏斗式验证体系

我们将验证过程设计为一个多层漏斗，每一层都由专门的 AI Agent 守卫。

1. **L1: 语法与静态分析** (Syntactic & Static Analysis)
2. **L2: 自动化测试生成与过滤** (Test Generation & Filtering) - **复刻 Meta TestGen-LLM**
3. **L3: 智能代码审查** (AI Code Review) - **复刻 Google Critique**
4. **L4: 自我修复流水线** (Self-Healing Pipeline) - **Wolverine 模式**

### 5.2 深度复刻 Meta TestGen-LLM：测试生成的工业级闭环

Meta 的研究表明，直接让 AI 写测试，生成的测试往往是“无效的”（Flaky）或“无用的”（不增加覆盖率）。TestGen-LLM 引入了一个严格的过滤机制 3。我们将此机制工程化如下：

#### 5.2.1 工作流详述

- **生成器（Generator Agent）**：
  - **输入**：变更的代码片段 + 现有的测试上下文。
  - **指令**：生成 5 个候选单元测试，覆盖特定的边缘情况（Edge Cases）。
- **过滤器（The Filter）**——这是核心：
  - **步骤 1：编译检查**。尝试运行生成的测试。如果编译失败或运行报错，直接丢弃（不修，因为成本比重生成高）。
  - **步骤 2：覆盖率验证**。运行 `Coverage` 工具。如果新测试没有覆盖任何**新**的代码行或分支，丢弃。只有增加了覆盖率的测试才有价值 16。
  - **步骤 3：稳定性检查**。连续运行新测试 5 次。如果结果不一致（Flaky），丢弃。
- **结果**：只有通过所有过滤器的测试才会被合并到代码库。这保证了测试套件的“高信噪比”。

#### 5.2.2 变异测试（Mutation Testing）增强

为了防止 AI 写出“永远通过”的假测试（Assertion Roulette），我们可以引入变异测试（如 Meta 的 SapFix 13）。

- **机制**：系统故意修改业务代码（如将 `a > 0` 改为 `a >= 0`）。
- **验证**：如果 AI 生成的测试依然通过，说明测试无效（没有捕捉到逻辑变化）。系统将驳回该测试，要求 AI 重写断言。

### 5.3 深度复刻 Google Critique：LLM-as-a-Judge 审查闭环

Google 的 Critique 系统强调代码审查是知识共享和质量把控的关键 1。我们构建一个 **Reviewer Agent** 来模拟这一过程。

#### 5.3.1 角色设定与 Rubrics（评分标准）

Reviewer Agent 不应只是说“LGTM”（Looks Good To Me），它必须像一个苛刻的资深工程师。我们需要定义结构化的评分标准（Rubrics）17：

| **维度**     | **审查点**                                             | **严重等级**            |
| ------------ | ------------------------------------------------------ | ----------------------- |
| **安全性**   | SQL注入、XSS、硬编码密钥、越权访问风险。               | **BLOCKER** (阻止合并)  |
| **正确性**   | 是否符合 Spec 定义？是否有并发竞争？错误处理是否完整？ | **CRITICAL** (必须修复) |
| **可维护性** | 命名规范、函数长度、代码重复率（DRY）、注释质量。      | **NITPICK** (建议修改)  |
| **性能**     | 循环中的数据库查询（N+1问题）、不必要的内存分配。      | **MAJOR**               |

#### 5.3.2 自动化审查工作流

1. **触发**：GitHub Pull Request 创建。
2. **分析**：Agent 读取 Git Diff，结合 `project_config.md`（架构规范）。
3. **推理（Chain of Thought）**：
   - *Thought*: "这段代码直接拼接了 SQL 字符串，虽然使用了 ORM 的 raw 方法，但未参数化。根据安全规范，这属于高危漏洞。"
4. **执行**：
   - 对于 **BLOCKER/CRITICAL**：AI 在 PR 中发表评论，标记“Request Changes”，并提供具体的修复代码建议。
   - 对于 **NITPICK**：AI 可以直接创建一个后续的 commit 来修复格式问题（Auto-fix），减少人类琐碎操作。
   - **Google 实践借鉴**：支持“Chained CLs”（链式变更）的审查，确保原子性提交 1。

### 5.4 自我修复（Self-Healing）CI/CD 流水线

这是闭环的最后一道防线。当代码合并后，CI/CD 流水线可能会因为环境问题或集成问题失败。我们不需要人类半夜起来看日志，AI 应当尝试自我修复 18。

#### 5.4.1 架构设计：Wolverine 模式

- **监控**：GitHub Actions 的 `on: failure` 钩子被触发。
- **诊断**：**Healer Agent** 被唤醒。
  - API 调用：获取 Workflow Run 的日志。
  - 分析：Agent 解析日志，提取错误堆栈（Stack Trace）和报错信息（如 `ModuleNotFound`, `TimeoutError`）。
  - 定位：Agent 映射错误到具体的源码文件和行号。
- **修复**：
  - Agent 根据错误原因生成 Patch（补丁代码）。
  - *Case 1*: 依赖缺失 -> 运行 `npm install <package>` 并更新 `package.json`。
  - *Case 2*: 类型错误 -> 修改 TypeScript 接口定义。
  - *Case 3*: 测试超时 -> 增加 Timeout 设置或优化查询。
- **验证**：Agent 提交 Patch 到分支，自动重新触发 CI。
- **循环控制**：设置最大重试次数（如 3 次），防止死循环。

#### 5.4.2 GitHub Actions 配置示例（Self-Healing）

YAML

```
name: Self-Healing CI Pipeline
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Run Tests
        id: run_tests
        run: npm test > test_output.log 2>&1
        continue-on-error: true  # 关键：即使失败也不立即终止，以便进入修复流程

      - name: AI Healer Agent
        if: steps.run_tests.outcome == 'failure'
        uses: custom/ai-healer-action@v1
        with:
          api_key: ${{ secrets.OPENAI_API_KEY }}
          error_log_path: test_output.log
          source_code_path:./src
          max_retries: 3
```

18

------

## 6. 第五阶段：验收与反馈闭环（The Acceptance & Feedback）

代码跑通了不代表产品做对了。最后一个环节是**验收测试（UAT）**的自动化与文档的同步更新。

### 6.1 视觉验收闭环

对于前端项目，代码正确不代表 UI 没有崩坏。

- **AI 视觉测试**：在 CI 阶段，使用 Playwright 对关键页面截图。
- **Vision Agent**：将截图发送给 GPT-4o（具备视觉能力）。
- **比对**：Agent 将截图与 Figma 设计稿（通过 API 获取图片）进行像素级和布局级对比。
- **反馈**：Agent 能够指出“按钮颜色偏浅”、“移动端布局重叠”等语义化问题，而不仅仅是像素差异。

### 6.2 文档回归闭环（Documentation Sync）

开发最大的痛点是文档腐烂（Document Rot）。代码变了，Spec 没变。

- **Spec Keeper Agent**：在代码合并到 `main` 分支后触发。
- **逆向工程**：Agent 读取最新的代码实现，对比原始的 Spec 文档。
- **自动更新**：如果发现 API 增加了参数或修改了返回结构，Agent 自动提交一个 PR 更新 `openapi.yaml` 和 `docs/` 中的文档，确保 Spec 永远是 Source of Truth。

------

## 7. 大厂实践对标与实施建议

| **关键流程** | **传统模式**            | **本报告推荐 AI 闭环模式**                       | **对标 Google 实践**  | **对标 Meta 实践** |
| ------------ | ----------------------- | ------------------------------------------------ | --------------------- | ------------------ |
| **需求阶段** | 简略 Jira Ticket        | **Spec-Driven**: AI 辅助生成详尽 TDD & OpenAPI   | Design Docs 7         | -                  |
| **编码阶段** | IDE 手写 + Copilot 补全 | **Agentic Workflow**: Plan-Execute-Verify 微循环 | Monorepo 工具链       | -                  |
| **代码审查** | 人工 Review，耗时数小时 | **LLM-as-a-Judge**: 自动拦截高危错误，即时反馈   | **Critique** 1        | -                  |
| **测试生成** | 开发人员手写，覆盖率低  | **TestGen Pipeline**: 生成 -> 过滤 -> 覆盖率验证 | Testing on the Toilet | **TestGen-LLM** 4  |
| **Bug 修复** | 人工看日志调试          | **Self-Healing CI**: 自动分析日志并提交 Patch    | -                     | **SapFix** 13      |