import { createControlPanel } from "@thingsvis/widget-sdk";

const W = "editor.widgets.thingsvis-widget-custom-device-control-card";

export const controls = createControlPanel()
  .addContentGroup((builder) => {
    builder.addTextInput("title", {
      label: `${W}.title`,
      default: "NO.1补水泵",
    });
    builder.addTextInput("statusText", {
      label: `${W}.statusText`,
      default: "运行",
    });
    builder.addSegmented("activeButton", {
      label: `${W}.activeButton`,
      options: [
        { label: { zh: "开", en: "On" }, value: "on", icon: "Power" },
        { label: { zh: "关", en: "Off" }, value: "off" },
      ],
    });
    builder.addSelect("statusTone", {
      label: `${W}.statusTone`,
      options: [
        { label: { zh: "正常", en: "Normal" }, value: "normal" },
        { label: { zh: "预警", en: "Warning" }, value: "warning" },
        { label: { zh: "故障", en: "Fault" }, value: "fault" },
        { label: { zh: "离线", en: "Offline" }, value: "offline" },
      ],
      default: "normal",
    });
    builder.addTextInput("onLabel", {
      label: `${W}.onLabel`,
      default: "开",
    });
    builder.addTextInput("offLabel", {
      label: `${W}.offLabel`,
      default: "关",
    });
    builder.addSwitch("showStatus", {
      label: `${W}.showStatus`,
      default: false,
    });
    builder.addSwitch("disabled", {
      label: `${W}.disabled`,
      default: false,
    });
  })
  .addStyleGroup((builder) => {
    builder.addColorPicker("accentColor", {
      label: `${W}.accentColor`,
      default: "#18dcff",
    });
    builder.addColorPicker("titleColor", {
      label: `${W}.titleColor`,
      default: "#eef7ff",
    });
    builder.addColorPicker("backgroundColor", {
      label: `${W}.backgroundColor`,
      default: "rgba(10,19,48,0.62)",
    });
    builder.addColorPicker("borderColor", {
      label: `${W}.borderColor`,
      default: "rgba(24,220,255,0.35)",
    });
    builder.addColorPicker("inactiveColor", {
      label: `${W}.inactiveColor`,
      default: "rgba(109,127,152,0.42)",
    });
    builder.addSlider("fontSize", {
      label: `${W}.fontSize`,
      min: 12,
      max: 30,
      step: 1,
      default: 15,
    });
    builder.addSlider("buttonFontSize", {
      label: `${W}.buttonFontSize`,
      min: 10,
      max: 26,
      step: 1,
      default: 13,
    });
    builder.addSlider("padding", {
      label: `${W}.padding`,
      min: 0,
      max: 24,
      step: 1,
      default: 12,
    });
    builder.addSlider("borderRadius", {
      label: `${W}.borderRadius`,
      min: 0,
      max: 16,
      step: 1,
      default: 6,
    });
    builder.addSwitch("glow", {
      label: `${W}.glow`,
      default: true,
    });
  })
  .build();
