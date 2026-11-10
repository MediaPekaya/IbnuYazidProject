/*
 * Global Streamer - pengesan hero draft automatik (Fasa 5, bahagian 1).
 *
 * Cara kerja: bingkai daripada sumber capture card dipotong pada kawasan (ROI) slot draft (5 ally, 5 enemy, ban kiri/kanan),
 * setiap potongan dibandingkan dengan ikon semua hero (padanan warna + corak bertaburan, tahan sedikit beza potongan/skala)
 * dan hero yang paling padan dipilih jika yakin. Hasil mesti stabil beberapa bingkai berturut-turut sebelum diterima.
 * Streamer boleh membetulkan slot yang salah dan sistem BELAJAR daripada pembetulan itu (disimpan pada PC sendiri).
 *
 * ROI ditakrif dalam unit TINGGI bingkai dan dilabuhkan pada tepi kiri/kanan/atas kerana HUD MLBB berskala mengikut
 * tinggi skrin, jadi satu pratetap berfungsi untuk pelbagai nisbah aspek. Kalibrasi tersedia jika peranti anda berbeza.
 *
 * API: GS.detect.prepare(onProgress) · GS.detect.analyze(source) · GS.detect.start() / stop() · GS.detect.learn(slotKey, hero)
 */
(function () {
  'use strict';
  const GS = window.GS;
  const G = 16;                 // grid ciri G x G
  const VAR = [                 // varian potongan ikon: [skala, anjakan x, anjakan y]
    [1, 0, 0], [0.84, 0, 0], [0.84, 0, -0.08], [0.84, 0, 0.08], [0.68, 0, 0], [0.68, 0, -0.1], [0.68, 0, 0.1], [0.9, 0.06, 0], [0.9, -0.06, 0],
  ];
  const D = (GS.detect = {
    ready: false,
    db: [],            // { name, vec, hist, learned }
    results: {},       // key -> { name, score, margin, stable }
    running: false,
    lastScan: 0,
    stats: { scans: 0, ms: 0 },
  });

  /* ---------- pratetap ROI (unit tinggi) ---------- */
  // anchor: 'L' (dari kiri), 'R' (dari kanan). x,y,w,h dalam unit tinggi bingkai.
  const slotsCol = (anchor, x0) => [0, 1, 2, 3, 4].map((i) => ({ a: anchor, x: x0, y: 0.116 + i * 0.1598, w: 0.174, h: 0.153 }));
  const bansRow = (anchor, x0, n) => Array.from({ length: n }, (_, i) => ({ a: anchor, x: x0 + i * 0.102, y: 0.008, w: 0.072, h: 0.072 }));
  D.presets = {
    'mlbb-draft': {
      label: 'MLBB draft (lalai)',
      groups: {
        ally: slotsCol('L', 0.08),
        enemy: slotsCol('R', 0.2),
        banAlly: bansRow('L', 0.037, 5),
        banEnemy: bansRow('R', 0.2, 5),
      },
    },
  };
  // enemy: x = jarak tepi kanan roi ke tepi kanan bingkai ialah (0.2 - w) => disimpan sebagai jarak tepi kiri roi dari kanan
  function resolveRect(r, W, H) {
    const x = r.a === 'R' ? W - r.x * H : r.x * H;
    return { x: Math.round(x), y: Math.round(r.y * H), w: Math.round(r.w * H), h: Math.round(r.h * H) };
  }
  D.rects = function (cfg, W, H) {
    const out = {};
    Object.entries(cfg.groups).forEach(([g, list]) => list.forEach((r, i) => { out[g + i] = Object.assign(resolveRect(r, W, H), { group: g, i }); }));
    return out;
  };

  /* ---------- ciri ---------- */
  const work = document.createElement('canvas');
  work.width = work.height = G;
  const wctx = work.getContext('2d', { willReadFrequently: true });
  const W_MASK = (() => {
    const m = new Float32Array(G * G);
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
      const dx = (x + 0.5) / G - 0.5, dy = (y + 0.5) / G - 0.5;
      m[y * G + x] = Math.exp(-(dx * dx + dy * dy) / (2 * 0.33 * 0.33));
    }
    return m;
  })();

  /** Potongan sumber (img/canvas/video) -> { vec, hist, var } atau null jika hampir seragam (slot kosong). */
  function feature(src, sx, sy, sw, sh) {
    wctx.imageSmoothingEnabled = true;
    wctx.imageSmoothingQuality = 'high';
    wctx.clearRect(0, 0, G, G);
    try { wctx.drawImage(src, sx, sy, sw, sh, 0, 0, G, G); } catch (e) { return null; }
    const px = wctx.getImageData(0, 0, G, G).data;
    const vec = new Float32Array(G * G * 3);
    const mean = [0, 0, 0];
    const n = G * G;
    for (let i = 0; i < n; i++) { for (let c = 0; c < 3; c++) mean[c] += px[i * 4 + c] * W_MASK[i]; }
    let ws = 0;
    for (let i = 0; i < n; i++) ws += W_MASK[i];
    for (let c = 0; c < 3; c++) mean[c] /= ws;
    let norm = 0;
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < 3; c++) {
        const v = (px[i * 4 + c] - mean[c]) * W_MASK[i];
        vec[i * 3 + c] = v;
        norm += v * v;
      }
    }
    const varc = Math.sqrt(norm / n);
    if (norm < 1e-6) return null;
    norm = Math.sqrt(norm);
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
    // histogram warna (hue berpemberat ketepuan), 18 bin
    const hist = new Float32Array(18);
    let hs = 0;
    for (let i = 0; i < n; i++) {
      const r = px[i * 4] / 255, g = px[i * 4 + 1] / 255, b = px[i * 4 + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      if (d < 0.08 || mx < 0.12) continue;
      let hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hue = (hue * 60 + 360) % 360;
      const wgt = d * W_MASK[i];
      hist[Math.min(17, Math.floor(hue / 20))] += wgt;
      hs += wgt;
    }
    if (hs > 0) for (let i = 0; i < 18; i++) hist[i] /= hs;
    return { vec, hist, sd: varc, mean };
  }
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  const inter = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.min(a[i], b[i]); return s; };
  const score = (f, t) => 0.8 * dot(f.vec, t.vec) + 0.2 * inter(f.hist, t.hist);

  /* ---------- pangkalan data ikon ---------- */
  function addIcon(name, img, learned) {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    const out = [];
    for (const [s, ox, oy] of VAR) {
      const sw = w * s, sh = h * s;
      const f = feature(img, (w - sw) / 2 + ox * w, (h - sh) / 2 + oy * h, sw, sh);
      if (f) out.push({ name, vec: f.vec, hist: f.hist, learned: !!learned });
    }
    return out;
  }

  D.prepare = async function (onProgress) {
    if (D.ready) return D.db.length;
    const heroes = GS.data.mlbbHeroes.filter((h) => h.img);
    let done = 0;
    const loadOne = (h) => new Promise((res) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.referrerPolicy = 'no-referrer';
      im.onload = () => { try { D.db.push(...addIcon(h.name, im)); } catch (e) { /* abaikan */ } res(); };
      im.onerror = () => res();
      im.src = GS.heroUrl(h.name, 128);
    });
    const queue = heroes.slice();
    const worker = async () => {
      while (queue.length) {
        await loadOne(queue.shift());
        done++;
        if (onProgress) onProgress(done, heroes.length);
      }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
    D.loadLearned();
    D.ready = D.db.some((t) => !t.learned);
    D.heroCount = new Set(D.db.map((t) => t.name)).size;
    return D.heroCount;
  };

  /* ---------- padanan ---------- */
  /** Kembalikan { name, score, margin, top:[{name,score}] } untuk satu potongan, atau null (kosong). */
  D.match = function (f) {
    if (!f) return null;
    const best = new Map();
    for (const t of D.db) {
      const s = score(f, t) + (t.learned ? 0.04 : 0);
      if (!best.has(t.name) || best.get(t.name) < s) best.set(t.name, s);
    }
    const arr = [...best.entries()].sort((a, b) => b[1] - a[1]);
    return { name: arr[0][0], score: arr[0][1], margin: arr[0][1] - arr[1][1], top: arr.slice(0, 4).map(([name, s]) => ({ name, score: s })) };
  };

  D.cfg = function () {
    const st = GS.state.detect || (GS.state.detect = {});
    if (!st.preset) st.preset = 'mlbb-draft';
    if (!st.adj) st.adj = { ally: { dx: 0, dy: 0, s: 1 }, enemy: { dx: 0, dy: 0, s: 1 }, banAlly: { dx: 0, dy: 0, s: 1 }, banEnemy: { dx: 0, dy: 0, s: 1 } };
    const base = D.presets[st.preset] || D.presets['mlbb-draft'];
    const groups = {};
    Object.entries(base.groups).forEach(([g, list]) => {
      const a = st.adj[g] || { dx: 0, dy: 0, s: 1 };
      groups[g] = list.map((r) => {
        const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        const w = r.w * a.s, h = r.h * a.s;
        const dx = r.a === 'R' ? -a.dx : a.dx;
        return { a: r.a, x: r.a === 'R' ? r.x - (w - r.w) / 2 + dx : cx - w / 2 + dx, y: cy - h / 2 + a.dy, w, h };
      });
    });
    return { groups };
  };

  /** Analisis satu bingkai (canvas/video/img) -> { slots: {key: match|null}, draft: bool }. */
  D.analyze = function (src, opts) {
    opts = opts || {};
    const W = src.videoWidth || src.naturalWidth || src.width, H = src.videoHeight || src.naturalHeight || src.height;
    if (!W || !H) return null;
    const rects = D.rects(D.cfg(), W, H);
    const out = {};
    const t0 = performance.now();
    for (const [key, r] of Object.entries(rects)) {
      if (r.x < 0 || r.y < 0 || r.x + r.w > W + 2 || r.y + r.h > H + 2) { out[key] = null; continue; }
      const f = feature(src, r.x, r.y, r.w, r.h);
      out[key] = f ? Object.assign(D.match(f) || {}, { sd: f.sd }) : null;
    }
    D.stats.ms = performance.now() - t0;
    D.stats.scans++;
    return { slots: out, rects, W, H };
  };

  /* ---------- pembelajaran (pembetulan streamer) ---------- */
  const LKEY = 'gs.detect.learned.v1';
  D.learnedStore = () => { try { return JSON.parse(localStorage.getItem(LKEY) || '{}'); } catch (e) { return {}; } };
  D.loadLearned = function () {
    D.db = D.db.filter((t) => !t.learned);
    const st = D.learnedStore();
    Object.entries(st).forEach(([name, arr]) => arr.forEach((a) => D.db.push({ name, learned: true, vec: Float32Array.from(a.v), hist: Float32Array.from(a.h) })));
  };
  /** Simpan potongan semasa slot sebagai templat tambahan bagi hero (maks 6 setiap hero). */
  D.learn = function (key, hero, src) {
    const name = GS.meta && GS.meta.canon(hero) || hero;
    const W = src.videoWidth || src.naturalWidth || src.width, H = src.videoHeight || src.naturalHeight || src.height;
    const r = D.rects(D.cfg(), W, H)[key];
    if (!r || !name) return false;
    const f = feature(src, r.x, r.y, r.w, r.h);
    if (!f) return false;
    const st = D.learnedStore();
    const arr = st[name] || (st[name] = []);
    arr.push({ v: Array.from(f.vec, (x) => Math.round(x * 1e4) / 1e4), h: Array.from(f.hist, (x) => Math.round(x * 1e3) / 1e3) });
    while (arr.length > 6) arr.shift();
    try { localStorage.setItem(LKEY, JSON.stringify(st)); } catch (e) { return false; }
    D.db.push({ name, learned: true, vec: f.vec, hist: f.hist });
    return true;
  };
  D.clearLearned = function () { try { localStorage.removeItem(LKEY); } catch (e) { /* abaikan */ } D.loadLearned(); };
})();
