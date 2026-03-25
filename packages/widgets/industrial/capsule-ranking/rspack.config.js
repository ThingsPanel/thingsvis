const { createWidgetConfig } = require('@thingsvis/widget-config');

module.exports = createWidgetConfig(__dirname, {
  port: 3211,
  exposes: {
    './Main': './src/index.ts',
  },
});
