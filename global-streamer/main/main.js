/* Global Streamer - proses utama Electron (app Windows).
 * STATUS: kerangka Fasa 2, BELUM diuji pada PC Windows sebenar. */
'use strict';
const { app, BrowserWindow, ipcMain, safeStorage, session, desktopCapturer, shell, Menu, globalShortcut, screen: electronScreen, nativeImage, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const { StreamEngine } = require('./stream-engine');
const { openLink } = require('./open-link');
const { VoiceHost } = require('./voice-win');
const { execFile } = require('child_process');
const { fetchTTS, elevenApi } = require('./tts-net');
const { chat: aiChat, transcribe: aiStt } = require('./ai-net');
const deck = require('./deck');
const ytPlayer = require('./yt-player');
const browserSrc = require('./browser-src');

// Penting untuk siaran: jangan perlahankan tab bila tetingkap tidak fokus.
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

// Jaring keselamatan: ralat tidak dijangka dalam proses utama tidak lagi memaparkan kotak ralat (siaran tidak terganggu); dicatat dalam konsol.
process.on('uncaughtException', (e) => { try { console.error('[GS] ralat proses utama:', e && e.stack || e); } catch (e2) { /* abaikan */ } });
process.on('unhandledRejection', (e) => { try { console.error('[GS] janji ditolak:', e && e.stack || e); } catch (e2) { /* abaikan */ } });

let win = null;
const engine = new StreamEngine((ev) => { if (win && !win.isDestroyed()) win.webContents.send('stream:event', ev); });

/* ---------- simpanan key disulitkan (OS) ---------- */
const vaultFile = () => path.join(app.getPath('userData'), 'vault.json');
function readVault() { try { return JSON.parse(fs.readFileSync(vaultFile(), 'utf8')); } catch (e) { return {}; } }
const FIXED_IDS = new Set(['tiktok', 'facebook', 'youtube', 'custom', 'chat-youtube', 'chat-facebook', 'tts-elevenlabs', 'tts-azure', 'ai-gemini', 'ai-groq']);
const VALID_IDS = { has: (id) => typeof id === 'string' && (FIXED_IDS.has(id) || /^x\d{1,3}$/.test(id)) }; // x1, x2... = platform tambahan

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
let pendingAudio = false;
const SRC_ID = /^(screen|window):\d+:\d+$/;
ipcMain.handle('sources:list', async () => {
  const all = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 }, fetchWindowIcons: false });
  const own = win && !win.isDestroyed() ? win.getTitle() : 'Global Streamer';
  // tetingkap tanpa nama (komponen sistem) dan tetingkap app ini sendiri tidak berguna sebagai sumber
  const keep = all.filter((s) => s.id.startsWith('screen:') || (String(s.name || '').trim() && s.name !== own));
  return keep.slice(0, 60).map((s) => ({ id: s.id, name: String(s.name || '').slice(0, 120), kind: s.id.startsWith('screen:') ? 'screen' : 'window', thumb: s.thumbnail && !s.thumbnail.isEmpty() ? s.thumbnail.toDataURL() : '' }));
});
ipcMain.handle('sources:select', (_e, id, opts) => {
  if (id && !SRC_ID.test(String(id))) return false;
  pendingSource = id ? String(id) : '';
  pendingAudio = !!(opts && opts.audio); // bunyi komputer (loopback Windows) bersama tangkapan skrin
  return true;
});

/* ---------- suara AI (Azure Speech / ElevenLabs): permintaan dibuat di sini, kunci tidak melalui halaman web ---------- */
ipcMain.handle('tts:fetch', async (_e, kind, p) => {
  if (kind !== 'azure' && kind !== 'eleven') return { ok: false, status: 0, code: 'input', message: 'penyedia tidak dikenali' };
  const r = await fetchTTS(kind, p && typeof p === 'object' ? p : {});
  return r.ok ? { ok: true, audio: new Uint8Array(r.audio) } : r;
});

/* Presentation: baca PDF dan tukar PowerPoint kepada PDF (cache dalam folder data app) */
ipcMain.handle('deck:read', (_e, file) => deck.readPdf(file));
ipcMain.handle('deck:convert', (_e, file) => deck.convert(file, path.join(app.getPath('userData'), 'deck-cache')));

ipcMain.handle('ai:stt', (_e, p) => aiStt(p && typeof p === 'object' ? p : {}));
ipcMain.handle('ai:chat', (_e, p) => aiChat(p && typeof p === 'object' ? p : {}));
ipcMain.handle('tts:eleven', (_e, op, p) => elevenApi(String(op), p && typeof p === 'object' ? p : {}));

