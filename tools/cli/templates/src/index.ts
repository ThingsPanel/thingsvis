/**
 * Widget entry point — built with @thingsvis/widget-sdk defineWidget API
 *
 * ─── 主题颜色规范 ────────────────────────────────────────────────────────────
 * 读取主题颜色必须使用 resolveWidgetColors(element)，它从 CSS 自定义属性
 * (--w-fg / --w-bg / --w-primary / --w-series-N 等) 读取当前主题的 token 值。
 *
 * 监听主题切换（切换画布主题时触发重渲）：
 *   const themeTarget = element.closest('[data-canvas-theme]');
 *   if (themeTarget) {
 *     new MutationObserver(() => {
 *       colors = resolveWidgetColors(element);
 *       redraw();
 *     }).observe(themeTarget, { attributes: true, attributeFilter: ['data-canvas-theme'] });
 *   }
 *
 * ⛔ 禁止：
 *   - 使用 ctx.theme 或 ctx?.theme 判断颜色（该字段不可靠，fallback 永远是某个固定值）
 *   - 硬编码 isDark ? '#xxx' : '#yyy' 之类的颜色分支
 *
 * 参考：packages/widgets/chart/echarts-line/src/index.ts
 * ────────────────────────────────────────────────────────────────────────────
 */

import { defineWidget } from '@thingsvis/widget-sdk';
import { PropsSchema, type Props } from './schema';
import { metadata } from './metadata';
import { controls } from './controls';

import zh from './locales/zh.json';
import en from './locales/en.json';

export const Main = defineWidget({
  ...metadata,

  schema: PropsSchema,
  locales: { zh, en },
  controls,

  render: (el: HTMLElement, props: Props) => {
    const box = document.createElement('div');
    box.style.width = '100%';
    box.style.height = '100%';
    box.style.backgroundColor = props.fill;
    box.style.opacity = String(props.opacity);
    el.appendChild(box);

    return {
      update: (newProps: Props) => {
        box.style.backgroundColor = newProps.fill;
        box.style.opacity = String(newProps.opacity);
      },
      destroy: () => {
        el.innerHTML = '';
      },
    };
  },
});

export default Main;
