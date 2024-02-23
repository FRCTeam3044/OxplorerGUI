import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
  packagerConfig: {
    // asar: {
    //   unpack:
    //     "{**/node_modules/java-bridge/**,node_modules/java-bridge-*/**,**/node_modules/java-libs/**}",
    // },
    asar: false,
  },
  rebuildConfig: {},
  //makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  makers: [new MakerZIP({}, ["linux"])],
  plugins: [
    //new AutoUnpackNativesPlugin({}),
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
