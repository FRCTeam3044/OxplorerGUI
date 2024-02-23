import "./vars.css";
import "./about.css";

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
