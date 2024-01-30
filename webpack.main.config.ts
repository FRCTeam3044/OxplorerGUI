import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";
import CopyPlugin from "copy-webpack-plugin";

let myPlugins = [
  ...plugins,
  new CopyPlugin({
    patterns: [{ from: "./oxplorer-0.7.1-all.jar", to: "." }],
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
  externals: {
    java: "commonjs java",
  },
};
