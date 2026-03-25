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

const STATUS_COLORS: Record<Props["statusTone"], string> = {
  normal: "#18dcff",
  warning: "#f7c948",
  fault: "#ff2b7a",
  offline: "#7f8ea3",
};

function renderCard(element: HTMLElement, props: Props) {
  const colors = resolveWidgetColors(element);
  const toneColor = props.accentColor || STATUS_COLORS[props.statusTone] || colors.primary;
  const borderColor = props.statusTone === "fault"
    ? withAlpha("#ff2b7a", 0.7)
    : props.borderColor || withAlpha(toneColor, 0.38);
  const outerGlow = props.glow ? `0 0 16px ${withAlpha(toneColor, 0.18)}` : "none";
  const activeOn = props.activeButton === "on";
  const inactiveText = props.disabled ? withAlpha(props.titleColor, 0.38) : withAlpha(props.titleColor, 0.58);
  const statusColor = props.statusTone === "fault" ? "#ff4d88" : STATUS_COLORS[props.statusTone] || toneColor;
  const containerOpacity = props.disabled ? 0.62 : 1;

  const onButtonStyle = activeOn
    ? `background:linear-gradient(180deg, ${withAlpha(toneColor, 0.92)}, ${withAlpha(toneColor, 0.48)});color:#ffffff;border:1px solid ${withAlpha(toneColor, 0.88)};box-shadow:0 0 12px ${withAlpha(toneColor, 0.32)};`
    : `background:${withAlpha(props.inactiveColor, 1)};color:${inactiveText};border:1px solid ${withAlpha(props.inactiveColor, 0.92)};`;
  const offButtonStyle = !activeOn
    ? `background:linear-gradient(180deg, ${withAlpha(statusColor, 0.88)}, ${withAlpha(statusColor, 0.38)});color:#ffffff;border:1px solid ${withAlpha(statusColor, 0.82)};box-shadow:0 0 12px ${withAlpha(statusColor, 0.22)};`
    : `background:${withAlpha(props.inactiveColor, 1)};color:${inactiveText};border:1px solid ${withAlpha(props.inactiveColor, 0.92)};`;

  element.innerHTML = `
    <div style="
      position:relative;
      width:100%;
      height:100%;
      display:flex;
      flex-direction:column;
      justify-content:flex-start;
      box-sizing:border-box;
      overflow:hidden;
      opacity:${containerOpacity};
      padding:${props.padding}px;
      border-radius:${props.borderRadius}px;
      border:1px solid ${borderColor};
      background:linear-gradient(180deg, ${withAlpha(props.backgroundColor, 0.98)}, ${withAlpha(props.backgroundColor, 0.62)} 72%, ${withAlpha(props.backgroundColor, 0.34)});
      box-shadow:${outerGlow};
    ">
      <div style="position:absolute;left:0;top:0;right:0;height:5px;background:linear-gradient(90deg, ${withAlpha(statusColor, 0.96)}, ${withAlpha(statusColor, 0.28)} 68%, transparent);"></div>
      <div style="position:absolute;left:10px;top:7px;width:64px;height:8px;background:repeating-linear-gradient(135deg, ${withAlpha(props.titleColor, 0.9)} 0 6px, transparent 6px 10px);opacity:0.9;"></div>
      <div style="display:flex;align-items:center;justify-content:center;min-height:42px;padding-top:10px;text-align:center;">
        <div style="color:${props.titleColor};font-size:${props.fontSize}px;font-weight:700;line-height:1.2;letter-spacing:0.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(props.title)}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;">
        <div style="
          width:calc(50% - 4px);
          min-width:54px;
          height:32px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${props.buttonFontSize}px;
          font-weight:700;
          clip-path:polygon(14% 0, 100% 0, 86% 100%, 0 100%);
          ${onButtonStyle}
        ">${escapeHtml(props.onLabel)}</div>
        <div style="
          width:calc(50% - 4px);
          min-width:54px;
          height:32px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${props.buttonFontSize}px;
          font-weight:700;
          clip-path:polygon(14% 0, 100% 0, 86% 100%, 0 100%);
          ${offButtonStyle}
        ">${escapeHtml(props.offLabel)}</div>
      </div>
      ${props.showStatus ? `<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;color:${statusColor};font-size:${Math.max(11, props.buttonFontSize - 1)}px;font-weight:600;line-height:1;"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${statusColor};box-shadow:0 0 8px ${withAlpha(statusColor, 0.4)};"></span><span>${escapeHtml(props.statusText)}</span></div>` : ""}
      <div style="position:absolute;left:50%;bottom:6px;width:36px;height:2px;transform:translateX(-50%);background:linear-gradient(90deg, transparent, ${withAlpha(props.titleColor, 0.86)}, transparent);"></div>
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
    renderCard(element, props);

    return {
      update: (nextProps: Props) => {
        renderCard(element, nextProps);
      },
      destroy: () => {
        element.innerHTML = "";
      },
    };
  },
});

export default Main;
