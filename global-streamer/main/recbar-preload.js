'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('recbar', { stop: () => ipcRenderer.send('rec:bar-stop') });
