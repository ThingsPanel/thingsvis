import { defineWidget, resolveWidgetColors, type WidgetColors } from "@thingsvis/widget-sdk";
import { controls } from "./controls";
import { metadata } from "./metadata";
import { PropsSchema, type Props, PRESETS, computeFinalValues } from "./schema";
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
  const basePreset = PRESETS[props.preset] ?? PRESETS["frost-white"];
  // 使用偏移量计算最终值
  return computeFinalValues(
    basePreset,
    props.blurOffset,
    props.opacityOffset,
    props.highlightOffset,
    props.tintOffset
  );
}

/**
 * 🧊 玻璃立体模式 - 多层高光、内发光、纹理
 */
function renderGlassMode(preset: ReturnType<typeof getPresetValues>, colors: WidgetColors): string {
  const tintColor = preset.color;
  
  const topLayer = withAlpha("#ffffff", clamp(preset.opacity + preset.highlight * 0.55, 0, 0.95));
  const midLayer = withAlpha("#ffffff", preset.opacity);
  const bottomLayer = withAlpha("#ffffff", Math.max(preset.opacity * 0.45, 0.04));
  const tintLayer = withAlpha(tintColor, clamp(preset.tint * 1.4, 0, 0.85));
  const sideGlow = withAlpha(tintColor, clamp(preset.tint * 1.1, 0, 0.75));
  const bottomTint = withAlpha(tintColor, clamp(preset.tint * 0.9, 0, 0.7));
  const topGlow = withAlpha("#ffffff", clamp(preset.highlight * 1.3, 0, 1));
  const innerHighlight = withAlpha("#ffffff", 0.28 + preset.highlight * 0.55);
  const lowerHighlight = withAlpha("#ffffff", preset.highlight * 0.08);
  const edgeShade = withAlpha(colors.bg || "#0f172a", 0.015 + preset.tint * 0.02);
  const noiseOpacity = preset.noise;

  return `
    <div style="
      width:100%;
      height:100%;
      border-radius:inherit;
      overflow:hidden;
      position:relative;
      box-sizing:border-box;
      background:
        radial-gradient(ellipse at 50% 0%, ${topGlow} 0%, transparent 60%),
        radial-gradient(ellipse at 0% 20%, ${sideGlow} 0%, transparent 40%),
        radial-gradient(ellipse at 100% 20%, ${sideGlow} 0%, transparent 40%),
        radial-gradient(ellipse at 50% 100%, ${bottomTint} 0%, transparent 50%),
        linear-gradient(180deg, ${topLayer} 0%, ${midLayer} 40%, ${bottomLayer} 100%),
        linear-gradient(160deg, ${tintLayer} 0%, transparent 65%);
      backdrop-filter: blur(${preset.blur}px) saturate(200%) brightness(1.12);
      -webkit-backdrop-filter: blur(${preset.blur}px) saturate(200%) brightness(1.12);
      box-shadow:
        inset 0 1.5px 0 ${innerHighlight},
        inset 0 -1px 0 ${lowerHighlight},
        inset 1px 0 0 ${withAlpha("#ffffff", preset.highlight * 0.06)},
        0 8px 32px rgba(0, 0, 0, ${0.06 + preset.opacity * 0.1}),
        0 4px 12px rgba(0, 0, 0, ${0.03 + preset.opacity * 0.06}),
        inset 0 0 20px ${withAlpha("#ffffff", preset.highlight * 0.15)};
    ">
      <!-- 玻璃纹理层 -->
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background:
          radial-gradient(circle at 25% 25%, ${withAlpha("#ffffff", noiseOpacity)} 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, ${withAlpha("#ffffff", noiseOpacity * 0.8)} 1px, transparent 1px),
          radial-gradient(circle at 50% 50%, ${withAlpha("#ffffff", noiseOpacity * 0.6)} 0.5px, transparent 0.5px);
        background-size: 50px 50px, 40px 40px, 30px 30px;
        mix-blend-mode:overlay;
        pointer-events:none;
      "></div>
      
      <!-- 细腻斜纹 -->
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background:
          repeating-linear-gradient(
            125deg,
            transparent 0px,
            transparent 3px,
            ${withAlpha("#ffffff", noiseOpacity * 0.4)} 3px,
            ${withAlpha("#ffffff", noiseOpacity * 0.4)} 4px,
            transparent 4px,
            transparent 7px
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

/**
 * ⬜ 微质感扁平模式 - 单层模糊，仅外阴影，现代简洁
 */
function renderFlatMode(preset: ReturnType<typeof getPresetValues>, colors: WidgetColors): string {
  const tintColor = preset.color;
  
  // 扁平模式：降低高光影响，简化层次
  const flatOpacity = Math.min(preset.opacity * 0.8, 0.25);
  const baseLayer = withAlpha("#ffffff", flatOpacity);
  const subtleTint = withAlpha(tintColor, preset.tint * 0.6);
  const noiseOpacity = preset.noise * 0.5;

  return `
    <div style="
      width:100%;
      height:100%;
      border-radius:inherit;
      overflow:hidden;
      position:relative;
      box-sizing:border-box;
      background:
        linear-gradient(180deg, ${baseLayer} 0%, ${withAlpha("#ffffff", flatOpacity * 0.7)} 100%),
        linear-gradient(160deg, ${subtleTint} 0%, transparent 60%);
      backdrop-filter: blur(${Math.max(8, preset.blur * 0.6)}px) saturate(140%);
      -webkit-backdrop-filter: blur(${Math.max(8, preset.blur * 0.6)}px) saturate(140%);
      box-shadow:
        0 4px 24px rgba(0, 0, 0, ${0.08 + flatOpacity * 0.15}),
        0 2px 8px rgba(0, 0, 0, ${0.04 + flatOpacity * 0.08});
    ">
      <!-- 轻微纹理 -->
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background:
          radial-gradient(circle at 30% 30%, ${withAlpha("#ffffff", noiseOpacity)} 1px, transparent 1px);
        background-size: 60px 60px;
        mix-blend-mode:overlay;
        opacity:0.6;
        pointer-events:none;
      "></div>
    </div>
  `;
}

/**
 * ⬜ 极简线条模式 - 仅边框，无模糊，最轻量
 */
function renderLineMode(preset: ReturnType<typeof getPresetValues>, colors: WidgetColors): string {
  const tintColor = preset.color;
  const themeFg = colors.fg || "#f1f5f9";
  
  // 线条模式：提取边框颜色（优先使用色调，其次文字色）
  const borderColor = preset.tint > 0.1 
    ? withAlpha(tintColor, 0.4 + preset.opacity * 0.3)
    : withAlpha(themeFg, 0.15 + preset.opacity * 0.2);
  
  const bgOpacity = Math.min(preset.opacity * 0.3, 0.1);

  return `
    <div style="
      width:100%;
      height:100%;
      border-radius:inherit;
      overflow:hidden;
      position:relative;
      box-sizing:border-box;
      background: ${withAlpha("#ffffff", bgOpacity)};
      border: 1.5px solid ${borderColor};
      box-shadow: none;
    "></div>
  `;
}

function renderPanel(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const preset = getPresetValues(props);
  
  let content: string;
  switch (props.styleMode) {
    case "flat":
      content = renderFlatMode(preset, colors);
      break;
    case "line":
      content = renderLineMode(preset, colors);
      break;
    case "glass":
    default:
      content = renderGlassMode(preset, colors);
      break;
  }

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: visible;
    border-radius: inherit;
  `;

  element.innerHTML = content;
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
