// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { SnapMode, Vertex, WindowState } from "../utils/structures";
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipc", {
  on: (channel: string, func: (...args: any[]) => void) => {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
});
contextBridge.exposeInMainWorld("util", {
  updateWindowState: (state: WindowState) => {
    ipcRenderer.invoke("updateWindowState", state);
  },
  getTemplates: () => {
    return ipcRenderer.invoke("getTemplates");
  },
});
contextBridge.exposeInMainWorld("files", {
  saveFile(data: string, path: string) {
    return ipcRenderer.invoke("saveFile", data, path);
  },
  saveFileAs(data: string) {
    return ipcRenderer.invoke("saveFileAs", data);
  },
  newFile: () => {
    return ipcRenderer.invoke("newFile");
  },
  openFile: () => {
    return ipcRenderer.invoke("openFile");
  },
  openFileFromPath: (path: string) => {
    return ipcRenderer.invoke("openFileFromPath", path);
  },
  getRecentFiles: () => {
    return ipcRenderer.invoke("getRecentFiles");
  },
  getFileSeperator: () => {
    return ipcRenderer.invoke("getFileSeperator");
  },
});

contextBridge.exposeInMainWorld("java", {
  generatePath: async (start: Vertex, target: Vertex) => {
    return ipcRenderer.invoke("generatePath", start, target);
  },
  setUseTrajectories: (use: boolean) => {
    ipcRenderer.invoke("setUseTrajectories", use);
  },
  setPointSpacing: (spacing: number) => {
    ipcRenderer.invoke("setPointSpacing", spacing);
  },
  setCornerPointSpacing: (spacing: number) => {
    ipcRenderer.invoke("setCornerPointSpacing", spacing);
  },
  setCornerDist: (distance: number) => {
    ipcRenderer.invoke("setCornerDist", distance);
  },
  setInjectPoints: (inject: boolean) => {
    ipcRenderer.invoke("setInjectPoints", inject);
  },
  setNormalizeCorners: (normalize: boolean) => {
    ipcRenderer.invoke("setNormalizeCorners", normalize);
  },
  setCornerSplitPercent: (percent: number) => {
    ipcRenderer.invoke("setCornerSplitPercent", percent);
  },
  setRobotLength: (height: number) => {
    ipcRenderer.invoke("setRobotLength", height);
  },
  setRobotWidth: (width: number) => {
    ipcRenderer.invoke("setRobotWidth", width);
  },
  setCornerCutDist: (dist: number) => {
    ipcRenderer.invoke("setCornerCutDist", dist);
  },
  setSnapMode: (snap: SnapMode) => {
    ipcRenderer.invoke("setSnapMode", snap);
  },
  getPointSpacing: () => {
    return ipcRenderer.invoke("getPointSpacing");
  },
  getCornerPointSpacing: () => {
    return ipcRenderer.invoke("getCornerPointSpacing");
  },
  getCornerDist: () => {
    return ipcRenderer.invoke("getCornerDist");
  },
  getInjectPoints: () => {
    return ipcRenderer.invoke("getInjectPoints");
  },
  getNormalizeCorners: () => {
    return ipcRenderer.invoke("getNormalizeCorners");
  },
  getCornerSplitPercent: () => {
    return ipcRenderer.invoke("getCornerSplitPercent");
  },
  getSnapMode: () => {
    return ipcRenderer.invoke("getSnapMode");
  },
});
