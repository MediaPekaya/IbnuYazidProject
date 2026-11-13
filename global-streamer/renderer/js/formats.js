/* Global Streamer - format siaran (TikTok menegak 9:16 / YouTube · Facebook mendatar 16:9) dan dock Template.
 * Suis di bar atas menukar format serta-merta (tanpa Tetapan); susun atur setiap format disimpan dan dipulihkan. */
(function () {
  'use strict';
  const GS = window.GS;
  const { h, $, $$ } = GS;
  const F = (GS.formats = {});
  let viewO = null;          // format yang sedang dilihat dalam dock Template
  let viewC = 'gaming';      // jenis template: 'gaming' atau 'formal'
  try { viewC = sessionStorage.getItem('gs.tplCat') || 'gaming'; } catch (e) { /* abaikan */ }
  const thumbs = {};         // cache gambar kecil: id|tema -> canvas

  F.syncSwitch = function () {
    const o = GS.orient();
    const sw = $('#fmtSwitch');
    if (!sw) return;
    sw.dataset.mode = o;
    $$('button', sw).forEach((b) => b.classList.toggle('on', b.dataset.o === o));
  };

  /** Tukar format. Mengembalikan true jika berjaya (false jika sedang LIVE). */
  F.set = function (o) {
    const ok = GS.scenes.switchFormat(o);
    F.syncSwitch();
    return ok;
  };

  const templates = (o) => { const g = GS.games[GS.state.game] || GS.games.mlbb; return g ? g.templates.filter((t) => t.orientation === o) : []; };

  /* Gambar kecil template dilukis sedikit demi sedikit (satu setiap bingkai) supaya menekan tab tidak tersangkut. */
  const hi = [], lo = []; let pumping = false;
  F.pending = () => hi.length + lo.length;
  function render(t, key) {
    const por = t.orientation === 'portrait';
    const cv = document.createElement('canvas');
    cv.width = por ? 180 : 320; cv.height = por ? 320 : 180;
    try { GS.Compositor.thumb(cv, t.build(), por ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 }, t.theme || t.fxStyle); } catch (e) { console.warn('[GS] thumb template', e); }
    thumbs[key] = cv; return cv;
  }
  function pump() {
    pumping = false;
    const t0 = performance.now();
    while ((hi.length || lo.length) && performance.now() - t0 < 6) {
      if (!hi.length) break;
      const j = hi.shift(); if (!thumbs[j.key]) render(j.t, j.key);
      if (j.target && j.target.isConnected) j.target.getContext('2d').drawImage(thumbs[j.key], 0, 0);
    }
    if (hi.length) { pumping = true; requestAnimationFrame(pump); } else idle();
  }
  let idling = false;
  function idle() {
    if (idling || !lo.length) return; idling = true;
    const ric = window.requestIdleCallback || ((fn) => setTimeout(() => fn({ timeRemaining: () => 8 }), 250));
    ric((dl) => {
      idling = false;
      if (hi.length) return;
      if (!(GS.live && GS.live.state === 'live') && dl.timeRemaining() > 6) { const j = lo.shift(); if (j && !thumbs[j.key]) render(j.t, j.key); }
      idle();
    }, { timeout: 4000 });
  }
  function enqueue(job, front) { (front ? hi : lo).push(job); if (front && !pumping) { pumping = true; requestAnimationFrame(pump); } else if (!front) idle(); }
  F.prewarm = function () {
    // selepas permulaan, siapkan gambar kecil jenis lain semasa app tidak sibuk
    const all = (GS.games[GS.state.game] || GS.games.mlbb).templates;
    all.forEach((t) => { const key = t.id + '|' + (t.theme || t.fxStyle); if (!thumbs[key]) enqueue({ t, key, target: null }); });
  };

  function thumb(t) {
    const por = t.orientation === 'portrait';
    const key = t.id + '|' + (t.theme || t.fxStyle);
    // salinan baharu setiap lukisan (satu elemen DOM tidak boleh berada di dua tempat)
    const c = document.createElement('canvas');
    c.width = por ? 180 : 320; c.height = por ? 320 : 180;
    if (thumbs[key]) c.getContext('2d').drawImage(thumbs[key], 0, 0);
    else enqueue({ t, key, target: c }, true);
    return c;
  }

  /** Guna template pada scene aktif (menukar format dahulu jika template itu untuk format lain). */
  F.use = async function (t) {
    if (!t) return false;
    const sc0 = GS.scenes.editTarget();
    if (t.orientation !== GS.orient() && !F.set(t.orientation)) return false;
    const sc = GS.scenes.editTarget() || sc0;
    const r = GS.scenes.applyTemplate(t.id, sc && sc.id);
    if (r) GS.toast(GS.t('Template "{0}" digunakan. Tekan Ctrl+Z untuk undur.', GS.t(t.name)), 'ok');
    return !!r;
  };

  F.drawDock = function () {
    const root = $('#tplBody');
    if (!root) return;
    const cur = GS.orient();
    if (!viewO) viewO = cur;
    $$('#tplTabs button').forEach((b) => b.classList.toggle('on', b.dataset.o === viewO));
    const sc = GS.scenes.editTarget();
    const keepTop = root.scrollTop, keepSig = root.dataset.sig;
    root.innerHTML = '';
    root.dataset.o = viewO;
    // scene "Sebentar Lagi": papar terus template Sebentar Lagi untuk scene itu
    if (sc && sc.templateId && F._lastScene !== sc.id) { const tcur = (GS.games[GS.state.game] || GS.games.mlbb).templates.find((t) => t.id === sc.templateId); if (tcur && tcur.category) viewC = tcur.category; else if (/sebentar\s*lagi|countdown timer|brb|soon/i.test(sc.name || '')) viewC = 'soon'; }
    else if (sc && F._lastScene !== sc.id && /sebentar\s*lagi|countdown timer|brb|soon/i.test(sc.name || '')) viewC = 'soon';
    if (sc) F._lastScene = sc.id;
    $$('#tplCats button').forEach((b) => b.classList.toggle('on', b.dataset.c === viewC));
    const cats = $('#tplCats'); if (cats) { cats.dataset.c = viewC; const on = cats.querySelector('button.on'); const th = cats.querySelector('.thumb'); if (on && th) { th.style.width = on.offsetWidth + 'px'; th.style.transform = 'translateX(' + (on.offsetLeft - 2) + 'px)'; } }
    templates(viewO).filter((t) => (t.category || 'gaming') === viewC).forEach((t) => {
      const sel = viewO === cur && sc && sc.templateId === t.id;
      root.append(h('button', { type: 'button', class: 'tpl-card ' + t.orientation + (sel ? ' sel' : ''), 'data-tpl': t.id, title: t.desc || t.name, onClick: () => F.use(t) },
        thumb(t), h('span', null, t.name)));
    });
    if (!root.children.length) root.append(h('div', { class: 'empty' }, 'Tiada template untuk format ini.'));
    // animasi lembut apabila bertukar jenis / format (hanya bila bertukar, bukan setiap muat semula)
    const sig = viewO + '|' + viewC;
    if (F._sig !== undefined && F._sig !== sig) { root.classList.remove('swap'); void root.offsetWidth; root.classList.add('swap'); }
    F._sig = sig;
    // kekalkan kedudukan skrol: klik template tidak menaikkan senarai ke atas; hanya bila jenis/format ditukar baru ke atas
    root.dataset.sig = sig;
    root.style.scrollBehavior = 'auto';
    root.scrollTop = keepSig === sig ? keepTop : 0;
    requestAnimationFrame(() => { root.style.scrollBehavior = ''; });
  };

  F.init = function () {
    const sw = $('#fmtSwitch');
    if (sw) $$('button', sw).forEach((b) => b.addEventListener('click', () => { F.set(b.dataset.o); viewO = GS.orient(); F.drawDock(); }));
    $$('#tplTabs button').forEach((b) => b.addEventListener('click', () => { viewO = b.dataset.o; F.drawDock(); }));
    $$('#tplCats button').forEach((b) => b.addEventListener('click', () => { viewC = b.dataset.c; try { sessionStorage.setItem('gs.tplCat', viewC); } catch (e) { /* abaikan */ } F.drawDock(); }));
    GS.on('scenes:changed', () => { F.syncSwitch(); F.drawDock(); });
    GS.on('format:changed', (o) => { viewO = o; });
    F.syncSwitch();
    F.drawDock();
    setTimeout(F.prewarm, 1500);
  };
})();
