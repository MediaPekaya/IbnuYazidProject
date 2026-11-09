/* Global Streamer - proses utama Electron (app Windows).
 * STATUS: kerangka Fasa 2, BELUM diuji pada PC Windows sebenar. */
'use strict';
const { app, BrowserWindow, ipcMain, safeStorage, session, desktopCapturer, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { StreamEngine } = require('./stream-engine');

// Penting untuk siaran: jangan perlahankan tab bila tetingkap tidak fokus.
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

let win = null;
const engine = new StreamEngine((ev) => { if (win && !win.isDestroyed()) win.webContents.send('stream:event', ev); });

/* ---------- simpanan key disulitkan (OS) ---------- */
const vaultFile = () => path.join(app.getPath('userData'), 'vault.json');
function readVault() { try { return JSON.parse(fs.readFileSync(vaultFile(), 'utf8')); } catch (e) { return {}; } }
const VALID_IDS = new Set(['tiktok', 'facebook', 'youtube', 'custom']);

ipcMain.handle('vault:get', (_e, id) => {
  if (!VALID_IDS.has(id)) return '';
  const raw = readVault()[id];
  if (!raw || !safeStorage.isEncryptionAvailable()) return '';
  try { return safeStorage.decryptString(Buffer.from(raw, 'base64')); } catch (e) { return ''; }
});
ipcMain.handle('vault:set', (_e, id, value) => {
  if (!VALID_IDS.has(id) || typeof value !== 'string' || value.length > 512) return false;
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Penyulitan OS tidak tersedia pada PC ini.');
  const v = readVault();
  if (value) v[id] = safeStorage.encryptString(value).toString('base64');
  else delete v[id];
  fs.writeFileSync(vaultFile(), JSON.stringify(v), { mode: 0o600 });
  return true;
});

/* ---------- siaran ---------- */
ipcMain.handle('stream:start', (_e, cfg) => engine.start(cfg));
ipcMain.on('stream:chunk', (_e, buf) => engine.write(buf));
ipcMain.handle('stream:stop', () => engine.stop());

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 960, minWidth: 1100, minHeight: 660,
    backgroundColor: '#04070f', title: 'Global Streamer', show: false, autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      backgroundThrottling: false,
    },
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  // pautan luaran dibuka dalam pelayar, bukan dalam app
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // izinkan kamera/mikrofon/skrin hanya untuk app ini
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(['media', 'display-capture', 'mediaKeySystem'].includes(permission)));
  // kongsi skrin: ambil skrin utama (TODO Fasa 2: pemilih skrin/tetingkap)
  session.defaultSession.setDisplayMediaRequestHandler((_req, cb) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((s) => cb(s.length ? { video: s[0] } : {})).catch(() => cb({}));
  });
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

app.on('before-quit', () => engine.stop());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
