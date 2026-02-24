# 🚀 ThingsVis × ThingsPanel 发布工作清单

> **发布目标日期**: 2026-02-25（明天）
> **当前时间**: 2026-02-24 10:36
> **负责人**: 你 + 同事A + 同事B

---

## 一、功能需求核对结论

> 逐项对照用户提供的功能需求，与代码库实际实现进行比对。

### 2.1 编辑器核心 (Editor Core)

| 功能 | 状态 | 说明 |
|------|------|------|
| 画布引擎 (LeaferJS) | ✅ **已实现** | 所有插件均依赖 `leafer-ui ^1.0.0`，渲染层已接入 |
| 无限画布 / 标尺 / 网格吸附 | ✅ **已实现** | LeaferJS 原生能力，`CreateToolLayer.tsx` 已集成 |
| 多选 / 框选 | ✅ **已实现** | 命令系统中有选择工具，内核 `selection.nodeIds` 支持多选 |
| 成组 (Group) | ⚠️ **部分实现** | Schema 层有 Group 节点类型，但 UI 中成组操作入口需确认 |
| 锁定 / 隐藏显示 | ✅ **已实现** | `defaultCommands.ts` 删除命令中有 `node.locked` 判断，图层面板存在 |
| 历史记录 Undo/Redo | ✅ **已实现** | `CommandRegistry` 完整实现了 `undo`/`redo`/`canUndo`/`canRedo` |
| 图层管理面板 | ✅ **已实现** | `LayerPanel.tsx` 已存在于 `LeftPanel` 目录 |

**结论**: 编辑器核心功能 **基本满足**，成组操作 UI 入口需上线前手动验证。

---

### 2.2 组件与插件系统 (Component System)

| 功能 | 状态 | 说明 |
|------|------|------|
| 文本组件 | ✅ **已实现** | `plugins/basic/text/` 存在且已构建 |
| 图片组件 | ✅ **已实现** | `plugins/media/image/` 存在且已构建 |
| 基础形状（矩形、圆形、线段） | ✅ **已实现** | `plugins/basic/rectangle/`, `circle/`, `line/` 均已构建 |
| 开关 / 视频流 | ⚠️ **需确认** | video 插件，需手工验证 |
| 图表 - ECharts 折线图 | ✅ **已实现** | `plugins/chart/echarts-line/` 已构建 |
| 图表 - ECharts 柱状图 / 饼图 | ❌ **未实现** | 代码库中只有 `echarts-line`，无 `echarts-bar` / `echarts-pie` |
| 图表 - uPlot 时序图 | ❌ **未实现** | 整个项目中未找到 uPlot 相关代码 |
| 图片上传 | ⚠️ **已实现** | image 插件存在 |
| 指示器/卡片组件 | ✅ **已实现** | `plugins/basic/indicator/`, `pm25-card/` 均已构建 |

**结论**: 基础组件 ✅，ECharts 柱状/饼图和 uPlot **缺失**。需决策：**发版前补齐 or 发版说明中标注 "即将推出"**。

---

### 2.3 数据与联动 (Data & Interaction)

| 功能 | 状态 | 说明 |
|------|------|------|
| HTTP (REST) 数据源 | ✅ **已实现** | `DataSourceConfig/RESTForm.tsx` 完整实现，有 Auth/Body/Headers 等配置项 |
| WebSocket 数据源 | ✅ **已实现** | `DataSourceConfig/WSForm.tsx` 完整实现，有 Heartbeat/Reconnect 配置 |
| MQTT 数据源 | ⚠️ **Schema已定义，UI待实现** | `MQTTConfigSchema` 已在 Schema 包中定义，但 `DataSourceConfig/` 目录下没有 `MQTTForm.tsx` |
| 数据转换器 (ETL) | ✅ **已实现** | `TransformationEditor.tsx` 存在，支持 Map/Filter 处理 |
| 蓝图 / 事件交互系统 | ⚠️ **需确认** | 事件系统在 specs 中有设计文档，但实现完整度需手工验证 |

**结论**: HTTP/WS 数据源完整，MQTT **UI 层缺失**（后端 Schema 已就位，UI 开发工作量约 0.5 天）。

---

## 二、发版前必做工作清单

### 🔴 P0 — 阻塞发版（必须今天完成）

- [ ] **功能全量冒烟测试** — 按下方"验证矩阵"逐项确认
- [ ] **ThingsVis 确定版本号** — 建议 `v0.1.0`（首个公开版）
- [ ] **ThingsPanel 确定版本号** — 建议 `v1.2.0`（含新功能）
- [ ] **创建 ThingsVis `release.yml`** — 基于现有 `deploy-test.yml` 修改，打 tag 时触发打包并上传 GitHub Release
- [ ] **在 GitHub 创建 Release** — 两个仓库分别创建

### 🟡 P1 — 强烈建议（影响用户体验）

