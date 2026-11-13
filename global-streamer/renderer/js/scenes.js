/* Global Streamer - scene, source, panel sifat & suntingan pada kanvas */
(function () {
  'use strict';
  const { h, icon } = { h: GS.h, icon: GS.icon };
  const S = (GS.scenes = {});
  let selectedId = null;
  let drafts = {};   // draf Pratonton (Mod Studio), tidak disimpan ke storan

  /* ---------- akses ---------- */
  const st = () => GS.state;
  const byId = (id) => st().scenes.find((s) => s.id === id);
  S.all = () => st().scenes;
  S.program = () => byId(st().programId) || st().scenes[0];
  /* Mod Studio: Pratonton ialah DRAF (salinan) scene. Apa sahaja yang disunting/ditambah di Pratonton tidak masuk Program
   * sehingga butang Peralihan ditekan. Setiap scene yang dipratonton menyimpan drafnya sendiri. */
  S.draftOf = (sc) => {
    if (!sc) return sc;
    if (!drafts[sc.id]) drafts[sc.id] = Object.assign({}, sc, { sources: GS.clone(sc.sources) });
    return drafts[sc.id];
  };
  S.dropDrafts = () => { drafts = {}; };
  S.getDrafts = () => drafts;
  S.setDrafts = (d) => { drafts = d || {}; };
  S.preview = () => {
    const sc = byId(st().previewId) || S.program();
    return st().mode === 'studio' ? S.draftOf(sc) : sc;
  };
  /** scene sebenar atau drafnya (Studio, scene yang sedang dipratonton) */
  const sceneForEdit = (id) => { const sc = byId(id); return sc && st().mode === 'studio' && id === st().previewId ? S.draftOf(sc) : sc; };
  S.editTarget = () => (st().mode === 'studio' ? S.preview() : S.program());
  S.selectedSource = () => { const sc = S.editTarget(); return sc && sc.sources.find((x) => x.id === selectedId); };
  S.selectedId = () => selectedId;

  function changed(what) { GS.save(); GS.emit(what || 'scenes:changed'); }

  /* ---------- pembina sumber ---------- */
  const mk = (type, name, x, y, w, h2, props = {}) => ({ id: GS.uid('src'), type, name, visible: true, locked: false, x, y, w, h: h2, fit: 'cover', props });

  S.ensureDefaults = function () {
    if (st().scenes.length) return;
    const por = GS.orient() === 'portrait';
    const a = S.applyTemplate(por ? 'holo-portrait' : 'holo-pro', null);
    const b = S.applyTemplate(por ? 'portrait-game' : 'game-penuh', null, por ? 'Fokus Game' : 'Game Penuh');
    // scene "Sebentar Lagi": guna template kira detik (jam/minit/saat boleh ditetapkan, tulisan boleh diedit)
    const c = S.applyTemplate(por ? 'sl-holo-portrait' : 'sl-holo-land', null, 'Sebentar Lagi') || (() => {
      const brb = por
        ? [mk('widget', 'Tajuk', 140, 760, 800, 260, { widget: 'brand', text: 'SEBENTAR LAGI' }), mk('widget', 'Banner Promosi', 0, 1484, 1080, 140, { widget: 'promo', style: 'info' })]
        : [mk('widget', 'Tajuk', 560, 400, 800, 200, { widget: 'brand', text: 'SEBENTAR LAGI' }), mk('widget', 'Bar Teks', 40, 846, 1840, 96, { widget: 'ticker' })];
      const sc = { id: GS.uid('scene'), name: 'Sebentar Lagi', fxStyle: 'holo', templateId: null, sources: brb };
      st().scenes.push(sc); return sc;
    })();
    st().programId = a.id;
    st().previewId = b.id;
    st().templateId = por ? 'holo-portrait' : 'holo-pro';
    GS.save();
  };

  /* Tukar format siaran: menegak 9:16 (TikTok LIVE) atau mendatar 16:9 (YouTube / Facebook).
   * Susun atur setiap format DISIMPAN dan dipulihkan apabila kembali (tiada kehilangan scene/sumber). Format yang belum pernah
   * digunakan mendapat susun atur lalai. Peranti video (capture card, kamera) dikekalkan; tiada muat semula halaman. */
  S.setOrientation = function (o) {
    if (o !== 'portrait' && o !== 'landscape') return false;
    if (o === GS.orient()) return true;
    if (GS.live && GS.live.state !== 'idle') { GS.toast(GS.t('Tamatkan siaran dahulu sebelum menukar format.'), 'warn'); return false; }
    const set = st().settings;
    const stash = st().layouts || (st().layouts = {});
    stash[GS.orient()] = { scenes: st().scenes, programId: st().programId, previewId: st().previewId, templateId: st().templateId, width: set.width, height: set.height, fps: set.fps, vbitrate: set.vbitrate };
    const keep = {};
    st().scenes.forEach((sc) => sc.sources.forEach((s) => {
      if (s.type === 'video' && s.props.kind !== 'screen' && GS.media.videos[s.id] && !keep[s.props.kind]) keep[s.props.kind] = { entry: GS.media.videos[s.id], deviceId: s.props.deviceId, label: s.props.deviceLabel };
    }));
    set.orientation = o;
    GS.applyDesign();
    const back = stash[o];
    delete stash[o];
    if (back && Array.isArray(back.scenes) && back.scenes.length) {
      st().scenes = back.scenes; st().programId = back.programId; st().previewId = back.previewId; st().templateId = back.templateId;
      set.width = back.width; set.height = back.height; set.fps = back.fps; set.vbitrate = back.vbitrate;
      if (!byId(st().programId)) st().programId = st().scenes[0].id;
      if (!byId(st().previewId)) st().previewId = st().programId;
    } else {
      set.width = o === 'portrait' ? 1080 : 1920;
      set.height = o === 'portrait' ? 1920 : 1080;
      set.fps = o === 'portrait' ? 30 : 60;
      set.vbitrate = o === 'portrait' ? 5000 : 6000;
      st().scenes = [];
      st().programId = st().previewId = null;
      S.ensureDefaults();
    }
    selectedId = null;
    // sambung peranti: guna semula aliran yang sedang terbuka; jika tidak, buka semula peranti tersimpan (senyap)
    st().scenes.forEach((sc) => sc.sources.forEach((s) => {
      if (s.type !== 'video' || s.props.kind === 'screen' || GS.media.videos[s.id] || s.props.deviceId) return;
      const k = keep[s.props.kind];
      if (k) { GS.media.videos[s.id] = k.entry; s.props.deviceId = k.deviceId; s.props.deviceLabel = k.label; }
    }));
    GS.media.autoReconnect(st().scenes);
    if (GS.app && GS.app.programComp) { GS.app.programComp.transition = null; GS.app.applyResolution(); GS.app.fit(); }
    GS.save();
    GS.emit('scenes:changed');
    GS.emit('format:changed', o);
    return true;
  };
  S.switchFormat = (o) => S.setOrientation(o);

  /* ---------- template ---------- */
  S.applyTemplate = function (tplId, sceneId, newName) {
    const game = GS.games[st().game];
    const tpl = game && game.templates.find((t) => t.id === tplId);
    if (!tpl) return null;
    let sc = sceneId ? sceneForEdit(sceneId) : null;
    const fresh = tpl.build();
    const old = sc ? sc.sources : [];
    const pool = old.filter((o) => o.type === 'video');
    fresh.forEach((n) => {
      if (n.type !== 'video') return;
      const i = pool.findIndex((o) => o.props.kind === n.props.kind);
      if (i >= 0) { const o = pool.splice(i, 1)[0]; n.id = o.id; n.props = Object.assign({}, o.props); }
    });
    pool.forEach((o) => { if (!fresh.some((n) => n.id === o.id)) GS.media.close(o.id); });
    const before = sc ? Object.assign({}, sc) : null;   // keadaan lama (sumber + tema) untuk animasi peralihan
    if (!sc) { sc = { id: GS.uid('scene'), name: newName || 'Live · ' + tpl.name, sources: [] }; st().scenes.push(sc); }
    sc.sources = fresh;
    sc.templateId = tpl.id;
    sc.theme = tpl.theme || tpl.fxStyle;
    sc.fxStyle = sc.theme;
    sc.fxAnchor = tpl.fxAnchor;
    sc.alertY = tpl.alertY;
    st().templateId = tpl.id;
    selectedId = null;
    // animasi lembut (gaya iOS) daripada rupa lama ke template baharu, pada paparan yang sedang menyunting scene ini
    if (before && GS.app && !S.noAnimate) {
      const comp = st().mode === 'studio' ? GS.app.previewComp : GS.app.programComp;
      if (comp && comp.startTransition) comp.startTransition(before, sc, 'ios', 760);
    }
    changed();
    return sc;
  };

  /* ---------- scene ---------- */
  S.add = function () {
    const sc = { id: GS.uid('scene'), name: GS.t('Scene {0}', st().scenes.length + 1), fxStyle: 'holo', templateId: null, sources: [] };
    st().scenes.push(sc);
    S.select(sc.id);
    changed();
  };
  S.duplicate = function (id) {
    const src = byId(id);
    if (!src) return;
    const copy = GS.clone(src);
    copy.id = GS.uid('scene');
    copy.name = GS.t('{0} (salinan)', GS.t(src.name));
    copy.sources.forEach((s, i) => {
      const oldId = src.sources[i].id;
      s.id = GS.uid('src');
      if (s.type === 'video' && GS.media.videos[oldId]) GS.media.videos[s.id] = GS.media.videos[oldId];
    });
    st().scenes.push(copy);
    changed();
  };
  S.remove = async function (id) {
    if (st().scenes.length <= 1) { GS.toast('Mesti ada sekurang-kurangnya satu scene.', 'warn'); return; }
    const sc = byId(id);
    if (!sc || !(await GS.ask(GS.t('Padam scene "{0}"?', GS.t(sc.name)), { danger: true }))) return;
    sc.sources.forEach((s) => GS.media.close(s.id));
    st().scenes = st().scenes.filter((s) => s.id !== id);
    if (st().programId === id) st().programId = st().scenes[0].id;
    if (st().previewId === id) st().previewId = st().scenes[0].id;
    delete drafts[id];
    selectedId = null;
    changed();
  };
  S.rename = function (id, name) {
    const sc = byId(id);
    if (sc && name.trim()) { sc.name = name.trim(); changed(); }
  };

  S.setProgram = function (id) {
    const to = byId(id), from = S.program();
    if (!to || to === from) return;
    const stg = st().settings;
    const prog = GS.app && GS.app.programComp;
    if (prog && stg.transition !== 'cut') prog.startTransition(from, to, stg.transition, stg.transitionMs);
    st().programId = id;
    changed();
  };

  S.select = function (id) {
    if (st().mode === 'studio') st().previewId = id;
    else { S.setProgram(id); st().previewId = id; }
    selectedId = null;
    changed();
  };

  S.doTransition = function () {
    if (st().mode !== 'studio') return;
    const draft = S.preview(), pg = S.program();
    const target = byId(st().previewId) || pg;
    if (!draft || !target) return;
    const same = target === pg;
    // tiada perubahan dan scene sama dengan Program: tiada apa untuk dialihkan
    if (same && JSON.stringify(draft.sources) === JSON.stringify(pg.sources)) { GS.toast(GS.t('Tiada perubahan untuk dialihkan. Sunting Pratonton atau pilih scene lain.'), 'info'); return; }
    // rakaman keadaan Program sebelum ini untuk animasi peralihan (susunan sumber lama kekal pada objek ini)
    const before = Object.assign({}, pg);
    // Peralihan: draf menjadi scene sebenar (id sumber dikekalkan supaya kamera/capture tidak terputus)
    const dropped = target.sources.filter((o) => !draft.sources.some((n) => n.id === o.id));
    target.sources = draft.sources;
    dropped.forEach((o) => { if (!st().scenes.some((x) => x.sources.some((y) => y.id === o.id))) { GS.media.close(o.id); if (o.type === 'clip') GS.media.removeClip(o.id); } });
    ['name', 'theme', 'fxStyle', 'fxAnchor', 'alertY', 'templateId'].forEach((k) => { if (draft[k] !== undefined) target[k] = draft[k]; });
    delete drafts[target.id];
    const oldProgramId = pg.id;
    if (same) {
      const stg = st().settings, prog = GS.app && GS.app.programComp;
      if (prog && stg.transition !== 'cut') prog.startTransition(before, target, stg.transition, stg.transitionMs);
    } else {
      S.setProgram(target.id);
      // tukar tempat seperti OBS: scene yang tadi dilihat penonton kini di Pratonton (kiri), scene baharu di Program (kanan)
      st().previewId = oldProgramId;
    }
    selectedId = null;
    GS.toast(GS.t('Dialihkan ke Program.'), 'ok');
    changed();
  };

  /* ---------- sumber ---------- */
  function addSource(src) {
    const sc = S.editTarget();
    if (!sc) return;
    sc.sources.push(src);
    selectedId = src.id;
    changed('sources:changed');
    GS.emit('scenes:changed');
  }

  S.addVideo = async function (kind) {
    const names = { capture: 'Game (Capture Card)', camera: 'Kamera', screen: 'Skrin / Tetingkap', gamepc: 'Game PC', display: 'Display Capture' };
    const dw = GS.design.w, dh = GS.design.h;
    const box = kind === 'camera' ? (dw > dh ? [1240, 40, 640, 360] : [640, 80, 400, 400]) : [0, 0, dw, dh];
    // "Game PC": tangkap SATU tetingkap sahaja (Steam, game, pelayar) seperti Window/Game Capture dalam OBS
    const props = kind === 'gamepc' ? { kind: 'screen', mode: 'window', deviceId: '' } : kind === 'display' ? { kind: 'screen', mode: 'display', deviceId: '' } : { kind, deviceId: '' };
    const src = mk('video', names[kind], ...box, props);
    src.fit = kind === 'camera' ? 'cover' : 'contain';
    addSource(src);
    const ok = await GS.media.pick(src);
    if (ok) S.afterPick(src);
  };

  /* selepas peranti dipilih: isi sumber lain sejenis yang belum ada peranti */
  S.afterPick = function (src) {
    if (!src.props.deviceId && src.props.kind !== 'screen') return;
    if (src.props.kind !== 'screen') {
      for (const sc of st().scenes) for (const s of sc.sources) {
        if (s !== src && s.type === 'video' && s.props.kind === src.props.kind && !s.props.deviceId) {
          s.props.deviceId = src.props.deviceId;
          s.props.deviceLabel = src.props.deviceLabel;
          GS.media.videos[s.id] = GS.media.videos[src.id];
        }
      }
    }
    changed('sources:changed');
  };

  S.addImage = function () {
    const inp = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    inp.addEventListener('change', async () => {
      const f = inp.files[0];
      if (!f) return;
      const url = await GS.media.downscale(await GS.media.readFile(f), 1920);
      const src = mk('image', f.name, 560, 240, 800, 600, { src: url });
      src.fit = 'contain';
      addSource(src);
    });
    document.body.append(inp);
    inp.click();
    setTimeout(() => inp.remove(), 60000);
  };

  /** Kedudukan bar bawah (footer): bar teks / banner promosi pada scene, jika tiada jalur bawah kanvas. */
  const footerRect = (sc) => {
    const W = GS.design.w, H = GS.design.h;
    // saiz footer besar mengikut rujukan: potret 1080 x 488, melintang 1920 x 300 (sampai ke bawah kanvas)
    if (W < H) return [0, H - Math.round(W * 0.452), W, Math.round(W * 0.452)];
    return [0, H - 300, W, 300];
    // saiz footer rujukan: lebar penuh, tinggi 0.45 x lebar (potret 1080 x 488 piksel)
    return W < H ? [0, H - Math.round(W * 0.452), W, Math.round(W * 0.452)] : [40, H - 210, W - 80, 170];
  };
  S.footerRect = footerRect;
  /** Tambah banner / video sendiri (imej, GIF animasi, video WebM/MP4) sebagai sumber, lalai di kedudukan footer. */
  S.addClip = function () {
    const inp = h('input', { type: 'file', accept: 'image/*,video/*,.gif,.webm,.mp4,.mov,.m4v', style: { display: 'none' } });
    inp.addEventListener('change', async () => {
      const f = inp.files[0];
      if (!f) return;
      await S.loadClip(null, f);
    });
    document.body.append(inp);
    inp.click();
    setTimeout(() => inp.remove(), 60000);
  };
  /** Footer video: pengguna memilih video pendek siap (cth 5-10 saat) yang bergerak/berulang di bar bawah menggantikan bar teks. */
  S.addFooterVideo = function () {
    const inp = h('input', { type: 'file', accept: 'video/*,.webm,.mp4,.mov,.m4v', style: { display: 'none' } });
    inp.addEventListener('change', async () => {
      const f = inp.files[0];
      if (!f) return;
      if (!(/^video\//.test(f.type) || /\.(webm|mp4|mov|m4v)$/i.test(f.name))) { GS.toast(GS.t('Pilih fail video (WebM, MP4 atau MOV).'), 'warn'); return; }
      const src = await S.loadClip(null, f);
      if (!src) return;
      src.name = 'Footer Video'; src.fit = 'cover'; src.props.footerVideo = true; src.props.loop = true;
      S.setBarsHidden(S.editTarget(), true); // bar teks diganti video; boleh dipaparkan semula melalui kotak "Sembunyikan bar teks"
      changed('props:changed'); renderProps();
      GS.toast(GS.t('Footer video dipasang di bar bawah dan berulang secara automatik. Seret atau ubah saiz jika perlu.') + ' ' + GS.t('Saiz video yang sesuai:') + ' ' + (GS.design.w < GS.design.h ? '1080 x 488' : '1920 x 300') + ' px.', 'ok', 8000);
    });
    document.body.append(inp);
    inp.click();
    setTimeout(() => inp.remove(), 60000);
  };
  /** Tukar video/imej sebuah klip dengan fail lain dari peranti (kedudukan dan saiz kekal; potongan ditetapkan semula). */
  S.replaceClip = function (s) {
    const inp = h('input', { type: 'file', accept: 'image/*,video/*,.gif,.webm,.mp4,.mov,.m4v', style: { display: 'none' } });
    inp.addEventListener('change', () => { if (inp.files[0]) S.loadClip(s, inp.files[0]); inp.remove(); });
    document.body.append(inp);
    inp.click();
    setTimeout(() => inp.remove(), 60000);
  };

  /** Potong video: tetingkap potongan diseret di atas pratonton (tiada pemegang sudut). Roda tetikus / peluncur untuk zum.
   *  Mod "Ikut kotak" mengunci nisbah ikut kotak footer; mod "Bebas" melaras empat sisi dengan peluncur. Disimpan sebagai pecahan (0-1) dalam props.crop. */
  S.cropClip = function (s) {
    const rec = GS.media.clips[s.id];
    const el = rec && rec.el;
    const vw = el && (rec.kind === 'video' ? el.videoWidth : el.naturalWidth), vh = el && (rec.kind === 'video' ? el.videoHeight : el.naturalHeight);
    if (!rec || !rec.ready || !vw || !vh) { GS.toast(GS.t('Video belum dimuat. Cuba sebentar lagi.'), 'warn'); return; }
    const A = s.w / s.h;
    const orig = s.props.crop ? Object.assign({}, s.props.crop) : null;
    const c = orig ? Object.assign({}, orig) : { x: 0, y: 0, w: 1, h: 1 };
    const bw = Math.min(vw, vh * A) / vw, bh = (bw * vw / A) / vh; // potongan terbesar yang ikut nisbah kotak
    let free = !!orig && Math.abs((c.w * vw) / (c.h * vh) - A) > 0.03;
    const clampC = () => { c.w = Math.min(1, Math.max(0.05, c.w)); c.h = Math.min(1, Math.max(0.05, c.h)); c.x = Math.min(1 - c.w, Math.max(0, c.x)); c.y = Math.min(1 - c.h, Math.max(0, c.y)); };
    const apply = () => { clampC(); if (c.w > 0.995 && c.h > 0.995) delete s.props.crop; else s.props.crop = { x: c.x, y: c.y, w: c.w, h: c.h }; GS.save(); };
    const zoomTo = (z) => { const cx = c.x + c.w / 2, cy = c.y + c.h / 2; c.w = bw / z; c.h = bh / z; c.x = cx - c.w / 2; c.y = cy - c.h / 2; apply(); sync(); };
    const maxW = 640, maxH = 380;
    const k = Math.min(maxW / vw, maxH / vh);
    const W = Math.round(vw * k), H = Math.round(vh * k);
    const cv = h('canvas', { width: W, height: H, class: 'crop-cv', style: { width: W + 'px', height: H + 'px', maxWidth: '100%' } });
    const g = cv.getContext('2d');
    let alive = true;
    const draw = () => {
      if (!alive) return;
      g.clearRect(0, 0, W, H);
      try { g.drawImage(el, 0, 0, W, H); } catch (e) { /* belum sedia */ }
      const x = c.x * W, y = c.y * H, w = c.w * W, hh = c.h * H;
      g.fillStyle = 'rgba(4, 8, 18, 0.66)';
      g.fillRect(0, 0, W, y); g.fillRect(0, y + hh, W, H - y - hh); g.fillRect(0, y, x, hh); g.fillRect(x + w, y, W - x - w, hh);
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
      g.beginPath();
      for (let i = 1; i < 3; i++) { g.moveTo(x + (w * i) / 3, y); g.lineTo(x + (w * i) / 3, y + hh); g.moveTo(x, y + (hh * i) / 3); g.lineTo(x + w, y + (hh * i) / 3); }
      g.stroke();
      g.strokeStyle = '#ffd36b'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, hh - 2);
      requestAnimationFrame(draw);
    };
    let drag = null;
    cv.style.cursor = 'grab';
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); drag = { px: e.clientX, py: e.clientY, x: c.x, y: c.y }; cv.style.cursor = 'grabbing'; });
    cv.addEventListener('pointermove', (e) => { if (!drag) return; const r = cv.getBoundingClientRect(); c.x = drag.x + (e.clientX - drag.px) / r.width; c.y = drag.y + (e.clientY - drag.py) / r.height; apply(); sync(); });
    const end = () => { drag = null; cv.style.cursor = 'grab'; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', (e) => { if (free) return; e.preventDefault(); zoomTo(Math.min(8, Math.max(1, bw / c.w * (e.deltaY < 0 ? 1.08 : 1 / 1.08)))); }, { passive: false });

    const range = (min, max, step, onInput) => h('input', { type: 'range', min, max, step, class: 'fader crop-range', onInput: (e) => onInput(Number(e.target.value)) });
    const lbl = (t, ctl, val) => h('label', { class: 'field crop-row' }, h('span', null, t), ctl, val);
    const vZoom = h('b', null), vPx = h('b', null), vPy = h('b', null), vL = h('b', null), vR = h('b', null), vT = h('b', null), vB = h('b', null);
    const rZoom = range(100, 800, 1, (v) => zoomTo(v / 100));
    const rPx = range(0, 100, 1, (v) => { c.x = (1 - c.w) * v / 100; apply(); sync(); });
    const rPy = range(0, 100, 1, (v) => { c.y = (1 - c.h) * v / 100; apply(); sync(); });
    const rL = range(0, 90, 1, (v) => { const r = 1 - c.x - c.w; c.x = v / 100; c.w = 1 - c.x - r; apply(); sync(); });
    const rR = range(0, 90, 1, (v) => { c.w = 1 - v / 100 - c.x; apply(); sync(); });
    const rT = range(0, 90, 1, (v) => { const b = 1 - c.y - c.h; c.y = v / 100; c.h = 1 - c.y - b; apply(); sync(); });
    const rB = range(0, 90, 1, (v) => { c.h = 1 - v / 100 - c.y; apply(); sync(); });
    const fitPanel = h('div', { class: 'crop-panel' }, lbl(GS.t('Zum'), rZoom, vZoom), lbl(GS.t('Gerak kiri/kanan'), rPx, vPx), lbl(GS.t('Gerak atas/bawah'), rPy, vPy));
    const freePanel = h('div', { class: 'crop-panel' }, lbl(GS.t('Potong kiri'), rL, vL), lbl(GS.t('Potong kanan'), rR, vR), lbl(GS.t('Potong atas'), rT, vT), lbl(GS.t('Potong bawah'), rB, vB));
    const bFit = h('button', { type: 'button', class: 'btn', onClick: () => { free = false; zoomTo(Math.max(1, bw / c.w)); sync(); } }, GS.t('Ikut kotak footer'));
    const bFree = h('button', { type: 'button', class: 'btn', onClick: () => { free = true; sync(); } }, GS.t('Bebas'));
    function sync() {
      clampC();
      bFit.classList.toggle('primary', !free); bFree.classList.toggle('primary', free);
      fitPanel.style.display = free ? 'none' : ''; freePanel.style.display = free ? '' : 'none';
      const z = Math.min(8, Math.max(1, bw / c.w));
      rZoom.value = Math.round(z * 100); vZoom.textContent = Math.round(z * 100) + '%';
      const px = c.w >= 0.999 ? 0 : Math.round(c.x / (1 - c.w) * 100), py = c.h >= 0.999 ? 0 : Math.round(c.y / (1 - c.h) * 100);
      rPx.value = px; vPx.textContent = px + '%'; rPy.value = py; vPy.textContent = py + '%';
      const l = Math.round(c.x * 100), r = Math.round((1 - c.x - c.w) * 100), t = Math.round(c.y * 100), b = Math.round((1 - c.y - c.h) * 100);
      rL.value = l; vL.textContent = l + '%'; rR.value = r; vR.textContent = r + '%'; rT.value = t; vT.textContent = t + '%'; rB.value = b; vB.textContent = b + '%';
    }
    if (!free && !orig) { c.w = bw; c.h = bh; c.x = (1 - c.w) / 2; c.y = (1 - c.h) / 2; apply(); } // mula dengan potongan di tengah ikut nisbah footer
    let m;
    const reset = h('button', { type: 'button', class: 'btn ghost', onClick: () => { c.x = 0; c.y = 0; c.w = 1; c.h = 1; free = true; apply(); sync(); } }, GS.t('Tiada potongan'));
    const cancel = h('button', { type: 'button', class: 'btn ghost', onClick: () => { if (orig) s.props.crop = orig; else delete s.props.crop; GS.save(); m.close(); } }, GS.t('Batal'));
    const done = h('button', { type: 'button', class: 'btn primary', onClick: () => m.close() }, GS.t('Siap'));
    m = GS.modal({
      title: GS.t('Potong video'),
      wide: true,
      body: h('div', { class: 'crop-wrap' },
        h('p', { class: 'muted note' }, GS.t('Seret kotak kuning pada video untuk pilih bahagian yang dipaparkan. Roda tetikus atau peluncur untuk zum.')),
        h('div', { class: 'crop-stage' }, cv),
        h('div', { class: 'btn-row' }, bFit, bFree),
        fitPanel, freePanel),
      footer: h('div', { class: 'btn-row' }, reset, cancel, done),
      onClose: () => { alive = false; changed('props:changed'); renderProps(); },
    });
    sync();
    draw();
  };

  /** Muatkan fail ke dalam sumber klip (baharu jika `src` null). */
  S.loadClip = async function (src, f) {
    const isVideo = /^video\//.test(f.type) || /\.(webm|mp4|mov|m4v)$/i.test(f.name);
    const path = window.gsNative && window.gsNative.pathOf ? window.gsNative.pathOf(f) : '';
    const url = path ? GS.media.clipFileUrl(path) : URL.createObjectURL(f);
    const props = { kind: isVideo ? 'video' : 'image', name: f.name, path: path || '', loop: true, hideBars: false };
    // imej kecil disimpan dalam tetapan supaya kekal dalam versi web; video/GIF besar menggunakan laluan fail (app Windows)
    if (!isVideo && !path && f.size <= 1500000) { try { props.src = await GS.media.readFile(f); } catch (e) { /* abaikan */ } }
    const sc = S.editTarget();
    if (!src) {
      const r = footerRect(sc);
      src = mk('clip', f.name, r[0], r[1], r[2], r[3], props);
      src.fit = 'contain';
      addSource(src);
    } else { delete src.props.crop; src.props = Object.assign(src.props, props); src.name = f.name; }
    GS.media.makeClip(src.id, props.src || url, props.kind, props);
    if (!path && !props.src && isVideo) GS.toast(GS.t('Video dimuat. Dalam versi web video tidak disimpan selepas muat semula; app Windows mengingati fail ini.'), 'info', 6000);
    changed('props:changed');
    renderProps();
    return src;
  };
  /** Sembunyikan/papar bar teks (INFO ... WELCOME) dan banner promosi (FOLLOW & SHARE) pada scene supaya banner sendiri menggantikannya. */
  S.setBarsHidden = function (sc, hide) {
    (sc ? sc.sources : []).forEach((x) => { if (x.type === 'widget' && (x.props.widget === 'ticker' || x.props.widget === 'promo' || x.props.widget === 'bot')) x.visible = !hide; });
    changed('sources:changed');
  };

  /** Pastikan widget "Meta Tournament" (Top Pick Hero / Top Ban Hero) wujud dan KELIHATAN pada setiap scene.
   *  Dilakukan sekali sahaja untuk scene sedia ada (supaya padam oleh pengguna kekal padam). */
  S.seedMetaBoard = function () {
    const st = GS.state;
    if (st.metaSeeded) return;
    const game = GS.games[st.game] || GS.games.mlbb;
    let added = false;
    st.scenes.forEach((sc) => {
      if (sc.sources.some((s) => s.type === 'widget' && s.props.widget === 'metaboard')) return;
      if (/^sl-/.test(sc.templateId || '') || /sebentar\s*lagi/i.test(sc.name || '')) return;   // scene Sebentar Lagi tidak memerlukan papan Meta
      const tpl = game && game.templates.find((t) => t.id === sc.templateId);
      let spec = null;
      if (tpl) { const w = tpl.build().find((s) => s.props && s.props.widget === 'metaboard'); if (w) spec = [w.x, w.y, w.w, w.h]; }
      if (!spec) spec = GS.orient() === 'portrait' ? [470, 30, 470, 260] : [940, 16, 490, 250];
      sc.sources.push(mk('widget', 'Meta Tournament', spec[0], spec[1], spec[2], spec[3], { widget: 'metaboard' }));
      added = true;
    });
    st.metaSeeded = 1;
    if (added) changed(); else GS.save();
  };

  /** Scene sedia ada: asingkan bot kecil banner promosi menjadi sumber 'Bot' (sekali sahaja; padam oleh pengguna kekal padam). */
  S.seedBots = function () {
    const st = GS.state;
    if (st.botSeeded) return;
    let added = false;
    st.scenes.forEach((sc) => {
      sc.sources.filter((s) => s.type === 'widget' && s.props.widget === 'promo').forEach((p) => {
        const gift = p.props.style === 'gift';
        if (sc.sources.some((s) => s.type === 'widget' && s.props.widget === 'bot' && Math.abs(s.x - p.x) < p.h && Math.abs(s.y - p.y) < p.h)) return;
        const b = mk('widget', gift ? 'Bot Hadiah' : 'Bot', p.x, p.y - Math.round(p.h * 0.06), Math.round(p.h * 1.24), Math.round(p.h * 1.12), { widget: 'bot', tone: gift ? 'gold' : 'blue' });
        b.visible = p.visible !== false;
        sc.sources.splice(sc.sources.indexOf(p) + 1, 0, b);
        added = true;
      });
    });
    st.botSeeded = 1;
    if (added) changed(); else GS.save();
  };

  S.addText = () => addSource(mk('text', 'Teks', 100, 100, 900, 90, { text: 'Teks baharu', size: 64, color: '#eaf4ff', weight: 800 }));

  const widgetDefs = {
    clock: ['Jam & Masa Main', 520, 118], winloss: ['Menang / Kalah', 520, 118], logo: ['Logo', 170, 116],
    photo: ['Latar gambar sebenar', 1080, 1920], decor: ['Latar hiasan', 1080, 1920], bgfx: ['Latar bergerak', 1080, 1920], tierlist: ['Tier List', 1000, 1300], countdown: ['Kira Detik (Sebentar Lagi)', 900, 460], bot: ['Bot', 160, 150], brand: ['Tajuk', 420, 116], ticker: ['Bar Teks', 1200, 90], frame: ['Bingkai', 640, 360], metaboard: ['Meta Tournament', 560, 330], matchboard: ['Perlawanan Tournament', 760, 250], resultsboard: ['Keputusan Tournament', 560, 400],
  };
  S.addWidget = function (type) {
    const d = widgetDefs[type];
    if (!d) return;
    if (type === 'photo') {
      const sc = S.editTarget(); if (!sc) return;
      const first = (GS.photos.list[0] || {}).id;
      const src = mk('widget', d[0], 0, 0, GS.design.w, GS.design.h, { widget: 'photo', photo: first, shade: 0.22 });
      sc.sources.unshift(src); selectedId = src.id; changed('sources:changed'); GS.emit('scenes:changed'); return;
    }
    if (type === 'decor') {
      const sc = S.editTarget(); if (!sc) return;
      const src = mk('widget', d[0], 0, 0, GS.design.w, GS.design.h, { widget: 'decor', style: 'school' });
      sc.sources.unshift(src); selectedId = src.id; changed('sources:changed'); GS.emit('scenes:changed'); return;
    }
    if (type === 'bgfx') { // latar bergerak: penuh kanvas dan di belakang semua sumber
      const sc = S.editTarget(); if (!sc) return;
      const src = mk('widget', d[0], 0, 0, GS.design.w, GS.design.h, { widget: 'bgfx', style: 'fire' });
      sc.sources.unshift(src); selectedId = src.id; changed('sources:changed'); GS.emit('scenes:changed'); return;
    }
    addSource(mk('widget', d[0], 120, 120, d[1], d[2], { widget: type, label: type === 'frame' ? '' : undefined }));
  };

  S.removeSource = function (id) {
    const sc = S.editTarget();
    const s = sc.sources.find((x) => x.id === id);
    if (!s) return;
    // sumber yang sama mungkin masih dipakai scene sebenar (Program) apabila dipadam dalam draf Pratonton: jangan tutup medianya
    const stillUsed = st().scenes.some((o) => o !== sc && o.sources.some((x) => x.id === id));
    if (!stillUsed && s.type === 'browser') GS.browser.close(s.id);
    if (!stillUsed) { GS.media.close(s.id); if (s.type === 'clip') GS.media.removeClip(s.id); }
    sc.sources = sc.sources.filter((x) => x.id !== id);
    if (selectedId === id) selectedId = null;
    changed('sources:changed');
    GS.emit('scenes:changed');
  };
  S.moveSource = function (id, dir) {
    const sc = S.editTarget();
    const i = sc.sources.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sc.sources.length) return;
    [sc.sources[i], sc.sources[j]] = [sc.sources[j], sc.sources[i]];
    changed('sources:changed');
    GS.emit('scenes:changed');
  };
  S.selectSource = function (id) {
    selectedId = id;
    if (GS.app) { GS.app.programComp.selectedId = id; GS.app.previewComp.selectedId = id; }
    GS.emit('select:changed');
  };

  /* ---------- popover ---------- */
  function popover(anchor, entries, center) {
    GS.$$('.popover').forEach((p) => p.remove());
    const pop = h('div', { class: 'popover', role: 'menu' }, entries.map((e) => e === '-' ? h('hr') : e.heading ? h('div', { class: 'pop-head' }, GS.t(e.heading)) :
      h('button', { class: 'pop-item', role: 'menuitem', onClick: () => { close(); e.run(); }, html: icon(e.icon || 'plus', 16) + '<span>' + GS.escapeHtml(GS.t(e.label)) + '</span>' })));
    document.body.append(pop);
    const r = anchor.getBoundingClientRect();
    // menu panjang (banyak sumber): hadkan tinggi mengikut skrin dan benarkan skrol, jangan terpotong di atas
    pop.style.maxHeight = (center ? Math.round(window.innerHeight * 0.8) : window.innerHeight - 16) + 'px';
    const pr = pop.getBoundingClientRect();
    if (center) { // menu panjang: di tengah skrin, boleh digulung, tidak terpotong di atas
      pop.style.left = Math.max(8, (window.innerWidth - pr.width) / 2) + 'px';
      pop.style.top = Math.max(8, (window.innerHeight - pr.height) / 2) + 'px';
    } else {
    pop.style.left = Math.min(window.innerWidth - pr.width - 8, Math.max(8, r.left)) + 'px';
    pop.style.top = Math.max(8, Math.min(r.top - pr.height - 8, window.innerHeight - pr.height - 8)) + 'px';
    }
    requestAnimationFrame(() => pop.classList.add('in'));
    function close() { pop.classList.remove('in'); setTimeout(() => pop.remove(), 200); document.removeEventListener('pointerdown', away, true); }
    function away(ev) { if (!pop.contains(ev.target)) close(); }
    setTimeout(() => document.addEventListener('pointerdown', away, true), 0);
  }

  /* ---------- UI: scene ---------- */
  function renderScenes() {
    const root = GS.$('#scenesBody');
    if (!root) return;
    root.innerHTML = '';
    const studio = st().mode === 'studio';
    S.all().forEach((sc) => {
      const isPgm = sc.id === st().programId, isPvw = studio && sc.id === st().previewId;
      const item = h('div', { class: 'list-item' + (isPgm ? ' pgm' : '') + (isPvw ? ' pvw' : ''), tabindex: 0, role: 'button', onClick: () => S.select(sc.id),
        onContextmenu: (e) => { const nm = e.currentTarget.querySelector('.name'); GS.ctxMenu(e, [{ label: 'Namakan semula', run: () => nm && inlineRename(nm, sc.name, (v) => S.rename(sc.id, v)) }, { label: 'Salin scene', run: () => S.duplicate(sc.id) }, '-', { label: 'Padam scene', danger: true, run: () => S.remove(sc.id) }]); },
        onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.select(sc.id); } } },
        h('span', { class: 'tag' }, isPgm ? 'PGM' : isPvw ? 'PVW' : ''),
        h('span', { class: 'name', onDblclick: (e) => { e.stopPropagation(); inlineRename(e.currentTarget, sc.name, (v) => S.rename(sc.id, v)); } }, sc.name),
        h('span', { class: 'row-actions' },
          h('button', { class: 'icon-btn sm', title: 'Salin scene', onClick: (e) => { e.stopPropagation(); S.duplicate(sc.id); }, html: icon('copy', 14) }),
          h('button', { class: 'icon-btn sm', title: 'Padam scene', onClick: (e) => { e.stopPropagation(); S.remove(sc.id); }, html: icon('trash', 14) })));
      root.append(item);
    });
  }

  // suntingan nama sebaris (ruang/Enter tidak lagi dirampas oleh baris senarai)
  function inlineRename(el, value, done) { GS.inlineEdit(el, value, done, () => changed()); }

  /* ---------- UI: sumber ---------- */
  /* ikon berbeza untuk setiap jenis sumber (merujuk kepada sumber yang dipilih) */
  const WIDGET_ICON = { clock: 'clock', winloss: 'scale', logo: 'hex', brand: 'tag', ticker: 'ticker', frame: 'frame', metaboard: 'barchart', matchboard: 'sword', resultsboard: 'trophy',
    promo: 'megaphone', countdown: 'timer', tierlist: 'layers', bot: 'bot', queue: 'list', boss: 'skull', toplike: 'heart', statusbar: 'activity', spelltimer: 'timer', draft: 'draft', label: 'tag', tiers: 'layers' };
  const typeIcon = (s) => {
    if (s.type === 'video') {
      const k = s.props.kind;
      if (k === 'camera') return 'camera';
      if (k === 'capture') return 'capture';
      if (k === 'screen') return s.props.mode === 'display' ? 'cast' : 'monitor';
      return 'monitor';
    }
    if (s.type === 'image') return 'image';
    if (s.type === 'clip') return 'film';
    if (s.type === 'slides') return 'images';
    if (s.type === 'deck') return 'deck';
    if (s.type === 'browser') return 'link';
    if (s.type === 'text') return 'text';
    return WIDGET_ICON[s.props && s.props.widget] || 'widget';
  };
  let lastDragEnd = 0;
  /** Tahan dan seret baris sumber ke atas / bawah untuk menyusun semula (gerakan lembut; tiada keperluan menekan anak panah). */
  function bindSourceDrag(root, sc) {
    const rows = Array.from(root.querySelectorAll('.list-item[data-sid]'));
    rows.forEach((row) => {
      row.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.target.closest('button, input, select, textarea')) return;
        const startY = e.clientY, idx0 = rows.indexOf(row), scroll0 = root.scrollTop;
        const tops = rows.map((r) => r.offsetTop), hts = rows.map((r) => r.offsetHeight);
        const step = rows.length > 1 ? Math.abs(tops[1] - tops[0]) : hts[0];
        let dragging = false, target = idx0, raf = 0, lastY = startY;
        const apply = () => {
          const dy = lastY - startY + (root.scrollTop - scroll0);
          row.style.transform = 'translateY(' + dy + 'px)';
          const center = tops[idx0] + hts[idx0] / 2 + dy;
          target = rows.findIndex((_, i) => center < tops[i] + hts[i] / 2);
          if (target < 0) target = rows.length - 1;
          rows.forEach((r, i) => {
            if (r === row) return;
            let shift = 0;
            if (idx0 < target && i > idx0 && i <= target) shift = -step; else if (idx0 > target && i < idx0 && i >= target) shift = step;
            r.style.transform = shift ? 'translateY(' + shift + 'px)' : '';
          });
        };
        const edge = () => {
          if (!dragging) return;
          const rc = root.getBoundingClientRect();
          if (lastY < rc.top + 28) root.scrollTop -= 8; else if (lastY > rc.bottom - 28) root.scrollTop += 8;
          apply();
          raf = requestAnimationFrame(edge);
        };
        const move = (ev) => {
          lastY = ev.clientY;
          if (!dragging) {
            if (Math.abs(lastY - startY) < 6) return;
            dragging = true; row.classList.add('dragging'); root.classList.add('reordering');
            try { row.setPointerCapture(ev.pointerId); } catch (e2) { /* abaikan */ }
            raf = requestAnimationFrame(edge);
          }
          apply();
        };
        const up = () => {
          document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
          cancelAnimationFrame(raf);
          if (!dragging) return;
          lastDragEnd = Date.now();
          row.classList.remove('dragging'); root.classList.remove('reordering');
          if (target !== idx0) {
            // baris dipaparkan dari atas ke bawah = sumber dari lapisan atas ke bawah
            const order = rows.map((r) => r.dataset.sid);
            const moved = order.splice(idx0, 1)[0]; order.splice(target, 0, moved);
            const byId = {}; sc.sources.forEach((x) => { byId[x.id] = x; });
            sc.sources = order.slice().reverse().map((id) => byId[id]).filter(Boolean);
            changed('sources:changed'); GS.emit('scenes:changed');
          } else { rows.forEach((r) => { r.style.transform = ''; }); row.style.transform = ''; }
        };
        document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
      });
    });
  }

  function renderSources() {
    const root = GS.$('#sourcesBody');
    if (!root) return;
    root.innerHTML = '';
    const sc = S.editTarget();
    if (!sc) return;
    if (!sc.sources.length) root.append(h('div', { class: 'empty' }, 'Scene kosong. Tekan + untuk tambah sumber.'));
    for (let i = sc.sources.length - 1; i >= 0; i--) {
      const s = sc.sources[i];
      root.append(h('div', { class: 'list-item' + (s.id === selectedId ? ' sel' : '') + (s.visible ? '' : ' off'), 'data-sid': s.id, tabindex: 0, role: 'button', onClick: () => { if (Date.now() - lastDragEnd < 250) return; S.selectSource(s.id); },
        onContextmenu: (e) => { const nm = e.currentTarget.querySelector('.name'); S.selectSource(s.id); GS.ctxMenu(e, [{ label: 'Namakan semula', run: () => nm && inlineRename(nm, s.name, (v) => { s.name = v.trim() || s.name; changed('sources:changed'); }) }, { label: 'Salin (Ctrl+C)', run: () => GS.keys.copy() }, { label: 'Tampal (Ctrl+V)', run: () => GS.keys.paste() }, '-', { label: s.locked ? 'Buka kunci' : 'Kunci', run: () => { s.locked = !s.locked; changed('sources:changed'); } }, { label: s.visible ? 'Sembunyi' : 'Papar', run: () => { s.visible = !s.visible; changed('sources:changed'); } }, '-', { label: 'Padam sumber', danger: true, run: () => S.removeSource(s.id) }]); },
        onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.selectSource(s.id); } } },
        h('span', { class: 'ico', html: icon(typeIcon(s), 15) }),
        h('span', { class: 'name', onDblclick: (e) => { e.stopPropagation(); inlineRename(e.currentTarget, s.name, (v) => { s.name = v.trim() || s.name; changed('sources:changed'); }); } }, s.name),
        h('span', { class: 'row-actions always' },
          h('button', { class: 'icon-btn sm' + (s.locked ? ' on' : ''), title: s.locked ? 'Buka kunci' : 'Kunci', onClick: (e) => { e.stopPropagation(); s.locked = !s.locked; changed('sources:changed'); }, html: icon(s.locked ? 'lock' : 'unlock', 14) }),
          h('button', { class: 'icon-btn sm', title: s.visible ? 'Sembunyi' : 'Papar', onClick: (e) => { e.stopPropagation(); s.visible = !s.visible; changed('sources:changed'); }, html: icon(s.visible ? 'eye' : 'eyeoff', 14) }))));
    }
    bindSourceDrag(root, sc);
  }

  function setupSourceToolbar() {
    const add = GS.$('#btnSourceAdd');
    add.addEventListener('click', () => popover(add, [
      { label: 'Capture Card (game)', icon: 'capture', run: () => S.addVideo('capture') },
      { label: 'Kamera / Webcam', icon: 'camera', run: () => S.addVideo('camera') },
      { label: 'Display Capture (skrin atau tetingkap: game, Google, Steam, Edge)', icon: 'cast', run: () => S.addVideo('display') },
      { label: 'Game PC (pilih tetingkap: Steam, game)', icon: 'bolt', run: () => S.addVideo('gamepc') },
      { label: 'Skrin penuh', icon: 'popout', run: () => S.addVideo('screen') },
      { label: 'Browser (YouTube, Instagram, mana-mana link)', icon: 'link', run: () => GS.browser.add() },
      '-',
      { label: 'Footer Video (video bergerak di bar bawah)', icon: 'film', run: S.addFooterVideo },
      { label: 'Banner / Video sendiri (imej, GIF, video)', icon: 'megaphone', run: S.addClip },
      { label: 'Imej', icon: 'image', run: S.addImage },
      { label: 'Auto Slide (gambar bergilir)', icon: 'images', run: () => GS.slides.openEditor(null) },
      { label: 'Presentation (PDF / PowerPoint)', icon: 'deck', run: () => GS.deck.openFile(null) },
      { label: 'Teks', icon: 'text', run: S.addText },
      '-',
      { label: 'Widget: Jam & Masa Main', icon: 'clock', run: () => S.addWidget('clock') },
      { label: 'Widget: Menang / Kalah', icon: 'scale', run: () => S.addWidget('winloss') },
      { label: 'Widget: Logo', icon: 'hex', run: () => S.addWidget('logo') },
      { label: 'Widget: Tier List', icon: 'layers', run: () => S.addWidget('tierlist') },
      { label: 'Widget: Bot', icon: 'bot', run: () => S.addWidget('bot') },
      { label: 'Widget: Tajuk', icon: 'tag', run: () => S.addWidget('brand') },
      { label: 'Widget: Bar Teks', icon: 'ticker', run: () => S.addWidget('ticker') },
      { label: 'Widget: Bingkai', icon: 'frame', run: () => S.addWidget('frame') },
      { label: 'Widget: Meta Tournament', icon: 'barchart', run: () => S.addWidget('metaboard') },
      { label: 'Widget: Perlawanan Tournament', icon: 'sword', run: () => S.addWidget('matchboard') },
      { label: 'Widget: Keputusan Tournament', icon: 'trophy', run: () => S.addWidget('resultsboard') },
      { label: 'Latar bergerak (api, kilat, peti, anime)', icon: 'flame', run: () => S.addWidget('bgfx') },
      { label: 'Latar gambar sebenar (pantai, rak buku, gunung...)', icon: 'image', run: () => S.addWidget('photo') },
      { label: 'Latar hiasan (sekolah, universiti, bunga, sains)', icon: 'images', run: () => S.addWidget('decor') },
      '-',
      { heading: 'Sebentar Lagi' },
      { label: 'Kira Detik (jam, minit, saat)', icon: 'timer', run: () => S.addWidget('countdown') },
      { label: 'Tajuk Sebentar Lagi', icon: 'tag', run: () => S.addWidget('brand') },
      { label: 'Bar Teks Sebentar Lagi', icon: 'ticker', run: () => S.addWidget('ticker') },
    ], true));
    GS.$('#btnSourceUp').addEventListener('click', () => selectedId && S.moveSource(selectedId, 1));
    GS.$('#btnSourceDown').addEventListener('click', () => selectedId && S.moveSource(selectedId, -1));
    GS.$('#btnSourceDel').addEventListener('click', () => selectedId && S.removeSource(selectedId));
    GS.$('#btnSceneAdd').addEventListener('click', S.add);
  }

  /* ---------- UI: sifat ---------- */
  function field(label, input) { return h('label', { class: 'field' }, h('span', null, label), input); }
  function numInput(s, key) {
    return h('input', { type: 'number', value: Math.round(s[key]), 'data-k': key, onChange: (e) => { s[key] = Math.max(key === 'w' || key === 'h' ? 10 : -5000, Number(e.target.value) || 0); changed('props:changed'); } });
  }


  /* kotak PROGRAM: mulakan kira detik yang sedang ditayangkan kepada penonton (Studio) */
  function programCountdownBox() {
    if (st().mode !== 'studio') return null;
    const prog = S.program(); if (!prog) return null;
    const cds = prog.sources.filter((x) => x.type === 'widget' && x.props.widget === 'countdown');
    if (!cds.length) return null;
    const CD = GS.countdown, box = h('div', { class: 'prog-cd', id: 'progCd' }, h('h4', null, 'PROGRAM · Start countdown now'));
    cds.forEach((src, i) => {
      const p = src.props, state = h('span', { class: 'prog-cd-state' }, '');
      const upd = () => { const ms = CD.remaining(p), pt = CD.parts(ms); state.textContent = String(pt.h).padStart(2, '0') + ':' + String(pt.m).padStart(2, '0') + ':' + String(pt.s).padStart(2, '0') + (CD.running(p) ? ' ▶' : ''); };
      upd(); const iv = setInterval(() => { if (!state.isConnected) { clearInterval(iv); return; } upd(); }, 250);
      box.append(h('div', { class: 'prog-cd-row' }, h('b', null, (src.name || 'Kira Detik') + (cds.length > 1 ? ' ' + (i + 1) : '')), state),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn primary', id: 'btnProgCdStart' + i, onClick: () => { if (!CD.start(p)) GS.toast(GS.t('Tetapkan jam, minit atau saat dahulu.'), 'warn'); GS.save(); upd(); } }, 'Mula sekarang'),
          h('button', { class: 'btn', onClick: () => { CD.pause(p); GS.save(); upd(); } }, 'Jeda'),
          h('button', { class: 'btn ghost', onClick: () => { CD.reset(p); GS.save(); upd(); } }, 'Set semula')));
    });
    return box;
  }
  function renderProps() {
    renderPropsBase();
    const root = GS.$('#propsBody');
    if (root && S.selectedSource()) { const pb = programCountdownBox(); if (pb) root.append(pb); }
  }
  function renderPropsBase() {
    const root = GS.$('#propsBody');
    if (!root) return;
    root.innerHTML = '';
    const s = S.selectedSource();
    if (!s) { root.append(h('div', { class: 'empty' }, 'Pilih satu sumber untuk ubah sifatnya.')); const pb0 = programCountdownBox(); if (pb0) root.append(pb0); return; }
    root.append(
      h('div', { class: 'grid4' }, field('X', numInput(s, 'x')), field('Y', numInput(s, 'y')), field('Lebar', numInput(s, 'w')), field('Tinggi', numInput(s, 'h'))));
    if (s.type === 'widget' && s.props.widget !== 'bgfx' && s.props.widget !== 'decor' && s.props.widget !== 'photo' && GS.fonts) {
      const fsel = h('select', { id: 'selFont', onChange: (e) => { s.props.font = e.target.value || undefined; changed('props:changed'); } },
        h('option', { value: '' }, GS.t('Fon asal')),
        Object.keys(GS.fonts.groups).map((g) => h('optgroup', { label: GS.t(GS.fonts.groups[g]) }, GS.fonts.list.filter((f) => f.group === g).map((f) => h('option', { value: f.key, selected: s.props.font === f.key }, f.name)))));
      root.append(field('Fon tulisan', fsel));
    }
    if (s.type === 'video' || s.type === 'image' || s.type === 'clip') {
      const sel = h('select', { onChange: (e) => { s.fit = e.target.value; changed('props:changed'); } },
        [['cover', 'Penuhi (potong)'], ['contain', 'Muat (tanpa potong)'], ['stretch', 'Regang']].map(([v, l]) => h('option', { value: v, selected: s.fit === v }, l)));
      root.append(field('Muat', sel));
    }
    if (s.type === 'clip') {
      const rec = GS.media.clips[s.id];
      const dim = rec && rec.ready ? (rec.kind === 'video' ? rec.el.videoWidth + '×' + rec.el.videoHeight : rec.el.naturalWidth + '×' + rec.el.naturalHeight) : '';
      root.append(h('button', { type: 'button', class: 'prop-info clip-link', 'data-clip-info': '1', title: GS.t('Klik untuk tukar video dari peranti anda'), onClick: () => S.replaceClip(s) }, (s.props.name || GS.t('Klip')) + (dim ? ' · ' + dim : '') + (rec && rec.error ? ' · ' + GS.t('Tidak dapat dimainkan') : !rec ? ' · ' + GS.t('Pilih fail semula') : '')));
      root.append(h('div', { class: 'btn-row' },
        h('button', { class: 'btn', id: 'btnClipPick', onClick: () => { const inp = h('input', { type: 'file', accept: 'image/*,video/*,.gif,.webm,.mp4,.mov,.m4v', style: { display: 'none' } }); inp.addEventListener('change', () => { if (inp.files[0]) S.loadClip(s, inp.files[0]); inp.remove(); }); document.body.append(inp); inp.click(); } }, rec ? 'Ganti fail' : 'Pilih fail'),
        h('button', { class: 'btn ghost', id: 'btnClipFooter', title: GS.t('Letak di bar bawah (footer)'), onClick: () => { const r = footerRect(S.editTarget()); s.x = r[0]; s.y = r[1]; s.w = r[2]; s.h = r[3]; changed('props:changed'); renderProps(); } }, 'Letak di footer'),
        h('button', { class: 'btn ghost', id: 'btnClipNatural', title: GS.t('Gunakan nisbah asal media'), onClick: () => { const r2 = GS.media.clips[s.id]; if (!r2 || !r2.ready) return; const nw = r2.kind === 'video' ? r2.el.videoWidth : r2.el.naturalWidth, nh = r2.kind === 'video' ? r2.el.videoHeight : r2.el.naturalHeight; if (nw && nh) { s.h = Math.round(s.w * nh / nw); changed('props:changed'); renderProps(); } } }, 'Nisbah asal')));
      root.append(h('div', { class: 'btn-row' },
        h('button', { class: 'btn primary', id: 'btnClipReplace', title: GS.t('Tukar kepada video lain dari peranti anda (kedudukan dan saiz kekal)'), onClick: () => S.replaceClip(s) }, 'Tukar video'),
        h('button', { class: 'btn', id: 'btnClipCrop', title: GS.t('Pilih bahagian video yang dipaparkan'), disabled: !(GS.media.clips[s.id] && GS.media.clips[s.id].ready), onClick: () => S.cropClip(s) }, 'Potong video'),
        h('button', { class: 'btn ghost', id: 'btnClipMore', title: GS.t('Tambah satu lagi video footer dari peranti'), onClick: () => S.addFooterVideo() }, 'Tambah video lagi')));
      if (s.props.kind === 'video') root.append(h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.props.loop !== false, onChange: (e) => { s.props.loop = e.target.checked; const r2 = GS.media.clips[s.id]; if (r2) r2.el.loop = e.target.checked; GS.save(); } }), 'Ulang video (loop)'));
      root.append(h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'chkHideBars', checked: !!s.props.hideBars, onChange: (e) => { s.props.hideBars = e.target.checked; S.setBarsHidden(S.editTarget(), e.target.checked); renderProps(); } }), 'Sembunyikan bar teks (INFO / Welcome) dan banner promosi pada scene ini'));
      root.append(h('p', { class: 'muted note' }, 'Banner sendiri boleh sebarang saiz: seret pada pratonton untuk alih, tarik sudut untuk besarkan, atau tukar Lebar/Tinggi di atas. "Muat" mengekalkan seluruh gambar, "Penuhi" memotong ikut kotak.'));
    }
    if (s.type === 'video') {
      const rec = GS.media.videos[s.id];
      const info = rec ? (rec.label || GS.t('Peranti')) + ' · ' + (rec.video.videoWidth || '?') + '×' + (rec.video.videoHeight || '?') : 'Tiada isyarat';
      root.append(h('div', { class: 'prop-info' }, info));
      root.append(h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onClick: async () => { if (await GS.media.pick(s)) S.afterPick(s); renderProps(); } }, s.props.mode === 'window' ? 'Pilih tetingkap' : s.props.mode === 'display' ? 'Pilih paparan / tetingkap' : s.props.kind === 'screen' ? 'Kongsi skrin' : 'Pilih peranti'),
        rec ? h('button', { class: 'btn ghost', onClick: () => { GS.media.close(s.id); s.props.deviceId = ''; changed('props:changed'); renderProps(); } }, 'Lepaskan') : null));
    }
    if (s.type === 'slides' || s.type === 'deck') GS.sources2.props(root, s, renderProps);
    if (s.type === 'browser') GS.browser.props(root, s, renderProps);
    if (s.type === 'text') {
      root.append(field('Teks', h('textarea', { rows: 2, onInput: (e) => { s.props.text = e.target.value; GS.save(); } }, s.props.text || '')));
      root.append(h('div', { class: 'grid2' },
        field('Saiz', h('input', { type: 'number', value: s.props.size || 48, onChange: (e) => { s.props.size = Number(e.target.value) || 48; GS.save(); } })),
        field('Warna', h('input', { type: 'color', value: s.props.color || '#eaf4ff', onInput: (e) => { s.props.color = e.target.value; GS.save(); } }))));
    }
    if (s.type === 'widget') {
      const w = s.props.widget;
      if (w === 'ticker') {
        root.append(field('Mesej bar teks (satu baris = satu mesej)', h('textarea', { rows: 4, onInput: (e) => { GS.state.ticker.messages = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean); GS.save(); } }, (GS.state.ticker.messages || []).join('\n'))));
      }
      if (w === 'ticker') {
        const p = s.props, sel = (key, label, opts, def) => field(label, h('select', { onChange: (e) => { p[key] = e.target.value; GS.save(); } }, opts.map(([v, l]) => h('option', { value: v, selected: (p[key] || def) === v }, l))));
        const nm = (key, label) => field(label, h('input', { type: 'number', value: p[key] || 0, onChange: (e) => { p[key] = Number(e.target.value) || 0; GS.save(); } }));
        root.append(h('div', { class: 'grid2' }, sel('align', 'Kedudukan tulisan', [['left', 'Kiri'], ['center', 'Tengah'], ['right', 'Kanan']], 'left'), sel('badge', 'Butang INFO', [['left', 'Kiri'], ['right', 'Kanan'], ['none', 'Sembunyi']], 'left')));
        root.append(h('div', { class: 'grid2' }, nm('textDx', 'Tulisan: geser kiri/kanan'), nm('textDy', 'Tulisan: geser atas/bawah')));
        root.append(h('div', { class: 'grid2' }, nm('badgeDx', 'INFO: geser kiri/kanan'), nm('badgeDy', 'INFO: geser atas/bawah')));
        root.append(field('Saiz tulisan (%)', h('input', { type: 'range', min: 50, max: 160, value: p.textScale || 100, onInput: (e) => { p.textScale = Number(e.target.value); GS.save(); } })));
      }
      if (w === 'tierlist') GS.tier.props(root, s, field, renderProps);
      if (w === 'photo') {
        const p = s.props;
        root.append(field('Gambar', h('select', { id: 'selPhoto', onChange: (e) => { p.photo = e.target.value; GS.save(); } }, GS.photos.list.map((ph) => h('option', { value: ph.id, selected: p.photo === ph.id }, GS.state.lang === 'ms' ? ph.ms : ph.en)))));
        root.append(field('Kegelapan tepi', h('input', { type: 'range', min: 0, max: 60, value: Math.round((p.shade != null ? p.shade : 0.22) * 100), onInput: (e) => { p.shade = Number(e.target.value) / 100; GS.save(); } })));
        const ph = GS.photos.byId(p.photo); if (ph) root.append(h('p', { class: 'muted note' }, ph.credit));
      }
      if (w === 'decor') {
        const p = s.props;
        root.append(field('Gaya latar', h('select', { onChange: (e) => { p.style = e.target.value; GS.save(); } }, GS.decor.styles.map(([v, l]) => h('option', { value: v, selected: (p.style || 'school') === v }, GS.t(l))))));
      }
      if (w === 'bgfx') {
        const p = s.props;
        root.append(field('Gaya latar', h('select', { onChange: (e) => { p.style = e.target.value; GS.save(); } }, GS.bgfx.styles.map(([v, l]) => h('option', { value: v, selected: (p.style || 'fire') === v }, GS.t(l))))));
        root.append(h('p', { class: 'muted note' }, 'Latar ini berada di belakang semua sumber lain. Gerakkannya ke atas atau bawah dalam senarai sumber jika perlu.'));
      }
      if (w === 'countdown') {
        const p = s.props, CD = GS.countdown;
        const num = (key, label, max) => field(label, h('input', { type: 'number', min: 0, max, value: p[key] || 0, class: 'cd-in', 'data-k': 'cd-' + key, onChange: (e) => { p[key] = GS.clamp(Number(e.target.value) || 0, 0, max); if (!CD.running(p)) { p.pausedMs = null; p.endAt = 0; } GS.save(); } }));
        root.append(h('div', { class: 'grid3' }, num('hours', 'Jam', 99), num('minutes', 'Minit', 59), num('seconds', 'Saat', 59)));
        root.append(h('div', { class: 'grid2' },
          field('Gaya nombor', h('select', { onChange: (e) => { p.numStyle = e.target.value; GS.save(); } }, CD.styles.map(([v, l]) => h('option', { value: v, selected: (p.numStyle || 'box') === v }, GS.t(l))))),
          h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!p.noPanel, onChange: (e) => { p.noPanel = e.target.checked; GS.save(); } }), h('span', null, 'Tanpa kotak latar'))));
        if (st().mode !== 'studio') {
          root.append(h('div', { class: 'btn-row' },
            h('button', { class: 'btn primary', id: 'btnCdStart', onClick: () => { if (!CD.start(p)) GS.toast(GS.t('Tetapkan jam, minit atau saat dahulu.'), 'warn'); GS.save(); renderProps(); } }, 'Mula'),
            h('button', { class: 'btn', id: 'btnCdPause', onClick: () => { CD.pause(p); GS.save(); renderProps(); } }, 'Jeda'),
            h('button', { class: 'btn ghost', id: 'btnCdReset', onClick: () => { CD.reset(p); GS.save(); renderProps(); } }, 'Set semula')));
        } else root.append(h('p', { class: 'muted note' }, 'Tetapkan masa di sini. Kira detik dimulakan dari kotak PROGRAM di bawah selepas scene ini berada di Program.'));
        const clock = h('input', { type: 'time', id: 'cdClock', class: 'cd-in' });
        root.append(field('Kira ke jam tertentu (cth 21:00)', h('div', { class: 'btn-row' }, clock, h('button', { class: 'btn', id: 'btnCdClock', onClick: () => { if (!CD.toClock(p, clock.value)) GS.toast(GS.t('Pilih jam dahulu.'), 'warn'); GS.save(); renderProps(); } }, 'Kira ke jam ini'))));
        root.append(field('Tajuk', h('input', { type: 'text', value: p.title || 'SEBENTAR LAGI', onInput: (e) => { p.title = e.target.value; GS.save(); } })));
        root.append(field('Tulisan bawah (cth nama game)', h('input', { type: 'text', value: p.subtitle || 'MOBILE LEGENDS', onInput: (e) => { p.subtitle = e.target.value; GS.save(); } })));
        root.append(field('Tulisan bila masa tamat', h('input', { type: 'text', value: p.endText || 'MULA SEKARANG!', onInput: (e) => { p.endText = e.target.value; GS.save(); } })));
        root.append(h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: p.showHours !== false, onChange: (e) => { p.showHours = e.target.checked; GS.save(); } }), h('span', null, 'Papar jam')));
      }
      if (w === 'bot') {
        root.append(h('div', { class: 'btn-row' },
          h('button', { class: 'btn primary', id: 'btnBotImg', title: GS.t('Letak gambar anda sendiri: anime, kartun, haiwan, foto atau apa sahaja'), onClick: () => pickBotImage((url) => { s.props.img = url; changed('props:changed'); renderProps(); }) }, 'Tukar gambar bot'),
          s.props.img ? h('button', { class: 'btn ghost', id: 'btnBotReset', onClick: () => { delete s.props.img; changed('props:changed'); renderProps(); } }, 'Guna bot asal') : null));
        root.append(h('p', { class: 'muted note' }, 'Pilih gambar anda sendiri (anime, kartun, haiwan, foto). PNG lutsinar (tanpa latar) paling kemas. Seret pada pratonton untuk alih, tarik sudut untuk besarkan.'));
      }
      if (w === 'brand') root.append(field('Tajuk', h('input', { type: 'text', value: s.props.text || '', placeholder: 'GLOBAL STREAMER', onInput: (e) => { s.props.text = e.target.value; GS.save(); } })));
      if (w === 'frame') root.append(field('Label bingkai', h('input', { type: 'text', value: s.props.label || '', onInput: (e) => { s.props.label = e.target.value.toUpperCase(); GS.save(); } })));
      if (w === 'logo') {
        root.append(h('div', { class: 'btn-row' },
          h('button', { class: 'btn', onClick: () => pickLogo() }, 'Muat naik logo / vektor'),
          GS.state.logo ? h('button', { class: 'btn ghost', onClick: () => { GS.state.logo = null; GS.save(); renderProps(); } }, 'Guna logo lalai') : null));
      }
    }
  }

  /** Pilih gambar bot daripada peranti (PNG lutsinar dikekalkan) dan serahkan data URL kepada `cb`. */
  function pickBotImage(cb) {
    const inp = h('input', { type: 'file', accept: 'image/png,image/webp,image/jpeg,image/gif,image/*', style: { display: 'none' } });
    inp.addEventListener('change', async () => {
      const f = inp.files[0];
      if (!f) return;
      try { cb(await GS.media.downscale(await GS.media.readFile(f), 1024, true)); } catch (e) { GS.toast(GS.t('Gambar tidak dapat dibaca. Cuba fail PNG atau JPG lain.'), 'warn'); }
    });
    document.body.append(inp);
    inp.click();
    setTimeout(() => inp.remove(), 60000);
  }

  function pickLogo() {
    const inp = h('input', { type: 'file', accept: 'image/png,image/webp,image/*', style: { display: 'none' } });
    inp.addEventListener('change', async () => {
      const f = inp.files[0];
      if (!f) return;
      GS.state.logo = await GS.media.downscale(await GS.media.readFile(f), 512, true); // sentiasa PNG (lutsinar dikekalkan)
      GS.save();
      renderProps();
    });
    document.body.append(inp);
    inp.click();
    setTimeout(() => inp.remove(), 60000);
  }

  /* kemas kini nilai nombor tanpa bina semula (semasa seret) */
  function syncNumbers() {
    const s = S.selectedSource();
    if (!s) return;
    GS.$$('#propsBody input[data-k]').forEach((i) => { i.value = Math.round(s[i.dataset.k]); });
  }

  /* ---------- suntingan pada kanvas ---------- */
  S.attachEditor = function (comp) {
    const cv = comp.canvas;
    let drag = null;
    const SNAP = 14;
    cv.addEventListener('pointerdown', (ev) => {
      if (!comp.editable) return;
      const sc = S.editTarget();
      if (!sc) return;
      const p = comp.toLogical(ev);
      const sel = sc.sources.find((x) => x.id === selectedId);
      const handle = sel && !sel.locked ? comp.handleAt(p.x, p.y, sel) : null;
      if (handle) {
        drag = { mode: 'resize', handle, start: p, orig: { x: sel.x, y: sel.y, w: sel.w, h: sel.h }, s: sel };
      } else {
        const hit = comp.hitTest(p.x, p.y, sc);
        if (hit) { S.selectSource(hit.id); renderSources(); renderProps(); drag = { mode: 'move', start: p, orig: { x: hit.x, y: hit.y }, s: hit }; }
        else { S.selectSource(null); renderSources(); renderProps(); }
      }
      if (drag) cv.setPointerCapture(ev.pointerId);
    });
    cv.addEventListener('pointermove', (ev) => {
      const sc = S.editTarget();
      const p = comp.toLogical(ev);
      if (!drag) {
        if (!comp.editable || !sc) { cv.style.cursor = ''; return; }
        const sel = sc.sources.find((x) => x.id === selectedId);
        const hnd = sel && !sel.locked ? comp.handleAt(p.x, p.y, sel) : null;
        cv.style.cursor = hnd ? (hnd === 'nw' || hnd === 'se' ? 'nwse-resize' : 'nesw-resize') : comp.hitTest(p.x, p.y, sc) ? 'move' : '';
        return;
      }
      const dx = p.x - drag.start.x, dy = p.y - drag.start.y, s = drag.s, o = drag.orig;
      const W = GS.design.w, H = GS.design.h;
      if (drag.mode === 'move') {
        let nx = o.x + dx, ny = o.y + dy;
        // tarik ke tepi/tengah kanvas
        for (const c of [0, W - s.w, (W - s.w) / 2]) if (Math.abs(nx - c) < SNAP) nx = c;
        for (const c of [0, H - s.h, (H - s.h) / 2]) if (Math.abs(ny - c) < SNAP) ny = c;
        s.x = Math.round(nx);
        s.y = Math.round(ny);
      } else {
        let { x, y, w, h: hh } = o;
        const hd = drag.handle;
        if (hd.includes('e')) w = o.w + dx;
        if (hd.includes('w')) { w = o.w - dx; x = o.x + dx; }
        if (hd.includes('s')) hh = o.h + dy;
        if (hd.includes('n')) { hh = o.h - dy; y = o.y + dy; }
        if (ev.shiftKey) { const r = o.w / o.h; hh = w / r; if (hd.includes('n')) y = o.y + o.h - hh; }
        if (w < 40) { if (hd.includes('w')) x -= 40 - w; w = 40; }
        if (hh < 40) { if (hd.includes('n')) y -= 40 - hh; hh = 40; }
        Object.assign(s, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(hh) });
      }
      syncNumbers();
    });
    const end = () => { if (drag) { drag = null; GS.save(); } };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
  };

  /* ---------- permulaan ---------- */
  S.init = function () {
    setupSourceToolbar();
    GS.on('scenes:changed', () => { renderScenes(); renderSources(); renderProps(); });
    GS.on('sources:changed', () => { renderSources(); });
    GS.on('select:changed', () => { renderSources(); renderProps(); });
    GS.on('props:changed', renderProps);
    GS.on('media:changed', () => { if (S.selectedSource() && S.selectedSource().type === 'video') renderProps(); });
    renderScenes();
    renderSources();
    renderProps();
  };
  S.renderAll = () => { renderScenes(); renderSources(); renderProps(); };

})();
