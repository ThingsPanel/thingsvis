import { defineWidget, resolveWidgetColors } from "@thingsvis/widget-sdk";
import { controls } from "./controls";
import { metadata } from "./metadata";
import { PropsSchema, type Props } from "./schema";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

function withAlpha(color: string, alpha: number): string {
  const normalized = color.trim();
  const clamped = Math.max(0, Math.min(1, alpha));
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
    const parts = (rgbMatch[1] ?? "").split(",").map((item) => item.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0] ?? "0"}, ${parts[1] ?? "0"}, ${parts[2] ?? "0"}, ${clamped})`;
    }
  }

  return normalized;
}

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHeader(element: HTMLElement, props: Props) {
  const colors = resolveWidgetColors(element);
  const accent = props.accentColor || colors.primary;
  const lineColor = props.lineColor || colors.primary;
  const titleColor = props.titleColor || colors.fg;
  const subtitleColor = props.subtitleColor || withAlpha(titleColor, 0.72);
  const outerGlow = props.glow ? `0 0 18px ${withAlpha(accent, 0.22)}` : "none";

  if (props.variant === "ribbon") {
    const stripe = props.showStripe
      ? `<div style="position:absolute;inset:4px auto 4px 10px;width:${Math.min(props.stripeWidth, 56)}px;border-radius:${Math.max(2, props.borderRadius - 1)}px;background:repeating-linear-gradient(135deg, ${withAlpha(lineColor, 0.96)} 0 8px, transparent 8px 12px);opacity:0.9;"></div>`
      : "";
    const tail = props.showTail
      ? `<div style="position:absolute;right:22px;top:50%;width:92px;height:2px;transform:translateY(-50%);background:linear-gradient(90deg, ${withAlpha(lineColor, 0.88)}, transparent);"></div><div style="position:absolute;left:22px;top:50%;width:92px;height:2px;transform:translateY(-50%);background:linear-gradient(270deg, ${withAlpha(lineColor, 0.88)}, transparent);"></div>`
      : "";

    element.innerHTML = `
      <div style="
        position:relative;
        width:100%;
        height:100%;
        display:flex;
        align-items:center;
        justify-content:center;
        box-sizing:border-box;
        overflow:hidden;
        padding:${props.paddingY}px ${props.paddingX}px;
        border:1px solid ${withAlpha(lineColor, 0.36)};
        border-radius:${props.borderRadius}px;
        background:linear-gradient(180deg, ${withAlpha(props.backgroundColor, 1)}, ${withAlpha(props.backgroundColor, 0.56)});
        clip-path:polygon(7% 0, 93% 0, 85% 100%, 15% 100%);
        box-shadow:${outerGlow};
      ">
        ${stripe}
        ${tail}
        <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-align:center;">
          <div style="color:${titleColor};font-size:${props.fontSize}px;font-weight:700;line-height:1.1;letter-spacing:1px;white-space:nowrap;">${escapeHtml(props.title)}</div>
          ${props.subtitle ? `<div style="color:${subtitleColor};font-size:${props.subtitleFontSize}px;line-height:1;white-space:nowrap;">${escapeHtml(props.subtitle)}</div>` : ""}
        </div>
      </div>
    `;
    return;
  }

  const justify = props.align === "center" ? "center" : "flex-start";
  const textAlign = props.align === "center" ? "center" : "left";
  const stripe = props.showStripe
    ? `<div style="position:absolute;left:0;top:0;bottom:0;width:${props.stripeWidth}px;background:linear-gradient(90deg, ${withAlpha(lineColor, 0.32)}, transparent);overflow:hidden;"><div style="position:absolute;inset:4px auto 4px 6px;width:${Math.max(12, props.stripeWidth - 16)}px;background:repeating-linear-gradient(135deg, ${withAlpha(lineColor, 0.98)} 0 7px, transparent 7px 11px);border-radius:${Math.max(2, props.borderRadius - 1)}px;"></div></div>`
    : "";
  const tail = props.showTail
    ? `<div style="flex:1 1 auto;min-width:24px;height:2px;background:linear-gradient(90deg, ${withAlpha(lineColor, 0.95)}, ${withAlpha(lineColor, 0.08)});margin-left:14px;"></div>`
    : "";

  element.innerHTML = `
    <div style="
      position:relative;
      width:100%;
      height:100%;
      display:flex;
      align-items:center;
      justify-content:${justify};
      gap:0;
      box-sizing:border-box;
      overflow:hidden;
      padding:${props.paddingY}px ${props.paddingX}px;
      padding-left:${props.showStripe ? props.paddingX + props.stripeWidth : props.paddingX}px;
      border:1px solid ${withAlpha(lineColor, 0.22)};
      border-radius:${props.borderRadius}px;
      background:linear-gradient(90deg, ${withAlpha(props.backgroundColor, 0.96)}, ${withAlpha(props.backgroundColor, 0.22)} 78%, transparent);
      box-shadow:${outerGlow};
    ">
      ${stripe}
      <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:${props.align === "center" ? "center" : "flex-start"};justify-content:center;min-width:0;text-align:${textAlign};">
        <div style="color:${titleColor};font-size:${props.fontSize}px;font-weight:700;line-height:1.1;letter-spacing:0.5px;white-space:nowrap;">${escapeHtml(props.title)}</div>
        ${props.subtitle ? `<div style="margin-top:2px;color:${subtitleColor};font-size:${props.subtitleFontSize}px;line-height:1;white-space:nowrap;">${escapeHtml(props.subtitle)}</div>` : ""}
      </div>
      ${tail}
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
    renderHeader(element, props);

    return {
      update: (nextProps: Props) => {
        renderHeader(element, nextProps);
      },
      destroy: () => {
        element.innerHTML = "";
      },
    };
  },
});

export default Main;
