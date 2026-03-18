import { createControlPanel } from "@thingsvis/widget-sdk";

const W = "widgets.thingsvis-widget-custom-alert-list";

export const controls = createControlPanel()
  .addContentGroup((builder) => {
    builder.addJsonEditor("items", {
      label: `${W}.items`,
      binding: true
    });
    builder.addNumberInput("maxItems", {
      label: `${W}.maxItems`,
      min: 1,
      max: 100,
      default: 6
    });
    builder.addSwitch("showTime", {
      label: `${W}.showTime`,
      default: true
    });
    builder.addSwitch("showSource", {
      label: `${W}.showSource`,
      default: true
    });
    builder.addSwitch("showDetail", {
      label: `${W}.showDetail`,
      default: true
    });
    builder.addSwitch("compact", {
      label: `${W}.compact`,
      default: false
    });
    builder.addSwitch("autoScroll", {
      label: `${W}.autoScroll`,
      default: true
    });
    builder.addSelect("scrollSpeed", {
      label: `${W}.scrollSpeed`,
      options: [
        { label: { zh: "慢", en: "Slow" }, value: "slow" },
        { label: { zh: "正常", en: "Normal" }, value: "normal" },
        { label: { zh: "快", en: "Fast" }, value: "fast" }
      ]
    });
    builder.addSwitch("pauseOnHover", {
      label: `${W}.pauseOnHover`,
      default: true
    });
    builder.addTextInput("emptyText", {
      label: `${W}.emptyText`,
      binding: true
    });
  })
  .addStyleGroup((builder) => {
    builder.addSlider("titleFontSize", {
      label: `${W}.titleFontSize`,
      min: 10,
      max: 28,
      step: 1,
      default: 14
    });
    builder.addSlider("detailFontSize", {
      label: `${W}.detailFontSize`,
      min: 10,
      max: 24,
      step: 1,
      default: 12
    });
    builder.addSlider("timeFontSize", {
      label: `${W}.timeFontSize`,
      min: 10,
      max: 24,
      step: 1,
      default: 11
    });
    builder.addSlider("itemRadius", {
      label: `${W}.itemRadius`,
      min: 0,
      max: 32,
      step: 1,
      default: 16
    });
  })
  .build();
