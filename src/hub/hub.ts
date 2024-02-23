import "./vars.css";
import "./hub.css";
import { SnapMode, Template, Vertex, WindowState } from "../utils/structures";
import "toastify-js/src/toastify.css";

import * as AutoEditor from "./AutoEditor";
import * as PathEditor from "./PathEditor";

declare global {
  interface Window {
    ipc: {
      on: (channel: string, func: (...args: any[]) => void) => void;
    };
    util: {
      updateWindowState: (state: WindowState) => void;
      getTemplates: () => Promise<Template[]>;
    };
    files: {
      openFile: () => Promise<{
        data: string;
        path: string;
      }>;
      newFile: () => Promise<{
        data: string;
        path: string;
      }>;
      saveFile: (data: string, path: string) => Promise<void>;
      saveFileAs: (data: string) => Promise<string>;
      openFileFromPath: (path: string) => Promise<string>;
      getRecentFiles: () => Promise<string[]>;
      getFileSeperator: () => Promise<string>;
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

    if (button.dataset.tabTarget === "#autoeditor") {
      AutoEditor.onFocus();
    } else if (button.dataset.tabTarget === "#patheditor") {
      PathEditor.onFocus();
    }
  });
});

AutoEditor.initialize();
AutoEditor.onFocus();
PathEditor.initialize();

function isAutoEditorActive() {
  return (
    (document.querySelector(".tab-button.active") as HTMLButtonElement).dataset
      .tabTarget === "#autoeditor"
  );
}

window.ipc.on("openFile", async () => {
  if (isAutoEditorActive()) {
    AutoEditor.open();
  }
});

window.ipc.on("saveFile", async () => {
  if (isAutoEditorActive()) {
    AutoEditor.save();
  }
});

window.ipc.on("newFile", async () => {
  if (isAutoEditorActive()) {
    AutoEditor.new();
  }
});

window.ipc.on("saveFileAs", async () => {
  if (isAutoEditorActive()) {
    AutoEditor.saveAs();
  }
});

window.ipc.on("importTemplates", async (commands: Template[]) => {
  if (isAutoEditorActive()) {
    AutoEditor.importTemplates(commands);
  }
});

window.ipc.on("undo", async () => {
  if (isAutoEditorActive()) {
    AutoEditor.undo();
  }
});

window.ipc.on("redo", async () => {
  if (isAutoEditorActive()) {
    AutoEditor.redo();
  }
});
