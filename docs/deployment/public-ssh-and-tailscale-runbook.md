# ThingsVis 部署通道备份与切换手册

> 本文档用于保存 ThingsVis 在公网 SSH 与 Tailscale SSH 之间切换时的配置、验证和回滚方法。
>
> 当前仓库是公开仓库。本文不保存任何密码、私钥、数据库连接串或 API key；所有敏感值只能放在 GitHub Actions Secrets 和服务器环境文件中。

> 当前实现（master `53175db`）：公网 SSH 优先；Cloud 公网不可达时自动回退到 Tailscale。三套环境均使用单条 SSH 连接流式传包并在同一连接内完成部署。

## 1. 三套环境

| 环境 | Workflow | GitHub Secrets | 服务器目录 |
| --- | --- | --- | --- |
| Test | `.github/workflows/deploy-test.yml` | `DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_SSH_KEY` | `/opt/thingsvis`、`/var/www/thingsvis-studio`、`/var/www/thingsvis-plugins` |
| E | `.github/workflows/deploy-e.yml` | `DEPLOY_HOST_E`、`DEPLOY_USER_E`、`DEPLOY_SSH_KEY_E` | `/opt/thingsvis`、`/var/www/thingsvis-studio`、`/var/www/thingsvis-plugins` |
| CLOUD | `.github/workflows/deploy-cloud.yml` | `DEPLOY_HOST_CLOUD`、`DEPLOY_USER_CLOUD`、`DEPLOY_SSH_KEY_CLOUD` | `/opt/thingsvis`、`/var/www/thingsvis-studio`、`/var/www/thingsvis-plugins` |

数据库和应用密钥仍分别使用 `DATABASE_URL`、`DATABASE_URL_E`、`DATABASE_URL_CLOUD` 以及 `AUTH_SECRET`。不要把这些值写入仓库。

## 2. 当前部署方案

Cloud、E、Test 的默认部署路径使用公网 SSH，并采用以下流程：

- 构建产物打包为带有 `github.run_id` 的 tar.gz；生产包排除 source map；
- 通过单条 OpenSSH 连接把包流式写入 `/tmp`，避免 `scp-action` 上传前探测、上传时再次建连；
- 服务器端校验 SHA-256、解包、更新 PM2/Nginx 并执行健康检查；
- 部署前自动清理 `/tmp/thingsvis-deploy-*` 历史临时包，避免失败重试填满 tmpfs；
- Cloud、E、Test 使用各自的 `DEPLOY_HOST*`、`DEPLOY_USER*`、`DEPLOY_SSH_KEY*` Secrets；
- 部署包传输完成后必须校验 SHA-256，部署失败不能视为成功。

Cloud 额外保留自动回退：

1. 先连接 `DEPLOY_HOST_CLOUD` 公网地址，连接超时为 10 秒；
2. 公网不可达时，GitHub Runner 临时加入 Tailscale `tag:ci-deploy`；
3. 使用 Cloud Tailscale 地址 `100.126.67.60`，重新流式传输同一个包并完成部署；
4. 公网恢复后自动回到公网路径，不会默认走 Tailscale。

最近一次实测：公网连接超时后，Cloud 通过 Tailscale 完成 94MB 包部署并通过健康检查；Test、E 也已成功完成。

服务器切换前必须确认：

1. 云安全组和主机防火墙允许 TCP/22；
2. `sshd` 监听公网地址；
3. 部署用户的 `authorized_keys` 已安装对应公钥；
4. 只允许公钥登录，关闭密码登录；
5. 禁止 root 直接登录，部署用户只拥有必要的目录和命令权限；
6. 已配置 SSH 日志、失败封禁和连接限速；
7. 从 GitHub Actions Runner 实测 SSH 流式传输、SHA-256 和远端健康检查。

