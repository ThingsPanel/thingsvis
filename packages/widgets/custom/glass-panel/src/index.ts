import { defineWidget, resolveWidgetColors, type WidgetColors } from "@thingsvis/widget-sdk";
import { controls } from "./controls";
import { metadata } from "./metadata";
import { PropsSchema, type Props, PRESETS } from "./schema";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function withAlpha(color: string | undefined | null, alpha: number): string {
  const normalized = String(color ?? "").trim();
  if (!normalized) {
    return `rgba(255, 255, 255, ${clamp(alpha, 0, 1)})`;
  }
  const clamped = clamp(alpha, 0, 1);
  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const raw = hexMatch[1] ?? "";
    const full = raw.length === 3 ? raw.split("").map((item) => item + item).join("") : raw;
    const int = Number.parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamped})`;
  }

  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const channelString = rgbMatch[1] ?? "";
    const parts = channelString.split(",").map((item) => item.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0] ?? "0"}, ${parts[1] ?? "0"}, ${parts[2] ?? "0"}, ${clamped})`;
    }
  }

  return normalized;
}

function getPresetValues(props: Props): {
  blur: number;
  opacity: number;
  highlight: number;
  tint: number;
  color: string;
} {
  const preset = PRESETS[props.preset];
  if (preset) {
    return {
      blur: preset.blur,
      opacity: preset.opacity,
      highlight: preset.highlight,
      tint: preset.tint,
      color: preset.color
    };
  }
  // 自定义模式 - 使用滑块值，颜色默认蓝
  return {
    blur: props.blurStrength,
    opacity: props.surfaceOpacity,
    highlight: props.highlightOpacity,
    tint: props.tintStrength,
    color: "#60a5fa"
  };
}

function renderPanel(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const preset = getPresetValues(props);
  const tintColor = preset.color;

  // 各层透明度计算
  const topLayer = withAlpha("#ffffff", clamp(preset.opacity + preset.highlight * 0.5, 0, 1));
  const midLayer = withAlpha("#ffffff", preset.opacity);
  const bottomLayer = withAlpha("#ffffff", Math.max(preset.opacity * 0.55, 0.06));

  // 色调层
  const tintLayer = withAlpha(tintColor, clamp(preset.tint * 1.3, 0, 0.9));
  const sideGlow = withAlpha(tintColor, clamp(preset.tint, 0, 0.8));
  const bottomTint = withAlpha(tintColor, clamp(preset.tint * 0.8, 0, 0.65));

  // 高光和阴影
  const topGlow = withAlpha("#ffffff", clamp(preset.highlight * 1.2, 0, 1));
  const softShade = withAlpha(colors.bg || "#0f172a", Math.min(preset.opacity * 0.12, 0.08));
  const innerHighlight = withAlpha("#ffffff", 0.22 + preset.highlight * 0.5);
  const lowerHighlight = withAlpha("#ffffff", preset.highlight * 0.1);
  const edgeShade = withAlpha(colors.bg || "#0f172a", 0.02 + preset.tint * 0.03);

  //  Frost 纹理（仅在高光较高时显示）
  const frostTexture = withAlpha("#ffffff", 0.01 + preset.highlight * 0.04);

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: visible;
    border-radius: inherit;
  `;

  element.innerHTML = `
    <div style="
      width:100%;
      height:100%;
      border-radius:inherit;
      overflow:hidden;
      position:relative;
      box-sizing:border-box;
      background:
        /* 左上角高光 */
        radial-gradient(circle at 5% 5%, ${topGlow} 0%, transparent 40%),
        /* 右上角色调光晕 */
        radial-gradient(ellipse at 95% 10%, ${sideGlow} 0%, transparent 50%),
        /* 底部色调阴影 */
        radial-gradient(ellipse at 50% 100%, ${bottomTint} 0%, transparent 60%),
        /* 底部环境阴影 */
        radial-gradient(ellipse at 50% 120%, ${softShade} 0%, transparent 50%),
        /* 主体白色层 */
        linear-gradient(165deg, ${topLayer} 0%, ${midLayer} 45%, ${bottomLayer} 100%),
        /* 主色调覆盖层 */
        linear-gradient(160deg, ${tintLayer} 0%, transparent 65%);
      backdrop-filter: blur(${preset.blur}px) saturate(185%) brightness(1.06);
      -webkit-backdrop-filter: blur(${preset.blur}px) saturate(185%) brightness(1.06);
      box-shadow:
        inset 0 1px 0 ${innerHighlight},
        inset 0 -1px 0 ${lowerHighlight},
        inset 1px 0 0 ${withAlpha("#ffffff", preset.highlight * 0.08)},
        0 4px 20px rgba(0, 0, 0, ${0.15 + preset.opacity * 0.15});
    ">
      ${preset.highlight > 0.15 ? `
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background:
          repeating-linear-gradient(
            135deg,
            ${frostTexture} 0 2px,
            transparent 2px 6px
          );
        mix-blend-mode:overlay;
        opacity:0.6;
        pointer-events:none;
      "></div>` : ''}
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background:
          linear-gradient(180deg, ${withAlpha("#ffffff", preset.highlight * 0.4)} 0%, transparent 20%, transparent 80%, ${edgeShade} 100%);
        pointer-events:none;
      "></div>
    </div>
  `;
}

export const Main = defineWidget({
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: metadata.defaultSize,
  constraints: metadata.constraints,
  resizable: metadata.resizable,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props) => {
    let currentProps = props;
    let colors = resolveWidgetColors(element);

    renderPanel(element, currentProps, colors);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderPanel(element, currentProps, colors);
      });
      observer.observe(element);
    }

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        colors = resolveWidgetColors(element);
        renderPanel(element, currentProps, colors);
      },
      destroy: () => {
        observer?.disconnect();
        element.innerHTML = "";
      }
    };
  }
});

export default Main;
