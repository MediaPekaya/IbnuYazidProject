/* Global Streamer - pintasan papan kekunci: Ctrl+Z (undur), Ctrl+Y / Ctrl+Shift+Z (ulang), Ctrl+A (pilih semua sumber),
 * Ctrl+C / Ctrl+V (salin / tampal sumber atau scene), anak panah (gerak sumber), Delete (padam).
 * Dalam kotak teks, Ctrl+A/C/V/Z berfungsi seperti biasa (teks, URL, nama). */
(function () {
  'use strict';
  const K = (GS.keys = {});
  const st = () => GS.state;
  const S = () => GS.scenes;

  /* ---------- sejarah (undur / ulang) ---------- */
  const dict = new Map();   // rentetan panjang (gambar data URL) disimpan sekali sahaja dalam sejarah
  const byRef = [];
  const replacer = (k, v) => {
    if (typeof v === 'string' && v.length > 600) {
      let id = dict.get(v);
      if (id === undefined) { id = byRef.length; byRef.push(v); dict.set(v, id); }
      return '\u0000ref:' + id;
    }
    return v;
  };
  const reviver = (k, v) => (typeof v === 'string' && v.charCodeAt(0) === 0 && v.startsWith('\u0000ref:') ? byRef[Number(v.slice(5))] : v);
  const snap = () => JSON.stringify({ scenes: st().scenes, programId: st().programId, previewId: st().previewId, drafts: S().getDrafts ? S().getDrafts() : {} }, replacer);
  let last = null, undo = [], redo = [], timer = 0, restoring = false;
  const LIMIT = 80;

  function record() {
    timer = 0;
    if (restoring || last === null) return;
    const now = snap();
    if (now === last) return;
    undo.push(last); if (undo.length > LIMIT) undo.shift();
    last = now; redo = [];
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(record, 350); }

  function restore(json) {
    restoring = true;
    try {
      const o = JSON.parse(json, reviver);
      st().scenes = o.scenes; st().programId = o.programId; st().previewId = o.previewId;
      if (S().setDrafts) S().setDrafts(o.drafts || {});
      if (!st().scenes.some((s) => s.id === st().programId)) st().programId = st().scenes[0] && st().scenes[0].id;
      if (!st().scenes.some((s) => s.id === st().previewId)) st().previewId = st().programId;
      S().selectSource(null);
      GS.emit('scenes:changed');
      GS.emit('sources:changed');
      GS.save();
    } finally { restoring = false; }
  }
  K.undo = function () {
    clearTimeout(timer); record();
    if (!undo.length) { GS.toast(GS.t('Tiada lagi yang boleh diundur.'), 'info'); return false; }
    redo.push(last); last = undo.pop(); restore(last);
    GS.toast(GS.t('Diundur (Ctrl+Z).'), 'ok');
    return true;
  };
  K.redo = function () {
    clearTimeout(timer); record();
    if (!redo.length) { GS.toast(GS.t('Tiada lagi yang boleh diulang.'), 'info'); return false; }
    undo.push(last); last = redo.pop(); restore(last);
    GS.toast(GS.t('Diulang (Ctrl+Y).'), 'ok');
    return true;
  };

  /* ---------- pilihan berbilang ---------- */
  let multi = [];
  const target = () => S().editTarget();
  K.selection = () => {
    const sc = target(); if (!sc) return [];
    const ids = multi.length ? multi : (S().selectedId() ? [S().selectedId()] : []);
    return sc.sources.filter((s) => ids.includes(s.id));
  };
  function paintMulti() {
    const root = GS.$('#sourcesBody'); if (!root) return;
    root.querySelectorAll('.list-item').forEach((el) => el.classList.toggle('multi', multi.includes(el.dataset.sid)));
  }
  K.selectAll = function () {
    const sc = target(); if (!sc || !sc.sources.length) return;
    multi = sc.sources.map((s) => s.id);
    S().selectSource(multi[multi.length - 1]);
    paintMulti();
    GS.toast(GS.t('{0} sumber dipilih (Ctrl+A).', multi.length), 'ok');
  };

  /* ---------- salin / tampal ---------- */
  let clip = null;   // { kind: 'src'|'scene', items }
  let zone = 'src';
  K.copy = function () {
    if (zone === 'scene') {
      const sc = S().all().find((x) => x.id === GS.state.previewId) || S().program();
      clip = { kind: 'scene', id: GS.state.mode === 'studio' ? GS.state.previewId : GS.state.programId };
      GS.toast(GS.t('Scene disalin. Tekan Ctrl+V untuk tampal.'), 'ok'); return;
    }
    const sel = K.selection();
    if (!sel.length) return;
    clip = { kind: 'src', items: sel.map((s) => GS.clone(s)) };
    GS.toast(GS.t('{0} sumber disalin. Tekan Ctrl+V untuk tampal.', sel.length), 'ok');
  };
  K.paste = function () {
    if (!clip) return;
    if (clip.kind === 'scene') { S().duplicate(clip.id); return; }
    const sc = target(); if (!sc) return;
    const ids = [];
    clip.items.forEach((orig) => {
      const c = GS.clone(orig);
      const oldId = orig.id;
      c.id = GS.uid('src');
      c.x = Math.round((c.x || 0) + 30); c.y = Math.round((c.y || 0) + 30);
      c.name = /\(salinan\)$/.test(c.name) ? c.name : GS.t('{0} (salinan)', c.name);
      if (c.type === 'video' && GS.media.videos[oldId]) GS.media.videos[c.id] = GS.media.videos[oldId];
      if (c.type === 'clip') {
        const p = c.props || {};
        const u = p.src || (p.path && GS.media.clipFileUrl ? GS.media.clipFileUrl(p.path) : '');
        if (u) GS.media.makeClip(c.id, u, p.kind === 'video' ? 'video' : 'image', p);
      }
      sc.sources.push(c); ids.push(c.id);
    });
    multi = ids.length > 1 ? ids : [];
    GS.save(); GS.emit('sources:changed'); GS.emit('scenes:changed');
    S().selectSource(ids[ids.length - 1]);
    paintMulti();
    GS.toast(GS.t('{0} sumber ditampal (Ctrl+V).', ids.length), 'ok');
  };

  K.remove = function () {
    const sel = K.selection(); if (!sel.length) return;
    sel.forEach((s) => S().removeSource(s.id));
    multi = [];
  };
  K.nudge = function (dx, dy) {
    K.selection().forEach((s) => { if (!s.locked) { s.x += dx; s.y += dy; } });
    GS.save(); GS.emit('select:changed');
  };

  /* ---------- papan kekunci ---------- */
  const typing = (el) => {
    if (!el) return false;
    const t = (el.tagName || '').toLowerCase();
    return t === 'input' || t === 'textarea' || t === 'select' || el.isContentEditable;
  };
  window.addEventListener('keydown', (e) => {
    if (typing(e.target)) return;                       // dalam kotak teks: tingkah laku biasa (teks, URL, nama)
    if (document.querySelector('#modalRoot .modal-back')) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (mod && key === 'z' && !e.shiftKey) { e.preventDefault(); K.undo(); return; }
    if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); K.redo(); return; }
    if (mod && key === 'a') { e.preventDefault(); K.selectAll(); return; }
    if (mod && key === 'c') { if (String(window.getSelection && window.getSelection()) !== '') return; e.preventDefault(); K.copy(); return; }
    if (mod && key === 'v') { e.preventDefault(); K.paste(); return; }
    if (mod) return;
    if (key === 'Delete' || key === 'Backspace') { if (K.selection().length) { e.preventDefault(); K.remove(); } return; }
    const step = e.shiftKey ? 20 : 2;
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[key];
    if (mv && K.selection().length) { e.preventDefault(); K.nudge(mv[0], mv[1]); }
  });

  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest && e.target.closest('#scenesBody')) zone = 'scene';
    else if (e.target.closest && e.target.closest('#sourcesBody, #stage, #propsBody')) { zone = 'src'; if (!e.ctrlKey && !e.shiftKey && !(e.target.closest('#sourcesBody') && false)) multi = multi.length && e.target.closest('#sourcesBody') && multi.includes((e.target.closest('.list-item') || {}).dataset && e.target.closest('.list-item').dataset.sid) ? multi : []; }
    setTimeout(paintMulti, 0);
  }, true);

  /** Menu klik kanan di kedudukan tetikus. entries: [{label, run, danger}] atau '-' */
  GS.ctxMenu = function (ev, entries) {
    ev.preventDefault(); ev.stopPropagation();
    GS.$$('.ctx-menu').forEach((m) => m.remove());
    const menu = GS.h('div', { class: 'popover ctx-menu', role: 'menu' }, entries.map((e) => e === '-' ? GS.h('hr') :
      GS.h('button', { type: 'button', class: 'pop-item' + (e.danger ? ' danger' : ''), role: 'menuitem', onClick: () => { close(); e.run(); } }, GS.h('span', null, GS.t(e.label)))));
    document.body.append(menu);
    const r = menu.getBoundingClientRect();
    menu.style.left = Math.max(6, Math.min(window.innerWidth - r.width - 6, ev.clientX)) + 'px';
    menu.style.top = Math.max(6, Math.min(window.innerHeight - r.height - 6, ev.clientY)) + 'px';
    requestAnimationFrame(() => menu.classList.add('in'));
    function close() { menu.remove(); document.removeEventListener('pointerdown', away, true); document.removeEventListener('keydown', esc, true); }
    function away(e2) { if (!menu.contains(e2.target)) close(); }
    function esc(e2) { if (e2.key === 'Escape') close(); }
    setTimeout(() => { document.addEventListener('pointerdown', away, true); document.addEventListener('keydown', esc, true); }, 0);
  };
  /** Ganti elemen teks dengan kotak input untuk menamakan semula. done(nilai) bila Enter/blur; cancel() bila Escape. */
  GS.inlineEdit = function (el, value, done, cancel) {
    const inp = GS.h('input', { class: 'inline-input', value });
    el.replaceWith(inp);
    inp.focus(); inp.select();
    let over = false;
    const finish = (ok) => { if (over) return; over = true; if (ok && inp.value.trim()) done(inp.value.trim()); else cancel && cancel(); };
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    inp.addEventListener('blur', () => finish(true));
    inp.addEventListener('click', (e) => e.stopPropagation());
    inp.addEventListener('pointerdown', (e) => e.stopPropagation());
  };

  K.init = function () {
    last = snap();
    const orig = GS.save;
    GS.save = function () { const r = orig.apply(this, arguments); if (!restoring) schedule(); return r; };
    GS.on('sources:changed', () => setTimeout(paintMulti, 0));
    GS.on('select:changed', () => setTimeout(paintMulti, 0));
    GS.on('scenes:changed', () => setTimeout(paintMulti, 0));
  };
})();
