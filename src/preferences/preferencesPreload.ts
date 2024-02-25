import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("prefs", {
  setTheme: (theme: string) => {
    ipcRenderer.invoke("setTheme", theme);
  },
  getPref: (pref: string, def: any) => {
    return ipcRenderer.invoke("getPref", pref, def);
  },
  setPref: (pref: string, value: any) => {
    ipcRenderer.invoke("setPref", pref, value);
  },
});
