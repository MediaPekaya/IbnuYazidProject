/* Global Streamer - core: namespace, utiliti, event bus, state & persistence */
(function () {
  'use strict';
  const GS = (window.GS = { version: '0.1.0', games: {}, ui: {} });

  /* ---------- DOM helpers ---------- */
  GS.$ = (s, r = document) => r.querySelector(s);
  GS.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  GS.h = function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') {
          for (const [sk, sv] of Object.entries(v)) {
            if (sk.startsWith('--')) el.style.setProperty(sk, sv);
            else el.style[sk] = sv;
          }
        }
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.length > 2 && k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };

  /* ---------- small utils ---------- */
  GS.uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
  GS.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  GS.lerp = (a, b, t) => a + (b - a) * t;
  GS.pad = (n) => String(n).padStart(2, '0');
  GS.fmtDur = (sec) => {
    sec = Math.max(0, Math.floor(sec));
    return GS.pad(Math.floor(sec / 3600)) + ':' + GS.pad(Math.floor((sec % 3600) / 60)) + ':' + GS.pad(sec % 60);
  };
  GS.debounce = (fn, ms) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };
  GS.clone = (o) => JSON.parse(JSON.stringify(o));
  GS.escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- event bus ---------- */
  const handlers = {};
  GS.on = (ev, fn) => {
    (handlers[ev] || (handlers[ev] = [])).push(fn);
    return () => (handlers[ev] = handlers[ev].filter((f) => f !== fn));
  };
  GS.emit = (ev, data) => {
    (handlers[ev] || []).slice().forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error('[GS] handler error for', ev, err);
      }
    });
  };

  /* ---------- toast ---------- */
  GS.toast = function (msg, type = 'info', ms = 3200) {
    let root = GS.$('#toasts');
    if (!root) {
      root = GS.h('div', { id: 'toasts', 'aria-live': 'polite' });
      document.body.append(root);
    }
    const t = GS.h('div', { class: 'toast ' + type }, msg);
    root.append(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => {
      t.classList.remove('in');
      setTimeout(() => t.remove(), 400);
    }, ms);
  };

  /* ---------- state ---------- */
  const KEY = 'globalstreamer.v1';
  const defaults = () => ({
    mode: 'normal',
    game: 'mlbb',
    templateId: 'holo-pro',
    scenes: [],
    programId: null,
    previewId: null,
    settings: { width: 1920, height: 1080, fps: 60, vbitrate: 6000, abitrate: 160, encoder: 'auto', transition: 'fade', transitionMs: 500 },
    platforms: {
      tiktok: { enabled: false, server: '' },
      facebook: { enabled: false, server: 'rtmps://live-api-s.facebook.com:443/rtmp/' },
      youtube: { enabled: false, server: 'rtmp://a.rtmp.youtube.com/live2' },
      custom: { enabled: false, server: '' },
    },
    audio: { channels: [] },
    winloss: { win: 0, loss: 0, streak: 0 },
    ticker: { messages: ['FOLLOW AKAUN SAYA', 'WELCOME TO MY LIVE', 'KEDAI DIAMOND DI BIO', 'TERIMA KASIH SEMUA'] },
    logo: null,
    sessionStart: Date.now(),
  });

  function load() {
    const d = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return d;
      const s = JSON.parse(raw);
      const merged = Object.assign(d, s);
      merged.settings = Object.assign(defaults().settings, s.settings || {});
      merged.platforms = Object.assign(defaults().platforms, s.platforms || {});
      merged.audio = Object.assign(defaults().audio, s.audio || {});
      merged.winloss = Object.assign(defaults().winloss, s.winloss || {});
      merged.ticker = Object.assign(defaults().ticker, s.ticker || {});
      return merged;
    } catch (e) {
      console.warn('[GS] gagal baca state', e);
      return d;
    }
  }
  GS.state = load();
  GS.resetState = () => {
    try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
    location.reload();
  };
  GS.saveNow = function () {
    try {
      localStorage.setItem(KEY, JSON.stringify(GS.state));
    } catch (e) {
      console.warn('[GS] gagal simpan', e);
      GS.toast('Gagal simpan tetapan (storan penuh?). Cuba kecilkan imej logo.', 'warn');
    }
  };
  GS.save = GS.debounce(GS.saveNow, 250);

  /* ---------- modal helper ---------- */
  GS.modal = function ({ title, body, footer, wide = false, onClose }) {
    const root = GS.$('#modalRoot');
    const close = () => {
      back.classList.remove('in');
      setTimeout(() => back.remove(), 280);
      document.removeEventListener('keydown', onKey);
      if (onClose) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const card = GS.h('div', { class: 'modal-card' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      GS.h('div', { class: 'modal-head' },
        GS.h('h2', null, title),
        GS.h('button', { class: 'icon-btn', 'aria-label': 'Tutup', onClick: close, html: GS.icon('x') })),
      GS.h('div', { class: 'modal-body' }, body),
      footer ? GS.h('div', { class: 'modal-foot' }, footer) : null);
    const back = GS.h('div', { class: 'modal-back', onClick: (e) => { if (e.target === back) close(); } }, card);
    root.append(back);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => back.classList.add('in'));
    return { close, card, back };
  };
})();
