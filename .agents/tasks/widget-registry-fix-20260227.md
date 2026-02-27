# Widget Registry 修复任务

**日期**: 2026-02-27  
**执行者**: AI Agent (TaskLoop + ThingsVis Widget Creator)  
**任务类型**: validate/fix

---

## 原始问题列表

通过对 `apps/studio/public/registry.json` 的检查，发现以下问题：

| # | Widget | 问题 | 严重程度 |
|---|--------|------|---------|
| 1 | `basic/line` | 缺少 `icon` 字段 | 🔴 High |
| 2 | `indicator/number-card` | `remoteName` 前缀有 `deleted_` | 🔴 High |
| 3 | `media/image` | `i18n.en` 是 "图片" 应该是 "Image" | 🟡 Medium |
| 4 | `media/video-player` | `name` 是 "video-player" 应该是 "视频播放器" | 🟡 Medium |

---

## 修复详情

### 修复 1: basic/line 缺少 icon
- **原因**: 重新运行 `generate-registry.js` 后自动修复
- **结果**: ✅ icon 现在为 "Minus"

### 修复 2: indicator/number-card remoteName
- **文件**: `widgets/indicator/number-card/package.json`
- **变更**: 
  ```diff
  - "name": "deleted-thingsvis-widget-indicator-number-card"
  + "name": "thingsvis-widget-indicator-number-card"
  ```
- **结果**: ✅ remoteName 现在为 `thingsvis_widget_indicator_number_card`

### 修复 3: media/image i18n.en
- **文件**: `widgets/media/image/package.json`
- **变更**:
  ```diff
  "i18n": {
      "zh": "图片",
  -   "en": "图片"
  +   "en": "Image"
  }
  ```
- **结果**: ✅ i18n.en 现在为 "Image"

### 修复 4: media/video-player name
- **文件**: `widgets/media/video-player/src/metadata.ts`
- **变更**:
  ```diff
  export const metadata = {
    id: 'media-video-player',
  - name: '网络视频流',
  + name: '视频播放器',
    category: 'media',
    icon: 'Video',
    version: '1.0.0',
    defaultSize: { width: 400, height: 300 },
  };
  ```
- **结果**: ✅ name 现在为 "视频播放器"

---

## 验证结果

```bash
$ node scripts/validate-registry.js apps/studio/public/registry.json
Registry validated OK
```

✅ 所有修复已通过验证

---

## 修改的文件列表

1. `widgets/indicator/number-card/package.json`
2. `widgets/media/image/package.json`
3. `widgets/media/video-player/src/metadata.ts`
4. `apps/studio/public/registry.json` (重新生成)

---

## 后续建议

1. 运行 `pnpm build` 确保所有 widget 能正常构建
2. 在编辑器中测试这些 widget 是否能正常加载和显示
3. 考虑添加 CI 检查来防止类似问题再次发生
