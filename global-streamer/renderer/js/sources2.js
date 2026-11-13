/* Global Streamer - sumber tambahan: AUTO SLIDE (gambar bergilir dengan peralihan) dan PRESENTATION (PDF / PowerPoint).
 * Sumber bertaip 'slides' dan 'deck' dilukis oleh kompositor melalui GS.slides.draw / GS.deck.draw. */
(function () {
  'use strict';
  const { h } = GS;
  const native = () => !!(window.gsNative && window.gsNative.isNative);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   // easeInOutCubic

  /* ======================================================================= AUTO SLIDE */
  const SL = (GS.slides = {});
  const DEF = { images: [], intervalMs: 3000, transition: 'fade', transMs: 700, smooth: true, fit: 'cover', loop: true };
  SL.defaults = () => JSON.parse(JSON.stringify(DEF));

  const urlOf = (it) => (it.src ? it.src : it.path && GS.media.clipFileUrl ? GS.media.clipFileUrl(it.path) : '');
  const imgOf = (it) => { const u = urlOf(it); return u ? GS.media.image(u) : null; };

  function fitRect(im, s, mode) {
    const iw = im.naturalWidth, ih = im.naturalHeight;
    const r = mode === 'contain' ? Math.min(s.w / iw, s.h / ih) : mode === 'stretch' ? 0 : Math.max(s.w / iw, s.h / ih);
    const dw = mode === 'stretch' ? s.w : iw * r, dh = mode === 'stretch' ? s.h : ih * r;
    return [s.x + (s.w - dw) / 2, s.y + (s.h - dh) / 2, dw, dh];
  }
  function drawOne(ctx, im, s, mode, o) {
    if (!im || !im.naturalWidth) return;
    const [x, y, w, hh] = fitRect(im, s, mode);
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.dx || o.dy) ctx.translate(o.dx || 0, o.dy || 0);
    if (o.scale && o.scale !== 1) { const cx = s.x + s.w / 2, cy = s.y + s.h / 2; ctx.translate(cx, cy); ctx.scale(o.scale, o.scale); ctx.translate(-cx, -cy); }
    ctx.drawImage(im, x, y, w, hh);
    ctx.restore();
  }
  SL.draw = function (ctx, s, now) {
    const p = Object.assign({}, DEF, s.props || {});
    const items = p.images || [];
    ctx.save();
    ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
    if (!items.length) {
      ctx.fillStyle = 'rgba(8,18,38,0.85)'; ctx.fillRect(s.x, s.y, s.w, s.h);
      GS.widgets.text(ctx, GS.tov ? GS.tov('AUTO SLIDE') : 'AUTO SLIDE', s.x + s.w / 2, s.y + s.h / 2, { size: Math.min(s.h * 0.1, 40), weight: 800, align: 'center', color: '#8aa2c4', spacing: 3 });
      ctx.restore(); return;
    }
    const n = items.length;
    const hold = clamp(Number(p.intervalMs) || 3000, 300, 120000), tr = p.transition === 'cut' ? 0 : clamp(Number(p.transMs) || 700, 0, 5000);
    const cycle = hold + tr;
    let k = Math.floor(now / cycle);
    if (p.loop === false && k >= n - 1) k = n - 1;
    const idx = ((k % n) + n) % n;
    const phase = p.loop === false && k >= n - 1 ? 0 : now % cycle;
    const cur = imgOf(items[idx]);
    // semasa peralihan: slide seterusnya masuk, slide semasa keluar
    if (phase > hold && tr > 0 && n > 1) {
      let t = (phase - hold) / tr;
      t = p.smooth === false ? t : ease(t);
      const nxt = imgOf(items[(idx + 1) % n]);
      switch (p.transition) {
        case 'slide': drawOne(ctx, cur, s, p.fit, { dx: -s.w * t }); drawOne(ctx, nxt, s, p.fit, { dx: s.w * (1 - t) }); break;
        case 'slideup': drawOne(ctx, cur, s, p.fit, { dy: -s.h * t }); drawOne(ctx, nxt, s, p.fit, { dy: s.h * (1 - t) }); break;
        case 'zoom': drawOne(ctx, cur, s, p.fit, { alpha: 1 }); drawOne(ctx, nxt, s, p.fit, { alpha: t, scale: 0.85 + 0.15 * t }); break;
        case 'zoomout': drawOne(ctx, nxt, s, p.fit, { alpha: 1 }); drawOne(ctx, cur, s, p.fit, { alpha: 1 - t, scale: 1 + 0.15 * t }); break;
        default: drawOne(ctx, cur, s, p.fit, { alpha: 1 }); drawOne(ctx, nxt, s, p.fit, { alpha: t });   // fade
      }
    } else drawOne(ctx, cur, s, p.fit, {});
    ctx.restore();
  };

  /** Hadkan saiz gambar slide: laluan fail (app Windows) disimpan sahaja; selainnya dikecilkan JPEG supaya storan tidak penuh. */
  async function toItem(file) {
    const path = native() && window.gsNative.pathOf ? window.gsNative.pathOf(file) : '';
    if (path) return { name: file.name, path };
    const url = await GS.media.readFile(file);
    return { name: file.name, src: await shrink(url, 1280) };
  }
  function shrink(dataUrl, max) {
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        const r = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        if (r >= 1 && dataUrl.length < 400000) return res(dataUrl);
        const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * r); c.height = Math.round(im.naturalHeight * r);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.84));
      };
      im.onerror = () => res(dataUrl);
      im.src = dataUrl;
    });
  }
  const thumbUrl = (it) => urlOf(it);

  /** Tetingkap pop-up Auto Slide: pilih gambar, kelajuan, peralihan dan kelicinan; "Simpan" barulah ditayangkan. */
  SL.openEditor = function (src) {
    const st = GS.scenes;
    const p = Object.assign(SL.defaults(), src ? JSON.parse(JSON.stringify(src.props || {})) : {});
    const list = h('div', { class: 'sl-list' });
    const paint = () => {
      list.innerHTML = '';
      if (!p.images.length) list.append(h('div', { class: 'empty' }, GS.t('Belum ada gambar. Tekan "Tambah gambar" untuk pilih daripada komputer.')));
      p.images.forEach((it, i) => list.append(h('div', { class: 'sl-item' },
        h('img', { src: thumbUrl(it), alt: it.name || '' }),
        h('span', { class: 'sl-no' }, String(i + 1)),
        h('div', { class: 'sl-btns' },
          h('button', { type: 'button', class: 'icon-btn sm', title: GS.t('Naik'), disabled: i === 0, onClick: () => { [p.images[i - 1], p.images[i]] = [p.images[i], p.images[i - 1]]; paint(); }, html: GS.icon('up', 13) }),
          h('button', { type: 'button', class: 'icon-btn sm', title: GS.t('Turun'), disabled: i === p.images.length - 1, onClick: () => { [p.images[i + 1], p.images[i]] = [p.images[i], p.images[i + 1]]; paint(); }, html: GS.icon('down', 13) }),
          h('button', { type: 'button', class: 'icon-btn sm', title: GS.t('Buang'), onClick: () => { p.images.splice(i, 1); paint(); }, html: GS.icon('trash', 13) })))));
      cnt.textContent = GS.t('{0} gambar', p.images.length);
    };
    const cnt = h('span', { class: 'muted' }, '');
    const pick = () => {
      const inp = h('input', { type: 'file', accept: 'image/*', multiple: true, style: { display: 'none' } });
      inp.addEventListener('change', async () => {
        for (const f of Array.from(inp.files || [])) { try { p.images.push(await toItem(f)); } catch (e) { /* abaikan gambar rosak */ } }
        paint();
      });
      document.body.append(inp); inp.click(); setTimeout(() => inp.remove(), 60000);
    };
    const sel = (key, opts, parse) => h('select', { onChange: (e) => { p[key] = parse ? parse(e.target.value) : e.target.value; } }, opts.map(([v, l]) => h('option', { value: v, selected: String(p[key]) === String(v) }, GS.t(l))));
    const body = h('div', { class: 'sl-editor' },
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn primary', id: 'btnSlideAdd', onClick: pick }, GS.t('Tambah gambar')), cnt),
      list,
      h('div', { class: 'grid2' },
        h('label', { class: 'field' }, h('span', null, GS.t('Tempoh setiap slide (ms)')), h('input', { type: 'number', id: 'slInterval', min: 300, max: 120000, step: 100, value: p.intervalMs, onChange: (e) => { p.intervalMs = clamp(Number(e.target.value) || 3000, 300, 120000); } })),
        h('label', { class: 'field' }, h('span', null, GS.t('Tempoh peralihan (ms)')), h('input', { type: 'number', id: 'slTrans', min: 0, max: 5000, step: 50, value: p.transMs, onChange: (e) => { p.transMs = clamp(Number(e.target.value) || 0, 0, 5000); } })),
        h('label', { class: 'field' }, h('span', null, GS.t('Jenis peralihan')), sel('transition', [['fade', 'Pudar'], ['slide', 'Luncur ke kiri'], ['slideup', 'Luncur ke atas'], ['zoom', 'Zum masuk'], ['zoomout', 'Zum keluar'], ['cut', 'Potong (tanpa peralihan)']])),
        h('label', { class: 'field' }, h('span', null, GS.t('Kelicinan')), sel('smooth', [['true', 'Licin (lembut)'], ['false', 'Lurus (sekata)']], (v) => v === 'true')),
        h('label', { class: 'field' }, h('span', null, GS.t('Muat gambar')), sel('fit', [['cover', 'Penuhi (potong)'], ['contain', 'Muat (tanpa potong)'], ['stretch', 'Regang']])),
        h('label', { class: 'field' }, h('span', null, GS.t('Ulang')), sel('loop', [['true', 'Ulang sentiasa'], ['false', 'Sekali sahaja (berhenti di akhir)']], (v) => v === 'true'))));
    paint();
    const save = h('button', { type: 'button', class: 'btn primary', id: 'btnSlideSave', onClick: () => {
      if (!p.images.length) { GS.toast(GS.t('Tambah sekurang-kurangnya satu gambar.'), 'warn'); return; }
      if (src) { src.props = Object.assign(src.props || {}, p); GS.save(); GS.emit('props:changed'); GS.emit('scenes:changed'); }
      else {
        const dw = GS.design.w, dh = GS.design.h;
        const s = { id: GS.uid('src'), type: 'slides', name: 'Auto Slide', visible: true, locked: false, x: Math.round(dw * 0.15), y: Math.round(dh * 0.15), w: Math.round(dw * 0.7), h: Math.round(dh * 0.7), fit: 'cover', props: p };
        const sc = st.editTarget(); sc.sources.push(s); st.selectSource(s.id); GS.save(); GS.emit('sources:changed'); GS.emit('scenes:changed');
      }
      m.close();
      GS.toast(GS.t('Auto Slide disimpan dan ditayangkan.'), 'ok');
    } }, GS.t('Simpan'));
    const m = GS.modal({ title: src ? 'Sunting Auto Slide' : 'Auto Slide', body, wide: true, footer: h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn ghost', onClick: () => m.close() }, GS.t('Batal')), save) });
  };

  /* ======================================================================= PRESENTATION */
  const DK = (GS.deck = { docs: new Map(), pages: new Map() });
  let pdfReady = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfReady) return pdfReady;
    pdfReady = new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = 'vendor/pdfjs/pdf.min.js';
      sc.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js'; } catch (e) { /* abaikan */ } res(window.pdfjsLib); };
      sc.onerror = () => rej(new Error('pustaka PDF tidak dapat dimuat'));
      document.head.append(sc);
    });
    return pdfReady;
  }
  /** Muatkan dokumen PDF (data bait) untuk kunci dokumen. */
  async function openPdf(key, bytes) {
    const lib = await loadPdfJs();
    const doc = await lib.getDocument({ data: bytes }).promise;
    DK.docs.set(key, doc);
    DK.pages.set(key, new Map());
    return doc;
  }
  async function renderPage(key, n) {
    const doc = DK.docs.get(key); if (!doc) return null;
    const cache = DK.pages.get(key) || new Map(); DK.pages.set(key, cache);
    if (cache.has(n) && cache.get(n).canvas) return cache.get(n).canvas;
    if (cache.has(n)) return null;                          // sedang dilukis
    cache.set(n, { canvas: null });
    try {
      const page = await doc.getPage(n);
      const vp0 = page.getViewport({ scale: 1 });
      const scale = clamp(1800 / vp0.width, 0.5, 4);
      const vp = page.getViewport({ scale });
      const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      const c2 = cv.getContext('2d'); c2.fillStyle = '#ffffff'; c2.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: c2, viewport: vp }).promise;
      cache.set(n, { canvas: cv });
      // simpan paling banyak 6 halaman dalam memori
      if (cache.size > 6) { for (const k of cache.keys()) { if (Math.abs(k - n) > 2) { cache.delete(k); break; } } }
      return cv;
    } catch (e) { cache.delete(n); return null; }
  }
  /** Muat semula dokumen daripada laluan fail (app Windows) selepas app dibuka semula. */
  async function ensureDoc(s) {
    const p = s.props || {};
    if (!p.docKey || DK.docs.has(p.docKey) || p._loading) return;
    if (!native() || !p.pdfPath || !window.gsNative.deck) return;
    p._loading = true;
    try {
      const r = await window.gsNative.deck.read(p.pdfPath);
      if (r && r.ok) await openPdf(p.docKey, new Uint8Array(r.data));
    } catch (e) { /* tinggalkan pemegang tempat */ }
    p._loading = false;
  }
  DK.draw = function (ctx, s, now) {
    const p = s.props || {};
    ctx.save();
    ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
    ctx.fillStyle = '#0b0f1a'; ctx.fillRect(s.x, s.y, s.w, s.h);
    const doc = p.docKey && DK.docs.get(p.docKey);
    if (!doc) {
      ensureDoc(s);
      GS.widgets.text(ctx, p.docKey ? GS.t('Memuatkan presentation…') : 'PRESENTATION', s.x + s.w / 2, s.y + s.h / 2, { size: Math.min(s.h * 0.07, 34), weight: 800, align: 'center', color: '#8aa2c4', spacing: 2 });
      if (p.name) GS.widgets.text(ctx, p.name, s.x + s.w / 2, s.y + s.h / 2 + Math.min(s.h * 0.08, 40), { size: Math.min(s.h * 0.045, 22), weight: 600, align: 'center', color: '#5d7799', maxW: s.w * 0.9 });
      ctx.restore(); return;
    }
    const n = clamp(p.page || 1, 1, doc.numPages);
    const cv = (DK.pages.get(p.docKey) || new Map()).get(n);
    const canvas = cv && cv.canvas;
    if (!canvas) renderPage(p.docKey, n);
    // pra-lukis halaman seterusnya supaya peralihan slaid segera
    if (n < doc.numPages && canvas) renderPage(p.docKey, n + 1);
    if (canvas) {
      const r = Math.min(s.w / canvas.width, s.h / canvas.height);
      const dw = canvas.width * r, dh = canvas.height * r;
      ctx.drawImage(canvas, s.x + (s.w - dw) / 2, s.y + (s.h - dh) / 2, dw, dh);
    }
    ctx.restore();
  };
  DK.go = function (s, to) {
    const p = s.props; const doc = p.docKey && DK.docs.get(p.docKey); if (!doc) return;
    p.page = clamp(to, 1, doc.numPages);
    GS.save(); GS.emit('props:changed');
  };
  DK.pageCount = (s) => { const d = s.props && s.props.docKey && DK.docs.get(s.props.docKey); return d ? d.numPages : 0; };

  /** Kawasan perbentangan: sumber bertanda props.slot (template perbentangan), jika tiada guna capture card yang kelihatan, jika tiada guna seluruh kanvas. */
  DK.slotRect = function (sc) {
    const srcs = (sc && sc.sources) || [];
    const slot = srcs.find((x) => x.props && x.props.slot && x.visible !== false) || srcs.find((x) => x.type === 'video' && x.props && x.props.kind === 'capture' && x.visible !== false);
    return slot ? { x: slot.x, y: slot.y, w: slot.w, h: slot.h } : { x: 0, y: 0, w: GS.design.w, h: GS.design.h };
  };
  DK.placeInSlot = function (sc, s, aspect) {
    const r = DK.slotRect(sc);
    if (aspect >= 1.5) { s.x = r.x; s.y = r.y; s.w = r.w; s.h = r.h; s.fit = 'contain'; return; }                 // slaid 16:9
    const hh = Math.round(r.h * 0.96), ww = Math.round(Math.min(r.w, hh * aspect));                                // kertas A4 / menegak: di tengah
    s.w = ww; s.h = Math.round(ww / aspect); s.x = Math.round(r.x + (r.w - s.w) / 2); s.y = Math.round(r.y + (r.h - s.h) / 2); s.fit = 'contain';
  };

  /** Buka fail presentation (PDF / PPT / PPTX) dan cipta/ganti sumber. */
  DK.openFile = function (src) {
    const inp = h('input', { type: 'file', accept: '.pdf,.ppt,.pptx,.pps,.ppsx,.odp,application/pdf', style: { display: 'none' } });
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const key = GS.uid('deck');
      let bytes, pdfPath = '', srcPath = native() && window.gsNative.pathOf ? window.gsNative.pathOf(f) : '';
      const toast = (t, k) => GS.toast(GS.t(t), k || 'info', 5000);
      try {
        if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') {
          bytes = new Uint8Array(await f.arrayBuffer());
          pdfPath = srcPath;
        } else {
          if (!native() || !window.gsNative.deck || !srcPath) { toast('Fail PowerPoint hanya boleh dibuka dalam app Windows. Simpan sebagai PDF dahulu jika menggunakan versi web.', 'warn'); return; }
          toast('Menukar PowerPoint kepada PDF… tunggu sebentar.', 'info');
          const r = await window.gsNative.deck.convert(srcPath);
          if (!r || !r.ok) { toast(r && r.message ? r.message : 'Tidak dapat menukar PowerPoint. Pasang Microsoft PowerPoint atau LibreOffice, atau simpan fail sebagai PDF.', 'warn'); return; }
          pdfPath = r.pdf;
          const rd = await window.gsNative.deck.read(pdfPath);
          if (!rd || !rd.ok) { toast('Tidak dapat membaca fail yang ditukar.', 'warn'); return; }
          bytes = new Uint8Array(rd.data);
        }
        const doc = await openPdf(key, bytes);
        const st = GS.scenes;
        if (src) {
          src.props = Object.assign(src.props || {}, { docKey: key, name: f.name, page: 1, pdfPath });
          src.name = 'Presentation';
        } else {
          const dw = GS.design.w, dh = GS.design.h;
          const s = { id: GS.uid('src'), type: 'deck', name: 'Presentation', visible: true, locked: false, x: Math.round(dw * 0.05), y: Math.round(dh * 0.05), w: Math.round(dw * 0.9), h: Math.round(dh * 0.9), fit: 'contain', props: { docKey: key, name: f.name, page: 1, pdfPath } };
          const sc = st.editTarget();
          // letak automatik di kedudukan capture card (atau kawasan perbentangan template): slaid 16:9 memenuhi kawasan itu, kertas A4 di tengah
          try { const pg = await doc.getPage(1); const vp = pg.getViewport({ scale: 1 }); DK.placeInSlot(sc, s, vp.width / vp.height); } catch (e) { /* kekal saiz asal */ }
          sc.sources.push(s); st.selectSource(s.id);
        }
        GS.save(); GS.emit('sources:changed'); GS.emit('scenes:changed'); GS.emit('props:changed');
        GS.toast(GS.t('Presentation dimuatkan: {0} ({1} halaman).', f.name, doc.numPages), 'ok');
      } catch (e) {
        GS.toast(GS.t('Fail tidak dapat dibuka: {0}', e && e.message ? e.message : ''), 'warn');
      }
    });
    document.body.append(inp); inp.click(); setTimeout(() => inp.remove(), 60000);
  };

  // PageUp / PageDown menukar slaid presentation yang dipilih (tidak bertembung dengan anak panah yang menggerakkan sumber)
  window.addEventListener('keydown', (e) => {
    const t = (e.target.tagName || '').toLowerCase();
    if (t === 'input' || t === 'textarea' || t === 'select' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key !== 'PageUp' && e.key !== 'PageDown') return;
    const s = GS.scenes.selectedSource();
    if (!s || s.type !== 'deck') return;
    e.preventDefault();
    DK.go(s, (s.props.page || 1) + (e.key === 'PageDown' ? 1 : -1));
  });

  /* panel sifat untuk kedua-dua jenis sumber */
  GS.sources2 = {
    props(root, s, renderProps) {
      if (s.type === 'slides') {
        const p = s.props || {};
        root.append(h('div', { class: 'prop-info' }, GS.t('{0} gambar · {1} ms · {2}', (p.images || []).length, p.intervalMs || 3000, GS.t(p.transition === 'cut' ? 'Potong' : 'Peralihan'))));
        root.append(h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn primary', id: 'btnSlideEdit', onClick: () => SL.openEditor(s) }, GS.t('Sunting slide'))));
      }
      if (s.type === 'deck') {
        const n = DK.pageCount(s);
        root.append(h('div', { class: 'prop-info' }, (s.props.name || 'Presentation') + (n ? ' · ' + GS.t('Slaid {0} / {1}', s.props.page || 1, n) : '')));
        root.append(h('div', { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn', id: 'btnDeckPrev', disabled: !n, onClick: () => { DK.go(s, (s.props.page || 1) - 1); renderProps(); } }, '◀ ' + GS.t('Sebelum')),
          h('button', { type: 'button', class: 'btn primary', id: 'btnDeckNext', disabled: !n, onClick: () => { DK.go(s, (s.props.page || 1) + 1); renderProps(); } }, GS.t('Seterusnya') + ' ▶')));
        root.append(h('div', { class: 'grid2' },
          h('label', { class: 'field' }, h('span', null, GS.t('Pergi ke slaid')), h('input', { type: 'number', id: 'deckGoto', min: 1, max: n || 1, value: s.props.page || 1, disabled: !n, onChange: (e) => { DK.go(s, Number(e.target.value) || 1); renderProps(); } }))));
        root.append(h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn ghost', id: 'btnDeckOpen', onClick: () => DK.openFile(s) }, GS.t('Tukar fail presentation'))));
        root.append(h('p', { class: 'muted note' }, GS.t('Tekan PageUp / PageDown untuk menukar slaid. Menyokong PDF dan PowerPoint (PPT, PPTX).')));
      }
    },
  };
})();
