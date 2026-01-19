# Codex 规则配置

## 四角色开发工作流

本项目使用四角色自动化开发流程：

### 角色列表

| 角色 | 规则文件 | 触发关键词 |
|------|----------|------------|
| 🎩 老板（守门员） | `rules/boss-gatekeeper.md` | 评审、审批、业务价值、ROI |
| 📋 产品经理（需求定义） | `rules/pm-specify.md` | 需求、功能、用户故事、spec |
| 🏗️ 架构师（上下文工程师） | `rules/architect-context.md` | 宪法、架构、Plan、熔断 |
| 💻 开发（TDD 领航员） | `rules/dev-navigator.md` | 写代码、TDD、测试、implement |

### 工作流顺序

```
用户想法 → 产品经理(spec.md) → 老板评审 → 架构师(plan.md) → 开发(TDD)
```

### 使用方式

在 Codex 对话中直接使用触发关键词：

- "帮我评审这个需求" → 触发老板角色
- "写一个新功能的需求" → 触发产品经理角色  
- "审查一下技术方案" → 触发架构师角色
- "开始写代码" → 触发开发角色

### 相关资源

- 现有 Agent 定义：`.github/agents/speckit.*.agent.md`
- Claude Code Skills：`.claude/skills/`
- Cursor 规则：`.cursor/commands/`
