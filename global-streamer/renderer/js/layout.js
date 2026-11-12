/* Global Streamer - susun atur panel boleh dilaras: tarik pemisah untuk menukar saiz, tarik tajuk dock untuk menukar kedudukan.
 * Semua kekal DI DALAM kawasannya (tidak boleh dikeluarkan atau dihilangkan): had saiz minimum/maksimum dikenakan.
 * Disimpan dalam GS.state.layout (berasingan untuk menegak dan mendatar). Klik dua kali pada pemisah = lalai. */
(function () {
  'use strict';
  const GS = window.GS;
  const { h, $, $$ } = GS;
  const Y = (GS.layout = { gutters: [] });

  const DOCKS = ['dockScenes', 'dockSources', 'dockProps', 'dockMixer', 'dockTemplates'];
  const LEFT = ['dockScenes', 'dockSources', 'dockProps'];
  const DEF = {
    land: { order: DOCKS.slice(), f: { dockScenes: 0.9, dockSources: 1, dockProps: 1.3, dockMixer: 1.25, dockTemplates: 1.7 }, dockH: 0, rightW: 0 },
    port: { order: LEFT.concat(['dockMixer', 'dockTemplates']), f: { dockScenes: 0.7, dockSources: 1, dockProps: 1.3 }, dockH: 0, leftW: 0, rightW: 0 },
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const st = () => {
    const S = GS.state;
    if (!S.layout) S.layout = {};
    ['land', 'port'].forEach((k) => {
      const d = clone(DEF[k]); const cur = S.layout[k] || {};
      const order = Array.isArray(cur.order) && cur.order.length === d.order.length && d.order.every((x) => cur.order.includes(x)) ? cur.order : d.order;
      S.layout[k] = Object.assign(d, cur, { order, f: Object.assign(d.f, cur.f || {}) });
    });
    return S.layout[GS.orient() === 'portrait' ? 'port' : 'land'];
  };
  const mode = () => (GS.orient() === 'portrait' ? 'port' : 'land');
  const el = (id) => document.getElementById(id);
  const clamp = GS.clamp;
  const rootStyle = document.documentElement.style;

  /** Terapkan nilai tersimpan: pembolehubah CSS dan susunan. */
  Y.apply = function () {
    const L = st(), m = mode();
    const set = (k, v) => (v ? rootStyle.setProperty(k, Math.round(v) + 'px') : rootStyle.removeProperty(k));
    set('--dock-h', L.dockH); set('--right-w', L.rightW); set('--left-w', m === 'port' ? L.leftW : 0);
    L.order.forEach((id, i) => { const d = el(id); if (d) d.style.order = i + 1; });
    DOCKS.forEach((id) => { const d = el(id); if (d) d.style.setProperty('--f', L.f[id] != null ? L.f[id] : 1); });
    Y.place();
  };

  /* ---------- pemisah ---------- */
  function gutterEl(kind, cls) {
    const g = h('div', { class: 'gutter ' + cls, 'data-kind': kind, role: 'separator', 'aria-orientation': cls === 'v' ? 'vertical' : 'horizontal', title: GS.t('Tarik untuk laras saiz. Klik dua kali untuk lalai.') });
    document.body.append(g);
    return g;
  }
  /* Kedudukan elemen SEBENAR (tanpa transform/animasi). getBoundingClientRect() terjejas oleh animasi buka tetingkap dan
   * pergerakan #app, sehingga pemisah biru tersalah letak (di atas Audio / Template) bila app baru dibuka. */
  const lr = (d) => {
    let x = 0, y = 0;
    for (let e = d; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
    const w = d.offsetWidth, hh = d.offsetHeight;
    return { left: x, top: y, width: w, height: hh, right: x + w, bottom: y + hh };
  };
  const rect = (id) => { const d = el(id); return d && d.offsetParent !== null ? lr(d) : null; };

  Y.build = function () {
    Y.gutters.forEach((g) => g.el.remove());
    Y.gutters = [];
    const m = mode(), L = st();
    const add = (kind, cls, ctx) => Y.gutters.push(Object.assign({ kind, cls, el: gutterEl(kind, cls) }, ctx));
    const visibleDocks = () => L.order.map((id) => el(id)).filter((d) => d && d.offsetParent !== null);
    if (m === 'land') {
      const ord = L.order;
      for (let i = 0; i < ord.length - 1; i++) add('dock-v', 'v', { a: ord[i], b: ord[i + 1] });
      add('footer-h', 'h', {});
    } else {
      LEFT_ORDER().slice(0, -1).forEach((id, i, arr) => add('left-h', 'h', { a: id, b: LEFT_ORDER()[i + 1] }));
      add('left-v', 'v', {});
      add('footer-h', 'h', {});
    }
    if (!document.body.classList.contains('right-out')) add('right-v', 'v', {});
    Y.gutters.forEach(bindGutter);
    void visibleDocks;
  };
  const LEFT_ORDER = () => st().order.filter((id) => LEFT.includes(id));

  /** Letakkan semua pemisah mengikut kedudukan semasa panel. */
  let raf = 0;
  Y.place = function () {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const m = mode(), L = st();
      const stage = el('stage'), right = el('right');
      Y.gutters.forEach((g) => {
        let r = null, x = 0, y = 0, w = 0, hh = 0;
        if (g.kind === 'dock-v' || g.kind === 'left-h') {
          const A = rect(g.a), B = rect(g.b);
          if (!A || !B) { g.el.style.display = 'none'; return; }
          if (g.cls === 'v') { x = (A.right + B.left) / 2 - 4; y = Math.min(A.top, B.top); w = 8; hh = Math.max(A.bottom, B.bottom) - y; }
          else { x = A.left; y = (A.bottom + B.top) / 2 - 4; w = A.width; hh = 8; }
        } else if (g.kind === 'footer-h') {
          const first = m === 'land' ? rect(L.order[0]) : rect('dockMixer');
          const mixer = rect('dockMixer'); const mm = rect('dockTemplates');
          const top = Math.min(...[rect('dockScenes'), mixer, mm].filter(Boolean).map((q) => q.top));
          const left = m === 'land' ? (first ? first.left : 0) : (rect('dockMixer') || { left: 0 }).left;
          const right2 = Math.max(...[mixer, mm].filter(Boolean).map((q) => q.right));
          x = m === 'land' ? left : mixer ? mixer.left : 0; y = top - 9; w = right2 - x; hh = 8;
          if (m === 'port') { x = (rect('dockMixer') || { left: 0 }).left; w = right2 - x; }
        } else if (g.kind === 'right-v') {
          if (!stage || !right || right.offsetParent === null) { g.el.style.display = 'none'; return; }
          const A = lr(stage), B = lr(right);
          x = (A.right + B.left) / 2 - 4; y = B.top; w = 8; hh = B.height;
        } else if (g.kind === 'left-v') {
          const A = rect('dockScenes'), S2 = stage && lr(stage);
          if (!A || !S2) { g.el.style.display = 'none'; return; }
          x = (A.right + S2.left) / 2 - 4; y = A.top; w = 8; hh = (rect('dockProps') || A).bottom - A.top;
        }
        void r;
        g.el.style.display = '';
        Object.assign(g.el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' });
      });
    });
  };

  function bindGutter(g) {
    const L = st(), m = mode();
    g.el.addEventListener('dblclick', () => { reset(g); });
    g.el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      g.el.setPointerCapture(e.pointerId);
      g.el.classList.add('drag');
      const x0 = e.clientX, y0 = e.clientY;
      const start = snapshot(g);
      const move = (ev) => { dragTo(g, start, ev.clientX - x0, ev.clientY - y0); };
      const up = () => { g.el.releasePointerCapture(e.pointerId); g.el.classList.remove('drag'); g.el.removeEventListener('pointermove', move); g.el.removeEventListener('pointerup', up); g.el.removeEventListener('pointercancel', up); GS.save(); if (GS.app) GS.app.fit(); Y.place(); };
      g.el.addEventListener('pointermove', move); g.el.addEventListener('pointerup', up); g.el.addEventListener('pointercancel', up);
    });
    void L; void m;
  }

  const MIN_DOCK_W = 150, MIN_DOCK_H = 90;
  function snapshot(g) {
    const L = st();
    const s = { dockH: (rect('dockMixer') || rect('dockScenes') || { height: 220 }).height, rightW: (el('right') && el('right').offsetWidth) || 0, leftW: (el('dockLeft') && el('dockLeft').offsetWidth) || 0 };
    if (g.kind === 'dock-v' || g.kind === 'left-h') { const A = lr(el(g.a)), B = lr(el(g.b)); s.A = g.kind === 'dock-v' ? A.width : A.height; s.B = g.kind === 'dock-v' ? B.width : B.height; s.fa = L.f[g.a]; s.fb = L.f[g.b]; }
    return s;
  }
  function dragTo(g, s, dx, dy) {
    const L = st();
    if (g.kind === 'dock-v' || g.kind === 'left-h') {
      const min = g.kind === 'dock-v' ? MIN_DOCK_W : MIN_DOCK_H, sum = s.A + s.B, d = g.kind === 'dock-v' ? dx : dy;
      const a = clamp(s.A + d, min, sum - min), tot = s.fa + s.fb;
      L.f[g.a] = (a / sum) * tot; L.f[g.b] = ((sum - a) / sum) * tot;
    } else if (g.kind === 'footer-h') {
      const maxH = Math.round(window.innerHeight * 0.6);
      L.dockH = clamp(Math.round(s.dockH - dy + 22), 150, maxH); // +22: tajuk dock dan jarak
    } else if (g.kind === 'right-v') {
      L.rightW = clamp(Math.round(s.rightW - dx), 260, Math.round(window.innerWidth * 0.5));
    } else if (g.kind === 'left-v') {
      L.leftW = clamp(Math.round(s.leftW + dx), 200, Math.round(window.innerWidth * 0.45));
    }
    Y.apply();
  }
  function reset(g) {
    const L = st(), D = DEF[mode()];
    if (g.kind === 'dock-v' || g.kind === 'left-h') { L.f[g.a] = D.f[g.a]; L.f[g.b] = D.f[g.b]; }
    else if (g.kind === 'footer-h') L.dockH = 0;
    else if (g.kind === 'right-v') L.rightW = 0;
    else if (g.kind === 'left-v') L.leftW = 0;
    Y.apply(); GS.save(); if (GS.app) GS.app.fit();
  }
  /** Tetapkan semula semua (susun atur semasa). */
  Y.resetAll = function () {
    const S = GS.state; S.layout = S.layout || {};
    S.layout[mode()] = clone(DEF[mode()]);
    ['--dock-h', '--right-w', '--left-w'].forEach((k) => rootStyle.removeProperty(k));
    Y.apply(); GS.save(); if (GS.app) GS.app.fit();
  };

  /** Animasi licin (FLIP) apabila panel bertukar tempat: perlahan dan lembut seperti peralihan iOS. */
  function flip(change) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const before = {};
    DOCKS.forEach((id) => { const d = el(id); if (d && d.offsetParent !== null) before[id] = d.getBoundingClientRect(); });
    change();
    if (reduce) return;
    DOCKS.forEach((id) => {
      const d = el(id), b = before[id];
      if (!d || !b || d.offsetParent === null || !d.animate) return;
      const a = d.getBoundingClientRect();
      const dx = b.left - a.left, dy = b.top - a.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      if (d._flip) d._flip.cancel();
      d._flip = d.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
    });
  }

  /* ---------- susun semula: tarik tajuk dock ---------- */
  function bindReorder(id) {
    const d = el(id);
    const head = d && $('.dock-head', d);
    if (!head || head.dataset.reorder) return;
    head.dataset.reorder = '1';
    head.classList.add('movable');
    head.title = GS.t('Tarik tajuk untuk menukar kedudukan panel ini');
    head.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button, input, select, a, .seg-mini')) return;
      if (mode() === 'port' && !LEFT.includes(id)) return; // mendatar sahaja; dalam mod menegak hanya kumpulan kiri boleh disusun semula
      const x0 = e.clientX, y0 = e.clientY; let dragging = false;
      const L = st(), m = mode();
      const group = m === 'port' ? (LEFT.includes(id) ? LEFT : ['dockMixer', 'dockTemplates']) : DOCKS; // kekal dalam kumpulannya
      const horizontal = !(m === 'port' && LEFT.includes(id));
      const move = (ev) => {
        if (!dragging && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 7) return;
        if (!dragging) { dragging = true; d.classList.add('dragging'); document.body.classList.add('reordering'); }
        const order = L.order.filter((x) => group.includes(x));
        const centers = order.map((x) => { const r = el(x).getBoundingClientRect(); return horizontal ? r.left + r.width / 2 : r.top + r.height / 2; });
        const pos = horizontal ? ev.clientX : ev.clientY;
        let target = centers.findIndex((c) => pos < c); if (target < 0) target = order.length - 1;
        const cur = order.indexOf(id);
        if (target !== cur) {
          order.splice(cur, 1); order.splice(target, 0, id);
          // tulis semula kedudukan kumpulan ini ke dalam susunan penuh (slot kumpulan kekal sama)
          const slots = L.order.map((x, i) => (group.includes(x) ? i : -1)).filter((i) => i >= 0);
          slots.forEach((slot, k) => { L.order[slot] = order[k]; });
          flip(() => { Y.apply(); Y.build(); Y.place(); });
        }
      };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); d.classList.remove('dragging'); document.body.classList.remove('reordering'); if (dragging) GS.save(); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    });
  }

  Y.init = function () {
    DOCKS.forEach(bindReorder);
    Y.apply(); Y.build(); Y.place();
    new ResizeObserver(() => Y.place()).observe(el('app') || document.body);
    window.addEventListener('resize', () => Y.place());
    // pastikan kedudukan betul selepas animasi buka, muat fon dan susun atur selesai
    ['animationend', 'transitionend'].forEach((ev) => document.addEventListener(ev, () => Y.place(), true));
    window.addEventListener('load', () => Y.place());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => Y.place());
    [60, 300, 800, 1600].forEach((ms) => setTimeout(() => Y.place(), ms));
    GS.on('format:changed', () => { Y.apply(); Y.build(); Y.place(); });
    GS.on('popout:changed', () => setTimeout(() => { Y.build(); Y.place(); }, 60));
  };
})();
