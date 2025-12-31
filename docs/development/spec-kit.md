
# Spec-Kit 通用开发速查表 (General Cheatsheet)

这份速查表适用于当前项目成员，可以快速了解sepc-kit开发规范。

## 1. 核心工作流 (The Loop)

请死记这个循环：**定规矩 -> 提需求 -> 定方案 -> 拆任务 -> 写代码**。

| 步骤 | 命令 | 作用 | 你的心智模型 |
| --- | --- | --- | --- |
| **0. 初始化** | `specify init` | 给项目装上大脑 | "你好 AI，这是我们的新战场。" |
| **1. 立宪** | `/speckit.constitution` | **项目原则** (只做一次) | "在这个项目里，必须严禁 Any 类型，必须写注释。" |
| **2. 需求** | `/speckit.specify` | **要做什么** (每次新功能) | "我要做一个登录页，要有微信扫码。" (别谈代码) |
| **3. 质询** | `/speckit.clarify` | **查漏补缺** (防坑) | "AI，你看看我刚才说的需求有没有逻辑漏洞？" |
| **4. 计划** | `/speckit.plan` | **怎么做** (技术选型) | "用 Vue3 + Pinia，接口调 `/api/login`。" |
| **5. 审查** | `/speckit.analyze` | **一致性检查** (最后防线) | "检查一下计划是否符合宪法？有没有漏掉需求？" |
| **6. 执行** | `/speckit.tasks` <br>

<br> `/speckit.implement` | **干活** | "没问题了，动手写代码吧。" |

---

## 2. 万能 Prompt 模版 (复制即用)

针对你的不同项目，我准备了通用的 Prompt 填空题。

### A. 初始化项目

```bash
# 进入你的项目文件夹
cd my-new-project
# 初始化 (如果是 Cursor)
specify init --here --ai cursor-agent

```

### B. 宪法模版 (`/speckit.constitution`)

*不管做什么项目，把这段话发给 AI，稍微改改技术栈即可。*

> **Prompt:**
> "Create project principles. The following rules are strictly enforced:
> 1. **Tech Stack**: Must use [ 填入技术栈，如 Vue3/Go/Python ].
> 2. **Code Style**: Functional programming preference. Explicit variable names. [ 如：必须写中文注释 ].
> 3. **Error Handling**: No silent failures. All API calls must be wrapped in try/catch or specific error handlers.
> 4. **Directory Structure**: strict separation of concerns. (e.g., UI components strictly separated from Business Logic)."
> 
> 

### C. 需求模版 (`/speckit.specify`)

*用自然语言描述，越像“产品经理”越好。*

> **Prompt:**
> "Feature: [ 功能名称，如：用户个人中心 ].
> **User Stories:**
> 1. As a user, I can [ 行为，如：点击头像上传新图片 ].
> 2. The system should [ 响应，如：自动压缩图片并上传到 OSS ].
> 3. Edge Case: If [ 异常情况，如：网络断开 ], show [ 提示信息 ]."
> 
> 

### D. 计划模版 (`/speckit.plan`)

*这里才开始谈技术。*

> **Prompt:**
> "Technical Implementation Plan:
> 1. **Data Model**: Create a schema for [ 数据表名 ]. Fields: [ 字段列表 ].
> 2. **State Management**: Use [ 状态库，如 Pinia/Redux ] to store [ 变量名 ].
> 3. **API**: Create endpoints [ 接口路径 ].
> 4. **Components**: Create [ 组件名 ] in `src/components`."
> 
> 

---

## 总结：为什么这么做？

Spec-Kit 的本质是**把“思考”固化在项目里**。

* 如果是你自己写代码，你可能写到一半忘了“这个变量为什么要用全局状态？”。
* 有了 Spec-Kit，`.specify/spec.md` 就是项目的**即时记忆**，`.specify/constitution.md` 就是项目的**法律**。
* 即使你这周忙别的，下周回来打开项目，运行 `/speckit.implement`，AI 依然能通过读取这些文件，无缝接着上一次的思路继续写。