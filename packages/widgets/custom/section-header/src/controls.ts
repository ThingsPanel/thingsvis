import { createControlPanel } from "@thingsvis/widget-sdk";

const W = "editor.widgets.thingsvis-widget-custom-section-header";

export const controls = createControlPanel()
  .addContentGroup((builder) => {
    builder.addTextInput("title", {
      label: `${W}.title`,
      default: "分区标题",
    });
    builder.addTextInput("subtitle", {
      label: `${W}.subtitle`,
      default: "",
    });
    builder.addSelect("variant", {
      label: `${W}.variant`,
      options: [
        { label: { zh: "分区条", en: "Panel" }, value: "panel" },
        { label: { zh: "标题带", en: "Ribbon" }, value: "ribbon" },
      ],
      default: "panel",
    });
    builder.addSegmented("align", {
      label: `${W}.align`,
      options: [
        { label: { zh: "左对齐", en: "Left" }, value: "left", icon: "AlignLeft" },
        { label: { zh: "居中", en: "Center" }, value: "center", icon: "AlignCenter" },
      ],
    });
    builder.addSwitch("showStripe", {
      label: `${W}.showStripe`,
      default: true,
    });
    builder.addSwitch("showTail", {
      label: `${W}.showTail`,
      default: true,
    });
  })
  .addStyleGroup((builder) => {
    builder.addColorPicker("accentColor", {
      label: `${W}.accentColor`,
      default: "#ff2b7a",
    });
    builder.addColorPicker("lineColor", {
      label: `${W}.lineColor`,
      default: "#4ce7ff",
    });
    builder.addColorPicker("backgroundColor", {
      label: `${W}.backgroundColor`,
      default: "rgba(10,19,48,0.64)",
    });
    builder.addColorPicker("titleColor", {
      label: `${W}.titleColor`,
      default: "#eef7ff",
    });
    builder.addColorPicker("subtitleColor", {
      label: `${W}.subtitleColor`,
      default: "rgba(238,247,255,0.68)",
    });
    builder.addSlider("fontSize", {
      label: `${W}.fontSize`,
      min: 12,
      max: 42,
      step: 1,
      default: 18,
    });
    builder.addSlider("subtitleFontSize", {
      label: `${W}.subtitleFontSize`,
      min: 10,
      max: 24,
      step: 1,
      default: 12,
    });
    builder.addSlider("paddingX", {
      label: `${W}.paddingX`,
      min: 0,
      max: 48,
      step: 1,
      default: 14,
    });
    builder.addSlider("paddingY", {
      label: `${W}.paddingY`,
      min: 0,
      max: 32,
      step: 1,
      default: 8,
    });
    builder.addSlider("stripeWidth", {
      label: `${W}.stripeWidth`,
      min: 0,
      max: 96,
      step: 1,
      default: 42,
    });
    builder.addSlider("borderRadius", {
      label: `${W}.borderRadius`,
      min: 0,
      max: 20,
      step: 1,
      default: 4,
    });
    builder.addSwitch("glow", {
      label: `${W}.glow`,
      default: true,
    });
  })
  .build();
