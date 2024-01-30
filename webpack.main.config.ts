import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";
import CopyPlugin from "copy-webpack-plugin";
import nodeExternals from "webpack-node-externals";

let myPlugins = [
  ...plugins,
  new CopyPlugin({
    patterns: [{ from: "./oxplorer-0.7.1-all.jar", to: "." }, { from: "./node_modules/java-bridge/java-src/build/libs/JavaBridge-2.1.1.jar", to: "../java-src/build/libs" }],
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
  }
};
