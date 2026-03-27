const { createWidgetConfig } = require('@thingsvis/widget-config');
module.exports = createWidgetConfig(__dirname, { port: 3406, exposes: { './Main': './src/index.ts' } });
