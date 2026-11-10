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
  let VAR = [                   // varian potongan ikon: [skala, anjakan x, anjakan y]
    [1, 0, 0], [0.84, 0, 0], [0.84, 0, -0.08], [0.84, 0, 0.08], [0.68, 0, 0], [0.68, 0, -0.1], [0.68, 0, 0.1], [0.9, 0.06, 0], [0.9, -0.06, 0],
  ];
  const opt = { wv: 0.8 };
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
  // Diukur daripada rakaman draft sebenar 1280x588 (tinggi 588): potret ally 76px persegi bermula x=76,y=70 (elak lencana bendera dan nama),
  // potret enemy ~90px persegi pada x=1135, ban ialah bulatan 42px berjarak 60px.
  const slotsCol = (anchor, x0, size) => [0, 1, 2, 3, 4].map((i) => ({ a: anchor, x: x0, y: 0.119 + i * 0.1598, w: size, h: size }));
  const bansRow = (anchor, x0, n, step) => Array.from({ length: n }, (_, i) => ({ a: anchor, x: x0 + i * step, y: 0.009, w: 0.071, h: 0.071 }));
  D.presets = {
    'mlbb-draft': {
      label: 'MLBB draft (lalai)',
      groups: {
        ally: slotsCol('L', 0.129, 0.129),
        enemy: slotsCol('R', 0.2466, 0.153),
        banAlly: bansRow('L', 0.104, 5, 0.102),
        banEnemy: bansRow('R', 0.483, 5, -0.102),
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
  const score = (f, t) => opt.wv * dot(f.vec, t.vec) + (1 - opt.wv) * inter(f.hist, t.hist);

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
    D.icons = D.icons || {};
    const loadOne = (h) => new Promise((res) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.referrerPolicy = 'no-referrer';
      im.onload = () => { D.icons[h.name] = im; try { D.db.push(...addIcon(h.name, im)); } catch (e) { /* abaikan */ } res(); };
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

  /** Bina semula pangkalan data dengan varian/pemberat lain (untuk penalaan dan ujian). */
  D.tune = function (o) {
    if (o.variants) VAR = o.variants;
    if (o.wv != null) opt.wv = o.wv;
    D.db = [];
    Object.entries(D.icons || {}).forEach(([name, im]) => D.db.push(...addIcon(name, im)));
    D.loadLearned();
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
    return { name: arr[0][0], score: arr[0][1], margin: arr[0][1] - arr[1][1], top: arr.slice(0, 6).map(([name, s]) => ({ name, score: s })) };
  };

  D._feature = feature;
  D._enc = null;

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
  // Disimpan terkuantiti (int8) supaya muat dalam localStorage: ~1 KB setiap templat.
  const LKEY = 'gs.detect.learned.v2';
  const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = (str) => { const s = atob(str); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const enc = (f) => ({ v: b64(new Uint8Array(Int8Array.from(f.vec, (x) => Math.round(x * 127)).buffer)), h: b64(Uint8Array.from(f.hist, (x) => Math.round(x * 255))) });
  const dec = (e) => ({ vec: Float32Array.from(new Int8Array(unb64(e.v).buffer), (x) => x / 127), hist: Float32Array.from(unb64(e.h), (x) => x / 255) });
  D.learnedStore = () => { try { return JSON.parse(localStorage.getItem(LKEY) || '{}'); } catch (e) { return {}; } };
  D.learnedCount = () => Object.values(D.learnedStore()).reduce((n, a) => n + a.length, 0);
  D.loadLearned = function () {
    D.db = D.db.filter((t) => !t.learned);
    const st = D.learnedStore();
    Object.entries(st).forEach(([name, arr]) => arr.forEach((e) => { try { D.db.push(Object.assign({ name, learned: true }, dec(e))); } catch (x) { /* abaikan */ } }));
  };
  /** Simpan potongan slot daripada bingkai (src) sebagai templat tambahan bagi hero (maks 6 setiap hero). */
  D.learn = function (key, hero, src) {
    const name = (GS.meta && GS.meta.canon(hero)) || hero;
    const W = src.videoWidth || src.naturalWidth || src.width, H = src.videoHeight || src.naturalHeight || src.height;
    const r = D.rects(D.cfg(), W, H)[key];
    if (!r || !name) return false;
    const f = feature(src, r.x, r.y, r.w, r.h);
    if (!f) return false;
    const st = D.learnedStore();
    const arr = st[name] || (st[name] = []);
    arr.push(enc(f));
    while (arr.length > 6) arr.shift();
    try { localStorage.setItem(LKEY, JSON.stringify(st)); } catch (e) { return false; }
    D.loadLearned();
    return true;
  };
  D.clearLearned = function () { try { localStorage.removeItem(LKEY); } catch (e) { /* abaikan */ } D.loadLearned(); };

  /* ---------- tetapan ---------- */
  const DEFAULTS = { enabled: false, sensitivity: 0.5, interval: 1000, autoShow: true, autoPredict: true, autoPhase: true, lockManual: true, sourceId: 'auto' };
  D.settings = function () {
    const st = GS.state.detect || (GS.state.detect = {});
    Object.keys(DEFAULTS).forEach((k) => { if (!(k in st)) st[k] = DEFAULTS[k]; });
    if (!st.locks) st.locks = {};
    if (!st.bans) st.bans = { banAlly: [], banEnemy: [] };
    D.cfg();
    return st;
  };

  /* ---------- sumber bingkai ---------- */
  D.testImage = null;
  D.setTestImage = (img) => { D.testImage = img || null; };
  /** Senarai sumber video yang boleh diimbas. */
  D.sources = function () {
    const out = [];
    (GS.state.scenes || []).forEach((sc) => sc.sources.forEach((s) => {
      if (s.type === 'video' && !out.some((o) => o.id === s.id)) out.push({ id: s.id, name: s.name, kind: s.props.kind });
    }));
    return out;
  };
  D.source = function () {
    if (D.testImage) return D.testImage;
    const st = D.settings();
    const list = D.sources().filter((s) => { const r = GS.media.videos[s.id]; return r && r.video.readyState >= 2 && r.video.videoWidth; });
    const pick = (st.sourceId !== 'auto' && list.find((s) => s.id === st.sourceId)) || list.find((s) => s.kind === 'capture') || list.find((s) => s.kind === 'screen');
    return pick ? GS.media.videos[pick.id].video : null;
  };

  /* ---------- enjin imbasan ---------- */
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const conf = (score, margin) => clamp01((score - 0.35) / 0.45) * 0.6 + clamp01(margin / 0.12) * 0.4;
  D.conf = conf;
  D.threshold = () => 0.7 - 0.4 * D.settings().sensitivity;
  D.state = { status: 'off', active: false, strong: 0, miss: 0, accepted: {}, slots: {}, frames: 0, ms: 0, W: 0, H: 0, committed: 0 };
  D.snap = document.createElement('canvas');
  const pend = {};

  const SIDE = { ally: 'ally', enemy: 'enemy' };
  const groupOf = (key) => key.replace(/\d+$/, '');
  const idxOf = (key) => Number(key.match(/\d+$/)[0]);
  const isLocked = (key) => { const st = D.settings(); return !!(st.locks[key] || st.locks[groupOf(key)]); };
  /** Tandakan slot/kumpulan diubah manual (pengesan tidak akan menimpanya). */
  D.noteManual = function (key) { const st = D.settings(); if (st.lockManual) { st.locks[key] = true; GS.save(); } };
  D.unlockAll = function () { const st = D.settings(); st.locks = {}; GS.save(); };
  D.resetDraft = function () {
    const st = D.settings(), d = GS.state.draft;
    d.ally = ['', '', '', '', '']; d.enemy = ['', '', '', '', '']; d.banAlly = ''; d.banEnemy = '';
    st.bans = { banAlly: [], banEnemy: [] };
    st.locks = {};
    Object.keys(pend).forEach((k) => delete pend[k]);
    GS.save();
    GS.emit('detect:changed', null);
  };

  function current(key) {
    const g = groupOf(key), i = idxOf(key), d = GS.state.draft;
    if (g === 'ally') return d.ally[i] || '';
    if (g === 'enemy') return d.enemy[i] || '';
    return D.settings().bans[g][i] || '';
  }
  function write(key, name) {
    const g = groupOf(key), i = idxOf(key), d = GS.state.draft, st = D.settings();
    if (g === 'ally') d.ally[i] = name;
    else if (g === 'enemy') d.enemy[i] = name;
    else { st.bans[g][i] = name; d[g] = st.bans[g].filter(Boolean).join(', '); }
  }

  /** Imbas satu bingkai dan kemas kini draft. Kembalikan ringkasan (untuk UI/ujian). */
  D.tick = function (forced) {
    const st = D.settings();
    const S = D.state;
    const src = forced || D.source();
    if (!src) { S.status = 'nosource'; return S; }
    if (!D.ready) { S.status = 'loading'; return S; }
    const r = D.analyze(src);
    if (!r) { S.status = 'nosignal'; return S; }
    // salinan bingkai untuk pratonton kalibrasi dan pembelajaran (maks 960 lebar)
    const sk = Math.min(1, 960 / r.W);
    if (D.snap.width !== Math.round(r.W * sk)) { D.snap.width = Math.round(r.W * sk); D.snap.height = Math.round(r.H * sk); }
    D.snap.getContext('2d').drawImage(src, 0, 0, D.snap.width, D.snap.height);
    S.W = r.W; S.H = r.H; S.ms = D.stats.ms; S.frames++;
    const thr = D.threshold();
    // penugasan unik: hero terbaik dahulu; setiap hero hanya satu slot
    const keys = Object.keys(r.slots).filter((k) => r.slots[k]).sort((a, b) => r.slots[b].top[0].score - r.slots[a].top[0].score);
    const used = new Set();
    const accepted = {};
    const slots = {};
    keys.forEach((k) => {
      const m = r.slots[k];
      const cand = m.top.filter((c) => !used.has(c.name));
      if (!cand.length) return;
      const c = cand[0];
      const margin = c.score - (cand[1] ? cand[1].score : c.score - 0.2);
      const cf = conf(c.score, margin);
      slots[k] = { name: c.name, score: c.score, margin, conf: cf, top: m.top, sd: m.sd };
      // slot pick: potret dalam game berbeza seni/skin daripada ikon wiki, jadi ambang lebih ketat (ketepatan diutamakan; pembetulan sekali klik + pembelajaran melengkapkan)
      const need = k.indexOf('ban') === 0 ? thr : thr + 0.3;
      slots[k].need = need;
      if (cf >= need) { accepted[k] = slots[k]; used.add(c.name); }
    });
    Object.keys(r.slots).forEach((k) => { if (!slots[k]) slots[k] = null; });
    S.slots = slots;
    S.accepted = accepted;
    S.rects = r.rects;
    // Pintu skrin draft: perlu sekurang-kurangnya 2 slot KUAT (skor >= 0.72 dan margin >= 0.1, cth ikon ban yang sama dengan ikon wiki)
    // dan 3 slot diterima. Diuji pada rakaman sebenar: draft = 4..8 slot kuat; gameplay/keputusan/TikTok = 0.
    const strong = Object.values(accepted).filter((a) => a.score >= 0.72 && a.margin >= 0.1).length;
    S.strong = strong;
    if (!S.active) {
      if (strong >= 2 && Object.keys(accepted).length >= 3) { S.active = true; S.miss = 0; }
    } else {
      S.miss = strong === 0 ? (S.miss || 0) + 1 : 0;
      if (S.miss >= 8) S.active = false; // draft tamat (permainan bermula)
    }
    if (!S.active) { S.status = 'idle'; Object.keys(pend).forEach((k) => delete pend[k]); return S; }
    S.status = 'draft';
    let committed = 0;
    Object.keys(r.slots).forEach((k) => {
      if (isLocked(k)) return;
      const acc = accepted[k];
      if (!acc) { delete pend[k]; return; }
      const cur = current(k);
      if (cur === acc.name) { delete pend[k]; return; }
      const p = pend[k];
      if (p && p.name === acc.name) p.count++; else pend[k] = { name: acc.name, count: 1 };
      const need = cur ? 6 : 3;
      if (pend[k].count < need) return;
      // hero yang sama tidak boleh berada di dua slot: kosongkan slot lama yang dikuasai pengesan
      ['ally0', 'ally1', 'ally2', 'ally3', 'ally4', 'enemy0', 'enemy1', 'enemy2', 'enemy3', 'enemy4'].concat(['banAlly0', 'banAlly1', 'banAlly2', 'banAlly3', 'banAlly4', 'banEnemy0', 'banEnemy1', 'banEnemy2', 'banEnemy3', 'banEnemy4'])
        .forEach((o) => { if (o !== k && !isLocked(o) && current(o) === acc.name) write(o, ''); });
      write(k, acc.name);
      delete pend[k];
      committed++;
    });
    if (committed) {
      const d = GS.state.draft;
      S.committed += committed;
      if (st.autoShow && !d.show) d.show = true;
      const na = d.ally.filter(Boolean).length, ne = d.enemy.filter(Boolean).length;
      if (st.autoPhase) d.phase = na + ne >= 10 ? 'TEAM COMPLETE' : na + ne === 0 ? 'BAN PHASE' : 'DRAFT PICK';
      if (st.autoPredict && GS.meta) {
        const pr = GS.meta.predict(d.ally.map((n) => GS.meta.canon(n)).filter(Boolean), d.enemy.map((n) => GS.meta.canon(n)).filter(Boolean));
        if (pr != null) d.winPct = pr;
      }
      GS.save();
      GS.emit('detect:changed', S);
    }
    return S;
  };

  /** Betulkan slot secara manual dan ajar sistem (templat disimpan pada PC ini). */
  D.correct = function (key, hero, learn) {
    const name = (GS.meta && GS.meta.canon(hero)) || '';
    if (!name) return false;
    write(key, name);
    D.noteManual(key);
    if (learn !== false && D.snap.width) D.learn(key, name, D.snap);
    delete pend[key];
    GS.save();
    GS.emit('detect:changed', D.state);
    return true;
  };

  let timer = 0;
  D.start = function () {
    const st = D.settings();
    clearInterval(timer);
    if (!st.enabled) { D.state.status = 'off'; return; }
    D.state.status = 'loading';
    D.prepare().then(() => { D.state.status = 'idle'; GS.emit('detect:changed', D.state); });
    timer = setInterval(() => { try { D.tick(); } catch (e) { console.error('[GS] ralat pengesan', e); } }, Math.max(400, st.interval));
  };
  D.setEnabled = function (on) { D.settings().enabled = !!on; GS.save(); D.start(); GS.emit('detect:changed', D.state); };
})();
