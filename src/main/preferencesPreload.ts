import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("prefs", {
  setTheme: (theme: string) => {
    ipcRenderer.invoke("setTheme", theme);
  },
  getTheme: () => {
    return ipcRenderer.invoke("getTheme");
  },
});
