/* Global Streamer - pemain YouTube tersembunyi (app Windows).
 * Tetingkap tersembunyi memuatkan halaman tonton YouTube sebenar (bukan embed; embed dihalang daripada fail lokal dan sesetengah video).
 * Bunyi dimainkan melalui pembesar suara komputer. Renderer membaca tempoh, masa, jeda dan tamat melalui IPC, dan mengawal main/jeda/kelantangan/cari. */
'use strict';
const wins = new Map();
/* Ad Block: sekat permintaan iklan pada tetingkap tersembunyi YouTube dan Browser source, dan langkau iklan dalam video. Lalai: hidup. */
let adBlockOn = true;
let monOn = true, monLabel = '';   // output streamer: hidup/mati dan nama pembesar suara yang dipilih
const AD_RE = /(^|\.)(doubleclick\.net|googlesyndication\.com|googleadservices\.com|adservice\.google\.[a-z.]+|googletagservices\.com|google-analytics\.com|2mdn\.net|moatads\.com|adnxs\.com|taboola\.com|outbrain\.com|criteo\.com|rubiconproject\.com|pubmatic\.com|amazon-adsystem\.com|adsrvr\.org|scorecardresearch\.com)$/i;
const AD_PATH = /(\/pagead\/|\/api\/stats\/ads|\/ptracking|\/get_midroll_|\/youtubei\/v1\/player\/ad_break|\/api\/stats\/atr|[?&]adformat=|\/ads\/(?:ga-audiences|measurement))/i;
const hooked = new Set();
function hookSession(ses) {
  if (!ses || hooked.has(ses)) return; hooked.add(ses);
  ses.webRequest.onBeforeRequest((d, cb) => {
    if (!adBlockOn) return cb({});
    let u; try { u = new URL(d.url); } catch (e) { return cb({}); }
    if (AD_RE.test(u.hostname) || (/(^|\.)youtube\.com$/i.test(u.hostname) && AD_PATH.test(u.pathname + u.search))) return cb({ cancel: true });
    cb({});
  });
}
const AD_CSS = '.video-ads,.ytp-ad-module,.ytp-ad-overlay-container,.ytp-ad-image-overlay,ytd-ad-slot-renderer,ytd-display-ad-renderer,ytd-promoted-sparkles-web-renderer,#masthead-ad,#player-ads,.ytd-merch-shelf-renderer{display:none!important}';
// langkau iklan: tekan butang langkau, senyapkan dan percepatkan iklan sehingga habis
const AD_SKIP = "(function(){try{var on=" + "__ON__" + ";var pl=document.querySelector('.html5-video-player');var v=document.querySelector('video');" +
  "var b=document.querySelector('.ytp-skip-ad-button,.ytp-ad-skip-button,.ytp-ad-skip-button-modern,.ytp-skip-ad-button__text');if(b&&on)b.click();" +
  "var o=document.querySelector('.ytp-ad-overlay-close-button');if(o&&on)o.click();" +
  "var ad=!!(pl&&pl.classList.contains('ad-showing'));" +
  "if(on&&ad&&v){v.muted=true;try{v.playbackRate=16;}catch(e){}if(isFinite(v.duration)&&v.duration>0&&v.currentTime<v.duration-0.2){try{v.currentTime=v.duration-0.1;}catch(e){}}}" +
  "else if(v&&window.__gsAdMuted){v.muted=false;try{v.playbackRate=1;}catch(e){}}" +
  "window.__gsAdMuted=ad&&on;return ad;}catch(e){return false;}})()";
