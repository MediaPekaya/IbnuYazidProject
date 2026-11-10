/* Global Streamer - keluarkan panel kanan (Chat / Game / Meta) ke tetingkap berasingan untuk skrin kedua.
 *
 * Elemen #right DIPINDAHKAN (bukan disalin) ke tetingkap baharu, jadi chat TikTok/Facebook/YouTube, alert dan semua kawalan
 * terus hidup dan serasi dengan app. Tarik tetingkap ke PC/skrin kedua. Tutup tetingkap itu, atau tekan "Masukkan semula",
 * untuk memulangkan panel ke dalam app. Kedudukan dan saiz tetingkap diingati. */
(function () {
  'use strict';
  const GS = window.GS;
  const P = (GS.popout = { win: null, el: null, parent: null, next: null, timer: 0, mo: null });
  const KEY = 'gs.popout.bounds';

  GS.popDoc = null;      // dokumen tetingkap keluar (untuk GS.$ / GS.$$ / modal)
  GS.activeDoc = document;

  const readBounds = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const saveBounds = () => {
    const w = P.win;
    if (!w || w.closed) return;
    try { localStorage.setItem(KEY, JSON.stringify({ x: w.screenX, y: w.screenY, w: w.outerWidth, h: w.outerHeight })); } catch (e) { /* abaikan */ }
  };

  P.isOut = () => !!P.win && !P.win.closed && !!P.el;

  /** Salin kelas/atribut/gaya akar supaya tema dan orientasi sentiasa sama dalam tetingkap keluar. */
  function syncRoot() {
    if (!P.win || P.win.closed) return;
    const d = P.win.document;
    d.documentElement.lang = document.documentElement.lang;
    d.documentElement.style.cssText = document.documentElement.style.cssText;
    ['data-theme', 'data-orient'].forEach((a) => { const v = document.documentElement.getAttribute(a); if (v == null) d.documentElement.removeAttribute(a); else d.documentElement.setAttribute(a, v); });
    d.body.className = document.body.className.replace(/\bright-out\b/g, '').trim() + ' gs-popout';
  }

  P.open = function () {
    if (P.isOut()) { try { P.win.focus(); } catch (e) { /* abaikan */ } return true; }
    const el = document.getElementById('right');
    if (!el) return false;
    if (GS.live && GS.live.state === 'starting') return false;
    const b = readBounds();
    const feat = 'popup=yes,width=' + (b.w || 440) + ',height=' + (b.h || 820) + (b.x != null ? ',left=' + b.x + ',top=' + b.y : '');
    const win = window.open('', 'gs-panel', feat);
    if (!win) { GS.toast(GS.t('Pelayar menyekat tetingkap baharu. Benarkan pop-up untuk laman ini.'), 'warn'); return false; }
    const d = win.document;
    d.title = 'Global Streamer · ' + GS.t('Chat dan kawalan game');
    d.head.append(...Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')).map((l) => { const n = d.createElement('link'); n.rel = 'stylesheet'; n.href = l.href; return n; }));
    P.win = win; P.el = el; P.parent = el.parentNode; P.next = el.nextSibling;
    GS.popDoc = d;
    syncRoot();
    const head = GS.h('div', { class: 'pop-head' },
      GS.h('b', null, 'Chat · Game · Meta'),
      GS.h('button', { type: 'button', class: 'btn ghost', id: 'btnPopBack', onClick: () => P.dock() }, 'Masukkan semula ke app'));
    const modalRoot = GS.h('div', { id: 'modalRoot' });
    d.body.append(head, el, modalRoot);
    d.addEventListener('pointerdown', () => { GS.activeDoc = d; }, true);
    document.body.classList.add('right-out');
    GS.activeDoc = d;
    // tetingkap ditutup: pulangkan panel ke dalam app
    // tetingkap ditutup oleh pengguna: pulangkan panel SEBELUM dokumennya dimusnahkan (supaya pendengar acara kekal berfungsi)
    ['beforeunload', 'pagehide', 'unload'].forEach((ev) => win.addEventListener(ev, () => { saveBounds(); P.dock(true); }));
    P.timer = setInterval(() => { if (!P.win || P.win.closed) P.dock(true); else saveBounds(); }, 800);
    P.mo = new MutationObserver(syncRoot);
    P.mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    P.mo.observe(document.documentElement, { attributes: true });
    GS.emit('popout:changed', true);
    return true;
  };

  /** Pulangkan panel ke dalam app. `closing` = tetingkap sudah/sedang ditutup. */
  P.dock = function (closing) {
    if (!P.el) return false;
    clearInterval(P.timer);
    if (P.mo) { P.mo.disconnect(); P.mo = null; }
    const el = P.el, win = P.win;
    saveBounds();
    const parent = P.parent && P.parent.isConnected ? P.parent : document.getElementById('workspace');
    if (parent) parent.insertBefore(el, P.next && P.next.parentNode === parent ? P.next : null);
    P.el = null; P.win = null; P.parent = null; P.next = null;
    GS.popDoc = null;
    GS.activeDoc = document;
    document.body.classList.remove('right-out');
    if (!closing && win && !win.closed) { try { win.close(); } catch (e) { /* abaikan */ } }
    GS.emit('popout:changed', false);
    return true;
  };

  P.toggle = () => (P.isOut() ? P.dock() : P.open());

  P.init = function () {
    const tabs = GS.$('.rtabs');
    if (tabs && !GS.$('#btnPopout')) {
      tabs.append(GS.h('button', { type: 'button', class: 'icon-btn rtab-pop', id: 'btnPopout', 'aria-label': 'Keluarkan panel ke tetingkap lain', title: 'Keluarkan panel ke tetingkap lain (skrin kedua)', onClick: () => P.open(), html: GS.icon('popout', 16) }));
    }
    const chips = GS.$('#platformChips');
    if (chips && chips.parentElement && !GS.$('#btnPanelBack')) {
      const b = GS.h('button', { type: 'button', class: 'chip upd hidden', id: 'btnPanelBack', title: 'Panel chat dikeluarkan ke tetingkap lain. Klik untuk memulangkan.', onClick: () => P.dock() }, 'Panel di tetingkap lain · Kembalikan');
      chips.parentElement.insertBefore(b, chips);
    }
    GS.on('popout:changed', (out) => { const b = document.getElementById('btnPanelBack'); if (b) b.classList.toggle('hidden', !out); const o = document.getElementById('btnPopout'); if (o) o.classList.toggle('hidden', !!out); });
    window.addEventListener('beforeunload', () => { if (P.win && !P.win.closed) { saveBounds(); try { P.win.close(); } catch (e) { /* abaikan */ } } });
    document.addEventListener('pointerdown', () => { GS.activeDoc = document; }, true);
  };
})();
