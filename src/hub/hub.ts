import "./index.css";
import { SnapMode, Vertex } from "../utils/structures";
import "toastify-js/src/toastify.css";

import AutoEditor from "./AutoEditor";
import PathEditor from "./PathEditor";

declare global {
  interface Window {
    files: {
      openFile: () => Promise<string>;
      openFileFromPath: (path: string) => Promise<string>;
      getRecentFiles: () => Promise<string[]>;
    };
    java: {
      generatePath: (start: Vertex, target: Vertex) => Promise<Vertex[]>;
      setPointSpacing: (spacing: number) => void;
      setCornerPointSpacing: (spacing: number) => void;
      setCornerDist: (distance: number) => void;
      setInjectPoints: (inject: boolean) => void;
      setNormalizeCorners: (normalize: boolean) => void;
      setCornerSplitPercent: (percent: number) => void;
      setRobotLength: (height: number) => void;
      setRobotWidth: (width: number) => void;
      setCornerCutDist: (dist: number) => void;
      setSnapMode: (snap: SnapMode) => void;
      getCornerPointSpacing: () => Promise<number>;
      getPointSpacing: () => Promise<number>;
      getCornerDist: () => Promise<number>;
      getInjectPoints: () => Promise<boolean>;
      getNormalizeCorners: () => Promise<boolean>;
      getCornerSplitPercent: () => Promise<number>;
      getSnapMode: () => Promise<SnapMode>;
    };
  }
}

const tabButtons = document.querySelectorAll(
  ".tab-button"
) as NodeListOf<HTMLButtonElement>;
const tabs = document.querySelectorAll(".tab");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.tabTarget);

    tabs.forEach((tab) => tab.classList.remove("active"));
    tabButtons.forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");
    target.classList.add("active");
  });
});

AutoEditor();
PathEditor();
