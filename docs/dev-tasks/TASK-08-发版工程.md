# TASK-08：发版工程

> **优先级**：🔴 P0
> **预估工时**：0.5 人天
> **前置依赖**：TASK-01 ~ TASK-07 全部完成

---

## 背景

这是所有前置任务完成后的最终发版步骤。

---

## 任务清单

### 版本与构建
- [ ] 版本号 `v0.1.0` 已写入所有 `package.json`（应在 TASK-02 中完成）
- [ ] 修复 `release.yml`（`.env.example` 引用 + preview + `continue-on-error` + 端口）
- [ ] 构建产物验证：`pnpm build` → standalone 运行

### 发布
- [ ] 创建 annotated Git Tag `v0.1.0` + 验证 CI 全流程
- [ ] GitHub Release 页面 + 产物上传
- [ ] **P1** SHA256 校验和

---

## 验收标准

1. `pnpm build` 成功完成
2. CI 全流程自动运行无错误
3. GitHub Release 页面创建完成，包含构建产物
4. Docker 镜像推送到 GHCR
5. 服务器自动部署成功