> 不建议把标准 GitHub-hosted Runner 的全部 Actions IP 段作为长期白名单。该地址池规模大且会变化；如果必须做来源限制，应使用固定公网 IP 的专用 Runner 或固定 IP 的部署中继机。

## 3. Tailscale 回滚方案

Tailscale 相关配置不要删除，保留以下 Secrets：

- `TS_OAUTH_CLIENT_ID`
- `TS_OAUTH_SECRET`

如果需要临时强制全量走 Tailscale：

1. 在 Cloud workflow 的构建步骤后恢复 `tailscale/github-action@v4`，目标地址为 Cloud 的 tailnet 地址；
2. 在 E workflow 的构建步骤后恢复 `tailscale/github-action@v4`，目标地址为 E 的 tailnet 地址；
3. 将上传目标改为对应的 Tailscale 地址；当前 Cloud workflow 已内置公网失败回退，不需要手工改动；
4. 保留部署包 SHA-256 校验、并发控制、数据库环境检查和健康检查；
5. 先使用 `workflow_dispatch` 单独验证 Test，再恢复 E 和 Cloud。

历史 Tailscale 切换提交：

- Cloud：`b98803f`、`3a6970f`
- E：`090aa6a`
- 上传超时调整：`5c8fa5e`、`f7d8a37`

这些提交仅作为回滚参考，不应直接覆盖后续的 Node 24 Actions、checksum 和竞态修复。

## 4. 切换验证清单

### Workflow 层

- [ ] YAML 解析通过；
- [ ] Cloud/E/Test 都没有错误地引用 Tailscale 地址；
- [ ] `DEPLOY_HOST*`、`DEPLOY_USER*`、`DEPLOY_SSH_KEY*` 名称与 Secrets 一致；
- [ ] 部署包文件名包含 `github.run_id`；
- [ ] 远端 SHA-256 与 Runner 侧一致；
- [ ] workflow 的超时不会把网络卡死伪装成长期运行；Cloud 公网探测超时为 10 秒；
- [ ] 失败重试前 `/tmp/thingsvis-deploy-*` 临时包会被清理；

### 服务器层

- [ ] TCP/22 连通；
- [ ] SSH 公钥登录成功；
- [ ] 部署用户可写目标目录并能执行必要的 PM2/Nginx 操作；
- [ ] `nginx -t` 通过；
- [ ] `http://127.0.0.1:8000/api/v1/health` 通过；
- [ ] `http://127.0.0.1:7050/` 通过；
- [ ] 远端部署完成后删除临时包和临时目录。

## 5. 本次故障结论与备份

- 构建和打包约 3 分钟，原先 124MB 包通过公网 SSH 上传曾耗时 35 分钟；
- 排除 source map 后包体积约 94MB；Test 单连接上传与部署约 4 分 32 秒；
- Cloud 公网 TCP/22 在 GitHub Runner 上仍然超时，主机内 `sshd` 和 iptables 已监听/放行，剩余问题在云安全组或上游公网入口；
- E 曾因 `/tmp` 945MB tmpfs 被历史失败包填满而报 `No space left on device`，已清理并加入部署前自动清理；
- Tailscale 相关配置保留在仓库和 GitHub Secrets 中，便于未来再次启用。

## 6. 安全阻断项

在公开仓库中发现任何已提交的 `.env`、`.env.local.bak`、数据库密码、认证密钥、管理员密码或 AI API key 时：

1. 立即停止扩大公网暴露面；
2. 轮换所有已暴露凭据；
3. 从当前分支和 Git 历史清理敏感文件；
4. 开启 Secret Scanning 和 Push Protection；
5. 轮换三套部署 SSH 私钥并检查登录审计；
6. 完成后再开放公网 22 或恢复自动部署。

仓库历史中曾发现 `apps/server/.env.local.bak` 被 Git 跟踪；若该文件仍含真实凭据，必须先轮换凭据并清理历史，再扩大公网暴露面。本文不保存这些凭据，也不在 workflow 中打印它们。
