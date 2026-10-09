const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('atelierDesktop', {
  readStore: () => ipcRenderer.invoke('store-read'),
  writeStore: raw => ipcRenderer.invoke('store-write', raw),
  document: (html, name, print) => ipcRenderer.invoke('document', {html, name, print}),
});
