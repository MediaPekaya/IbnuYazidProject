'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('recpre', {
  onInit: (cb) => ipcRenderer.on('pre:init', (_e, d) => cb(d)),
  resize: (w, h) => ipcRenderer.send('pre:resize', { w, h }),
  shot: () => ipcRenderer.send('pre:event', { type: 'shot' }),
  start: (mic) => ipcRenderer.send('pre:event', { type: 'start', mic }),
  cancel: () => ipcRenderer.send('pre:event', { type: 'cancel' }),
  drag: (phase, x, y) => ipcRenderer.send('pre:drag', { phase, x, y }),
});
