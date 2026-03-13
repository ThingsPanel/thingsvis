const { createWidgetConfig } = require('@thingsvis/widget-config');

module.exports = createWidgetConfig(__dirname, { port: process.env.WIDGET_PORT });


