import { defineWidget, resolveWidgetColors, type WidgetColors } from "@thingsvis/widget-sdk";
import { controls } from "./controls";
import { metadata } from "./metadata";
import { PropsSchema, type Props, resolveGlassValues } from "./schema";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function withAlpha(color: string | undefined | null, alpha: number): string {
  const normalized = String(color ?? "").trim();
  const clamped = clamp(alpha, 0, 1);
  if (!normalized) {
    return `rgba(255, 255, 255, ${clamped})`;
  }

  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const raw = hexMatch[1] ?? "";
    const full = raw.length === 3 ? raw.split("").map((item) => item + item).join("") : raw;
    const int = Number.parseInt(full, 16);
    return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${clamped})`;
  }

  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = (rgbMatch[1] ?? "").split(",").map((item) => item.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0] ?? "255"}, ${parts[1] ?? "255"}, ${parts[2] ?? "255"}, ${clamped})`;
    }
  }

  return normalized;
}

function renderPanel(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const glass = resolveGlassValues(props);
  const fill = withAlpha("#ffffff", glass.fillOpacity);
  const fillSoft = withAlpha("#ffffff", glass.fillOpacity * 0.62);
  const tint = withAlpha(glass.tintColor, glass.fillOpacity * glass.tintStrength);
  const tintGlow = withAlpha(glass.tintColor, glass.tintStrength * 0.18);
  const topHighlight = withAlpha("#ffffff", glass.highlight * 0.7);
  const edgeHighlight = withAlpha("#ffffff", glass.highlight * 0.5);
  const innerShade = withAlpha(colors.bg || "#0f172a", 0.08);
  const noiseDot = withAlpha("#ffffff", glass.noise);
  const noiseLine = withAlpha("#ffffff", glass.noise * 0.35);
  const shadowAlpha = 0.08 + glass.fillOpacity * 0.12;

  element.style.cssText = `
    width:100%;
    height:100%;
    box-sizing:border-box;
    overflow:visible;
    border-radius:inherit;
  `;

  element.innerHTML = `
    <div style="
      position:relative;
      width:100%;
      height:100%;
      box-sizing:border-box;
      overflow:hidden;
      border-radius:inherit;
      background:
        radial-gradient(ellipse at 50% 0%, ${topHighlight} 0%, transparent 58%),
        radial-gradient(ellipse at 18% 12%, ${tintGlow} 0%, transparent 42%),
        linear-gradient(180deg, ${fill} 0%, ${fillSoft} 100%),
        linear-gradient(135deg, ${tint} 0%, transparent 68%);
      border:1px solid ${withAlpha("#ffffff", 0.16 + glass.highlight * 0.34)};
      backdrop-filter:blur(${glass.blur}px) saturate(180%);
      -webkit-backdrop-filter:blur(${glass.blur}px) saturate(180%);
      box-shadow:
        inset 0 1px 0 ${edgeHighlight},
        inset 0 -1px 0 ${innerShade},
        0 10px 30px rgba(15, 23, 42, ${shadowAlpha}),
        0 2px 8px rgba(15, 23, 42, ${shadowAlpha * 0.55});
    ">
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        pointer-events:none;
        background:
          radial-gradient(circle at 24% 28%, ${noiseDot} 1px, transparent 1px),
          radial-gradient(circle at 72% 64%, ${withAlpha("#ffffff", glass.noise * 0.75)} 1px, transparent 1px);
        background-size:48px 48px, 36px 36px;
        mix-blend-mode:overlay;
      "></div>
      <div style="
        position:absolute;
        inset:0;
        border-radius:inherit;
        pointer-events:none;
        background:linear-gradient(120deg, transparent 0%, ${noiseLine} 45%, transparent 58%);
        opacity:${clamp(glass.highlight * 0.55, 0, 0.5)};
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

    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest("[data-canvas-theme]");
    if (themeTarget && typeof MutationObserver !== "undefined") {
      themeObserver = new MutationObserver(() => {
        colors = resolveWidgetColors(element);
        renderPanel(element, currentProps, colors);
      });
      themeObserver.observe(themeTarget, { attributes: true, attributeFilter: ["data-canvas-theme"] });
    }

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        colors = resolveWidgetColors(element);
        renderPanel(element, currentProps, colors);
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = "";
      }
    };
  }
});

export default Main;
