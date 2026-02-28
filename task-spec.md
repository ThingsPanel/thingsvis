# 任务规范 (Task Specification)

## 1. 任务边界
本次任务的核心目标是解决 ThingsVis 在处理多种运行模式（云端模式、体验模式、嵌入模式）时发生的认证冲突问题。具体表现为在 ThingsPanel 中通过 iframe 嵌入（Embed/Widget 模式）以及在独立应用中使用“体验模式”时，由于路由守卫（`ProtectedRoute`）强制检查 `isAuthenticated` 状态，导致页面被错误地重定向到 `/login`。

任务范围限定在前端认证逻辑的改造，涉及以下主要模块：
- `src/lib/auth/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`

## 2. 验收标准
1. **嵌入模式正常显示**：在 ThingsPanel 等宿主环境以内嵌 iframe 方式加载 ThingsVis 编辑器（带有 `saveTarget=host` 等参数）时，不再跳转到登录页，能够正常接收 `tv:init` 消息并显示。
2. **体验模式正常运作**：在 ThingsVis 独立界面点击“免登录体验模式”时，能正确进入本地存储沙箱环境，不被拦截到 `/login`。
3. **云端模式受控**：标准的云端访问 `/editor` 时，如果不处于已登录状态且不是上述两种特例，依然应该被重定向到 `/login` 页面。
4. **统一状态管理**：`AuthContext` 需要能够清晰区分当前处于何种 `storageMode`（`local`, `cloud`, `embed`），并对上层路由守卫提供合理的认证状态支持。

## 3. 关联子任务
- **子任务 1**：改造 `AuthContext.tsx`，细化认证状态暴露。在 Embed 模式下和 Guest 体验模式下，提供绕过强制检查的机制，或者将 `isAuthenticated` 的定义拓宽。
- **子任务 2**：改造 `ProtectedRoute.tsx`，支持动态校验。根据当前的运行模式（URL 参数或 context 给出的 `storageMode`），动态决定是否跳过拦截。
- **子任务 3**：验证与测试。在当前通过运行环境（`pnpm dev:all` 与 `pnpm dev`）双边验证修改结果，确保所有三种模式表现符合预期。
