const { createWidgetConfig } = require("@thingsvis/widget-config");
const path = require("path");
const rspack = require("@rspack/core");

const config = createWidgetConfig(__dirname, {
  port: 3325,
});

config.plugins.push(
  new rspack.CopyRspackPlugin({
    patterns: [
      {
        from: path.join(__dirname, "node_modules/three/examples/jsm/libs/draco/gltf"),
        to: "draco",
        globOptions: {
          ignore: ["**/draco_encoder.js"],
        },
      },
    ],
  }),
);

module.exports = config;
