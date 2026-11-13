/* Global Streamer - sumber "Browser": tampal sebarang link (YouTube, Instagram, Google, GitHub, Netlify, dan lain-lain) dan ia ditayangkan
 * dalam kawasan sumber, secara lalai di kedudukan dan saiz capture card. Hanya dalam app Windows (tetingkap Chromium tersembunyi di belakang tabir). */
(function () {
  'use strict';
  const { h } = GS;
  const B = (GS.browser = { recs: {} });
  const native = () => !!(window.gsNative && window.gsNative.browser);
  const norm = (raw) => {
    let u = String(raw || '').trim();
    if (!u) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) && !/^https?:/i.test(u)) return '';              // hanya http dan https
    if (!/^https?:\/\//i.test(u)) u = /^[^\s]+\.[^\s]{2,}(\/|$)/.test(u) ? 'https://' + u : 'https://www.google.com/search?q=' + encodeURIComponent(u);
    return u;
  };
  B.norm = norm;
  const size = (s) => { const rw = Math.max(480, Math.min(1600, Math.round(s.w * 0.7))); return [rw, Math.round(rw * s.h / s.w)]; };

  function rec(s) {
    let r = B.recs[s.id];
    if (!r) {
      r = B.recs[s.id] = { id: s.id, bmp: null, busy: false, drawn: 0, opened: '', timer: 0, sz: '' };
      r.timer = setInterval(async () => {
        if (!native()) return;
        if (Date.now() - r.drawn > 1500 || r.busy) return;
        r.busy = true;
        try {
          const buf = await window.gsNative.browser.frame(r.id, 70);
          if (buf && buf.length) { const bmp = await createImageBitmap(new Blob([buf], { type: 'image/jpeg' })); if (r.bmp && r.bmp.close) r.bmp.close(); r.bmp = bmp; if (r.mini) r.mini(); }
        } catch (e) { /* abaikan */ }
        r.busy = false;
      }, 66);
    }
    return r;
  }
  /** Dipanggil oleh kompositor setiap bingkai. */
  B.draw = function (comp, ctx, s, now) {
    const r = rec(s);
    r.drawn = Date.now();
    const url = norm(s.props.url);
    if (native() && url) {
      const [w, hh] = size(s), key = w + 'x' + hh;
      if (r.opened !== url) { r.opened = url; r.sz = key; window.gsNative.browser.open(s.id, url, w, hh).catch(() => {}); }
      else if (r.sz !== key) { r.sz = key; window.gsNative.browser.nav(s.id, 'resize', w, hh).catch(() => {}); }
    }
    if (r.bmp) { comp.drawFit(ctx, r.bmp, r.bmp.width, r.bmp.height, s); return; }
    comp.placeholder(ctx, s, now);
    ctx.save(); ctx.font = '600 ' + Math.max(14, s.h * 0.035) + 'px ' + GS.widgets.FONT; ctx.fillStyle = 'rgba(190,210,240,0.9)'; ctx.textAlign = 'center';
    ctx.fillText(!native() ? GS.t('Sumber Browser hanya tersedia dalam app Windows.') : !url ? GS.t('Tampal link dalam Sifat sumber Browser.') : GS.t('Memuatkan halaman…'), s.x + s.w / 2, s.y + s.h * 0.72);
    ctx.restore();
  };
  B.close = function (id) { const r = B.recs[id]; if (r) { clearInterval(r.timer); delete B.recs[id]; } if (native()) window.gsNative.browser.close(id).catch(() => {}); };
  B.go = function (s, raw) {
    const u = norm(raw);
    if (!u) { GS.toast(GS.t('Link tidak sah.'), 'warn'); return false; }
    s.props.url = u; const r = rec(s); r.opened = u; r.bmp = null;
    if (native()) { const [w, hh] = size(s); window.gsNative.browser.open(s.id, u, w, hh).catch(() => {}); window.gsNative.browser.nav(s.id, 'url', u).catch(() => {}); }
    GS.save(); return true;
  };
  /** Tambah sumber Browser di kedudukan capture card (atau kawasan perbentangan template), kemudian minta link. */
  B.add = function () {
    const sc = GS.scenes.editTarget(); if (!sc) return;
    const r0 = GS.deck && GS.deck.slotRect ? GS.deck.slotRect(sc) : { x: 0, y: 0, w: GS.design.w, h: GS.design.h };
    const s = { id: GS.uid('src'), type: 'browser', name: 'Browser', visible: true, locked: false, x: r0.x, y: r0.y, w: r0.w, h: r0.h, fit: 'contain', props: { url: '' } };
    sc.sources.push(s); GS.scenes.selectSource(s.id);
    GS.save(); GS.emit('sources:changed'); GS.emit('scenes:changed');
    B.askLink(s);
  };
  B.askLink = function (s) {
    const inp = h('input', { type: 'text', id: 'browserLinkInp', placeholder: 'https://www.youtube.com/watch?v=...  /  https://www.instagram.com/...', value: s.props.url || '', style: { width: '100%' } });
    const go = () => { if (B.go(s, inp.value)) { m.close(); GS.emit('props:changed'); } };
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); });
    const m = GS.modal({ title: 'Browser', body: h('div', null, h('p', { class: 'muted note' }, 'Tampal link apa sahaja (YouTube, Instagram, Google, GitHub, Netlify, dan lain-lain). Halaman ditayangkan dalam kawasan sumber ini, seperti capture card.'), inp),
      footer: h('div', { class: 'btn-row' }, h('button', { class: 'btn ghost', onClick: () => m.close() }, 'Batal'), h('button', { class: 'btn primary', id: 'btnBrowserGo', onClick: go }, 'Buka')) });
    setTimeout(() => inp.focus(), 100);
  };
  /** Panel sifat. */
  B.props = function (root, s, renderProps) {
    const inp = h('input', { type: 'text', id: 'browserUrl', value: s.props.url || '', placeholder: 'https://', onKeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') { if (B.go(s, inp.value)) renderProps(); } } });
    root.append(h('label', { class: 'field' }, h('span', null, GS.t('Link halaman')), inp),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn primary', id: 'btnBrowserOpen', onClick: () => { if (B.go(s, inp.value)) renderProps(); } }, GS.t('Buka')),
        h('button', { class: 'btn', onClick: () => native() && window.gsNative.browser.nav(s.id, 'back') }, '◀'),
        h('button', { class: 'btn', onClick: () => native() && window.gsNative.browser.nav(s.id, 'forward') }, '▶'),
        h('button', { class: 'btn', onClick: () => native() && window.gsNative.browser.nav(s.id, 'reload') }, GS.t('Muat semula'))));
    root.append(h('div', { class: 'btn-row' },
      h('button', { class: 'btn', onClick: () => native() && window.gsNative.browser.nav(s.id, 'scroll', 360) }, '▲ ' + GS.t('Skrol')),
      h('button', { class: 'btn', onClick: () => native() && window.gsNative.browser.nav(s.id, 'scroll', -360) }, '▼ ' + GS.t('Skrol')),
      h('button', { class: 'btn ghost', onClick: (e) => { s.props.mute = !s.props.mute; if (native()) window.gsNative.browser.nav(s.id, 'mute', s.props.mute); e.currentTarget.textContent = s.props.mute ? GS.t('Nyahbisu') : GS.t('Bisu'); GS.save(); } }, s.props.mute ? GS.t('Nyahbisu') : GS.t('Bisu'))));
    // paparan mini: klik untuk menekan butang dalam halaman (cth tutup notis kuki), roda tetikus untuk skrol
    const cv = h('canvas', { width: 320, height: Math.round(320 * s.h / s.w), class: 'browser-mini', title: GS.t('Klik untuk menekan dalam halaman') });
    const r = rec(s), draw = () => { if (!cv.isConnected) { r.mini = null; return; } const c = cv.getContext('2d'); c.fillStyle = '#05080f'; c.fillRect(0, 0, cv.width, cv.height); if (r.bmp) c.drawImage(r.bmp, 0, 0, cv.width, cv.height); r.drawn = Date.now(); };
    r.mini = draw; draw();
    cv.addEventListener('click', (e) => { const b = cv.getBoundingClientRect(); if (native()) window.gsNative.browser.nav(s.id, 'click', (e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height); });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); if (native()) window.gsNative.browser.nav(s.id, 'scroll', -e.deltaY); }, { passive: false });
    root.append(cv, h('p', { class: 'muted note' }, GS.t('Bunyi halaman dimainkan melalui pembesar suara komputer. Untuk masukkan ke siaran, hidupkan "Audio skrin" dalam Audio Mixer.')));
  };
})();
