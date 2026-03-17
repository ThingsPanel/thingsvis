import { defineWidget, resolveWidgetColors, type WidgetColors } from "@thingsvis/widget-sdk";
import { controls } from "./controls";
import { metadata } from "./metadata";
import { PropsSchema, type Props } from "./schema";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

type VariantName = Props["variant"];

const VARIANT_TINTS: Record<VariantName, string> = {
  neutral: "#ffffff",
  blue: "#dbeafe",
  warm: "#fde7d8",
  cyan: "#d9f6ff",
  emerald: "#ddfbea",
  amber: "#feedd6"
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

function renderPanel(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const tint = VARIANT_TINTS[props.variant] ?? VARIANT_TINTS.neutral;
  const topLayer = withAlpha("#ffffff", clamp(props.surfaceOpacity + props.highlightOpacity * 0.45, 0, 1));
  const midLayer = withAlpha("#ffffff", props.surfaceOpacity);
  const bottomLayer = withAlpha("#ffffff", Math.max(props.surfaceOpacity * 0.62, 0.08));
  const tintLayer = withAlpha(tint, props.tintStrength);
  const topGlow = withAlpha("#ffffff", props.highlightOpacity);
  const softShade = withAlpha(colors.bg || "#dbe4ee", Math.min(props.surfaceOpacity * 0.12, 0.08));

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
  `;

  element.innerHTML = `
    <div style="
      width:100%;
      height:100%;
      border-radius:${props.cornerRadius}px;
      overflow:hidden;
      background:
        radial-gradient(circle at top left, ${topGlow} 0%, transparent 42%),
        linear-gradient(180deg, ${topLayer} 0%, ${midLayer} 34%, ${bottomLayer} 100%),
        linear-gradient(135deg, ${tintLayer} 0%, transparent 70%),
        linear-gradient(180deg, transparent 0%, ${softShade} 100%);
      backdrop-filter: blur(${props.blurStrength}px) saturate(150%) brightness(1.03);
      -webkit-backdrop-filter: blur(${props.blurStrength}px) saturate(150%) brightness(1.03);
    "></div>
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
