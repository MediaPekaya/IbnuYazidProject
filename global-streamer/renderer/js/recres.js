/* Global Streamer - resolusi rakaman: sisi pendek sekurang-kurangnya 1080 dan paling banyak 2K (2560x1440).
 * Sumber lebih kecil daripada 1080 dinaikkan skala melalui kanvas; sumber lebih besar daripada 2K dikecilkan.
 * Sumber dalam julat 1080 hingga 2K dirakam apa adanya (tanpa kanvas, tiada kos tambahan). Ubah MAX_LONG/MAX_SHORT untuk had lain. */
(function () {
  'use strict';
  const GS = (window.GS = window.GS || {});
  const R = (GS.recres = { MIN: 1080, MAX_LONG: 2560, MAX_SHORT: 1440 });
  const even = (n) => Math.max(2, Math.round(n / 2) * 2);

  /** Faktor skala untuk sumber w x h (1 = tidak perlu ubah). */
  R.scale = function (w, h) {
    const short = Math.min(w, h), long = Math.max(w, h);
    if (!short || !long) return 1;
    let k = short < R.MIN ? R.MIN / short : 1;
    k = Math.min(k, R.MAX_LONG / long, R.MAX_SHORT / short);
    return Math.abs(k - 1) < 0.001 ? 1 : k;
  };
  R.size = function (w, h) { const k = R.scale(w, h); return { k, w: k === 1 ? w : even(w * k), h: k === 1 ? h : even(h * k) }; };
  /** Bitrate video (kbps) untuk gerakan licin (60 fps): 1080p 16 Mbps, 1440p (2K) 24 Mbps. */
  R.bitrate = function (w, h) { const px = w * h; return px <= 2300000 ? 16000 : 24000; };
  /** Jika saiz perlu diubah: kembalikan {track, w, h, stop}; jika tidak, null (guna trek asal). src = canvas atau video. */
  R.fit = function (src, sw, sh, fps) {
    const z = R.size(sw, sh);
    if (z.k === 1) return null;
    const cv = document.createElement('canvas');
    cv.width = z.w; cv.height = z.h;
    const ctx = cv.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const draw = () => { try { ctx.drawImage(src, 0, 0, z.w, z.h); } catch (e) { /* belum sedia */ } };
    draw();
    const timer = setInterval(draw, Math.round(1000 / (fps || 30)));
    const stream = cv.captureStream(fps || 30);
    return { track: stream.getVideoTracks()[0], w: z.w, h: z.h, stop() { clearInterval(timer); try { stream.getTracks().forEach((t) => t.stop()); } catch (e) { /* abaikan */ } } };
  };
})();
