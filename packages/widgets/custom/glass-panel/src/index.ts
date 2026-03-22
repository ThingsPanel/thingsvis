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
  const fallbackPreset = PRESETS["frost-white"]!;
  const basePreset = PRESETS[props.preset] ?? fallbackPreset;
  // 使用偏移量计算最终值
  return computeFinalValues(
    basePreset,
    props.blurOffset,
    props.opacityOffset,
    props.highlightOffset,
    props.tintOffset
  );
}

function renderPanel(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const preset = getPresetValues(props);
  const tintColor = preset.color;
  
  // 文字颜色：优先使用用户设置，其次继承主题
  const textColor = props.textColor || colors.fg || "#f1f5f9";

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
    color: ${textColor};
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
        /* 顶部主高光 - 更大更柔和 */
        radial-gradient(ellipse at 50% 0%, ${topGlow} 0%, transparent 60%),
        /* 左上角色调光晕 */
        radial-gradient(ellipse at 0% 20%, ${sideGlow} 0%, transparent 40%),
        /* 右上角色调光晕 */
        radial-gradient(ellipse at 100% 20%, ${sideGlow} 0%, transparent 40%),
        /* 底部色调渐变 */
        radial-gradient(ellipse at 50% 100%, ${bottomTint} 0%, transparent 50%),
        /* 主体渐变 - 更均匀 */
        linear-gradient(180deg, ${topLayer} 0%, ${midLayer} 40%, ${bottomLayer} 100%),
        /* 主色调覆盖 */
        linear-gradient(160deg, ${tintLayer} 0%, transparent 65%);
      backdrop-filter: blur(${preset.blur}px) saturate(200%) brightness(1.12);
      -webkit-backdrop-filter: blur(${preset.blur}px) saturate(200%) brightness(1.12);
      box-shadow:
        /* 顶部内发光 */
        inset 0 1.5px 0 ${innerHighlight},
        /* 底部内阴影 */
        inset 0 -1px 0 ${lowerHighlight},
        /* 左侧微光 */
        inset 1px 0 0 ${withAlpha("#ffffff", preset.highlight * 0.06)},
        /* 外阴影 - 更柔和 */
        0 8px 32px rgba(0, 0, 0, ${0.06 + preset.opacity * 0.1}),
        0 4px 12px rgba(0, 0, 0, ${0.03 + preset.opacity * 0.06}),
        /* 边缘发光 */
        inset 0 0 20px ${withAlpha("#ffffff", preset.highlight * 0.15)};
    ">
      <!-- 玻璃纹理层 - 模拟真实磨砂玻璃效果 -->
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background:
          /* 细密噪点纹理 */
          radial-gradient(circle at 25% 25%, ${withAlpha("#ffffff", noiseOpacity)} 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, ${withAlpha("#ffffff", noiseOpacity * 0.8)} 1px, transparent 1px),
          radial-gradient(circle at 50% 50%, ${withAlpha("#ffffff", noiseOpacity * 0.6)} 0.5px, transparent 0.5px);
        background-size: 50px 50px, 40px 40px, 30px 30px;
        mix-blend-mode:overlay;
        pointer-events:none;
      "></div>
      
      <!-- 细腻斜纹 - 模拟磨砂玻璃加工痕迹 -->
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