/* ---------- suara (pengecam luar talian + suara bot) ---------- */
const voice = new VoiceHost((ev) => { if (win && !win.isDestroyed()) win.webContents.send('voice:event', ev); });
ipcMain.handle('voice:available', () => voice.available());
ipcMain.handle('voice:start', (_e, source, cfg) => voice.start(String(source), cfg && typeof cfg === 'object' ? cfg : {}));
ipcMain.handle('voice:stop', (_e, source) => { if (source) voice.stop(String(source)); else voice.stopAll(); return true; });
ipcMain.on('voice:pcm', (_e, source, data) => { if (data && data.byteLength && data.byteLength <= 65536) voice.pcm(String(source), data); });
ipcMain.handle('voice:say', async (_e, text, opts) => {
  try { const wav = await voice.say(text, opts && typeof opts === 'object' ? opts : {}); return { ok: true, wav: new Uint8Array(wav) }; } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 200) }; }
});

/* ---------- rakaman: ditulis terus ke cakera (tidak memenuhi RAM), kemudian dibetulkan tempoh/carian ---------- */
let recStream = null, recFile = '';
const recDir = () => path.join(app.getPath('videos'), 'GlobalStreamer');
ipcMain.handle('rec:open', () => {
  try {
    if (recStream) { try { recStream.end(); } catch (e) { /* abaikan */ } recStream = null; }
    fs.mkdirSync(recDir(), { recursive: true });
    const d = new Date(), p2 = (n) => String(n).padStart(2, '0');
    recFile = path.join(recDir(), 'GlobalStreamer-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()) + '.webm');
    recStream = fs.createWriteStream(recFile);
    return { ok: true, file: recFile };
  } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
});
ipcMain.on('rec:chunk', (_e, buf) => { if (recStream && buf && buf.byteLength && buf.byteLength <= 128 * 1024 * 1024) recStream.write(Buffer.from(buf)); });
ipcMain.handle('rec:close', async () => {
  if (!recStream) return { ok: false, error: 'tiada rakaman' };
  const st = recStream, f = recFile;
  recStream = null;
  await new Promise((r) => st.end(r));
  const tmp = f.replace(/\.webm$/, '.fix.webm');
  try {
    // betulkan tempoh dan penunjuk carian (tanpa pengekodan semula, beberapa saat)
    await new Promise((res, rej) => execFile(require('./stream-engine').ffmpegBinary(), ['-y', '-v', 'error', '-i', f, '-c', 'copy', tmp], { timeout: 600000, windowsHide: true }, (e) => (e ? rej(e) : res())));
    if (fs.existsSync(tmp) && fs.statSync(tmp).size > 0) fs.renameSync(tmp, f);
  } catch (e) { try { fs.unlinkSync(tmp); } catch (e2) { /* tiada */ } }
  try { return { ok: true, file: f, size: fs.statSync(f).size }; } catch (e) { return { ok: false, error: 'fail rakaman tiada' }; }
});
ipcMain.handle('rec:reveal', (_e, f) => {
  if (typeof f !== 'string' || !path.resolve(f).startsWith(path.resolve(recDir()))) return false;
  shell.showItemInFolder(f);
  return true;
});

/* bar kecil sentiasa di atas semasa merakam skrin penuh (tidak muncul dalam rakaman): masa, Jeda dan "Henti & simpan".
 * Boleh DISEMBUNYIKAN sementara (butang "Sembunyi" atau Ctrl+Alt+H): bar mengecil menjadi tab kecil di tengah atas, klik tab atau tekan pintasan untuk paparkan semula. */
let recBar = null;
let recBarHidden = false;
const BAR_W = 560, BAR_H = 56, PILL_W = 34, PILL_H = 34;
/* tukar antara bar penuh dan pil merah REC: kedudukan semasa (yang diseret pengguna) dikekalkan, hanya saiz berubah di sekitar titik tengah atasnya */
/* bar REC kekal kelihatan di skrin tetapi TIDAK masuk dalam rakaman / siaran: dikecualikan daripada tangkapan skrin (Windows). Dipasang semula setiap kali tetingkap dipaparkan atau berubah supaya tidak hilang. */
function recBarProtect() {
  if (!recBar || recBar.isDestroyed()) return;
  try { recBar.setContentProtection(true); } catch (e) { /* tidak disokong */ }
}
function recBarPlace(hidden) {
  if (!recBar || recBar.isDestroyed()) return;
  const { screen } = require('electron');
  const b = recBar.getBounds();
  const wa = screen.getDisplayMatching(b).workArea;
  const w = hidden ? PILL_W : BAR_W, h = hidden ? PILL_H : BAR_H;
  const cx = b.x + b.width / 2;
  const x = Math.max(wa.x, Math.min(wa.x + wa.width - w, Math.round(cx - w / 2)));
  const y = Math.max(wa.y, Math.min(wa.y + wa.height - h, b.y + (hidden ? Math.round((BAR_H - PILL_H) / 2) : -Math.round((BAR_H - PILL_H) / 2))));
  recBar.setBounds({ x, y, width: w, height: h });
  recBarProtect();
  recBarHidden = hidden;
  recBar.webContents.send('rec:bar-collapsed', hidden);
}
function showRecBar(on) {
  if (!on) {
    try { globalShortcut.unregister('CommandOrControl+Alt+H'); } catch (e) { /* abaikan */ }
    if (recBar && !recBar.isDestroyed()) recBar.close();
    recBar = null; recBarHidden = false; return;
  }
  if (recBar && !recBar.isDestroyed()) return;
  const { screen } = require('electron');
  const wa = screen.getPrimaryDisplay().workArea;
  recBar = new BrowserWindow({
    width: BAR_W, height: BAR_H, x: Math.round(wa.x + wa.width / 2 - BAR_W / 2), y: wa.y + 12, frame: false, resizable: false, alwaysOnTop: true, skipTaskbar: true, show: false, hasShadow: false, transparent: true,
    backgroundColor: '#00000000', title: 'Global Streamer REC',
    webPreferences: { preload: path.join(__dirname, 'recbar-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  recBarHidden = false;
  recBar.setAlwaysOnTop(true, 'screen-saver');
  try { recBar.setContentProtection(true); } catch (e) { /* tidak disokong */ }
  recBar.webContents.on('will-navigate', (e) => e.preventDefault());
  recBar.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  recBar.loadFile(path.join(__dirname, 'recbar.html'));
  recBar.once('ready-to-show', () => { if (recBar && !recBar.isDestroyed()) { recBar.showInactive(); recBarProtect(); setTimeout(recBarProtect, 400); } });
  try { globalShortcut.register('CommandOrControl+Alt+H', () => recBarPlace(!recBarHidden)); } catch (e) { /* pintasan sudah digunakan */ }
}
ipcMain.handle('rec:bar', (_e, on) => { showRecBar(!!on); return true; });
ipcMain.on('rec:bar-stop', () => { if (win && !win.isDestroyed()) win.webContents.send('rec:stop-request'); });
ipcMain.on('rec:bar-pause', () => { if (win && !win.isDestroyed()) win.webContents.send('rec:pause-request'); });
ipcMain.on('rec:bar-hide', (_e, hide) => recBarPlace(!!hide));
/* seret bar / bulatan REC ke mana-mana (tepi, bucu, bawah, tengah) dengan tetikus */
let recDrag = null;
ipcMain.on('rec:bar-drag', (_e, d) => {
  if (!recBar || recBar.isDestroyed() || !d) return;
  if (d.phase === 'start') { const b = recBar.getBounds(); recDrag = { b, sx: d.x, sy: d.y }; return; }
  if (!recDrag) return;
  if (d.phase === 'end') { recDrag = null; return; }
  const { screen } = require('electron');
  const b = recDrag.b;
  const nx = Math.round(b.x + d.x - recDrag.sx), ny = Math.round(b.y + d.y - recDrag.sy);
  const wa = screen.getDisplayNearestPoint({ x: nx + Math.round(b.width / 2), y: ny + Math.round(b.height / 2) }).workArea;
  const x = Math.max(wa.x, Math.min(wa.x + wa.width - b.width, nx));
  const y = Math.max(wa.y, Math.min(wa.y + wa.height - b.height, ny));
  recBar.setBounds({ x, y, width: b.width, height: b.height });
});
ipcMain.on('rec:bar-state', (_e, st) => { if (recBar && !recBar.isDestroyed()) recBar.webContents.send('rec:bar-state', st); });

/* ---------- panel pilih sebelum merakam (gaya Snipping Tool): gambar skrin atau video, mikrofon, Mula ---------- */
let recPre = null, preDone = false;
function preClose() { preDone = true; if (recPre && !recPre.isDestroyed()) recPre.close(); recPre = null; }
function preOpen(data) {
  preClose(); preDone = false;
  const wa = electronScreen.getPrimaryDisplay().workArea;
  const W = 190, H = 60;
  recPre = new BrowserWindow({
    width: W, height: H, x: Math.round(wa.x + wa.width / 2 - W / 2), y: wa.y + 12, frame: false, resizable: false, alwaysOnTop: true, skipTaskbar: true, show: false, hasShadow: false, transparent: true,
    backgroundColor: '#00000000', title: 'Global Streamer Rakam',
    webPreferences: { preload: path.join(__dirname, 'recpre-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  recPre.setAlwaysOnTop(true, 'screen-saver');
  try { recPre.setContentProtection(true); } catch (e) { /* tidak disokong */ }
  recPre.webContents.on('will-navigate', (e) => e.preventDefault());
  recPre.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  recPre.loadFile(path.join(__dirname, 'recpre.html'));
  recPre.webContents.once('did-finish-load', () => { if (recPre && !recPre.isDestroyed()) recPre.webContents.send('pre:init', data || {}); });
  recPre.once('ready-to-show', () => { if (recPre && !recPre.isDestroyed()) recPre.show(); });
  recPre.on('closed', () => { recPre = null; if (!preDone && win && !win.isDestroyed()) win.webContents.send('rec:pre-event', { type: 'cancel' }); });
}
ipcMain.handle('rec:pre-open', (_e, data) => { preOpen(data); return true; });
ipcMain.handle('rec:pre-close', () => { preClose(); return true; });
ipcMain.on('pre:resize', (_e, d) => {
  if (!recPre || recPre.isDestroyed() || !d) return;
  const b = recPre.getBounds(), wa = electronScreen.getDisplayMatching(b).workArea;
  const w = Math.max(120, Math.min(700, Math.round(d.w))), h = Math.max(40, Math.min(400, Math.round(d.h)));
  const cx = b.x + b.width / 2;
  recPre.setBounds({ x: Math.max(wa.x, Math.min(wa.x + wa.width - w, Math.round(cx - w / 2))), y: b.y, width: w, height: h });
});
ipcMain.on('pre:event', (_e, ev) => {
  if (!ev || typeof ev.type !== 'string') return;
  preClose();
  if (win && !win.isDestroyed()) win.webContents.send('rec:pre-event', { type: ev.type, mic: typeof ev.mic === 'string' ? ev.mic.slice(0, 80) : 'off' });
});
/* tangkapan skrin: sembunyikan app sebentar supaya skrin sebenar yang diambil, simpan PNG ke Gambar/GlobalStreamer, salin ke papan keratan */
const shotDir = () => path.join(app.getPath('pictures'), 'GlobalStreamer');
function shotName() { const d = new Date(), p2 = (n) => String(n).padStart(2, '0'); return 'GlobalStreamer-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()) + '.png'; }
function saveShot(img) {
  fs.mkdirSync(shotDir(), { recursive: true });
  const f = path.join(shotDir(), shotName());
  fs.writeFileSync(f, img.toPNG());
  try { clipboard.writeImage(img); } catch (e) { /* abaikan */ }
  try { shell.showItemInFolder(f); } catch (e) { /* abaikan */ }
  return f;
}
/* tangkapan skrin dengan PILIH KAWASAN: skrin dibekukan, pengguna tarik kotak (boleh dilaras / dialih), Enter atau butang Ambil gambar */
let shotWin = null, shotResolve = null;
ipcMain.on('shot:done', (_e, rect) => { const r = shotResolve; shotResolve = null; if (shotWin && !shotWin.isDestroyed()) shotWin.close(); shotWin = null; if (r) r(rect && typeof rect === 'object' ? rect : null); });
ipcMain.handle('rec:shot-screen', async () => {
  let was = false;
  try {
    const d = electronScreen.getPrimaryDisplay();
    was = !!(win && !win.isDestroyed() && win.isVisible() && !win.isMinimized());
    if (was) { win.minimize(); await new Promise((r) => setTimeout(r, 650)); }
    const size = { width: Math.round(d.size.width * d.scaleFactor), height: Math.round(d.size.height * d.scaleFactor) };
    const srcs = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: size });
    const src = srcs.find((x) => String(x.display_id) === String(d.id)) || srcs[0];
    if (!src || src.thumbnail.isEmpty()) return { ok: false, error: 'tiada tangkapan skrin' };
    const full = src.thumbnail, fs_ = full.getSize();
    // tetingkap penuh skrin yang memaparkan tangkapan beku, untuk memilih kawasan
    const rect = await new Promise((resolve) => {
      shotResolve = resolve;
      shotWin = new BrowserWindow({ x: d.bounds.x, y: d.bounds.y, width: d.bounds.width, height: d.bounds.height, frame: false, resizable: false, movable: false, alwaysOnTop: true, skipTaskbar: true, show: false, hasShadow: false, fullscreenable: false, backgroundColor: '#000000', title: 'Pilih kawasan',
        webPreferences: { preload: path.join(__dirname, 'shotsel-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
      shotWin.setAlwaysOnTop(true, 'screen-saver');
      shotWin.webContents.on('will-navigate', (e) => e.preventDefault());
      shotWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      shotWin.loadFile(path.join(__dirname, 'shotsel.html'));
      shotWin.webContents.once('did-finish-load', () => { if (shotWin && !shotWin.isDestroyed()) { shotWin.webContents.send('shot:init', { image: 'data:image/jpeg;base64,' + full.toJPEG(88).toString('base64'), scale: fs_.width / d.bounds.width }); shotWin.show(); shotWin.focus(); } });
      shotWin.on('closed', () => { shotWin = null; if (shotResolve) { const r = shotResolve; shotResolve = null; r(null); } });
    });
    if (was && win && !win.isDestroyed()) { win.restore(); win.focus(); }
    if (!rect) return { ok: false, cancelled: true };
    const k = fs_.width / d.bounds.width;
    const crop = { x: Math.max(0, Math.round(rect.x * k)), y: Math.max(0, Math.round(rect.y * k)), width: Math.max(1, Math.round(rect.w * k)), height: Math.max(1, Math.round(rect.h * k)) };
    crop.width = Math.min(crop.width, fs_.width - crop.x); crop.height = Math.min(crop.height, fs_.height - crop.y);
    // kualiti: kawasan dipilih disimpan pada resolusi asal skrin (tanpa mampatan, PNG), dan dibesarkan dengan penyisipan terbaik sehingga sisi terpanjang sekurang-kurangnya 4K (3840 px), supaya kekal licin apabila dizum rapat
    let img = full.crop(crop);
    const sz = img.getSize(), longSide = Math.max(sz.width, sz.height);
    if (longSide < 3840) { const f = Math.min(12, 3840 / longSide); img = img.resize({ width: Math.round(sz.width * f), height: Math.round(sz.height * f), quality: 'best' }); }
    return { ok: true, file: saveShot(img) };
  } catch (e) { if (was && win && !win.isDestroyed()) { try { win.restore(); } catch (e2) { /* abaikan */ } } return { ok: false, error: String((e && e.message) || e) }; }
});
ipcMain.handle('rec:shot-save', (_e, buf) => {
  try {
    if (!buf || !buf.byteLength || buf.byteLength > 64 * 1024 * 1024) return { ok: false, error: 'imej tidak sah' };
    const img = nativeImage.createFromBuffer(Buffer.from(buf));
    if (img.isEmpty()) return { ok: false, error: 'imej tidak sah' };
    return { ok: true, file: saveShot(img) };
  } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
});
/* buang rakaman yang sedang berjalan: tutup dan padam fail */
ipcMain.handle('rec:discard', async () => {
  const st = recStream, f = recFile; recStream = null;
  try { if (st) await new Promise((r) => st.end(r)); } catch (e) { /* abaikan */ }
  try { if (f && path.resolve(f).startsWith(path.resolve(recDir()))) fs.unlinkSync(f); } catch (e) { /* abaikan */ }
  return true;
});
ipcMain.on('rec:bar-discard', () => { if (win && !win.isDestroyed()) win.webContents.send('rec:discard-request'); });
ipcMain.on('rec:bar-mic', () => { if (win && !win.isDestroyed()) win.webContents.send('rec:mic-request'); });
ipcMain.handle('app:minimize', () => { if (win && !win.isDestroyed()) win.minimize(); return true; });
ytPlayer.register({ ipcMain, BrowserWindow });
browserSrc.register({ ipcMain, BrowserWindow });
ipcMain.handle('app:restore', () => { if (win && !win.isDestroyed()) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } return true; });

/* ---------- siaran ---------- */
ipcMain.handle('stream:start', (_e, cfg) => engine.start(cfg));
ipcMain.on('stream:chunk', (_e, buf) => engine.write(buf));
ipcMain.handle('stream:stop', () => engine.stop());

/* kawalan tetingkap (hanya tetingkap utama) */
ipcMain.on('win:minimize', () => { if (win && !win.isDestroyed()) win.minimize(); });
ipcMain.on('win:maximize', () => { if (win && !win.isDestroyed()) { if (win.isMaximized()) win.unmaximize(); else win.maximize(); } });
ipcMain.on('win:close', () => { if (win && !win.isDestroyed()) win.close(); });
ipcMain.handle('win:state', () => ({ maximized: !!(win && !win.isDestroyed() && win.isMaximized()), focused: !!(win && !win.isDestroyed() && win.isFocused()) }));

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 960, minWidth: 1100, minHeight: 660,
    backgroundColor: '#04070f', title: 'Global Streamer', icon: path.join(__dirname, '..', 'renderer', 'assets', 'logo-512.png'), show: false, autoHideMenuBar: true,
    frame: false,   // bingkai gaya MacBook dilukis oleh app; butang kecilkan / besarkan / tutup di sebelah kanan
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      backgroundThrottling: false,
    },
  });
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => { ytPlayer.stopAll(); browserSrc.stopAll(); });
  /* tutup dengan animasi: beri masa kepada animasi (gaya macOS) sebelum tetingkap benar-benar ditutup */
  let closingOK = false;
  win.on('close', (e) => {
    if (closingOK || !win || win.isDestroyed()) return;
    e.preventDefault();
    win.webContents.send('win:closing');
    setTimeout(() => {
      if (!win || win.isDestroyed()) return;
      closingOK = true;
      win.close();
      // jika penutupan dibatalkan (cth siaran sedang berjalan), pulihkan paparan
      setTimeout(() => { closingOK = false; if (win && !win.isDestroyed()) win.webContents.send('win:closing-cancel'); }, 400);
    }, 300);
  });
  const sendState = () => { if (win && !win.isDestroyed()) win.webContents.send('win:state', { maximized: win.isMaximized(), focused: win.isFocused() }); };
  ['maximize', 'unmaximize', 'focus', 'blur'].forEach((ev) => win.on(ev, sendState));
  win.on('restore', () => { if (win && !win.isDestroyed()) win.webContents.send('win:restored'); });
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
  // klik kanan pada kotak teks: Potong / Salin / Tampal / Pilih semua (memastikan tampal sentiasa boleh digunakan untuk URL dan key)
  app.on('web-contents-created', (_e, wc) => {
    wc.on('context-menu', (_ev, params) => {
      if (!params.isEditable && !params.selectionText) return;
      const t = [];
      if (params.isEditable) t.push({ role: 'undo', label: 'Buat asal' }, { role: 'redo', label: 'Buat semula' }, { type: 'separator' }, { role: 'cut', label: 'Potong' });
      t.push({ role: 'copy', label: 'Salin' });
      if (params.isEditable) t.push({ role: 'paste', label: 'Tampal' });
      t.push({ role: 'selectAll', label: 'Pilih semua' });
      Menu.buildFromTemplate(t).popup();
    });
  });
  // izinkan kamera/mikrofon/skrin hanya untuk app ini
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(['media', 'display-capture', 'mediaKeySystem'].includes(permission)));
  // kongsi skrin: sumber yang dipilih pengguna (pemilih dalam app); jika tiada, skrin pertama
  session.defaultSession.setDisplayMediaRequestHandler((_req, cb) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((s) => {
      const pick = (pendingSource && s.find((x) => x.id === pendingSource)) || s.find((x) => x.id.startsWith('screen:')) || s[0];
      pendingSource = '';
      const res = pick ? { video: pick } : {};
      if (pick && pendingAudio) res.audio = 'loopback';
      pendingAudio = false;
      cb(res);
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
  // versi zip (diekstrak, bukan dipasang): tiada app-update.yml -> tiada kemas kini automatik; pengguna memuat turun zip baharu
  if (app.isPackaged && !test && !fs.existsSync(path.join(process.resourcesPath, 'app-update.yml'))) { updState.state = 'portable'; return; }
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

app.on('before-quit', () => { ytPlayer.stopAll(); browserSrc.stopAll(); engine.stop(); voice.stopAll(); try { if (recStream) recStream.end(); } catch (e) { /* abaikan */ } showRecBar(false); try { globalShortcut.unregisterAll(); } catch (e) { /* abaikan */ } });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
