import { createControlPanel } from "@thingsvis/widget-sdk";

const W = "widgets.thingsvis-widget-custom-section-header";

export const controls = createControlPanel()
  .addContentGroup((builder) => {
    builder.addTextInput("eyebrow", {
      label: `${W}.eyebrow`,
      binding: true
    });
    builder.addTextInput("title", {
      label: `${W}.title`,
      binding: true
    });
    builder.addTextInput("subtitle", {
      label: `${W}.subtitle`,
      binding: true
    });
  })
  .addStyleGroup((builder) => {
    builder.addColorPicker("accentColor", {
      label: `${W}.accentColor`,
      default: "",
      binding: true
    });
    builder.addColorPicker("titleColor", {
      label: `${W}.titleColor`,
      default: "",
      binding: true
    });
    builder.addColorPicker("subtitleColor", {
      label: `${W}.subtitleColor`,
      default: "",
      binding: true
    });
    builder.addSlider("eyebrowFontSize", {
      label: `${W}.eyebrowFontSize`,
      min: 8,
      max: 24,
      step: 1,
      default: 12
    });
    builder.addSlider("titleFontSize", {
      label: `${W}.titleFontSize`,
      min: 14,
      max: 64,
      step: 1,
      default: 32
    });
    builder.addSlider("subtitleFontSize", {
      label: `${W}.subtitleFontSize`,
      min: 10,
      max: 32,
      step: 1,
      default: 13
    });
  })
  .build();
