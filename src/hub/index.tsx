import React from "react";
import ReactDOM from "react-dom";
import { Template } from "../utils/structures";
import { WindowState } from "../utils/structures";
import { Vertex } from "../utils/structures";
import { SnapMode } from "../utils/structures";
import Hub from "./hub";
import { createRoot } from "react-dom/client";

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
      setUseTrajectories: (use: boolean) => void;
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

const container = document.getElementById("app");
const root = createRoot(container!);
root.render(<Hub />);
