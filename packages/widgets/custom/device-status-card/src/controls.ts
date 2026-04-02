import { createControlPanel } from "@thingsvis/widget-sdk";

const W = "widgets.thingsvis-widget-custom-device-status-card";

export const controls = createControlPanel()
  .addContentGroup((builder) => {
    builder.addTextInput("title", { label: `${W}.title`, binding: true });
    builder.addTextInput("zone", { label: `${W}.zone`, binding: true });
    builder.addSelect("status", {
      label: `${W}.status`,
      options: [
        { label: { zh: "在线", en: "Online" }, value: "online" },
        { label: { zh: "告警", en: "Warning" }, value: "warning" },
        { label: { zh: "离线", en: "Offline" }, value: "offline" },
        { label: { zh: "维护", en: "Maintenance" }, value: "maintenance" }
      ]
    });
    builder.addTextInput("statusLabel", { label: `${W}.statusLabel`, binding: true });
    builder.addTextInput("primaryLabel", { label: `${W}.primaryLabel`, binding: true });
    builder.addTextInput("primaryValue", { label: `${W}.primaryValue`, binding: true });
    builder.addTextInput("primaryUnit", { label: `${W}.primaryUnit`, binding: true });
    builder.addTextInput("secondaryLabel", { label: `${W}.secondaryLabel`, binding: true });
    builder.addTextInput("secondaryValue", { label: `${W}.secondaryValue`, binding: true });
    builder.addTextInput("secondaryUnit", { label: `${W}.secondaryUnit`, binding: true });
    builder.addSlider("progress", {
      label: `${W}.progress`,
      min: 0,
      max: 100,
      step: 1,
      default: 63
    });
    builder.addSwitch("compact", {
      label: `${W}.compact`,
      default: false
    });
  })
  .addStyleGroup((builder) => {
    builder.addColorPicker("progressColor", {
      label: `${W}.progressColor`,
      default: "",
      binding: true
    });
    builder.addSlider("titleFontSize", {
      label: `${W}.titleFontSize`,
      min: 10,
      max: 32,
      step: 1,
      default: 16
    });
    builder.addSlider("metaFontSize", {
      label: `${W}.metaFontSize`,
      min: 10,
      max: 24,
      step: 1,
      default: 12
    });
    builder.addSlider("valueFontSize", {
      label: `${W}.valueFontSize`,
      min: 14,
      max: 48,
      step: 1,
      default: 30
    });
  })
  .build();
