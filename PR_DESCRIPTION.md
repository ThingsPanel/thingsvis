# 🚀 新功能：分享链接 - 无状态仪表板嵌入

## 概述

实现了无状态的分享链接功能，允许通过 UUID v4 令牌嵌入 ThingsVis 仪表板，无需复杂的 SSO Token 交换流程。

## 主要变更

### 后端 API

✅ **数据库 Schema**
- 添加 `shareToken` (UUID v4), `shareExpiry`, `shareEnabled` 字段到 Dashboard 模型
- 数据库迁移已应用

✅ **API 端点**
- `POST /api/v1/dashboards/:id/share` - 创建分享链接（需认证）
- `GET /api/v1/dashboards/:id/share` - 查询分享信息，Token 脱敏（需认证）
- `DELETE /api/v1/dashboards/:id/share` - 吊销分享链接（需认证）
- `GET /api/v1/dashboards/:id/validate-share` - 验证分享链接（**无需认证**）

### 前端实现

✅ **API 客户端**
- 扩展 `apiClient` 支持 `skipAuth` 选项
- 添加 `createShareLink`, `validateShareLink`, `revokeShareLink`, `getShareInfo` 函数

✅ **EmbedPage 支持**
- 支持 `shareToken` URL 参数
- URL 参数优先级：`shareToken` > `token`
- 完全向后兼容现有 SSO Token 流程

✅ **UI 组件**
- `ShareDashboardDialog` - 完整的分享管理对话框
- 支持设置过期时间（1/7/30 天或永久）
- 一键复制分享链接
- 实时显示过期状态

### 文档

✅ **集成指南**
- 完整的 API 文档
- 前端集成示例
- ThingsPanel 集成指南
- 安全最佳实践
- 迁移指南

## 功能特性

### 🔒 安全性
- UUID v4 生成 shareToken（128-bit 随机）
- 支持过期时间设置
- 支持实时吊销
- 查询接口返回脱敏 Token

### �� 向后兼容
- 保留现有 SSO Token 机制
- 不影响现有嵌入流程
- 可以与 SSO Token 共存

### ⚡ 无状态设计
- 完全无状态验证
- 无需维护会话
- 简化嵌入流程

### 📊 使用简单
```typescript
// 创建分享链接
const result = await createShareLink('dash_123', { expiresIn: 86400 });

// 嵌入
<iframe src={result.data.shareUrl} />
```

## 测试

✅ 构建测试通过
- Server 构建成功
- Studio 构建成功
- 所有 lint 检查通过

⏸️ 待完成（可选）
- API 端到端测试
- 前端集成测试

## 文件变更

### 核心文件
- `apps/server/prisma/schema.prisma` - 数据模型
- `apps/server/src/app/api/v1/dashboards/[id]/share/route.ts` - 分享 CRUD
- `apps/server/src/app/api/v1/dashboards/[id]/validate-share/route.ts` - 验证 API
- `apps/studio/src/lib/api/client.ts` - API 客户端增强
- `apps/studio/src/lib/api/dashboards.ts` - 分享 API 封装
- `apps/studio/src/pages/EmbedPage.tsx` - shareToken 支持
- `apps/studio/src/components/dashboard/ShareDashboardDialog.tsx` - UI 组件

### 文档
- `docs/integration/share-link-integration.md` - 集成指南
- `FEATURE_SUMMARY.md` - 功能总结

## 部署注意事项

1. **数据库迁移**：部署前需要运行数据库迁移
2. **向后兼容**：不影响现有功能，可以安全部署
3. **HTTPS**：生产环境建议使用 HTTPS

## 相关文档

- [集成指南](docs/integration/share-link-integration.md)
- [功能总结](FEATURE_SUMMARY.md)
- [架构设计](share-link-embed-architecture-spec.md)

## Checklist

- [x] 代码实现完成
- [x] 构建测试通过
- [x] 文档完善
- [x] 向后兼容
- [ ] API 测试（可选）
- [ ] 集成测试（可选）

## 预览

创建分享链接并嵌入：

```html
<iframe 
  src="https://thingsvis.example.com/#/embed?id=dash_123&shareToken=xxx"
  width="100%" 
  height="600">
</iframe>
```

---

**类型**: 新功能  
**影响范围**: 后端 API + 前端 + 数据库  
**破坏性变更**: 无
