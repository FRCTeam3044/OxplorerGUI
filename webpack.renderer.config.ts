import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }],
});

const myPlugins = [
  ...plugins,
  new CopyWebpackPlugin({
    patterns: [{ from: "src/img", to: "main_window/static/img" }],
  }),
];

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins: myPlugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
  },
};
