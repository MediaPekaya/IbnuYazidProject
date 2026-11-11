/* Global Streamer - format siaran (TikTok menegak 9:16 / YouTube · Facebook mendatar 16:9) dan dock Template.
 * Suis di bar atas menukar format serta-merta (tanpa Tetapan); susun atur setiap format disimpan dan dipulihkan. */
(function () {
  'use strict';
  const GS = window.GS;
  const { h, $, $$ } = GS;
  const F = (GS.formats = {});
  let viewO = null;          // format yang sedang dilihat dalam dock Template
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

  function thumb(t) {
    const por = t.orientation === 'portrait';
    const key = t.id + '|' + (t.theme || t.fxStyle);
    if (!thumbs[key]) {
      const cv = document.createElement('canvas');
      cv.width = por ? 180 : 320; cv.height = por ? 320 : 180;
      try { GS.Compositor.thumb(cv, t.build(), por ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 }, t.theme || t.fxStyle); } catch (e) { console.warn('[GS] thumb template', e); }
      thumbs[key] = cv;
    }
    // salinan baharu setiap lukisan (satu elemen DOM tidak boleh berada di dua tempat)
    const c = document.createElement('canvas');
    c.width = thumbs[key].width; c.height = thumbs[key].height;
    c.getContext('2d').drawImage(thumbs[key], 0, 0);
    return c;
  }

  /** Guna template pada scene aktif (menukar format dahulu jika template itu untuk format lain). */
  F.use = async function (t) {
    if (!t) return false;
    const sc0 = GS.scenes.editTarget();
    if (!(await GS.ask(GS.t('Guna template "{0}"? Susun atur scene aktif akan diganti (peranti video dikekalkan).', GS.t(t.name))))) return false;
    if (t.orientation !== GS.orient() && !F.set(t.orientation)) return false;
    const sc = GS.scenes.editTarget() || sc0;
    const r = GS.scenes.applyTemplate(t.id, sc && sc.id);
    if (r) GS.toast(GS.t('Template "{0}" digunakan.', GS.t(t.name)), 'ok');
    return !!r;
  };

  F.drawDock = function () {
    const root = $('#tplBody');
    if (!root) return;
    const cur = GS.orient();
    if (!viewO) viewO = cur;
    $$('#tplTabs button').forEach((b) => b.classList.toggle('on', b.dataset.o === viewO));
    const sc = GS.scenes.editTarget();
    root.innerHTML = '';
    templates(viewO).forEach((t) => {
      const sel = viewO === cur && sc && sc.templateId === t.id;
      root.append(h('button', { type: 'button', class: 'tpl-card ' + t.orientation + (sel ? ' sel' : ''), 'data-tpl': t.id, title: t.desc || t.name, onClick: () => F.use(t) },
        thumb(t), h('span', null, t.name)));
    });
    if (!root.children.length) root.append(h('div', { class: 'empty' }, 'Tiada template untuk format ini.'));
  };

  F.init = function () {
    const sw = $('#fmtSwitch');
    if (sw) $$('button', sw).forEach((b) => b.addEventListener('click', () => { F.set(b.dataset.o); viewO = GS.orient(); F.drawDock(); }));
    $$('#tplTabs button').forEach((b) => b.addEventListener('click', () => { viewO = b.dataset.o; F.drawDock(); }));
    GS.on('scenes:changed', () => { F.syncSwitch(); F.drawDock(); });
    GS.on('format:changed', (o) => { viewO = o; });
    F.syncSwitch();
    F.drawDock();
  };
})();
