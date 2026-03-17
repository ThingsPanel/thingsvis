import { createControlPanel } from "@thingsvis/widget-sdk";

const W = "widgets.thingsvis-widget-custom-glass-panel";

export const controls = createControlPanel()
  .addStyleGroup((builder) => {
    builder.addSelect("variant", {
      label: `${W}.variant`,
      options: [
        { label: { zh: "中性白", en: "Neutral" }, value: "neutral" },
        { label: { zh: "冷蓝", en: "Blue" }, value: "blue" },
        { label: { zh: "暖光", en: "Warm" }, value: "warm" }
      ]
    });
    builder.addSlider("cornerRadius", {
      label: `${W}.cornerRadius`,
      min: 0,
      max: 64,
      step: 1,
      default: 20
    });
    builder.addSlider("blurStrength", {
      label: `${W}.blurStrength`,
      min: 0,
      max: 40,
      step: 1,
      default: 22
    });
    builder.addSlider("surfaceOpacity", {
      label: `${W}.surfaceOpacity`,
      min: 0.05,
      max: 1,
      step: 0.01,
      default: 0.36
    });
    builder.addSlider("highlightOpacity", {
      label: `${W}.highlightOpacity`,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.28
    });
    builder.addSlider("tintStrength", {
      label: `${W}.tintStrength`,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.08
    });
  })
  .build();
