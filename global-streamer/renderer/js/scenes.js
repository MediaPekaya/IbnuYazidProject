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

  /* tukar orientasi siaran (menegak 9:16 / mendatar 16:9). Scene diganti dengan susun atur lalai orientasi baharu;
   * peranti video (capture card, kamera) dikekalkan supaya tidak perlu dipilih semula. */
  S.setOrientation = function (o) {
    if (o !== 'portrait' && o !== 'landscape') return false;
    if (o === GS.orient()) return true;
    if (GS.live && GS.live.state !== 'idle') { GS.toast(GS.t('Tamatkan siaran dahulu sebelum menukar orientasi.'), 'warn'); return false; }
    const keep = {};
    const oldIds = [];
    st().scenes.forEach((sc) => sc.sources.forEach((s) => {
      if (s.type !== 'video') return;
      oldIds.push(s.id);
      if (s.props.kind !== 'screen' && GS.media.videos[s.id] && !keep[s.props.kind]) keep[s.props.kind] = { entry: GS.media.videos[s.id], deviceId: s.props.deviceId, label: s.props.deviceLabel };
    }));
    const set = st().settings;
    set.orientation = o;
    GS.applyDesign();
    set.width = o === 'portrait' ? 1080 : 1920;
    set.height = o === 'portrait' ? 1920 : 1080;
    set.fps = o === 'portrait' ? 30 : 60;
    set.vbitrate = o === 'portrait' ? 5000 : 6000;
    st().scenes = [];
    st().programId = st().previewId = null;
    selectedId = null;
    S.ensureDefaults();
    st().scenes.forEach((sc) => sc.sources.forEach((s) => {
      const k = s.type === 'video' && keep[s.props.kind];
      if (k) { GS.media.videos[s.id] = k.entry; s.props.deviceId = k.deviceId; s.props.deviceLabel = k.label; }
    }));
    oldIds.forEach((id) => GS.media.close(id));
    if (GS.app && GS.app.programComp) { GS.app.programComp.transition = null; GS.app.applyResolution(); GS.app.fit(); }
    GS.save();
    GS.emit('scenes:changed');
    return true;
  };

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
    sc.fxStyle = tpl.fxStyle;
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
    const names = { capture: 'Game (Capture Card)', camera: 'Kamera', screen: 'Skrin / Tetingkap' };
    const box = kind === 'camera' ? [1240, 40, 640, 360] : [0, 0, 1920, 1080];
    const src = mk('video', names[kind], ...box, { kind, deviceId: '' });
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

  S.addText = () => addSource(mk('text', 'Teks', 100, 100, 900, 90, { text: 'Teks baharu', size: 64, color: '#eaf4ff', weight: 800 }));

  const widgetDefs = {
    clock: ['Jam & Masa Main', 520, 118], winloss: ['Menang / Kalah', 520, 118], logo: ['Logo', 170, 116],
    brand: ['Tajuk', 420, 116], ticker: ['Bar Teks', 1200, 90], frame: ['Bingkai', 640, 360],
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
  const typeIcon = (s) => (s.type === 'video' ? (s.props.kind === 'camera' ? 'camera' : 'monitor') : s.type === 'image' ? 'image' : s.type === 'text' ? 'text' : 'widget');

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
      { label: 'Skrin / Tetingkap', icon: 'monitor', run: () => S.addVideo('screen') },
      '-',
      { label: 'Imej', icon: 'image', run: S.addImage },
      { label: 'Teks', icon: 'text', run: S.addText },
      '-',
      { label: 'Widget: Jam & Masa Main', icon: 'widget', run: () => S.addWidget('clock') },
      { label: 'Widget: Menang / Kalah', icon: 'widget', run: () => S.addWidget('winloss') },
      { label: 'Widget: Logo', icon: 'widget', run: () => S.addWidget('logo') },
      { label: 'Widget: Tajuk', icon: 'widget', run: () => S.addWidget('brand') },
      { label: 'Widget: Bar Teks', icon: 'widget', run: () => S.addWidget('ticker') },
      { label: 'Widget: Bingkai', icon: 'widget', run: () => S.addWidget('frame') },
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
    if (s.type === 'video' || s.type === 'image') {
      const sel = h('select', { onChange: (e) => { s.fit = e.target.value; changed('props:changed'); } },
        [['cover', 'Penuhi (potong)'], ['contain', 'Muat (tanpa potong)'], ['stretch', 'Regang']].map(([v, l]) => h('option', { value: v, selected: s.fit === v }, l)));
      root.append(field('Muat', sel));
    }
    if (s.type === 'video') {
      const rec = GS.media.videos[s.id];
      const info = rec ? (rec.label || GS.t('Peranti')) + ' · ' + (rec.video.videoWidth || '?') + '×' + (rec.video.videoHeight || '?') : 'Tiada isyarat';
      root.append(h('div', { class: 'prop-info' }, info));
      root.append(h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onClick: async () => { if (await GS.media.pick(s)) S.afterPick(s); renderProps(); } }, s.props.kind === 'screen' ? 'Kongsi skrin' : 'Pilih peranti'),
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
