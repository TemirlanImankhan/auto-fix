const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("autoFixDesktop", {
  saveSiteUrl: (siteUrl) => ipcRenderer.invoke("autofix:save-site-url", siteUrl),
});
