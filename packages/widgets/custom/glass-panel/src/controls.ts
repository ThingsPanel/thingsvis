import { createControlPanel } from "@thingsvis/widget-sdk";

const W = "widgets.thingsvis-widget-custom-glass-panel";

export const controls = createControlPanel()
  .addStyleGroup((builder) => {
    builder.addSelect("variant", {
      label: `${W}.variant`,
      options: [
        { label: { zh: "中性白", en: "Neutral" }, value: "neutral" },
        { label: { zh: "冷蓝", en: "Blue" }, value: "blue" },
        { label: { zh: "暖光", en: "Warm" }, value: "warm" },
        { label: { zh: "青蓝", en: "Cyan" }, value: "cyan" },
        { label: { zh: "翡翠", en: "Emerald" }, value: "emerald" },
        { label: { zh: "琥珀", en: "Amber" }, value: "amber" }
      ]
    });
    builder.addSelect("preset", {
      label: `${W}.preset`,
      options: [
        { label: { zh: "💎 水晶质感", en: "💎 Crystal" }, value: "crystal" },
        { label: { zh: "🧊 磨砂玻璃", en: "🧊 Frost" }, value: "frost" },
        { label: { zh: "🔲 半实心", en: "🔲 Solid" }, value: "solid" },
        { label: { zh: "✨ 极简轻薄", en: "✨ Minimal" }, value: "minimal" },
        { label: { zh: "⚙️ 自定义", en: "⚙️ Custom" }, value: "custom" }
      ]
    });
    builder.addSlider("blurStrength", {
      label: `${W}.blurStrength`,
      min: 0,
      max: 40,
      step: 1,
      default: 24
    });
    builder.addSlider("surfaceOpacity", {
      label: `${W}.surfaceOpacity`,
      min: 0.05,
      max: 1,
      step: 0.01,
      default: 0.22
    });
    builder.addSlider("highlightOpacity", {
      label: `${W}.highlightOpacity`,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.32
    });
    builder.addSlider("tintStrength", {
      label: `${W}.tintStrength`,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.35
    });
  })
  .build();