// terima syarat/kuki YouTube (halaman persetujuan menghalang video daripada dimuat)
const CONSENT = "(function(){var t=/accept all|terima semua|i agree|setuju|reject all/i;var bs=document.querySelectorAll('button,tp-yt-paper-button,ytd-button-renderer button');for(var i=0;i<bs.length;i++){var x=(bs[i].getAttribute('aria-label')||bs[i].textContent||'').trim();if(/accept all|terima semua|i agree|setuju/i.test(x)){bs[i].click();return true;}}var f=document.querySelector('form[action*=\"consent\"] button');if(f){f.click();return true;}return false;})()";
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function setAdBlock(on) { adBlockOn = on !== false; }
function register({ ipcMain, BrowserWindow }) {
  ipcMain.handle('adblock:set', (_e, on) => { setAdBlock(on); return adBlockOn; });
  ipcMain.handle('adblock:get', () => adBlockOn);
  // output streamer: matikan bunyi tetingkap lagu apabila output dimatikan; cuba pilih pembesar suara mengikut nama (jika pelayar mendedahkan nama peranti)
  const sinkScript = () => monLabel ? "(function(){var L=" + JSON.stringify(monLabel) + ";navigator.mediaDevices.enumerateDevices().then(function(ds){var d=ds.filter(function(x){return x.kind==='audiooutput'&&x.label&&(x.label===L||x.label.indexOf(L)>=0||L.indexOf(x.label)>=0);})[0];var v=document.querySelector('video');if(d&&v&&v.setSinkId)v.setSinkId(d.deviceId);}).catch(function(){});})()" : '';
  const applyMon = (w) => { if (!live(w)) return; try { w.webContents.setAudioMuted(!monOn); } catch (e) { /* abaikan */ } const sc = sinkScript(); if (sc) run(w, sc); };
  ipcMain.handle('yt:monitor', (_e, on, label) => { monOn = on !== false; monLabel = typeof label === 'string' ? label.slice(0, 200) : ''; wins.forEach((w) => applyMon(w)); return true; });
  try { const { session } = require('electron'); hookSession(session.fromPartition('persist:gs-yt')); hookSession(session.fromPartition('persist:gs-browser')); } catch (e) { /* abaikan */ }
  const alive = (key) => { const w = wins.get(key); return w && !w.isDestroyed() && w.webContents && !w.webContents.isDestroyed() ? w : null; };
  const stop = (key) => { const w = wins.get(key); if (w && !w.isDestroyed()) w.destroy(); wins.delete(key); };
  // selamat: tetingkap atau kandungannya mungkin sudah dimusnahkan (lagu ditukar / ditutup) semasa pemasa masih berjalan
  const live = (w) => !!(w && !w.isDestroyed() && w.webContents && !w.webContents.isDestroyed());
  const run = (w, code) => { try { return live(w) ? w.webContents.executeJavaScript(code, true).catch(() => null) : Promise.resolve(null); } catch (e) { return Promise.resolve(null); } };

  ipcMain.handle('yt:load', async (_e, key, url) => {
    if (typeof key !== 'string' || !/^https:\/\/(www\.|music\.)?youtube\.com\//.test(String(url))) return { ok: false };
    stop(key);
    const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { partition: 'persist:gs-yt', backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required', contextIsolation: true, nodeIntegration: false, sandbox: true } });
    w.webContents.setUserAgent(UA);
    w.webContents.setAudioMuted(!monOn);
    w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    w.webContents.on('did-finish-load', () => { try { if (live(w)) w.webContents.insertCSS(AD_CSS).catch(() => {}); } catch (e) { /* abaikan */ } });
    wins.set(key, w);
    try { await w.loadURL(url, { userAgent: UA }); } catch (e) { /* halaman mungkin dialihkan; teruskan */ }
    // cuba main (halaman kadang-kadang menunggu)
    [800, 2500, 5000].forEach((ms) => setTimeout(() => { if (live(w)) run(w, CONSENT); }, ms));
    setTimeout(() => applyMon(w), 2500);
    setTimeout(() => { if (live(w)) run(w, "(function(){var v=document.querySelector('video');if(v&&v.paused)v.play().catch(function(){});var b=document.querySelector('.ytp-large-play-button');if(v&&v.paused&&b)b.click();})()"); }, 1500);
    return { ok: true };
  });
  ipcMain.handle('yt:state', async (_e, key) => {
    const w = alive(key); if (!w) return null;
    await run(w, AD_SKIP.replace('__ON__', adBlockOn ? 'true' : 'false'));
    return run(w, "(function(){var v=document.querySelector('video');if(!v)return null;var t=document.title.replace(/ - YouTube$/,'').replace(/^\\(\\d+\\)\\s*/,'');return {dur:isFinite(v.duration)?v.duration:0,cur:v.currentTime||0,paused:v.paused,ended:v.ended&&!document.querySelector('.html5-video-player.ad-showing'),title:t,ad:!!document.querySelector('.ad-showing')};})()");
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
module.exports = { register, stopAll, setAdBlock, hookSession };
