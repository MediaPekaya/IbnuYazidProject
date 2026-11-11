/* Global Streamer - scene, source, panel sifat & suntingan pada kanvas */
(function () {
  'use strict';
  const { h, icon } = { h: GS.h, icon: GS.icon };
  const S = (GS.scenes = {});
  let selectedId = null;

  /* ---------- akses ---------- */
  const st = () => GS.state;
  const byId = (id) => st().scenes.find((s) => s.id === id);
  S.all = () => st().scenes;
  S.program = () => byId(st().programId) || st().scenes[0];
  S.preview = () => byId(st().previewId) || S.program();
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
    const brb = por
      ? [mk('widget', 'Tajuk', 140, 760, 800, 260, { widget: 'brand', text: 'SEBENTAR LAGI' }), mk('widget', 'Banner Promosi', 0, 1484, 1080, 140, { widget: 'promo', style: 'info' })]
      : [mk('widget', 'Tajuk', 560, 400, 800, 200, { widget: 'brand', text: 'SEBENTAR LAGI' }), mk('widget', 'Bar Teks', 40, 846, 1840, 96, { widget: 'ticker' })];
    const c = { id: GS.uid('scene'), name: 'Sebentar Lagi', fxStyle: 'holo', templateId: null, sources: brb };
    st().scenes.push(c);
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
    let sc = sceneId ? byId(sceneId) : null;
    const fresh = tpl.build();
    const old = sc ? sc.sources : [];
    const pool = old.filter((o) => o.type === 'video');
    fresh.forEach((n) => {
      if (n.type !== 'video') return;
      const i = pool.findIndex((o) => o.props.kind === n.props.kind);
      if (i >= 0) { const o = pool.splice(i, 1)[0]; n.id = o.id; n.props = Object.assign({}, o.props); }
    });
    pool.forEach((o) => { if (!fresh.some((n) => n.id === o.id)) GS.media.close(o.id); });
    if (!sc) { sc = { id: GS.uid('scene'), name: newName || 'Live · ' + tpl.name, sources: [] }; st().scenes.push(sc); }
    sc.sources = fresh;
    sc.templateId = tpl.id;
    sc.theme = tpl.theme || tpl.fxStyle;
    sc.fxStyle = sc.theme;
    sc.fxAnchor = tpl.fxAnchor;
    sc.alertY = tpl.alertY;
    st().templateId = tpl.id;
    selectedId = null;
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
  S.remove = function (id) {
    if (st().scenes.length <= 1) { GS.toast('Mesti ada sekurang-kurangnya satu scene.', 'warn'); return; }
    const sc = byId(id);
    if (!sc || !confirm(GS.t('Padam scene "{0}"?', GS.t(sc.name)))) return;
    sc.sources.forEach((s) => GS.media.close(s.id));
    st().scenes = st().scenes.filter((s) => s.id !== id);
    if (st().programId === id) st().programId = st().scenes[0].id;
    if (st().previewId === id) st().previewId = st().scenes[0].id;
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
    const pv = S.preview(), pg = S.program();
    if (!pv || pv === pg) { GS.toast('Pilih scene lain dalam Pratonton dahulu.', 'info'); return; }
    S.setProgram(pv.id);
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
    const names = { capture: 'Game (Capture Card)', camera: 'Kamera', screen: 'Skrin / Tetingkap', gamepc: 'Game PC' };
    const dw = GS.design.w, dh = GS.design.h;
    const box = kind === 'camera' ? (dw > dh ? [1240, 40, 640, 360] : [640, 80, 400, 400]) : [0, 0, dw, dh];
    // "Game PC": tangkap SATU tetingkap sahaja (Steam, game, pelayar) seperti Window/Game Capture dalam OBS
    const props = kind === 'gamepc' ? { kind: 'screen', mode: 'window', deviceId: '' } : { kind, deviceId: '' };
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
    const bars = (sc ? sc.sources : []).filter((x) => x.type === 'widget' && (x.props.widget === 'ticker' || x.props.widget === 'promo'));
    if (bars.length) { const b = bars.sort((a, c) => c.y - a.y)[0]; return [b.x, b.y, b.w, b.h]; }
    return [40, H - 210, W - 80, 170];
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
      GS.toast(GS.t('Footer video dipasang di bar bawah dan berulang secara automatik. Seret atau ubah saiz jika perlu.'), 'ok', 6000);
    });
    document.body.append(inp);
    inp.click();
    setTimeout(() => inp.remove(), 60000);
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
    } else { src.props = Object.assign(src.props, props); src.name = f.name; }
    GS.media.makeClip(src.id, props.src || url, props.kind, props);
    if (!path && !props.src && isVideo) GS.toast(GS.t('Video dimuat. Dalam versi web video tidak disimpan selepas muat semula; app Windows mengingati fail ini.'), 'info', 6000);
    changed('props:changed');
    renderProps();
    return src;
  };
  /** Sembunyikan/papar bar teks (INFO ... WELCOME) dan banner promosi (FOLLOW & SHARE) pada scene supaya banner sendiri menggantikannya. */
  S.setBarsHidden = function (sc, hide) {
    (sc ? sc.sources : []).forEach((x) => { if (x.type === 'widget' && (x.props.widget === 'ticker' || x.props.widget === 'promo')) x.visible = !hide; });
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

  S.addText = () => addSource(mk('text', 'Teks', 100, 100, 900, 90, { text: 'Teks baharu', size: 64, color: '#eaf4ff', weight: 800 }));

  const widgetDefs = {
    clock: ['Jam & Masa Main', 520, 118], winloss: ['Menang / Kalah', 520, 118], logo: ['Logo', 170, 116],
    brand: ['Tajuk', 420, 116], ticker: ['Bar Teks', 1200, 90], frame: ['Bingkai', 640, 360], metaboard: ['Meta Tournament', 560, 330], matchboard: ['Perlawanan Tournament', 760, 250], resultsboard: ['Keputusan Tournament', 560, 400],
  };
  S.addWidget = function (type) {
    const d = widgetDefs[type];
    if (!d) return;
    addSource(mk('widget', d[0], 120, 120, d[1], d[2], { widget: type, label: type === 'frame' ? '' : undefined }));
  };

  S.removeSource = function (id) {
    const sc = S.editTarget();
    const s = sc.sources.find((x) => x.id === id);
    if (!s) return;
    GS.media.close(s.id);
    if (s.type === 'clip') GS.media.removeClip(s.id);
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
  function popover(anchor, entries) {
    GS.$$('.popover').forEach((p) => p.remove());
    const pop = h('div', { class: 'popover', role: 'menu' }, entries.map((e) => e === '-' ? h('hr') :
      h('button', { class: 'pop-item', role: 'menuitem', onClick: () => { close(); e.run(); }, html: icon(e.icon || 'plus', 16) + '<span>' + GS.escapeHtml(GS.t(e.label)) + '</span>' })));
    document.body.append(pop);
    const r = anchor.getBoundingClientRect();
    const pr = pop.getBoundingClientRect();
    pop.style.left = Math.min(window.innerWidth - pr.width - 8, Math.max(8, r.left)) + 'px';
    pop.style.top = Math.max(8, r.top - pr.height - 8) + 'px';
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
        onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.select(sc.id); } } },
        h('span', { class: 'tag' }, isPgm ? 'PGM' : isPvw ? 'PVW' : ''),
        h('span', { class: 'name', onDblclick: (e) => { e.stopPropagation(); inlineRename(e.currentTarget, sc.name, (v) => S.rename(sc.id, v)); } }, sc.name),
        h('span', { class: 'row-actions' },
          h('button', { class: 'icon-btn sm', title: 'Salin scene', onClick: (e) => { e.stopPropagation(); S.duplicate(sc.id); }, html: icon('copy', 14) }),
          h('button', { class: 'icon-btn sm', title: 'Padam scene', onClick: (e) => { e.stopPropagation(); S.remove(sc.id); }, html: icon('trash', 14) })));
      root.append(item);
    });
  }

  function inlineRename(el, value, done) {
    const inp = h('input', { class: 'inline-input', value });
    el.replaceWith(inp);
    inp.focus();
    inp.select();
    const finish = (ok) => { if (ok) done(inp.value); else changed(); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    inp.addEventListener('blur', () => finish(true));
    inp.addEventListener('click', (e) => e.stopPropagation());
  }

  /* ---------- UI: sumber ---------- */
  const typeIcon = (s) => (s.type === 'video' ? (s.props.kind === 'camera' ? 'camera' : 'monitor') : s.type === 'image' || s.type === 'clip' ? 'image' : s.type === 'text' ? 'text' : 'widget');

  function renderSources() {
    const root = GS.$('#sourcesBody');
    if (!root) return;
    root.innerHTML = '';
    const sc = S.editTarget();
    if (!sc) return;
    if (!sc.sources.length) root.append(h('div', { class: 'empty' }, 'Scene kosong. Tekan + untuk tambah sumber.'));
    for (let i = sc.sources.length - 1; i >= 0; i--) {
      const s = sc.sources[i];
      root.append(h('div', { class: 'list-item' + (s.id === selectedId ? ' sel' : '') + (s.visible ? '' : ' off'), tabindex: 0, role: 'button', onClick: () => S.selectSource(s.id),
        onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.selectSource(s.id); } } },
        h('span', { class: 'ico', html: icon(typeIcon(s), 15) }),
        h('span', { class: 'name', onDblclick: (e) => { e.stopPropagation(); inlineRename(e.currentTarget, s.name, (v) => { s.name = v.trim() || s.name; changed('sources:changed'); }); } }, s.name),
        h('span', { class: 'row-actions always' },
          h('button', { class: 'icon-btn sm' + (s.locked ? ' on' : ''), title: s.locked ? 'Buka kunci' : 'Kunci', onClick: (e) => { e.stopPropagation(); s.locked = !s.locked; changed('sources:changed'); }, html: icon(s.locked ? 'lock' : 'unlock', 14) }),
          h('button', { class: 'icon-btn sm', title: s.visible ? 'Sembunyi' : 'Papar', onClick: (e) => { e.stopPropagation(); s.visible = !s.visible; changed('sources:changed'); }, html: icon(s.visible ? 'eye' : 'eyeoff', 14) }))));
    }
  }

  function setupSourceToolbar() {
    const add = GS.$('#btnSourceAdd');
    add.addEventListener('click', () => popover(add, [
      { label: 'Capture Card (game)', icon: 'monitor', run: () => S.addVideo('capture') },
      { label: 'Kamera / Webcam', icon: 'camera', run: () => S.addVideo('camera') },
      { label: 'Game PC (pilih tetingkap: Steam, game)', icon: 'monitor', run: () => S.addVideo('gamepc') },
      { label: 'Skrin penuh', icon: 'monitor', run: () => S.addVideo('screen') },
      '-',
      { label: 'Footer Video (video bergerak di bar bawah)', icon: 'image', run: S.addFooterVideo },
      { label: 'Banner / Video sendiri (imej, GIF, video)', icon: 'image', run: S.addClip },
      { label: 'Imej', icon: 'image', run: S.addImage },
      { label: 'Teks', icon: 'text', run: S.addText },
      '-',
      { label: 'Widget: Jam & Masa Main', icon: 'widget', run: () => S.addWidget('clock') },
      { label: 'Widget: Menang / Kalah', icon: 'widget', run: () => S.addWidget('winloss') },
      { label: 'Widget: Logo', icon: 'widget', run: () => S.addWidget('logo') },
      { label: 'Widget: Tajuk', icon: 'widget', run: () => S.addWidget('brand') },
      { label: 'Widget: Bar Teks', icon: 'widget', run: () => S.addWidget('ticker') },
      { label: 'Widget: Bingkai', icon: 'widget', run: () => S.addWidget('frame') },
      { label: 'Widget: Meta Tournament', icon: 'widget', run: () => S.addWidget('metaboard') },
      { label: 'Widget: Perlawanan Tournament', icon: 'widget', run: () => S.addWidget('matchboard') },
      { label: 'Widget: Keputusan Tournament', icon: 'widget', run: () => S.addWidget('resultsboard') },
    ]));
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

  function renderProps() {
    const root = GS.$('#propsBody');
    if (!root) return;
    root.innerHTML = '';
    const s = S.selectedSource();
    if (!s) { root.append(h('div', { class: 'empty' }, 'Pilih satu sumber untuk ubah sifatnya.')); return; }
    root.append(
      h('div', { class: 'grid4' }, field('X', numInput(s, 'x')), field('Y', numInput(s, 'y')), field('Lebar', numInput(s, 'w')), field('Tinggi', numInput(s, 'h'))));
    if (s.type === 'video' || s.type === 'image' || s.type === 'clip') {
      const sel = h('select', { onChange: (e) => { s.fit = e.target.value; changed('props:changed'); } },
        [['cover', 'Penuhi (potong)'], ['contain', 'Muat (tanpa potong)'], ['stretch', 'Regang']].map(([v, l]) => h('option', { value: v, selected: s.fit === v }, l)));
      root.append(field('Muat', sel));
    }
    if (s.type === 'clip') {
      const rec = GS.media.clips[s.id];
      const dim = rec && rec.ready ? (rec.kind === 'video' ? rec.el.videoWidth + '×' + rec.el.videoHeight : rec.el.naturalWidth + '×' + rec.el.naturalHeight) : '';
      root.append(h('div', { class: 'prop-info', 'data-clip-info': '1' }, (s.props.name || GS.t('Klip')) + (dim ? ' · ' + dim : '') + (rec && rec.error ? ' · ' + GS.t('Tidak dapat dimainkan') : !rec ? ' · ' + GS.t('Pilih fail semula') : '')));
      root.append(h('div', { class: 'btn-row' },
        h('button', { class: 'btn', id: 'btnClipPick', onClick: () => { const inp = h('input', { type: 'file', accept: 'image/*,video/*,.gif,.webm,.mp4,.mov,.m4v', style: { display: 'none' } }); inp.addEventListener('change', () => { if (inp.files[0]) S.loadClip(s, inp.files[0]); inp.remove(); }); document.body.append(inp); inp.click(); } }, rec ? 'Ganti fail' : 'Pilih fail'),
        h('button', { class: 'btn ghost', id: 'btnClipFooter', title: GS.t('Letak di bar bawah (footer)'), onClick: () => { const r = footerRect(S.editTarget()); s.x = r[0]; s.y = r[1]; s.w = r[2]; s.h = r[3]; changed('props:changed'); renderProps(); } }, 'Letak di footer'),
        h('button', { class: 'btn ghost', id: 'btnClipNatural', title: GS.t('Gunakan nisbah asal media'), onClick: () => { const r2 = GS.media.clips[s.id]; if (!r2 || !r2.ready) return; const nw = r2.kind === 'video' ? r2.el.videoWidth : r2.el.naturalWidth, nh = r2.kind === 'video' ? r2.el.videoHeight : r2.el.naturalHeight; if (nw && nh) { s.h = Math.round(s.w * nh / nw); changed('props:changed'); renderProps(); } } }, 'Nisbah asal')));
      if (s.props.kind === 'video') root.append(h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.props.loop !== false, onChange: (e) => { s.props.loop = e.target.checked; const r2 = GS.media.clips[s.id]; if (r2) r2.el.loop = e.target.checked; GS.save(); } }), 'Ulang video (loop)'));
      root.append(h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'chkHideBars', checked: !!s.props.hideBars, onChange: (e) => { s.props.hideBars = e.target.checked; S.setBarsHidden(S.editTarget(), e.target.checked); renderProps(); } }), 'Sembunyikan bar teks (INFO / Welcome) dan banner promosi pada scene ini'));
      root.append(h('p', { class: 'muted note' }, 'Banner sendiri boleh sebarang saiz: seret pada pratonton untuk alih, tarik sudut untuk besarkan, atau tukar Lebar/Tinggi di atas. "Muat" mengekalkan seluruh gambar, "Penuhi" memotong ikut kotak.'));
    }
    if (s.type === 'video') {
      const rec = GS.media.videos[s.id];
      const info = rec ? (rec.label || GS.t('Peranti')) + ' · ' + (rec.video.videoWidth || '?') + '×' + (rec.video.videoHeight || '?') : 'Tiada isyarat';
      root.append(h('div', { class: 'prop-info' }, info));
      root.append(h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onClick: async () => { if (await GS.media.pick(s)) S.afterPick(s); renderProps(); } }, s.props.mode === 'window' ? 'Pilih tetingkap' : s.props.kind === 'screen' ? 'Kongsi skrin' : 'Pilih peranti'),
        rec ? h('button', { class: 'btn ghost', onClick: () => { GS.media.close(s.id); s.props.deviceId = ''; changed('props:changed'); renderProps(); } }, 'Lepaskan') : null));
    }
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
      if (w === 'brand') root.append(field('Tajuk', h('input', { type: 'text', value: s.props.text || '', placeholder: 'GLOBAL STREAMER', onInput: (e) => { s.props.text = e.target.value; GS.save(); } })));
      if (w === 'frame') root.append(field('Label bingkai', h('input', { type: 'text', value: s.props.label || '', onInput: (e) => { s.props.label = e.target.value.toUpperCase(); GS.save(); } })));
      if (w === 'logo') {
        root.append(h('div', { class: 'btn-row' },
          h('button', { class: 'btn', onClick: () => pickLogo() }, 'Muat naik logo / vektor'),
          GS.state.logo ? h('button', { class: 'btn ghost', onClick: () => { GS.state.logo = null; GS.save(); renderProps(); } }, 'Guna logo lalai') : null));
      }
    }
  }

  function pickLogo() {
    const inp = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    inp.addEventListener('change', async () => {
      const f = inp.files[0];
      if (!f) return;
      GS.state.logo = await GS.media.downscale(await GS.media.readFile(f), 512);
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

  window.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (!selectedId) return;
    const s = S.selectedSource();
    if (!s) return;
    if (e.key === 'Delete') { S.removeSource(selectedId); return; }
    const step = e.shiftKey ? 20 : 2;
    const mv = { ArrowLeft: ['x', -step], ArrowRight: ['x', step], ArrowUp: ['y', -step], ArrowDown: ['y', step] }[e.key];
    if (mv && !s.locked) { e.preventDefault(); s[mv[0]] += mv[1]; syncNumbers(); GS.save(); }
  });
})();
