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
  noise: number;
} {
  const preset = PRESETS[props.preset];
  if (preset) {
    return {
      blur: preset.blur,
      opacity: preset.opacity,
      highlight: preset.highlight,
      tint: preset.tint,
      color: preset.color,
      noise: preset.noise
    };
  }
  // 自定义模式
  return {
    blur: props.blurStrength,
    opacity: props.surfaceOpacity,
    highlight: props.highlightOpacity,
    tint: props.tintStrength,
    color: "#60a5fa",
    noise: 0.04
  };
}

function renderPanel(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const preset = getPresetValues(props);
  const tintColor = preset.color;

  // 各层透明度计算 - 更通透
  const topLayer = withAlpha("#ffffff", clamp(preset.opacity + preset.highlight * 0.55, 0, 0.95));
  const midLayer = withAlpha("#ffffff", preset.opacity);
  const bottomLayer = withAlpha("#ffffff", Math.max(preset.opacity * 0.45, 0.04));

  // 色调层 - 更自然
  const tintLayer = withAlpha(tintColor, clamp(preset.tint * 1.4, 0, 0.85));
  const sideGlow = withAlpha(tintColor, clamp(preset.tint * 1.1, 0, 0.75));
  const bottomTint = withAlpha(tintColor, clamp(preset.tint * 0.9, 0, 0.7));

  // 高光和阴影 - 更柔和
  const topGlow = withAlpha("#ffffff", clamp(preset.highlight * 1.3, 0, 1));
  const softShade = withAlpha(colors.bg || "#0f172a", Math.min(preset.opacity * 0.08, 0.05));
  const innerHighlight = withAlpha("#ffffff", 0.28 + preset.highlight * 0.55);
  const lowerHighlight = withAlpha("#ffffff", preset.highlight * 0.08);
  const edgeShade = withAlpha(colors.bg || "#0f172a", 0.015 + preset.tint * 0.02);

  // 噪点纹理强度
  const noiseOpacity = preset.noise;

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
        /* 顶部主高光 */
        radial-gradient(ellipse at 30% 0%, ${topGlow} 0%, transparent 55%),
        /* 右上角色调光晕 */
        radial-gradient(ellipse at 90% 15%, ${sideGlow} 0%, transparent 45%),
        /* 底部色调渐变 */
        radial-gradient(ellipse at 50% 100%, ${bottomTint} 0%, transparent 55%),
        /* 底部环境阴影 - 更淡 */
        radial-gradient(ellipse at 50% 130%, ${softShade} 0%, transparent 40%),
        /* 主体渐变 - 角度更柔和 */
        linear-gradient(170deg, ${topLayer} 0%, ${midLayer} 50%, ${bottomLayer} 100%),
        /* 主色调覆盖 */
        linear-gradient(155deg, ${tintLayer} 0%, transparent 70%);
      backdrop-filter: blur(${preset.blur}px) saturate(190%) brightness(1.08);
      -webkit-backdrop-filter: blur(${preset.blur}px) saturate(190%) brightness(1.08);
      box-shadow:
        /* 顶部内发光 */
        inset 0 1.5px 0 ${innerHighlight},
        /* 底部内阴影 */
        inset 0 -1px 0 ${lowerHighlight},
        /* 左侧微光 */
        inset 1px 0 0 ${withAlpha("#ffffff", preset.highlight * 0.06)},
        /* 外阴影 - 更柔和 */
        0 8px 32px rgba(0, 0, 0, ${0.08 + preset.opacity * 0.12}),
        0 2px 8px rgba(0, 0, 0, ${0.04 + preset.opacity * 0.08});
    ">
      <!-- 微噪点纹理层 - 模拟真实玻璃表面的微观粗糙 -->
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background-image: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><filter id=\"noise\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23noise)\" opacity=\"0.5\"/></svg>');
        background-size: 150px 150px;
        opacity:${noiseOpacity};
        mix-blend-mode:overlay;
        pointer-events:none;
      "></div>
      
      <!-- 细腻斜纹 - 更淡更密 -->
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background:
          repeating-linear-gradient(
            125deg,
            transparent 0,
            transparent 2px,
            ${withAlpha("#ffffff", noiseOpacity * 0.5)} 2px,
            ${withAlpha("#ffffff", noiseOpacity * 0.5)} 3px,
            transparent 3px,
            transparent 5px
          );
        mix-blend-mode:soft-light;
        pointer-events:none;
      "></div>
      
      <!-- 边缘高光渐变 -->
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background:
          linear-gradient(180deg, 
            ${withAlpha("#ffffff", preset.highlight * 0.5)} 0%, 
            transparent 15%, 
            transparent 85%, 
            ${edgeShade} 100%
          );
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
