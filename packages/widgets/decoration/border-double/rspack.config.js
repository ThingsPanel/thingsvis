const { createWidgetConfig } = require('@thingsvis/widget-config');
module.exports = createWidgetConfig(__dirname, { port: 3403, exposes: { './Main': './src/index.ts' } });
