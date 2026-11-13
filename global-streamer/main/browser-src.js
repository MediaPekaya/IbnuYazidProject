/* Global Streamer - sumber "Browser": halaman web dilukis ke kanvas siaran (app Windows).
 * Setiap sumber ada tetingkap Chromium luar-skrin (offscreen) yang tersembunyi. Renderer menarik bingkai JPEG ~15 fps hanya selagi sumber dilukis;
 * tetingkap ditutup sendiri jika tiada bingkai ditarik selama 20 saat. Bunyi halaman dimainkan melalui pembesar suara komputer. */
'use strict';
const wins = new Map();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const okUrl = (u) => /^https?:\/\/[^\s]+$/i.test(String(u || ''));

function register({ ipcMain, BrowserWindow }) {
  const get = (key) => { const r = wins.get(key); return r && r.win && !r.win.isDestroyed() ? r : null; };
  const close = (key) => { const r = wins.get(key); if (r && r.win && !r.win.isDestroyed()) r.win.destroy(); wins.delete(key); };
  const clampN = (n, a, b) => Math.max(a, Math.min(b, Math.round(Number(n) || a)));

  ipcMain.handle('br:open', async (_e, key, url, w, h) => {
    if (typeof key !== 'string' || !okUrl(url)) return { ok: false };
    const old = get(key);
    const W = clampN(w, 320, 1920), H = clampN(h, 240, 1200);
    if (old) { if (old.url !== url) { old.url = url; old.win.loadURL(url, { userAgent: UA }).catch(() => {}); } old.lastPull = Date.now(); return { ok: true }; }
    const win = new BrowserWindow({ show: false, width: W, height: H, useContentSize: true, webPreferences: { offscreen: true, partition: 'persist:gs-browser', backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required', contextIsolation: true, nodeIntegration: false, sandbox: true } });
    const rec = { win, url, last: null, lastPull: Date.now(), w: W, h: H };
    wins.set(key, rec);
    win.webContents.setUserAgent(UA);
    win.webContents.setFrameRate(24);
    win.webContents.on('paint', (_ev, _dirty, image) => { rec.last = image; });
    win.webContents.setWindowOpenHandler(({ url: u }) => { if (okUrl(u)) win.loadURL(u, { userAgent: UA }).catch(() => {}); return { action: 'deny' }; });
    win.loadURL(url, { userAgent: UA }).catch(() => {});
    return { ok: true };
  });
  ipcMain.handle('br:frame', (_e, key, q) => {
    const r = get(key); if (!r || !r.last) return null;
    r.lastPull = Date.now();
    try { return r.last.toJPEG(clampN(q, 30, 95)); } catch (e) { return null; }
  });
  ipcMain.handle('br:nav', (_e, key, cmd, a, b) => {
    const r = get(key); if (!r) return false;
    const wc = r.win.webContents;
    r.lastPull = Date.now();
    if (cmd === 'back' && wc.canGoBack()) wc.goBack();
    else if (cmd === 'forward' && wc.canGoForward()) wc.goForward();
    else if (cmd === 'reload') wc.reload();
    else if (cmd === 'url' && okUrl(a)) { r.url = a; wc.loadURL(a, { userAgent: UA }).catch(() => {}); }
    else if (cmd === 'mute') wc.setAudioMuted(!!a);
    else if (cmd === 'scroll') wc.sendInputEvent({ type: 'mouseWheel', x: Math.round(r.w / 2), y: Math.round(r.h / 2), deltaX: 0, deltaY: -Number(a) || 0, canScroll: true });
    else if (cmd === 'click') { const x = Math.round(Number(a) * r.w), y = Math.round(Number(b) * r.h); wc.sendInputEvent({ type: 'mouseMove', x, y }); wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 }); wc.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 }); }
    else if (cmd === 'resize') { const W = clampN(a, 320, 1920), H = clampN(b, 240, 1200); if (W !== r.w || H !== r.h) { r.w = W; r.h = H; r.win.setContentSize(W, H); } }
    else return false;
    return true;
  });
  ipcMain.handle('br:close', (_e, key) => { close(key); return true; });
  setInterval(() => { const now = Date.now(); wins.forEach((r, k) => { if (now - r.lastPull > 20000) close(k); }); }, 5000).unref();
}
function stopAll() { Array.from(wins.keys()).forEach((k) => { const r = wins.get(k); if (r && r.win && !r.win.isDestroyed()) r.win.destroy(); wins.delete(k); }); }
module.exports = { register, stopAll };
