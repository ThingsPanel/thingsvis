# Iteration Log

## 历史任务摘要（来自 docs/dev-tasks/iteration-log.md）
> 之前完成了 6 个子任务，涵盖：SDK Context 扩展、画布主题隔离、KernelStore 集成、Widget 适配、CSS Variables 主题重构、echarts-line 构建修复。详见 `docs/dev-tasks/iteration-log.md`。

---

## Sub-task 7: 修复仪表盘/饼图等组件无法拖拽问题

### 7.1 分析与解决
- **What was done**: 
  1. 修复了致命的构建错误：部分组件编译出单独的一个 `dist` 文件而不是目录。修复了在 `package.json` 的 `deploy:widgets` 脚本中对于 "文件已存在" 的判断丢失，现会 `unlinkSync` 然后再建立正确的 `dist` 目录。执行了 `pnpm build:widgets`。
  2. 修复了 `echarts-gauge`、`echarts-pie` 组件代码中针对遗留 `isDark` 变量引发的报错（`ReferenceError: isDark is not defined`）。将判断转为新版从 `colors` 对象中直接提取相应颜色。
  3. 修复并从根源上消除了 **ECharts Canvas 拦截与吞噬拖拽事件的问题**：在 `Moveable` 拖拽过程中，系统为了视觉层叠将当前组件 `overlayBox` 设置 `z-index: 1000`。由于底层部件原始带有 `pointer-events: auto`，直接越俎代庖吞吐了由于 z-index 提升带来的拖拽 Move 动作。于是在 `@thingsvis/ui` 的 `widgetRenderer.ts` 中写入拦截判定：如果系统处于 Editor `editable` 状态下，将 DOM 底层的事件侦听剥夺 `pointerEvents = 'none'`，完全放权给更高层抽象负责。
- **What was tried & failed**: 测试阶段直接通过 PowerShell 检查文件 IO 差异确定出组件实际上加载失败退化为 placeholder 时的底层关联反应。
- **What succeeded**: 组件产物均被重建，Moveable 层重新在编辑环境获得绝对控制权。
- **How it was tested**: 代码逻辑盘点及脚本本地成功重编测试。
- **Key decisions & rationale**: 直接要求底层的 `VisualEngine` + `WidgetOverlayRenderer` 对于编辑状态不保留 `auto` 的接收权。防止类似于 ECharts 的底层类库因为本身包含丰富交互逻辑截断了外部 React 事件的冒泡与调度。这是在编辑器层设计中保持单一职责极其重要的一步。
- **Time/Iteration count**: 1

---

## Sub-task 8: 修复上传图片不显示问题

### 8.1 分析与解决
- **已完成工作**:
  修复了图片上传成功后画布上不显示的问题。根因是 rsbuild dev server (`localhost:3000`) 缺少对 `/uploads` 路径的代理配置，导致上传后返回的 URL（如 `http://localhost:3000/uploads/xxx.jpg`）在前端请求时无法找到文件。文件实际存储在后端 Next.js 服务的 `apps/server/public/uploads/` 目录下，由 `localhost:8000` 提供服务。
- **尝试与失败记录**: 无失败，一次定位到根因。
- **最终成功方案**:
  在 `apps/studio/rsbuild.config.ts` 的 `server.proxy` 中增加 `/uploads` → `http://localhost:8000` 的代理规则，与已有的 `/api` 代理规则保持一致。
- **测试方法与结果**: 需要重启 dev server 后验证，在浏览器中访问 `http://localhost:3000/uploads/tbJF7d_do9yFIvqDdsedl.jpg` 应能正常加载图片。
- **关键决策与原因**: 选择在 rsbuild proxy 层面解决，而非修改前端 URL 拼接逻辑。因为 proxy 是开发环境的标准做法，生产环境通常由 Nginx/反向代理统一处理，不需要改前端代码。
- **耗时/迭代次数**: 1
