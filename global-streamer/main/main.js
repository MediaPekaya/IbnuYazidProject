/* Global Streamer - proses utama Electron (app Windows).
 * STATUS: kerangka Fasa 2, BELUM diuji pada PC Windows sebenar. */
'use strict';
const { app, BrowserWindow, ipcMain, safeStorage, session, desktopCapturer, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { StreamEngine } = require('./stream-engine');
const { openLink } = require('./open-link');
const { VoiceHost } = require('./voice-win');

// Penting untuk siaran: jangan perlahankan tab bila tetingkap tidak fokus.
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

let win = null;
const engine = new StreamEngine((ev) => { if (win && !win.isDestroyed()) win.webContents.send('stream:event', ev); });

/* ---------- simpanan key disulitkan (OS) ---------- */
const vaultFile = () => path.join(app.getPath('userData'), 'vault.json');
function readVault() { try { return JSON.parse(fs.readFileSync(vaultFile(), 'utf8')); } catch (e) { return {}; } }
const VALID_IDS = new Set(['tiktok', 'facebook', 'youtube', 'custom', 'chat-youtube', 'chat-facebook']);

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

/* ---------- pemilih skrin / tetingkap ---------- */
let pendingSource = '';
const SRC_ID = /^(screen|window):\d+:\d+$/;
ipcMain.handle('sources:list', async () => {
  const all = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 }, fetchWindowIcons: false });
  const own = win && !win.isDestroyed() ? win.getTitle() : 'Global Streamer';
  // tetingkap tanpa nama (komponen sistem) dan tetingkap app ini sendiri tidak berguna sebagai sumber
  const keep = all.filter((s) => s.id.startsWith('screen:') || (String(s.name || '').trim() && s.name !== own));
  return keep.slice(0, 60).map((s) => ({ id: s.id, name: String(s.name || '').slice(0, 120), kind: s.id.startsWith('screen:') ? 'screen' : 'window', thumb: s.thumbnail && !s.thumbnail.isEmpty() ? s.thumbnail.toDataURL() : '' }));
});
ipcMain.handle('sources:select', (_e, id) => {
  if (id && !SRC_ID.test(String(id))) return false;
  pendingSource = id ? String(id) : '';
  return true;
});

/* ---------- suara (pengecam luar talian + suara bot) ---------- */
const voice = new VoiceHost((ev) => { if (win && !win.isDestroyed()) win.webContents.send('voice:event', ev); });
ipcMain.handle('voice:available', () => voice.available());
ipcMain.handle('voice:start', (_e, source, cfg) => voice.start(String(source), cfg && typeof cfg === 'object' ? cfg : {}));
ipcMain.handle('voice:stop', (_e, source) => { if (source) voice.stop(String(source)); else voice.stopAll(); return true; });
ipcMain.on('voice:pcm', (_e, source, data) => { if (data && data.byteLength && data.byteLength <= 65536) voice.pcm(String(source), data); });
ipcMain.handle('voice:say', async (_e, text, opts) => {
  try { const wav = await voice.say(text, opts && typeof opts === 'object' ? opts : {}); return { ok: true, wav: new Uint8Array(wav) }; } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 200) }; }
});

/* ---------- siaran ---------- */
ipcMain.handle('stream:start', (_e, cfg) => engine.start(cfg));
ipcMain.on('stream:chunk', (_e, buf) => engine.write(buf));
ipcMain.handle('stream:stop', () => engine.stop());

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 960, minWidth: 1100, minHeight: 660,
    backgroundColor: '#04070f', title: 'Global Streamer', icon: path.join(__dirname, '..', 'renderer', 'assets', 'logo-512.png'), show: false, autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      backgroundThrottling: false,
    },
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  // pautan luaran dibuka dalam pelayar, bukan dalam app
  // tetingkap panel (chat dikeluarkan ke skrin kedua): hanya about:blank bernama gs-panel; semua pautan lain dibuka dalam Chrome
  win.webContents.setWindowOpenHandler(({ url, frameName }) => {
    if ((url === 'about:blank' || url === '') && frameName === 'gs-panel') {
      return { action: 'allow', overrideBrowserWindowOptions: { title: 'Global Streamer', backgroundColor: '#04070f', autoHideMenuBar: true, icon: path.join(__dirname, '..', 'renderer', 'assets', 'logo-512.png'), minWidth: 320, minHeight: 320, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } } };
    }
    openLink(url, shell);
    return { action: 'deny' };
  });
  win.webContents.on('did-create-window', (child) => {
    child.setMenuBarVisibility(false);
    child.webContents.on('will-navigate', (e) => e.preventDefault());
    child.webContents.setWindowOpenHandler(({ url }) => { openLink(url, shell); return { action: 'deny' }; });
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // izinkan kamera/mikrofon/skrin hanya untuk app ini
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(['media', 'display-capture', 'mediaKeySystem'].includes(permission)));
  // kongsi skrin: sumber yang dipilih pengguna (pemilih dalam app); jika tiada, skrin pertama
  session.defaultSession.setDisplayMediaRequestHandler((_req, cb) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((s) => {
      const pick = (pendingSource && s.find((x) => x.id === pendingSource)) || s.find((x) => x.id.startsWith('screen:')) || s[0];
      pendingSource = '';
      cb(pick ? { video: pick } : {});
    }).catch(() => cb({}));
  });
  createWindow();
  setupUpdater();
  // kemas kini "masa nyata": semak 8 saat selepas dibuka, setiap 5 minit, dan apabila tetingkap difokus semula
  setTimeout(checkUpdate, 8000);
  setInterval(checkUpdate, 5 * 60 * 1000);
  if (win) win.on('focus', () => { if (Date.now() - lastCheck > 60 * 1000) checkUpdate(); });
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