- [ ] **ThingsVis README 更新** — 最低包含：功能介绍、部署方式（tar.gz解压 + Nginx 配置）、环境变量说明
- [ ] **编写 Release Notes** — ThingsVis v0.1.0 功能列表；ThingsPanel v1.2.0 更新内容
- [ ] **MQTT 数据源 UI** — 如果时间允许，补全 `MQTTForm.tsx`；否则在文档中注明"后续版本支持"
- [ ] **ECharts 柱状图 / 饼图插件** — 如果时间允许各花 2-3 小时补齐；否则文档注明

### 🟢 P2 — 时间允许做（不阻塞发版）

- [ ] 成组 (Group) UI 入口验证与修复
- [ ] Iframe / 视频流组件确认
- [ ] SVG 上传功能验证
- [ ] docker-compose.yml 模板

---

## 三、功能验证矩阵（冒烟测试）

| # | 测试场景 | 验证方法 | Pass? |
|---|---------|---------|-------|
| **编辑器** | | | |
| E1 | 打开编辑器，拖拽矩形/圆形/文本到画布 | 目视 | ☐ |
| E2 | Ctrl+Z 撤销，Ctrl+Shift+Z 重做 | 操作验证 | ☐ |
| E3 | 复选多个组件（框选 or Shift点选） | 操作验证 | ☐ |
| E4 | 锁定一个组件，尝试移动（应无法移动） | 操作验证 | ☐ |
| E5 | 图层面板拖拽调整层级 | 操作验证 | ☐ |
| **数据源** | | | |
| D1 | 添加 HTTP 数据源，配置一个 GET 请求 | 配置面板正常打开 | ☐ |
| D2 | 添加 WebSocket 数据源 | 配置面板正常打开 | ☐ |
| D3 | 数据转换器：对返回数据做 Map 操作 | 转换结果正确 | ☐ |
| **组件** | | | |
| C1 | 从插件库拖入 ECharts 折线图 | 正常渲染 | ☐ |
| C2 | 图表绑定 HTTP 数据源后显示数据 | 数据正常展示 | ☐ |
| C3 | 上传一个自定义 JS 插件包 | 加载成功 | ☐ |
| **ThingsPanel 集成** | | | |
| T1 | Widget Mode：设备模板 → Web图表配置 | 编辑器打开，保存正常 | ☐ |
| T2 | App Mode：可视化 → 新建大屏 | 编辑器打开，自动保存正常 | ☐ |
| T3 | Viewer Mode：首页仪表板预览 | 预览渲染正确 | ☐ |
| **保存/发布** | | | |
| S1 | 编辑后手动保存 | 无报错，重新打开数据还在 | ☐ |
| S2 | 等待 10 秒自动保存 | Console 无错误 | ☐ |

---

## 四、三人协作分工

> **时间窗口**: 今天（2月24日）全天 + 明天上午

### 👤 你（主负责：发版工程 + 架构决策）

```
今天上午（现在-12:00）:
  [ ] 确认版本号（v0.1.0 / v1.2.0）
  [ ] 编写 ThingsVis release.yml（约 1 小时）
  [ ] 本地验证一次完整的打包流程

今天下午（14:00-18:00）:
  [ ] 修复同事A反馈的 P0 Bug
  [ ] 决策：MQTT UI 和 ECharts 柱状/饼图是否要赶进去
  [ ] 在 GitHub 创建两个仓库的 Release（最后触发 CI）
```

### 👤 同事 A（主负责：功能测试）

```
今天上午（10:00-12:00）:
  [ ] 打开测试环境（ThingsVis 已自动部署至最新 master）
  [ ] 执行验证矩阵 E1-E5（编辑器部分）
  [ ] 执行验证矩阵 D1-D3（数据源部分）

今天下午（14:00-18:00）:
  [ ] 执行验证矩阵 C1-C3（组件部分）
  [ ] 执行验证矩阵 T1-T3（ThingsPanel 集成）
  [ ] 执行验证矩阵 S1-S2（保存发布）
  [ ] 将 Bug 整理成列表，按 P0/P1 优先级排序给"你"
```

### 👤 同事 B（主负责：文档 + Release Notes）

```
今天上午（10:00-12:00）:
  [ ] 整理 ThingsVis v0.1.0 功能列表（用"功能需求核对结论"中 ✅ 的部分）
  [ ] 整理 ThingsPanel v1.2.0 更新内容（从最近3个 commit 中提取）

今天下午（14:00-17:00）:
  [ ] 撰写 ThingsVis README（部署步骤 + 环境变量 + 截图）
  [ ] 撰写两份中文 Release Notes
  [ ] 如时间允许：补全 MQTTForm.tsx（技术同学）
  [ ] 将 Release Notes 内容发给"你"，等待最终上传 GitHub Release
```

---

## 五、发版时间线

