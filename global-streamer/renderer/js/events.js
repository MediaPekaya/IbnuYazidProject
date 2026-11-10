/*
 * Global Streamer - pengesan kejadian dalam game (Fasa 5b): kill, death, item dibeli, victory, defeat.
 *
 *  - Kill / death: HUD kanan atas memaparkan K/D/A sebagai nombor putih. Nombor dibaca dengan padanan glif digit
 *    (tanpa OCR berat), dan perubahan nilai menjadi kejadian. Kill berturut-turut dalam tetingkap masa => DOUBLE/TRIPLE/MANIAC/SAVAGE.
 *  - Item: toast pembelian (ikon + nama) di kanan atas dipadankan dengan ikon item daripada wiki.
 *  - Victory / Defeat: skrin keputusan dipadankan dengan tandatangan visual (disimpan sebagai vektor ciri, bukan gambar).
 * ROI ditakrif dalam unit TINGGI bingkai dan dilabuhkan kanan/tengah, sama seperti pengesan draft.
 */
(function () {
  'use strict';
  const GS = window.GS;
  const E = (GS.events = { ready: false, log: [], state: { status: 'off' } });

  /* ---------- geometri ---------- */
  // HUD diukur daripada rakaman gameplay 1280x720 (unit = tinggi 720). a:'R' = jarak dari tepi kanan ke tepi kiri ROI.
  E.rois = {
    kills: { a: 'R', x: 0.4125, y: 0.025, w: 0.040, h: 0.034 },
    deaths: { a: 'R', x: 0.3361, y: 0.025, w: 0.039, h: 0.034 },
    assists: { a: 'R', x: 0.2611, y: 0.025, w: 0.060, h: 0.034 },
  };
  const rect = (r, W, H) => ({ x: Math.round(r.a === 'R' ? W - r.x * H : r.a === 'C' ? W / 2 + r.x * H : r.x * H), y: Math.round(r.y * H), w: Math.max(2, Math.round(r.w * H)), h: Math.max(2, Math.round(r.h * H)) });
  E.rect = rect;

  /* ---------- pembaca digit ---------- */
  const CH = 48; // tinggi kanonik ROI selepas penskalaan
  const GW = 10, GH = 16;
  const cv = document.createElement('canvas');
  const cx = cv.getContext('2d', { willReadFrequently: true });

  function segment(src, r) {
    const cw = Math.max(8, Math.round((r.w / r.h) * CH));
    cv.width = cw; cv.height = CH;
    cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
    try { cx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, cw, CH); } catch (e) { return { valid: false, segs: [] }; }
    const px = cx.getImageData(0, 0, cw, CH).data;
    const m = new Uint8Array(cw * CH);
    let mx = 0;
    for (let i = 0; i < cw * CH; i++) { const v = Math.min(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]); m[i] = v; if (v > mx) mx = v; }
    if (mx < 110) return { valid: false, segs: [], mx };
    const T = Math.max(100, 0.72 * mx);
    const cols = new Int16Array(cw);
    for (let y = 0; y < CH; y++) for (let x = 0; x < cw; x++) if (m[y * cw + x] > T) cols[x]++;
    const runs = [];
    let s = -1, gap = 0;
    for (let x = 0; x <= cw; x++) {
      const on = x < cw && cols[x] >= 3;
      if (on) { if (s < 0) s = x; gap = 0; } else if (s >= 0) { gap++; if (gap > 2 || x === cw) { runs.push([s, x - gap]); s = -1; gap = 0; } }
    }
    const segs = [];
    runs.forEach(([x0, x1]) => {
      let y0 = CH, y1 = -1;
      for (let y = 0; y < CH; y++) for (let x = x0; x <= x1; x++) if (m[y * cw + x] > T) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const h = y1 - y0 + 1, w = x1 - x0 + 1;
      if (h < CH * 0.42 || w > h * 1.1) return; // bukan digit (bunyi, ikon, tepi cahaya)
      const vec = new Float32Array(GW * GH);
      for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
        const ax0 = x0 + (gx * w) / GW, ax1 = x0 + ((gx + 1) * w) / GW, ay0 = y0 + (gy * h) / GH, ay1 = y0 + ((gy + 1) * h) / GH;
        let sum = 0, n = 0;
        for (let yy = Math.floor(ay0); yy < Math.ceil(ay1); yy++) for (let xx = Math.floor(ax0); xx < Math.ceil(ax1); xx++) { sum += m[yy * cw + xx] > T ? 1 : 0; n++; }
        vec[gy * GW + gx] = n ? sum / n : 0;
      }
      let nrm = 0; for (let i = 0; i < vec.length; i++) nrm += vec[i] * vec[i];
      nrm = Math.sqrt(nrm) || 1;
      for (let i = 0; i < vec.length; i++) vec[i] /= nrm;
      segs.push({ x0, x1, y0, y1, w, h, aspect: w / h, vec });
    });
    return { valid: true, segs, mx };
  }
  E.segment = segment;

  const tmpl = () => (GS.data && GS.data.digits && GS.data.digits.t) || null;
  function classify(seg) {
    const T = tmpl();
    if (!T) return null;
    let best = null, second = -1;
    Object.keys(T).forEach((d) => {
      const t = T[d];
      let dotp = 0;
      for (let i = 0; i < seg.vec.length; i++) dotp += seg.vec[i] * t.v[i];
      const sc = dotp - 0.6 * Math.abs(seg.aspect - t.aspect);
      if (!best || sc > best.score) { if (best) second = best.score; best = { digit: d, score: sc }; } else if (sc > second) second = sc;
    });
    best.margin = best.score - second;
    return best;
  }
  /** Baca nombor (rentetan digit) daripada ROI. Kembalikan { value, conf } atau null jika tidak sah. */
  E.readNumber = function (src, r) {
    const seg = segment(src, r);
    if (!seg.valid || !seg.segs.length || seg.segs.length > 3) return null;
    const ds = seg.segs.map(classify);
    if (ds.some((d) => !d)) return null;
    const conf = Math.min(...ds.map((d) => d.score));
    if (conf < 0.7) return null;
    return { value: Number(ds.map((d) => d.digit).join('')), conf, margin: Math.min(...ds.map((d) => d.margin)) };
  };
  /** Baca K/D/A daripada bingkai. */
  E.readKDA = function (src) {
    const W = src.videoWidth || src.naturalWidth || src.width, H = src.videoHeight || src.naturalHeight || src.height;
    if (!W || !H) return null;
    const out = {};
    ['kills', 'deaths', 'assists'].forEach((k) => { out[k] = E.readNumber(src, rect(E.rois[k], W, H)); });
    return out;
  };

  /* ---------- latihan templat digit (alat pembangunan; hasil disimpan dalam data/digits.js) ---------- */
  E._train = function (samples) {
    // samples: [{ src, kills, deaths, assists }] dengan nilai sebenar. Setiap digit dilabel mengikut susunan kiri->kanan.
    const acc = {};
    samples.forEach((s) => {
      const W = s.src.naturalWidth || s.src.width, H = s.src.naturalHeight || s.src.height;
      ['kills', 'deaths', 'assists'].forEach((k) => {
        const seg = segment(s.src, rect(E.rois[k], W, H));
        const label = String(s[k]);
        if (!seg.valid || seg.segs.length !== label.length) return;
        seg.segs.forEach((g, i) => { const d = label[i]; (acc[d] = acc[d] || []).push(g); });
      });
    });
    const out = {};
    Object.keys(acc).forEach((d) => {
      const n = acc[d].length, v = new Float32Array(GW * GH);
      let asp = 0;
      acc[d].forEach((g) => { for (let i = 0; i < v.length; i++) v[i] += g.vec[i] / n; asp += g.aspect / n; });
      let nrm = 0; for (let i = 0; i < v.length; i++) nrm += v[i] * v[i];
      nrm = Math.sqrt(nrm) || 1;
      out[d] = { v: Array.from(v, (x) => Math.round((x / nrm) * 1e3) / 1e3), aspect: Math.round(asp * 1e3) / 1e3, n };
    });
    return { w: GW, h: GH, t: out };
  };

  /* ---------- tetapan ---------- */
  const DEF = { enabled: false, kills: true, items: true, results: true, interval: 500, window: 10, sensitivity: 0.5, adjHud: { dx: 0, dy: 0, s: 1 }, adjToast: { dx: 0, dy: 0, s: 1 } };
  E.settings = function () {
    const st = GS.state.events || (GS.state.events = {});
    Object.keys(DEF).forEach((k) => { if (!(k in st)) st[k] = JSON.parse(JSON.stringify(DEF[k])); });
    return st;
  };
  // ROI toast pembelian item (ikon bulat di bawah $ emas, kanan atas). Diukur daripada rakaman 1280x720.
  E.rois.toastIcon = { a: 'R', x: 0.229, y: 0.100, w: 0.100, h: 0.100 };
  E.rois.result = { a: 'C', x: -0.62, y: 0.38, w: 1.24, h: 0.30 };
  const adj = (r, a) => {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, w = r.w * a.s, h = r.h * a.s;
    const dx = r.a === 'R' ? -a.dx : a.dx;
    return { a: r.a, x: r.a === 'R' ? r.x - (w - r.w) / 2 + dx : r.a === 'C' ? r.x - (w - r.w) / 2 + dx : cx - w / 2 + dx, y: cy - h / 2 + a.dy, w, h };
  };
  E.roi = function (name) {
    const st = E.settings();
    const hud = name === 'kills' || name === 'deaths' || name === 'assists';
    return adj(E.rois[name], hud ? st.adjHud : name === 'toastIcon' ? st.adjToast : { dx: 0, dy: 0, s: 1 });
  };

  /* ---------- log kejadian ---------- */
  E.emit = function (type, detail) {
    const ev = { t: Date.now(), type, detail: detail || {} };
    E.log.unshift(ev);
    E.log.length = Math.min(E.log.length, 30);
    GS.emit('events:log', ev);
  };

  /* ---------- skrin keputusan (victory / defeat) ---------- */
  const unb64 = (str) => { const s = atob(str); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  let resT = null;
  function loadResultTemplates() {
    if (resT) return resT;
    const src = GS.data && GS.data.resultT;
    if (!src) return null;
    resT = {};
    Object.keys(src).forEach((k) => { resT[k] = src[k].map((e) => ({ vec: Float32Array.from(new Int8Array(unb64(e.v).buffer), (x) => x / 127), hist: Float32Array.from(unb64(e.h), (x) => x / 255) })); });
    E.loadLearnedResults();
    return resT;
  }
  const LRKEY = 'gs.events.result.v1';
  const encF = (f) => { let a = ''; const v = new Int8Array(Int8Array.from(f.vec, (x) => Math.round(x * 127))); const h = Uint8Array.from(f.hist, (x) => Math.round(x * 255)); const b = (u) => { let s = ''; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }; return { v: b(new Uint8Array(v.buffer)), h: b(h) }; };
  E.loadLearnedResults = function () {
    let st = {};
    try { st = JSON.parse(localStorage.getItem(LRKEY) || '{}'); } catch (e) { /* abaikan */ }
    ['victory', 'defeat'].forEach((k) => { resT[k] = resT[k].filter((t) => !t.learned); (st[k] || []).forEach((e) => resT[k].push({ learned: true, vec: Float32Array.from(new Int8Array(unb64(e.v).buffer), (x) => x / 127), hist: Float32Array.from(unb64(e.h), (x) => x / 255) })); });
  };
  /** Ajar skrin keputusan semasa (klik apabila skrin VICTORY/DEFEAT dipaparkan). */
  E.learnResult = function (kind, src) {
    src = src || GS.detect.source();
    if (!src || !GS.detect._feature) return false;
    const W = src.videoWidth || src.naturalWidth || src.width, H = src.videoHeight || src.naturalHeight || src.height;
    const r = rect(E.roi('result'), W, H);
    const f = GS.detect._feature(src, r.x, r.y, r.w, r.h);
    if (!f) return false;
    let st = {};
    try { st = JSON.parse(localStorage.getItem(LRKEY) || '{}'); } catch (e) { /* abaikan */ }
    (st[kind] = st[kind] || []).push(encF(f));
    while (st[kind].length > 6) st[kind].shift();
    try { localStorage.setItem(LRKEY, JSON.stringify(st)); } catch (e) { return false; }
    loadResultTemplates(); E.loadLearnedResults();
    return true;
  };
  E.clearLearnedResults = function () { try { localStorage.removeItem(LRKEY); } catch (e) { /* abaikan */ } if (resT) E.loadLearnedResults(); };
  const inter = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.min(a[i], b[i]); return s; };
  E.resultScores = function (src) {
    const T = loadResultTemplates();
    if (!T || !GS.detect._feature) return null;
    const W = src.videoWidth || src.naturalWidth || src.width, H = src.videoHeight || src.naturalHeight || src.height;
    if (!W || !H) return null;
    const r = rect(E.roi('result'), W, H);
    const f = GS.detect._feature(src, r.x, r.y, r.w, r.h);
    if (!f) return { victory: 0, defeat: 0 };
    const out = {};
    ['victory', 'defeat'].forEach((k) => {
      let best = -1;
      T[k].forEach((t) => { let d = 0; for (let i = 0; i < f.vec.length; i++) d += f.vec[i] * t.vec[i]; const sc = 0.8 * d + 0.2 * inter(f.hist, t.hist); if (sc > best) best = sc; });
      out[k] = best;
    });
    return out;
  };

  /* ---------- item: toast pembelian ---------- */
  let itemDB = null;
  function itemDBReady() { return itemDB && itemDB.ready; }
  E.prepareItems = async function () {
    if (itemDB) return itemDB.promise;
    itemDB = { ready: false, t: [] };
    const items = (GS.data.mlbbItems || []).filter((i) => i.img);
    itemDB.promise = (async () => {
      const queue = items.slice();
      const one = (it) => new Promise((res) => {
        const im = new Image(); im.crossOrigin = 'anonymous'; im.referrerPolicy = 'no-referrer';
        im.onload = () => {
          try {
            const w = im.naturalWidth, h = im.naturalHeight;
            [[1, 0, 0], [0.84, 0, 0], [0.7, 0, 0]].forEach(([k, ox, oy]) => { const f = GS.detect._feature(im, (w - w * k) / 2 + ox * w, (h - h * k) / 2 + oy * h, w * k, h * k); if (f) itemDB.t.push({ name: it.name, vec: f.vec, hist: f.hist }); });
          } catch (e) { /* abaikan */ }
          res();
        };
        im.onerror = res;
        im.src = it.img + '/scale-to-width-down/96';
      });
      await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) await one(queue.shift()); }));
      itemDB.ready = itemDB.t.length > 0;
      return itemDB.ready;
    })();
    return itemDB.promise;
  };
  // cincin emas di sekeliling ikon toast: pintu supaya kawasan kosong tidak dipadankan secara palsu
  const rc = document.createElement('canvas');
  rc.width = rc.height = 40;
  const rx = rc.getContext('2d', { willReadFrequently: true });
  function goldRing(src, r) {
    try { rx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, 40, 40); } catch (e) { return 0; }
    const d = rx.getImageData(0, 0, 40, 40).data;
    let hit = 0;
    const N = 24;
    for (let a = 0; a < N; a++) {
      const ang = (a / N) * Math.PI * 2;
      let ok = false;
      for (let rad = 13; rad <= 21 && !ok; rad += 1) {
        const x = Math.round(20 + Math.cos(ang) * rad), y = Math.round(20 + Math.sin(ang) * rad);
        if (x < 0 || y < 0 || x > 39 || y > 39) continue;
        const i = (y * 40 + x) * 4, R = d[i], G = d[i + 1], B = d[i + 2];
        if (R > 150 && G > 105 && B < 150 && R - B > 40 && R >= G) ok = true;
      }
      if (ok) hit++;
    }
    return hit / N;
  }
  E.matchItem = function (src) {
    if (!itemDBReady() || !GS.detect._feature) return null;
    const W = src.videoWidth || src.naturalWidth || src.width, H = src.videoHeight || src.naturalHeight || src.height;
    const r = rect(E.roi('toastIcon'), W, H);
    const ring = goldRing(src, r);
    const f = GS.detect._feature(src, r.x, r.y, r.w, r.h);
    if (!f) return null;
    const best = new Map();
    itemDB.t.forEach((t) => { const s = 0.8 * (() => { let d = 0; for (let i = 0; i < f.vec.length; i++) d += f.vec[i] * t.vec[i]; return d; })() + 0.2 * inter(f.hist, t.hist); if (!best.has(t.name) || best.get(t.name) < s) best.set(t.name, s); });
    const arr = [...best.entries()].sort((a, b) => b[1] - a[1]);
    return { name: arr[0][0], score: arr[0][1], margin: arr[0][1] - arr[1][1], ring, top: arr.slice(0, 4).map(([name, s]) => ({ name, score: s })) };
  };

  /* ---------- enjin imbasan ---------- */
  const S = (E.state = { status: 'off', kda: null, result: null, item: null, frames: 0, ms: 0, kdaOk: 0 });
  const M = { base: null, pendKDA: null, chain: [], streak: 0, resStreak: 0, resLock: '', resClear: 0, itemPend: null, itemCool: {}, owned: new Set(), lastKillAt: 0, kills: 0 };
  E._m = M;

  const LABELS = ['KILL', 'DOUBLE KILL', 'TRIPLE KILL', 'MANIAC', 'SAVAGE'];
  function onKills(n, now) {
    const st = E.settings();
    for (let i = 0; i < n; i++) {
      if (now - M.lastKillAt <= st.window * 1000 && M.chain.length) M.chain.push(now); else M.chain = [now];
      M.lastKillAt = now;
      M.streak++;
      let label = LABELS[Math.min(M.chain.length, 5) - 1];
      if (M.chain.length === 1 && M.streak === 3) label = 'KILLING SPREE';
      E.emit('kill', { label, chain: M.chain.length, streak: M.streak });
      GS.fx.trigger('kill', { label });
    }
  }
  function onDeath() {
    M.streak = 0; M.chain = [];
    E.emit('death');
    GS.fx.trigger('death');
  }
  function newMatch(reason) { M.base = null; M.pendKDA = null; M.chain = []; M.streak = 0; M.owned = new Set(); E.emit('newmatch', { reason }); }

  function stepKDA(src, now) {
    const k = E.readKDA(src);
    const ok = k && k.kills && k.deaths && k.assists;
    S.kda = ok ? { k: k.kills.value, d: k.deaths.value, a: k.assists.value } : null;
    if (!ok) return;
    S.kdaOk++;
    const cur = S.kda;
    // pengesahan: nilai sama dalam 2 imbasan berturut-turut
    const key = cur.k + ',' + cur.d + ',' + cur.a;
    if (!M.pendKDA || M.pendKDA.key !== key) { M.pendKDA = { key, n: 1, v: cur }; return; }
    M.pendKDA.n++;
    if (M.pendKDA.n !== 2) return;
    if (!M.base) { M.base = cur; return; }                        // garis dasar: tiada kejadian untuk nilai sedia ada
    const b = M.base;
    if (cur.k < b.k || cur.d < b.d) { if (cur.k + cur.d <= 1) newMatch('reset'); return; }  // nilai menurun: perlawanan baharu atau salah baca
    const dk = cur.k - b.k, dd = cur.d - b.d;
    if (dk > 3 || dd > 2) return;                                   // lonjakan tidak munasabah: abaikan, tunggu nilai stabil
    M.base = cur;
    if (dd > 0) onDeath();
    if (dk > 0) onKills(dk, now);
  }

  function stepItem(src, now) {
    const m = E.matchItem(src);
    S.item = m;
    if (!m) return;
    const thr = 0.62 - 0.2 * E.settings().sensitivity; // 0.52 lalai
    const ok = m.ring >= 0.1 && m.score >= thr && m.margin >= 0.12;
    if (!ok) { M.itemPend = null; return; }
    if (!M.itemPend || M.itemPend.name !== m.name) { M.itemPend = { name: m.name, n: 1 }; return; }
    M.itemPend.n++;
    if (M.itemPend.n !== 3) return; // toast sebenar kekal beberapa saat: perlu 3 imbasan berturut-turut dengan item sama
    if (M.itemCool[m.name] && now - M.itemCool[m.name] < 10000) return;
    M.itemCool[m.name] = now;
    const it = (GS.data.mlbbItemByName || {})[m.name.toLowerCase()] || { name: m.name, cat: 'attack' };
    E.emit('item', { name: m.name, score: m.score });
    GS.fx.trigger('itembuy', { item: it });
    // kesan "item penuh": komponen resipi digantikan oleh item gabungan
    (it.recipe || []).forEach((r) => M.owned.delete(r));
    if (!/Potion$/i.test(it.name)) M.owned.add(it.name);
    S.owned = [...M.owned];
    if (M.owned.size >= 6 && !M.fullAnnounced) {
      M.fullAnnounced = true;
      E.emit('fullitem', { items: [...M.owned] });
      GS.fx.trigger('fullitem', { items: [...M.owned].map((n) => (GS.data.mlbbItemByName || {})[n.toLowerCase()] || { name: n, cat: 'attack' }) });
    }
  }

  function stepResult(src, now) {
    const sc = E.resultScores(src);
    S.result = sc;
    if (!sc) return;
    const thr = 0.82 - 0.2 * E.settings().sensitivity - 0.0; // 0.72 lalai
    const kind = sc.victory >= thr && sc.victory >= sc.defeat ? 'victory' : sc.defeat >= thr ? 'defeat' : '';
    if (!kind) {
      M.resStreak = 0;
      if (M.resLock && ++M.resClear >= 10) { M.resLock = ''; M.resClear = 0; }
      return;
    }
    M.resClear = 0;
    M.resStreak++;
    if (M.resStreak < 2 || M.resLock === kind) return;
    M.resLock = kind;
    E.emit(kind, { score: sc[kind] });
    GS.fx.trigger(kind);
    newMatch(kind); // perlawanan tamat: tetapkan semula K/D/A dan item
    M.fullAnnounced = false;
  }

  E.tick = function (forced, nowOverride) {
    const st = E.settings();
    const src = forced || GS.detect.source();
    if (!src) { S.status = 'nosource'; return S; }
    const W = src.videoWidth || src.naturalWidth || src.width;
    if (!W) { S.status = 'nosignal'; return S; }
    const t0 = performance.now();
    const now = nowOverride || Date.now();
    if (!E.snap) E.snap = document.createElement('canvas');
    const sk = Math.min(1, 960 / W), H0 = src.videoHeight || src.naturalHeight || src.height;
    if (E.snap.width !== Math.round(W * sk)) { E.snap.width = Math.round(W * sk); E.snap.height = Math.round(H0 * sk); }
    E.snap.getContext('2d').drawImage(src, 0, 0, E.snap.width, E.snap.height);
    S.W = W; S.H = H0;
    S.status = 'on';
    S.frames++;
    if (st.results) stepResult(src, now);
    if (st.kills) stepKDA(src, now);
    if (st.items) stepItem(src, now);
    S.ms = performance.now() - t0;
    return S;
  };

  let timer = 0;
  E.start = function () {
    const st = E.settings();
    clearInterval(timer);
    if (!st.enabled) { S.status = 'off'; return; }
    S.status = 'loading';
    loadResultTemplates();
    if (st.items) E.prepareItems().then(() => { S.status = 'on'; GS.emit('events:log', null); });
    timer = setInterval(() => { try { E.tick(); } catch (e) { console.error('[GS] ralat pengesan kejadian', e); } }, Math.max(250, st.interval));
  };
  E.setEnabled = function (on) { E.settings().enabled = !!on; GS.save(); E.start(); };
  E.reset = function () { newMatch('manual'); M.fullAnnounced = false; S.owned = []; M.itemCool = {}; };
})();
