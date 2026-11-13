/* Global Streamer - latar GAMBAR SEBENAR (foto) dengan gerakan perlahan (zum dan gelongsor halus, gaya Ken Burns).
 * Fail gambar dalam assets/photos; kredit dan lesen dalam data/photo-credits.js dan assets/photos/CREDITS.txt. */
(function () {
  'use strict';
  const W = GS.widgets;
  const imgs = {};
  const load = (file) => {
    let r = imgs[file];
    if (!r) { r = imgs[file] = { img: new Image(), ok: false }; r.img.onload = () => { r.ok = true; }; r.img.src = 'assets/photos/' + file; }
    return r.ok ? r.img : null;
  };
  GS.photos = { list: GS.PHOTO_LIST || [], byId: (id) => GS.photos.list.find((p) => p.id === id), load };
  W.photo = function (ctx, s, t) {
    const p = s.props || {}, ph = GS.photos.byId(p.photo) || GS.photos.list[0], { x, y, w, h } = s;
    const im = ph && load(ph.file);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (!im) { ctx.fillStyle = '#1a2233'; ctx.fillRect(x, y, w, h); ctx.restore(); return; }
    // cover + zum perlahan 1.00 -> 1.09 dan gelongsor halus
    const k = 1.04 + 0.05 * Math.sin(t * 0.00005 * 6.28 * 0.8), base = Math.max(w / im.naturalWidth, h / im.naturalHeight) * k;
    const dw = im.naturalWidth * base, dh = im.naturalHeight * base;
    const px = (dw - w) * (0.5 + 0.45 * Math.sin(t * 0.00008)), py = (dh - h) * (0.5 + 0.45 * Math.cos(t * 0.00006));
    ctx.drawImage(im, x - px, y - py, dw, dh);
    // vinjet lembut supaya widget di tepi jelas dibaca
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(0,0,0,' + (p.shade != null ? p.shade : 0.22) + ')'); g.addColorStop(0.5, 'rgba(0,0,0,0.04)'); g.addColorStop(1, 'rgba(0,0,0,' + (p.shade != null ? p.shade : 0.3) + ')');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.restore();
  };
})();
