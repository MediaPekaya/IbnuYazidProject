'use strict';
const { contextBridge, ipcRenderer, webUtils } = require('electron');

/* Jambatan selamat antara antara muka dan proses utama. Hanya fungsi yang diperlukan didedahkan. */
contextBridge.exposeInMainWorld('gsNative', {
  isNative: true,
  pathOf: (file) => { try { return webUtils.getPathForFile(file) || ''; } catch (e) { return ''; } },
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
    select: (id, opts) => ipcRenderer.invoke('sources:select', id, opts),
  },
  app: {
    info: () => ipcRenderer.invoke('app:info'),
    checkUpdate: () => ipcRenderer.invoke('update:check'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    enableUpdate: (on) => ipcRenderer.invoke('update:enable', on),
    onUpdate: (cb) => ipcRenderer.on('update:event', (_e, d) => cb(d)),
  },
  tts: {
    fetch: (kind, params) => ipcRenderer.invoke('tts:fetch', kind, params),
    eleven: (op, params) => ipcRenderer.invoke('tts:eleven', op, params),
  },
  ai: {
    chat: (params) => ipcRenderer.invoke('ai:chat', params),
    stt: (params) => ipcRenderer.invoke('ai:stt', params),
  },
  rec: {
    open: () => ipcRenderer.invoke('rec:open'),
    chunk: (buf) => ipcRenderer.send('rec:chunk', buf),
    close: () => ipcRenderer.invoke('rec:close'),
    reveal: (f) => ipcRenderer.invoke('rec:reveal', f),
    bar: (on) => ipcRenderer.invoke('rec:bar', on),
    onStopRequest: (cb) => ipcRenderer.on('rec:stop-request', () => cb()),
  },
  win: {
    minimize: () => ipcRenderer.invoke('app:minimize'),
    restore: () => ipcRenderer.invoke('app:restore'),
  },
  voice: {
    available: () => ipcRenderer.invoke('voice:available'),
    start: (source, cfg) => ipcRenderer.invoke('voice:start', source, cfg),
    stop: (source) => ipcRenderer.invoke('voice:stop', source),
    pcm: (source, data) => ipcRenderer.send('voice:pcm', source, data),
    say: (text, opts) => ipcRenderer.invoke('voice:say', text, opts),
    onEvent: (cb) => ipcRenderer.on('voice:event', (_e, d) => cb(d)),
  },
  onStreamEvent: (cb) => ipcRenderer.on('stream:event', (_e, data) => cb(data)),
});
