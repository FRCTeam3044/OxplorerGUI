import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("aboutUtil", {
  getVersion: () => {
    return ipcRenderer.invoke("getVersion");
  },
});
