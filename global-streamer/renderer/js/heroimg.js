/*
 * Global Streamer - gambar karakter hero.
 * Gambar TIDAK dibundel dalam app atau repo (seni karya Moonton). Ia dimuat pada PC pengguna sendiri daripada CDN
 * Mobile Legends Wiki (CORS dibenarkan, jadi kanvas siaran tidak tercemar) dan disimpan dalam cache pelayar.
 * Jika gagal dimuat (luar talian dan belum dicache), paparan jatuh balik kepada inisial hero.
 *
 *   GS.heroUrl(name, size)  -> URL gambar (untuk <img>), '' jika tiada
 *   GS.heroImg(name)        -> HTMLImageElement yang sudah dimuat (untuk kanvas), atau null
 */
(function () {
  'use strict';
  const GS = window.GS;
  const cache = new Map();
  const RETRY_MS = 30000;

  GS.heroUrl = function (name, size) {
    const x = GS.hero && GS.hero(name);
    return x && x.img ? x.img + '/scale-to-width-down/' + (size || 96) : '';
  };

  GS.heroImg = function (name) {
    const key = String(name || '').trim().toLowerCase();
    if (!key) return null;
    let rec = cache.get(key);
    if (rec && rec.state === 'err' && Date.now() - rec.t > RETRY_MS) { cache.delete(key); rec = null; }
    if (!rec) {
      const url = GS.heroUrl(name, 128);
      rec = { state: url ? 'loading' : 'none', img: null, t: Date.now() };
      cache.set(key, rec);
      if (url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        img.onload = () => { rec.state = 'ok'; rec.img = img; };
        img.onerror = () => { rec.state = 'err'; rec.t = Date.now(); };
        img.src = url;
      }
    }
    return rec.state === 'ok' ? rec.img : null;
  };

  /** Lukis gambar hero dalam bulatan/bentuk semasa (path sudah dibina oleh pemanggil). */
  GS.drawHeroInPath = function (ctx, name, cx, cy, r) {
    const img = GS.heroImg(name);
    if (!img) return false;
    ctx.save();
    ctx.clip();
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    return true;
  };
})();
