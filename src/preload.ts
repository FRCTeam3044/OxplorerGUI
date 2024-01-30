// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { Vertex } from "./javaUtils/structures";
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  generatePath: async (start: Vertex, target: Vertex) => {
    return ipcRenderer.invoke("generatePath", start, target);
  },
});
