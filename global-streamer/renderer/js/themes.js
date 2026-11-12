/*
 * Global Streamer - tema warna + rekaan, dan saiz output.
 *
 * Tema mengubah: gradien sempadan widget, warna cahaya, latar, bentuk panel (bulat/tajam), gaya panel (kaca/pepejal/garis)
 * dan palet efek (kill, victory dll). Warna semantik ALLY (biru) dan ENEMY (merah) pada widget draft kekal supaya mudah dibezakan.
 * Setiap scene menyimpan temanya sendiri (sc.theme); template memilih tema lalainya.
 */
(function () {
  'use strict';
  const GS = window.GS;

  const dark = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
    return '#' + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255);
  };
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  };

  const defs = [
    { id: 'holo', name: 'Hologram Biru', g: ['#2ea8ff', '#7a5cff', '#ff3b5c'], light: '#6be6ff', gold: '#ffd36b', panel: ['14,30,60', '6,12,28'], bgBase: '#050a18', rscale: 1, mode: 'glass', line: 3 },
    { id: 'crimson', name: 'Merah Menyala', g: ['#ff3b5c', '#ff7a3b', '#ffb13b'], light: '#ffb3c0', gold: '#ffd36b', panel: ['40,10,18', '16,4,8'], bgBase: '#0c0408', rscale: 0.6, mode: 'glass', line: 3 },
    { id: 'gold', name: 'Emas Mewah', g: ['#ffb13b', '#ff6a3b', '#ffd36b'], light: '#ffe9a8', gold: '#ffd36b', panel: ['38,26,8', '14,9,3'], bgBase: '#0a0703', rscale: 1, mode: 'solid', line: 3 },
    { id: 'neon', name: 'Neon Arena', g: ['#2dffa0', '#19d3ff', '#b5ff3b'], light: '#9dffd6', gold: '#e8ff7a', panel: ['6,32,28', '2,12,12'], bgBase: '#02090a', rscale: 0.18, mode: 'glass', line: 2.5 },
    { id: 'galaxy', name: 'Galaksi Ungu', g: ['#9a5cff', '#ff5cc8', '#5c8cff'], light: '#e0c8ff', gold: '#ffd0f0', panel: ['28,16,58', '12,6,28'], bgBase: '#07030f', rscale: 1.6, mode: 'glass', line: 3 },
    { id: 'sunset', name: 'Matahari Terbenam', g: ['#ff7a3b', '#ff3b8c', '#7a3bff'], light: '#ffd0b0', gold: '#ffe08a', panel: ['44,18,30', '18,8,16'], bgBase: '#0b0509', rscale: 1.25, mode: 'glass', line: 3 },
    { id: 'ice', name: 'Ais Segar', g: ['#7ae6ff', '#3b8cff', '#b8f0ff'], light: '#d8f8ff', gold: '#e8fbff', panel: ['16,42,64', '6,20,36'], bgBase: '#040c14', rscale: 1, mode: 'glass', line: 3 },
    { id: 'mono', name: 'Monokrom Bersih', g: ['#ffffff', '#9aa7bd', '#5b667a'], light: '#ffffff', gold: '#e6e9f0', panel: ['24,26,32', '10,11,14'], bgBase: '#060709', rscale: 0.3, mode: 'outline', line: 2 },
    // tema 2D rata: latar plain, panel pepejal, sempadan nipis sewarna, tiada cahaya atau kilauan
    { id: 'flat-navy', name: '2D Navy', flat: true, g: ['#3b82f6', '#3b82f6', '#60a5fa'], light: '#93c5fd', gold: '#fbbf24', panel: ['23,42,77', '19,35,66'], bgBase: '#0f1b33', rscale: 0.6, mode: 'solid', line: 2, text: '#eef4ff', muted: '#9db0d0' },
    { id: 'flat-white', name: '2D Putih', flat: true, g: ['#1d4fd8', '#1d4fd8', '#d8212f'], light: '#1d4fd8', gold: '#b7791f', panel: ['255,255,255', '246,248,252'], bgBase: '#eef1f6', rscale: 0.6, mode: 'solid', line: 2, text: '#1b2433', muted: '#5b6678' },
    { id: 'flat-forest', name: '2D Hijau Hutan', flat: true, g: ['#34d399', '#34d399', '#a7f3d0'], light: '#6ee7b7', gold: '#fde68a', panel: ['22,64,58', '17,52,47'], bgBase: '#0f2a24', rscale: 0.6, mode: 'solid', line: 2, text: '#ecfdf5', muted: '#9fd3c1' },
    { id: 'flat-wine', name: '2D Merah Anggur', flat: true, g: ['#fb7185', '#fb7185', '#fda4af'], light: '#fda4af', gold: '#fcd34d', panel: ['61,23,39', '50,18,32'], bgBase: '#2a0f1a', rscale: 0.6, mode: 'solid', line: 2, text: '#fff1f2', muted: '#d9a3b0' },
    { id: 'flat-violet', name: '2D Ungu Lembut', flat: true, g: ['#a78bfa', '#a78bfa', '#c4b5fd'], light: '#c4b5fd', gold: '#fde68a', panel: ['43,31,77', '35,25,64'], bgBase: '#1d1533', rscale: 0.8, mode: 'solid', line: 2, text: '#f5f3ff', muted: '#b9aedd' },
    { id: 'flat-charcoal', name: '2D Arang', flat: true, g: ['#f43f5e', '#f43f5e', '#fb7185'], light: '#fb7185', gold: '#fbbf24', panel: ['35,38,46', '28,31,38'], bgBase: '#17191f', rscale: 0.45, mode: 'solid', line: 2, text: '#f1f3f7', muted: '#a0a8b6' },
    { id: 'flat-sky', name: '2D Langit Cerah', flat: true, g: ['#0ea5e9', '#0ea5e9', '#f59e0b'], light: '#0284c7', gold: '#b45309', panel: ['255,255,255', '240,248,255'], bgBase: '#d9eefb', rscale: 0.8, mode: 'solid', line: 2, text: '#0f2a3d', muted: '#4a6b82' },
    { id: 'flat-sun', name: '2D Matahari', flat: true, g: ['#f59e0b', '#f59e0b', '#ef4444'], light: '#d97706', gold: '#b45309', panel: ['255,255,255', '255,248,232'], bgBase: '#fdf0cf', rscale: 0.8, mode: 'solid', line: 2, text: '#3a2a08', muted: '#7a6430' },
  ];

  const T = (GS.theme = { list: defs, cur: null });
  GS.themes = {};
  GS.fxPal = {};
  defs.forEach((d) => {
    d.glow = d.flat ? 'rgba(0,0,0,0)' : rgba(d.g[0], 0.55);
    d.sweep = d.flat ? 'rgba(255,255,255,0)' : rgba(d.light, 0.13);
    d.orbs = [rgba(d.g[0], 0.28), rgba(d.g[2], 0.2), rgba(d.g[1], 0.14)];
    d.grid = rgba(d.g[0], 0.06);
    GS.themes[d.id] = d;
    GS.fxPal[d.id] = { main: d.g[0], light: d.light, accent: d.g[2], glow: rgba(d.g[0], 0.9), band: [dark(d.g[0], 0.18), dark(d.g[0], 0.55), dark(d.g[1], 0.3)], fire: ['#ffffff', d.g[2], d.g[0]] };
  });

  /** Gunakan tema untuk lukisan seterusnya (dipanggil oleh kompositor bagi setiap scene). */
  T.use = function (id) {
    const d = GS.themes[id] || GS.themes.holo;
    if (T.cur === d) return d;
    T.cur = d;
    const C = GS.colors;
    C.cyan = d.light;
    C.gold = d.gold;
    // tema rata (2D) boleh menukar warna teks dan teks malap (tema cerah memakai teks gelap)
    if (!T.baseText) T.baseText = { text: C.text, muted: C.muted };
    C.text = d.text || T.baseText.text;
    C.muted = d.muted || T.baseText.muted;
    return d;
  };
  T.use('holo');

  /** Tetapkan tema untuk scene program semasa. */
  T.setScene = function (id) {
    const sc = GS.scenes && GS.scenes.program();
    if (!sc || !GS.themes[id]) return false;
    sc.theme = id;
    sc.fxStyle = id;
    GS.save();
    GS.emit && GS.emit('theme:changed', id);
    return true;
  };
  T.sceneTheme = (sc) => (sc && (sc.theme || sc.fxStyle)) || 'holo';
  T.swatch = (d) => 'linear-gradient(135deg,' + d.g.join(',') + ')';

  /* ---------- saiz output ---------- */
  const sizes = {
    portrait: [
      { w: 540, tag: 'SD · hemat data', br: 1800 },
      { w: 720, tag: 'HD', br: 2800 },
      { w: 1080, tag: 'Full HD · TikTok LIVE', br: 5000 },
      { w: 1440, tag: '2K', br: 9000 },
      { w: 2160, tag: '4K · PC kuat', br: 18000 },
    ],
    landscape: [
      { w: 854, tag: 'SD · hemat data', br: 1500 },
      { w: 1280, tag: 'HD', br: 3500 },
      { w: 1920, tag: 'Full HD', br: 6000 },
      { w: 2560, tag: '2K', br: 10000 },
      { w: 3840, tag: '4K · PC kuat', br: 20000 },
    ],
  };
  const Z = (GS.sizes = {});
  const even = (n) => Math.round(n / 2) * 2;
  Z.heightFor = (w) => even((w * GS.design.h) / GS.design.w);
  Z.list = () => sizes[GS.orient()].map((s) => Object.assign({ h: Z.heightFor(s.w) }, s));
  Z.label = (s) => s.w + '×' + s.h + ' · ' + GS.t(s.tag);
  /** Tetapkan saiz output; bitrate dicadangkan (boleh ditukar semula dalam Tetapan). */
  Z.apply = function (w, opts) {
    const s = GS.state.settings;
    if (GS.live && GS.live.state !== 'idle') { GS.toast(GS.t('Tamatkan siaran dahulu sebelum menukar saiz.'), 'warn'); return false; }
    const p = sizes[GS.orient()].find((x) => x.w === w);
    s.width = w;
    s.height = Z.heightFor(w);
    if (p && !(opts && opts.keepBitrate)) s.vbitrate = p.br;
    if (opts && opts.fps) s.fps = opts.fps;
    GS.save();
    GS.app.applyResolution();
    GS.emit && GS.emit('size:changed', s);
    return true;
  };

  /** Menu saiz di bawah cip resolusi. */
  Z.openMenu = function (anchor) {
    const { h } = GS;
    GS.$$('.popover').forEach((p) => p.remove());
    const s = GS.state.settings;
    const row = (it) => h('button', { class: 'pop-item size-item' + (s.width === it.w ? ' on' : ''), role: 'menuitem', onClick: () => { close(); if (Z.apply(it.w)) GS.toast(GS.t('Saiz output: {0}×{1} (bitrate dicadangkan {2} kbps)', it.w, it.h, it.br), 'ok'); } },
      h('b', null, it.w + '×' + it.h), h('span', null, GS.t(it.tag)), h('em', null, it.br + ' kbps'));
    const fps = h('div', { class: 'pop-fps' }, [30, 60, 120, 200].map((f) => h('button', { class: 'subtab' + (s.fps === f ? ' on' : ''), onClick: () => { close(); Z.apply(s.width, { keepBitrate: true, fps: f }); } }, f + ' fps')));
    const pop = h('div', { class: 'popover size-pop', role: 'menu' }, h('h5', null, GS.orient() === 'portrait' ? 'Saiz menegak 9:16' : 'Saiz mendatar 16:9'), Z.list().map(row), h('hr'), fps,
      h('p', { class: 'muted note' }, 'Orientasi ditukar dalam Tetapan. TikTok dan Facebook biasanya menghadkan 1080p; 4K hanya untuk YouTube.'));
    document.body.append(pop);
    const r = anchor.getBoundingClientRect(), pr = pop.getBoundingClientRect();
    pop.style.left = Math.min(window.innerWidth - pr.width - 8, Math.max(8, r.left)) + 'px';
    pop.style.top = Math.min(window.innerHeight - pr.height - 8, r.bottom + 8) + 'px';
    requestAnimationFrame(() => pop.classList.add('in'));
    function close() { pop.classList.remove('in'); setTimeout(() => pop.remove(), 200); document.removeEventListener('pointerdown', away, true); }
    function away(ev) { if (!pop.contains(ev.target) && ev.target !== anchor) close(); }
    setTimeout(() => document.addEventListener('pointerdown', away, true), 0);
  };
})();
