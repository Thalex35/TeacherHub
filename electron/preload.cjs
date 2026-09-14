const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  isElectron: true,
  openPresentation: (url, fileName) =>
    ipcRenderer.invoke("open-presentation", { url, fileName }),
});
