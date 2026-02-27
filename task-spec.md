# 任务规范：修复上传图片不显示问题

## 问题描述
图片上传成功（文件存在于 `apps/server/public/uploads/`），右侧属性面板正确显示了 URL（如 `http://localhost:3000/uploads/xxx.jpg`），但画布上图片组件无法加载此 URL。

## 根本原因
- Studio（前端）运行在 `localhost:3000`（rsbuild dev server）
- Server（后端 Next.js）运行在 `localhost:8000`
- rsbuild 已有 `/api` → `localhost:8000` 的代理，所以上传 API 正常工作
- 但 `/uploads/` 路径**缺少代理规则**
- 文件存储在 `apps/server/public/uploads/`，由 Next.js (8000端口) 静态文件服务提供
- Studio (3000端口) 收到 `/uploads/xxx.jpg` 请求时无法找到文件

## 验收标准
- [ ] 上传图片后，图片在画布上正确显示
- [ ] URL 模式输入外部图片链接仍然正常工作
- [ ] 修改不影响现有 API 代理功能

## 修改范围
单文件修改：`apps/studio/rsbuild.config.ts`
