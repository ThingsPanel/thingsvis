# SSO 与管理员初始化安全修复（2026-11-16）

本次修复 A-008、补全 A-018，并复核已有 A-019/A-020 修复。修改的是 Server；嵌入式前端可继续发送旧请求字段，但它们不再构成可信身份。

## 部署

- 配置新的随机 `AUTH_SECRET`（至少 32 字符）。移除所有内置开发密钥回退；Bearer 与 NextAuth Cookie 两条认证通路都拒绝缺失、默认及明显弱密钥。轮换使旧 Token/Cookie 失效。
- 配置 `THINGSPANEL_API_URL` 为可信 ThingsPanel 后端根地址，不带 `/api/v1`。后端必须包含新的 `GET /api/v1/auth/sso/identity`。该端点校验有效 JWT、当前用户状态，并从数据库确定身份、角色、租户；系统管理员空间保持为 `thingspanel-sys-admin`。
- `platform` 只接受 `thingspanel`。不使用请求体中的 `userInfo`、`role`，不使用客户端提供的验证 URL，不跟随验证请求重定向。验证超时/异常拒绝签发。
- 首次初始化必须配置唯一的 `SEED_ADMIN_PASSWORD`（至少 12 字符）。已修改的管理员密码不随重启覆盖；检测到历史 `admin123` 时要求新密码并仅替换密码，不改变角色、租户。没有新密码就拒绝完成 seed。
- 保留 A-019 的 `ASSET_SELF_HOSTS` 配置及 A-020 的上传限额。旧 SSO 凭证必须通过 AUTH_SECRET 轮换作废，不能只部署上传鉴权。

## 验证

```powershell
pnpm exec vitest run --config apps/server/vitest.security.config.ts
pnpm exec vitest run --config apps/server/vitest.assets.config.ts
pnpm exec vitest run --config apps/server/vitest.uploads.config.ts
pnpm exec tsc --noEmit -p apps/server/tsconfig.json
```

安全测试覆盖：伪造 Token 不落库、伪造角色/身份不生效、已有角色按可信结果更新、平台断网和异常响应失败关闭、弱密钥拒绝、Cookie 通路同样拒绝默认密钥、管理员初始化和重启不覆盖密码、历史默认密码替换。

部署验收需要测试环境中的 ThingsPanel 后端及测试账号：

1. 任意 `platformToken` 请求 `/api/v1/auth/sso`：401；验证后端不可达：503。两者都不能创建用户/租户。
2. 普通租户用户的有效 Token 搭配伪造 `role: SUPER_ADMIN`、他人的 `userInfo`：最终 Token 中仍是本人、本人租户和普通角色。
3. 使用真实系统管理员及租户管理员分别进入首页、编辑器：默认看板与原有空间正常；权限来自后端。
4. 更改管理员密码后重启两次：新密码持续有效，`admin123` 无效。历史默认密码账号必须配置新密码后才可启动完成。
5. 匿名上传被拒绝、合法上传正常；内网资产代理被拒绝、正常公网资源与 Range 下载正常。具体见 `public-asset-security.md` 和 `upload-security.md`。

本次没有清理生产历史账号、没有轮换线上密钥、没有部署镜像。生成和应用环境密钥属于发布步骤，不能把本地单测通过当作线上整改完成。
