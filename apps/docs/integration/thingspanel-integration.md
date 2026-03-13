# ThingsPanel 集成案例

本页是面向 ThingsPanel 场景的集成案例说明。

如果你只是要理解通用 iframe 接入，请先看：

- [嵌入模式接入指南](/guide/embed-dashboard)

## 适用场景

- 宿主系统是 ThingsPanel
- 由宿主负责 token、平台字段和 dashboard 初始化
- 通过 `postMessage` 与 ThingsVis iframe 通信

## 当前仓库中的事实来源

相关实现和参考文件包括：

- `apps/studio/src/embed/message-router.ts`
- `apps/studio/src/pages/EmbedPage.tsx`
- `docs/thingspanel-integration-guide.md`

## 建议阅读顺序

1. 先理解通用嵌入模型
2. 再看 ThingsPanel 的具体宿主实现
3. 最后再对照宿主中的 Vue 组件或业务页面接入

## 典型能力

ThingsPanel 集成里最关键的是这些能力边界：

- iframe 加载
- `tv:init` 初始化
- 平台字段推送
- 历史数据回填
- 保存回传
- 反向写回

## 参考文档

当前更细的协议说明仍保留在：

- 仓库文件：`docs/thingspanel-integration-guide.md`

建议后续将其中对外可复用的部分继续抽离回通用嵌入文档。

## 截图占位

> TODO: 在此补一张 ThingsPanel 宿主页中的嵌入效果截图。
