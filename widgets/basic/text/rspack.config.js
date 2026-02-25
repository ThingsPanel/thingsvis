const { createWidgetConfig } = require('../../../configs/rspack-widget.config.js');

module.exports = createWidgetConfig(__dirname, { port: process.env.WIDGET_PORT });


