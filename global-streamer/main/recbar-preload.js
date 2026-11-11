'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('recbar', {
  stop: () => ipcRenderer.send('rec:bar-stop'),
  pause: () => ipcRenderer.send('rec:bar-pause'),
  hide: (h) => ipcRenderer.send('rec:bar-hide', !!h),
  onState: (cb) => ipcRenderer.on('rec:bar-state', (_e, st) => cb(st)),
  onCollapsed: (cb) => ipcRenderer.on('rec:bar-collapsed', (_e, c) => cb(!!c)),
});