/* ---------- kemas kini automatik (electron-updater) ----------
 * Suapan: build.publish (generic) dalam package.json -> https://global-streamer.web.app/updates/ (latest.yml + pemasang).
 * Semakan hanya dalam app yang dipasang (packaged); untuk ujian: GS_UPDATE_URL + GS_UPDATE_TEST=1 (tanpa muat turun). */
const updFile = () => path.join(app.getPath('userData'), 'update.json');
const readUpd = () => { try { return Object.assign({ enabled: true }, JSON.parse(fs.readFileSync(updFile(), 'utf8'))); } catch (e) { return { enabled: true }; } };
let updState = { state: 'idle', version: '', progress: 0, message: '' };
let updater = null;
function sendUpd(patch) {
  updState = Object.assign({}, updState, patch);
  if (win && !win.isDestroyed()) win.webContents.send('update:event', updState);
}
function setupUpdater() {
  const test = !!process.env.GS_UPDATE_TEST;
  if (!app.isPackaged && !test) { updState.state = 'dev'; return; }
  if (test && process.env.GS_FAKE_WIN) Object.defineProperty(process, 'platform', { value: 'win32' }); // ujian sahaja: cari latest.yml seperti pada Windows
  try { updater = require('electron-updater').autoUpdater; } catch (e) { updState.state = 'unavailable'; return; }
  updater.autoDownload = !test;
  updater.autoInstallOnAppQuit = true;
  updater.logger = null;
  if (test && process.env.GS_UPDATE_URL) {
    updater.forceDevUpdateConfig = true;
    // ujian: 'github' = penyedia GitHub seperti app yang dipasang; lain-lain = suapan generik
    updater.setFeedURL(process.env.GS_UPDATE_URL === 'github' ? { provider: 'github', owner: 'MediaPekaya', repo: 'IbnuYazidProject' } : { provider: 'generic', url: process.env.GS_UPDATE_URL });
  }
  updater.on('checking-for-update', () => sendUpd({ state: 'checking', message: '' }));
  updater.on('update-available', (i) => sendUpd({ state: 'available', version: i.version, message: '' }));
  updater.on('update-not-available', () => sendUpd({ state: 'current', message: '' }));
  updater.on('download-progress', (p) => sendUpd({ state: 'downloading', progress: Math.round(p.percent || 0) }));
  updater.on('update-downloaded', (i) => sendUpd({ state: 'downloaded', version: i.version, progress: 100 }));
  updater.on('error', (e) => sendUpd({ state: 'error', message: String((e && e.message) || e).slice(0, 200) }));
}
let lastCheck = 0;
function checkUpdate(force) {
  if (!updater || (!force && !readUpd().enabled)) return;
  // jangan semak semula semasa memuat turun / selepas siap dimuat turun
  if (['downloading', 'downloaded'].includes(updState.state)) return;
  lastCheck = Date.now();
  updater.checkForUpdates().catch(() => {});
}
ipcMain.handle('app:info', () => ({ version: app.getVersion(), packaged: app.isPackaged, platform: process.platform, update: Object.assign({}, updState, { enabled: readUpd().enabled }) }));
ipcMain.handle('update:check', () => { if (!updater) return false; checkUpdate(true); return true; });
ipcMain.handle('update:install', () => { if (updater && updState.state === 'downloaded') { updater.quitAndInstall(true, true); return true; } return false; });
ipcMain.handle('update:enable', (_e, on) => { const v = Object.assign(readUpd(), { enabled: !!on }); fs.writeFileSync(updFile(), JSON.stringify(v)); return v.enabled; });

app.on('before-quit', () => { engine.stop(); voice.stopAll(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
