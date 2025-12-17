const { createPluginConfig } = require('../../../configs/rspack-plugin.config.js');

module.exports = createPluginConfig(__dirname, {
  port: {{DEV_SERVER_PORT}}
});


