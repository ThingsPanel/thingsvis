import { createControlPanel } from "@thingsvis/widget-sdk";

const W = "widgets.thingsvis-widget-custom-glass-panel";

export const controls = createControlPanel()
  .addStyleGroup((builder) => {
    // 风格模式：控制立体感程度
    builder.addSelect("styleMode", {
      label: `${W}.styleMode`,
      options: [
        { label: { zh: "🧊 玻璃立体（多层光影）", en: "🧊 Glass (Multi-layer)" }, value: "glass" },
        { label: { zh: "⬜ 微质感扁平（推荐）", en: "⬜ Flat Micro (Recommended)" }, value: "flat" },
        { label: { zh: "▭ 极简线条（仅边框）", en: "▭ Line Only" }, value: "line" }
      ]
    });

    // 精品预设选择 - 基础质感+色调
    builder.addSelect("preset", {
      label: `${W}.preset`,
      options: [
        // 水晶系列 - 高透高亮
        { label: { zh: "💎 水晶白（最通透）", en: "💎 Crystal White" }, value: "crystal-white" },
        { label: { zh: "💎 水晶蓝（科技冷调）", en: "💎 Crystal Blue" }, value: "crystal-blue" },
        { label: { zh: "💎 水晶紫（高端优雅）", en: "💎 Crystal Purple" }, value: "crystal-purple" },
        // 磨砂系列 - 平衡柔和
        { label: { zh: "🧊 磨砂白（推荐）", en: "🧊 Frost White" }, value: "frost-white" },
        { label: { zh: "🧊 磨砂暖（温暖亲和）", en: "🧊 Frost Warm" }, value: "frost-warm" },
        // 极简系列
        { label: { zh: "✨ 极简白（最轻薄）", en: "✨ Minimal White" }, value: "minimal-white" },
        // 半实心系列
        { label: { zh: "🔲 半实心（强遮挡）", en: "🔲 Solid White" }, value: "solid-white" },
        // 自定义基准
        { label: { zh: "⚙️ 自定义基准", en: "⚙️ Custom Base" }, value: "custom" }
      ]
    });

    // 微调滑块 - 始终生效，基于预设进行偏移
    builder.addSlider("blurOffset", {
      label: `${W}.blurOffset`,
      min: -10,
      max: 10,
      step: 1,
      default: 0
    });
    builder.addSlider("opacityOffset", {
      label: `${W}.opacityOffset`,
      min: -0.3,
      max: 0.3,
      step: 0.01,
      default: 0
    });
    builder.addSlider("highlightOffset", {
      label: `${W}.highlightOffset`,
      min: -0.3,
      max: 0.3,
      step: 0.01,
      default: 0
    });
    builder.addSlider("tintOffset", {
      label: `${W}.tintOffset`,
      min: -0.3,
      max: 0.3,
      step: 0.01,
      default: 0
    });
  })
  .build();