```
今天  10:30  同事A开始测试 / 同事B开始写文档 / 你写 release.yml
      12:00  第一轮测试结果汇总，确认 P0 Bug 数量
      14:00  修 P0 Bug，push 到 master（触发自动部署测试环境）
      16:00  第二轮测试确认 P0 全部修复
      17:00  Release Notes 定稿，release.yml 完成
      17:30  ⭐ 在 GitHub 打 tag，触发打包 CI

明天  09:00  CI 打包完成，检查产物（下载 tar.gz 验证）
      10:00  正式在 GitHub 发布 Release（两个仓库）
      10:30  🎉 向社区宣布发版
```

---

## 六、发版产物清单（最小可行）

### ThingsVis v0.1.0
- [ ] `thingsvis-v0.1.0.tar.gz`（GitHub Release 附件）
  - server/ (Next.js standalone)
  - studio/ (静态文件，内含 Preview 和 Embed 路由)
  - plugins/ (内置插件)
  - thingsvis.conf (Nginx 参考配置)
- [ ] GitHub Release 页面（含 Release Notes）
- [ ] README 更新（部署文档）

### ThingsPanel v1.2.0
- [ ] `thingspanel-frontend-v1.2.0.zip`（CI 自动打包）
- [ ] `thingspanel-frontend-v1.2.0.tar.gz`（CI 自动打包）
- [ ] GitHub Release 页面（含 Release Notes）

---

## 七、关键风险与应对

| 风险 | 概率 | 应对方案 |
|------|------|---------|
| 测试发现 P0 Bug，今天修不完 | 中 | 推迟发版到明天下午；关键路径是 T1/T2/T3 |
| release.yml CI 首次跑失败 | 中 | 提前今天上午跑，不要等到最后 |
| MQTT 缺失导致用户投诉 | 低 | Release Notes 中明确标注为"upcoming"，设置 GitHub Issue 追踪 |
| ECharts 只有折线图被质疑 | 中 | 同上，文档中说明柱状/饼图为后续 milestone |

---

## 八、发布方式选择

### 竞品对比

| 竞品 | 发布方式 | 特点 |
|------|---------|------|
| **Grafana** | Docker Hub + GitHub Release ZIP | 最完整，适合大团队 |
| **DataEase** | docker-compose 一键安装 + GitHub Release | 最省心，依赖复杂时最优 |
| **GoView** | 仅源码，无正式发版 | 用户体验差，不建议学 |

### ThingsVis 推荐方案：docker-compose（性价比最优）

ThingsVis 由两个独立部分组成，天然适合 docker-compose：

```
apps/server    → Next.js Server（已有 standalone 构建）
apps/studio    → 纯静态 SPA（内含 Preview 和 Embed 路由）
```

**目标 docker-compose.yml（需新建）：**

```yaml
services:
  server:
    image: ghcr.io/thingspanel/thingsvis-server:v0.1.0
    ports: ["3000:3000"]
    env_file: .env

  studio:
    image: nginx:alpine
    volumes:
      - ./studio:/usr/share/nginx/html:ro
      - ./thingsvis.conf:/etc/nginx/conf.d/default.conf:ro
    ports: ["7050:80"]
```

用户只需：

```bash
docker-compose up -d
# Studio:  http://localhost:7050
```

**为什么选 docker-compose 而非纯 tar.gz：**
- ThingsVis 和 ThingsPanel 独立部署，依赖简单，不需要像 DataEase 那样复杂的 docker-compose
- GitHub Container Registry (ghcr.io) 免费，不需要 Docker Hub 账号
- 同时提供 tar.gz 作为备选，兼顾不用 Docker 的用户

### 今天需要新建的文件

- [ ] `Dockerfile` for server（基于 Next.js standalone）
- [ ] `docker-compose.yml`（放在仓库根目录）
- [ ] `.github/workflows/release.yml`（打 tag → build 镜像 → push ghcr.io → 上传 tar.gz）

> 预计工作量：约 2 小时，可由"你"今天上午完成。

---

## 九、本地测试方法

### 方式 1：pnpm dev（日常开发，最快）

```powershell
cd f:\coding\thingsvis
pnpm install
pnpm dev:all   # 同时启动 studio + server
```

访问：
- Studio（编辑器）：`http://localhost:3000`
- Server（API）：`http://localhost:3001`

### 方式 2：本地构建后测试（发版前必做，最接近生产）

```powershell
# 1. 完整构建
pnpm build

# 2. 启动 server
node apps/server/.next/standalone/apps/server/server.js

# 3. 托管静态文件（需安装 serve：npm i -g serve）
serve apps/studio/dist -p 7050
```

### 方式 3：push master 触发 CI（准生产验证）

最简单的"和生产一致"的测试方法：

```powershell
git push origin master
# CI 自动部署到测试服务器，约 5-10 分钟后访问测试环境 URL 验证
```

