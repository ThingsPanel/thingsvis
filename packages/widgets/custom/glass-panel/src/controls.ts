import { createControlPanel } from "@thingsvis/widget-sdk";

const W = "widgets.thingsvis-widget-custom-glass-panel";

export const controls = createControlPanel()
  .addStyleGroup((builder) => {
    // 精品预设选择 - 一个下拉框搞定质感和色调
    builder.addSelect("preset", {
      label: `${W}.preset`,
      options: [
        // 水晶系列
        { label: { zh: "💎 水晶白", en: "💎 Crystal White" }, value: "crystal-white" },
        { label: { zh: "💎 水晶蓝", en: "💎 Crystal Blue" }, value: "crystal-blue" },
        { label: { zh: "💎 水晶紫", en: "💎 Crystal Purple" }, value: "crystal-purple" },
        // 磨砂系列
        { label: { zh: "🧊 磨砂白", en: "🧊 Frost White" }, value: "frost-white" },
        { label: { zh: "🧊 磨砂暖", en: "🧊 Frost Warm" }, value: "frost-warm" },
        // 极简系列
        { label: { zh: "✨ 极简白", en: "✨ Minimal White" }, value: "minimal-white" },
        // 半实心系列
        { label: { zh: "🔲 半实心白", en: "🔲 Solid White" }, value: "solid-white" },
        // 自定义
        { label: { zh: "⚙️ 自定义", en: "⚙️ Custom" }, value: "custom" }
      ]
    });

    // 自定义参数滑块（仅在自定义预设时生效）
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
