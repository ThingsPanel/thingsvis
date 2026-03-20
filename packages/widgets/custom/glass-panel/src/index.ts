import { defineWidget, resolveWidgetColors, type WidgetColors } from "@thingsvis/widget-sdk";
import { controls } from "./controls";
import { metadata } from "./metadata";
import { PropsSchema, type Props, PRESETS } from "./schema";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

type VariantName = Props["variant"];

const VARIANT_TINTS: Record<VariantName, string> = {
  neutral: "#f8fbff",
  blue: "#dbeafe",
  warm: "#fde8dc",
  cyan: "#dbf5ff",
  emerald: "#dcf7eb",
  amber: "#fff0d8"
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

function getPresetValues(props: Props): { blur: number; opacity: number; highlight: number; tint: number } {
  const preset = PRESETS[props.preset];
  if (props.preset !== "custom" && preset) {
    return { blur: preset.blur, opacity: preset.opacity, highlight: preset.highlight, tint: preset.tint };
  }
  return { 
    blur: props.blurStrength, 
    opacity: props.surfaceOpacity, 
    highlight: props.highlightOpacity, 
    tint: props.tintStrength 
  };
}

function renderPanel(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const preset = getPresetValues(props);
  const tint = VARIANT_TINTS[props.variant] ?? VARIANT_TINTS.neutral;
  const topLayer = withAlpha("#ffffff", clamp(preset.opacity + preset.highlight * 0.45, 0, 1));
  const midLayer = withAlpha("#ffffff", preset.opacity);
  const bottomLayer = withAlpha("#ffffff", Math.max(preset.opacity * 0.6, 0.08));
  const tintLayer = withAlpha(tint, clamp(preset.tint * 1.2, 0, 0.85));
  const topGlow = withAlpha("#ffffff", clamp(preset.highlight * 1.1, 0, 1));
  const sideGlow = withAlpha(tint, clamp(preset.tint * 0.9, 0, 0.75));
  const bottomTint = withAlpha(tint, clamp(preset.tint * 0.7, 0, 0.6));
  const softShade = withAlpha(colors.bg || "#dbe4ee", Math.min(preset.opacity * 0.14, 0.1));
  const ambientShadow = withAlpha("#0f172a", 0.04 + preset.opacity * 0.06);
  const innerHighlight = withAlpha("#ffffff", 0.2 + preset.highlight * 0.45);
  const lowerHighlight = withAlpha("#ffffff", preset.highlight * 0.12);
  const frostTexture = withAlpha("#ffffff", 0.015 + preset.highlight * 0.05);
  const edgeShade = withAlpha(colors.bg || "#dbe4ee", 0.025 + preset.tint * 0.04);


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
        /* Top-left white glow */
        radial-gradient(circle at top left, ${topGlow} 0%, transparent 42%),
        /* Top-right tinted glow - stronger */
        radial-gradient(ellipse at 85% 15%, ${sideGlow} 0%, transparent 45%),
        /* Bottom tinted shade - stronger */
        radial-gradient(ellipse at 50% 120%, ${bottomTint} 0%, transparent 55%),
        /* Base surface layers */
        linear-gradient(180deg, ${topLayer} 0%, ${midLayer} 38%, ${bottomLayer} 100%),
        /* Main color tint wash */
        linear-gradient(160deg, ${tintLayer} 0%, transparent 60%),
        /* Bottom edge tint */
        linear-gradient(0deg, ${bottomTint} 0%, transparent 50%);
      backdrop-filter: blur(${preset.blur}px) saturate(180%) brightness(1.05);
      -webkit-backdrop-filter: blur(${preset.blur}px) saturate(180%) brightness(1.05);
      box-shadow:
        inset 0 1px 0 ${innerHighlight},
        inset 0 -1px 0 ${lowerHighlight},
        inset 1px 0 0 ${withAlpha("#ffffff", preset.highlight * 0.1)};
    ">
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background:
          repeating-linear-gradient(
            135deg,
            ${frostTexture} 0 2px,
            transparent 2px 7px
          );
        mix-blend-mode:soft-light;
        opacity:0.5;
        pointer-events:none;
      "></div>
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        background:
          linear-gradient(180deg, ${withAlpha("#ffffff", preset.highlight * 0.34)} 0%, transparent 24%, transparent 76%, ${edgeShade} 100%);
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
