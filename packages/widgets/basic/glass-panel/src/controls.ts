import { createControlPanel } from "@thingsvis/widget-sdk";

const W = "widgets.thingsvis-widget-custom-glass-panel";

export const controls = createControlPanel()
  .addStyleGroup((builder) => {
    builder.addSelect("preset", {
      label: `${W}.preset`,
      options: [
        { label: { zh: "通透玻璃", en: "Clear Glass" }, value: "clear" },
        { label: { zh: "标准磨砂", en: "Frosted Glass" }, value: "frosted" },
        { label: { zh: "高遮挡玻璃", en: "Dense Glass" }, value: "dense" }
      ]
    });

    builder.addSlider("blur", {
      label: `${W}.blur`,
      min: 0,
      max: 40,
      step: 1,
      default: 18
    });

    builder.addSlider("fillOpacity", {
      label: `${W}.fillOpacity`,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.16
    });

    builder.addColorPicker("tintColor", {
      label: `${W}.tintColor`,
      default: "#ffffff"
    });

    builder.addSlider("tintStrength", {
      label: `${W}.tintStrength`,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0
    });

    builder.addSlider("highlight", {
      label: `${W}.highlight`,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.28
    });

    builder.addSlider("noise", {
      label: `${W}.noise`,
      min: 0,
      max: 0.12,
      step: 0.005,
      default: 0.025
    });
  })
  .build();
