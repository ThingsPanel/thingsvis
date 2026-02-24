const { createWidgetConfig } = require('../../../configs/rspack-widget.config.js');

module.exports = createWidgetConfig(__dirname, {
  port: {{DEV_SERVER_PORT}}
});


