/* Global Streamer - pemain YouTube tersembunyi (app Windows).
 * Tetingkap tersembunyi memuatkan halaman tonton YouTube sebenar (bukan embed; embed dihalang daripada fail lokal dan sesetengah video).
 * Bunyi dimainkan melalui pembesar suara komputer. Renderer membaca tempoh, masa, jeda dan tamat melalui IPC, dan mengawal main/jeda/kelantangan/cari. */
'use strict';
const wins = new Map();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function register({ ipcMain, BrowserWindow }) {
  const alive = (key) => { const w = wins.get(key); return w && !w.isDestroyed() ? w : null; };
  const stop = (key) => { const w = wins.get(key); if (w && !w.isDestroyed()) w.destroy(); wins.delete(key); };
  const run = (w, code) => w.webContents.executeJavaScript(code, true).catch(() => null);

  ipcMain.handle('yt:load', async (_e, key, url) => {
    if (typeof key !== 'string' || !/^https:\/\/(www\.|music\.)?youtube\.com\//.test(String(url))) return { ok: false };
    stop(key);
    const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { partition: 'persist:gs-yt', backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required', contextIsolation: true, nodeIntegration: false, sandbox: true } });
    w.webContents.setUserAgent(UA);
    w.webContents.setAudioMuted(false);
    w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    wins.set(key, w);
    try { await w.loadURL(url, { userAgent: UA }); } catch (e) { /* halaman mungkin dialihkan; teruskan */ }
    // cuba main (halaman kadang-kadang menunggu)
    setTimeout(() => { if (alive(key)) run(w, "(function(){var v=document.querySelector('video');if(v&&v.paused)v.play().catch(function(){});var b=document.querySelector('.ytp-large-play-button');if(v&&v.paused&&b)b.click();})()"); }, 1500);
    return { ok: true };
  });
  ipcMain.handle('yt:state', async (_e, key) => {
    const w = alive(key); if (!w) return null;
    return run(w, "(function(){var v=document.querySelector('video');if(!v)return null;var t=document.title.replace(/ - YouTube$/,'').replace(/^\\(\\d+\\)\\s*/,'');return {dur:isFinite(v.duration)?v.duration:0,cur:v.currentTime||0,paused:v.paused,ended:v.ended,title:t,ad:!!document.querySelector('.ad-showing')};})()");
  });
  ipcMain.handle('yt:cmd', async (_e, key, cmd, val) => {
    const w = alive(key); if (!w) return false;
    const n = Number(val) || 0;
    const code = {
      play: "var v=document.querySelector('video');if(v)v.play().catch(function(){});",
      pause: "var v=document.querySelector('video');if(v)v.pause();",
      vol: "var v=document.querySelector('video');if(v){v.muted=false;v.volume=" + Math.max(0, Math.min(1, n)) + ";}",
      seek: "var v=document.querySelector('video');if(v)v.currentTime=" + Math.max(0, n) + ";",
      next: "var b=document.querySelector('.ytp-next-button');if(b)b.click();",
    }[cmd];
    if (!code) return false;
    await run(w, '(function(){' + code + '})()');
    return true;
  });
  ipcMain.handle('yt:stop', (_e, key) => { stop(key); return true; });
}
function stopAll() { Array.from(wins.keys()).forEach((k) => { const w = wins.get(k); if (w && !w.isDestroyed()) w.destroy(); wins.delete(k); }); }
module.exports = { register, stopAll };
