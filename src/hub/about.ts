import "./vars.css";
import "./about.css";
import { OXPLORER_VERSION } from "../utils/constants";

declare global {
  interface Window {
    aboutUtil: {
      getVersion: () => Promise<string>;
    };
  }
}

let versionSpan = document.querySelector("#version") as HTMLSpanElement;
window.aboutUtil.getVersion().then((version) => {
  versionSpan.textContent = version;
});

let oxplorerVersionSpan = document.querySelector(
  "#oxplorerVersion",
) as HTMLSpanElement;
oxplorerVersionSpan.textContent = OXPLORER_VERSION;
