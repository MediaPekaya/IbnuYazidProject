'use strict';
const { contextBridge, ipcRenderer } = require('electron');

/* Jambatan selamat antara antara muka dan proses utama. Hanya fungsi yang diperlukan didedahkan. */
contextBridge.exposeInMainWorld('gsNative', {
  isNative: true,
  vault: {
    get: (id) => ipcRenderer.invoke('vault:get', id),
    set: (id, value) => ipcRenderer.invoke('vault:set', id, value),
  },
  stream: {
    start: (cfg) => ipcRenderer.invoke('stream:start', cfg),
    chunk: (buf) => ipcRenderer.send('stream:chunk', buf),
    stop: () => ipcRenderer.invoke('stream:stop'),
  },
  sources: {
    list: () => ipcRenderer.invoke('sources:list'),
    select: (id) => ipcRenderer.invoke('sources:select', id),
  },
  app: {
    info: () => ipcRenderer.invoke('app:info'),
    checkUpdate: () => ipcRenderer.invoke('update:check'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    enableUpdate: (on) => ipcRenderer.invoke('update:enable', on),
    onUpdate: (cb) => ipcRenderer.on('update:event', (_e, d) => cb(d)),
  },
  onStreamEvent: (cb) => ipcRenderer.on('stream:event', (_e, data) => cb(data)),
});
