'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('shotsel', {
  onInit: (cb) => ipcRenderer.on('shot:init', (_e, d) => cb(d)),
  done: (rect) => ipcRenderer.send('shot:done', rect),
});
