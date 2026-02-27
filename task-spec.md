# 任务规范：编辑器暗色模式与画布主题的彻底解耦

## 问题描述
编辑器的 `isDarkMode` 切换仍会影响画布区域，因为：
1. `.dark` class 在 Editor 根 `<div>` 上设置 Tailwind CSS 变量，这些变量**级联**到子元素 `.theme-*` 画布容器。
2. `.theme-dawn` / `.theme-midnight` 的 CSS 变量覆盖**不完整**——遗漏了 `--accent`, `--secondary`, `--input`, `--ring`, `--destructive`, `--primary` 等多个变量。
3. `toggleTheme` 还操作 `document.documentElement.classList`（`<html>` 元素），影响全局 Tailwind `dark:*` 前缀。

## 解决方案
**核心思路：让画布容器 `.theme-*` 建立完整的 CSS 变量隔离屏障，切断 `.dark` 的任何泄漏路径。**

### 子任务清单
- [x] **S1**: 在 `index.css` 中为 `.theme-dawn` 和 `.theme-midnight` **补全所有缺失的 Tailwind CSS 变量**（`--accent`, `--accent-foreground`, `--secondary`, `--secondary-foreground`, `--destructive`, `--destructive-foreground`, `--input`, `--ring`, `--primary`, `--primary-foreground`, `--chart-*`, `--radius`）
- [x] **S2**: 移除 `document.documentElement.classList.toggle("dark")` 操作，将 `dark` class 控制限制在 Editor 组件的根 `<div>` 内，防止全局污染
- [x] **S3**: 验证切换编辑器暗色/亮色模式时，画布区域的颜色完全不受影响

## 验收标准
1. 编辑器切换 dark/light 模式时，画布内的 widget 颜色不变
2. 画布 `.theme-dawn` 在 dark 编辑器下仍为亮色
3. 画布 `.theme-midnight` 在 light 编辑器下仍为深色
4. `pnpm build:widgets` 编译成功
