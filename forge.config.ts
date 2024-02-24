import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";
import MakerDMG from "@electron-forge/maker-dmg";
import MakerAppImage from "electron-forge-maker-appimage";

const config: ForgeConfig = {
  packagerConfig: {
    // asar: {
    //   unpack:
    //     "{**/node_modules/java-bridge/**,node_modules/java-bridge-*/**,**/node_modules/java-libs/**}",
    // },
    asar: false,
    icon: "./src/icons/icon",
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      setupIcon: "./src/icons/icon.ico",
    }),
    new MakerDMG({
      icon: "./src/icons/icon.icns",
      name: "OxplorerGUI",
    }),
    new MakerRpm({
      options: {
        name: "OxplorerGUI",
        productName: "OxplorerGUI",
        bin: "OxplorerGUI",
        icon: "./src/icons/png/512x512.png",
      },
    }),
    new MakerDeb({
      options: {
        name: "OxplorerGUI",
        productName: "OxplorerGUI",
        bin: "OxplorerGUI",
        icon: "./src/icons/png/512x512.png",
      },
    }),
    new MakerAppImage({
      options: {
        name: "OxplorerGUI",
        productName: "OxplorerGUI",
        bin: "OxplorerGUI",
        icon: "./src/icons/png/512x512.png",
      },
    }),
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/hub/index.html",
            js: "./src/hub/hub.ts",
            name: "main_window",
            preload: {
              js: "./src/main/preload.ts",
            },
          },
          {
            html: "./src/hub/preferences.html",
            js: "./src/hub/preferences.ts",
            name: "preferences_window",
            preload: {
              js: "./src/main/preferencesPreload.ts",
            },
          },
          {
            html: "./src/hub/about.html",
            name: "about_window",
            js: "./src/hub/about.ts",
            preload: {
              js: "./src/main/aboutPreload.ts",
            },
          },
        ],
      },
    }),
    {
      name: "@timfish/forge-externals-plugin",
      config: {
        externals: ["java-bridge"],
        includeDeps: true,
      },
    },
  ],
};

export default config;
