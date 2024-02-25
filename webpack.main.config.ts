import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";
import CopyPlugin from "copy-webpack-plugin";
import { OXPLORER_VERSION } from "./src/utils/constants";

let myPlugins = [
  ...plugins,
  new CopyPlugin({
    patterns: [
      {
        from: `./src/java-libs/oxplorer-${OXPLORER_VERSION}-all.jar`,
        to: `./java-libs/oxplorer-${OXPLORER_VERSION}-all.jar`,
      },
      {
        from: "./node_modules/java-bridge/java-src/build/libs/JavaBridge-2.1.1.jar",
        to: "../java-src/build/libs/JavaBridge-2.1.1.jar",
      },
      { from: "src/icons", to: "../icons" },
    ],
  }),
];

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/index.ts",
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: myPlugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
  },
};
