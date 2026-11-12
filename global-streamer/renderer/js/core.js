/* Global Streamer - core: namespace, utiliti, event bus, state & persistence */
(function () {
  'use strict';
  const GS = (window.GS = { version: '0.1.0', games: {}, ui: {} });

  /* ---------- DOM helpers ---------- */
  GS.$ = (s, r) => (r ? r.querySelector(s) : document.querySelector(s) || (GS.popDoc && GS.popDoc.querySelector(s)) || null);
  GS.$$ = (s, r) => (r ? Array.from(r.querySelectorAll(s)) : Array.from(document.querySelectorAll(s)).concat(GS.popDoc ? Array.from(GS.popDoc.querySelectorAll(s)) : []));
  const TR_ATTR = new Set(['title', 'aria-label', 'placeholder', 'alt']);
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
        else el.setAttribute(k, v === true ? '' : TR_ATTR.has(k) && typeof v === 'string' && GS.t ? GS.t(v) : v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(typeof kid === 'string' && GS.t ? GS.t(kid) : String(kid)));
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
  const STATE_V = 3; // naikkan apabila susun atur lalai berubah (scene lama diganti, tetapan platform dikekalkan)
  const defaults = () => ({
    v: STATE_V,
    mode: 'normal',
    game: 'mlbb',
    templateId: 'holo-portrait',
    scenes: [],
    programId: null,
    previewId: null,
    settings: { orientation: 'portrait', width: 1080, height: 1920, fps: 30, vbitrate: 5000, abitrate: 160, encoder: 'auto', transition: 'fade', transitionMs: 500, recMode: 'program', recSystemAudio: false, recMinimize: true },
    platforms: {
      tiktok: { enabled: false, server: '' },
      facebook: { enabled: false, server: 'rtmps://live-api-s.facebook.com:443/rtmp/' },
      youtube: { enabled: false, server: 'rtmp://a.rtmp.youtube.com/live2' },
    },
    audio: { channels: [], voiceClean: true, sfxInStream: false },
    winloss: { win: 0, loss: 0, streak: 0 },
    voice: {
      enabled: false, culture: 'auto', minConf: 0.5, cooldownMs: 3000,
      mic: { on: true, channel: 'auto' },      // suara streamer (mikrofon)
      game: { on: false, channel: 'auto' },    // bunyi/suara pengumum game (capture card / audio skrin)
      triggers: [
        { fx: 'kill', phrases: 'first blood, double kill, triple kill, maniac, savage, killing spree, legendary, shutdown, kill' },
        { fx: 'death', phrases: 'you have been slain, mati, i died, dah mati' },
        { fx: 'victory', phrases: 'victory, menang, we won' },
        { fx: 'defeat', phrases: 'defeat, kalah, we lost' },
      ],
      // pengumum: efek (kill, double kill, victory, defeat...) BERCAKAP menggunakan suara yang dipilih
      announcer: {
        v: 3, on: true, lang: 'en-US', keepBeep: true,
        textsEn: { kill: '', slain: 'You have slain an enemy', 'first blood': 'First blood', 'double kill': 'Double kill', 'triple kill': 'Triple kill', maniac: 'Maniac', savage: 'Savage', 'killing spree': 'Killing spree', legendary: 'Legendary', shutdown: 'Shutdown', death: 'You have been slain', victory: 'Victory', defeat: 'Defeat', fullitem: 'Full item' },
        textsMs: { kill: 'Bunuh!', 'first blood': 'Darah pertama!', 'double kill': 'Bunuh dua!', 'triple kill': 'Bunuh tiga!', maniac: 'Maniak!', savage: 'Ganas!', 'killing spree': 'Tak boleh dihentikan!', legendary: 'Legenda!', shutdown: 'Tamatkan dia!', death: 'Kau dah mati.', victory: 'Kita menang! Syabas semua!', defeat: 'Kita kalah... tak apa, lain kali kita cuba lagi.', fullitem: 'Item penuh!' },
      },
      bot: {
        enabled: false, name: 'Jarvis', aliases: '', voiceOn: true, inStream: false, voiceName: '', rate: 0, listenMs: 8000,
        fallback: 'Maaf, saya tak faham soalan itu.', ack: 'Ya?', ai: { provider: 'groq', model: '', extra: '' },
        tts: { provider: 'system', gender: 'female', model: 'eleven_multilingual_v2', maleVoice: 'pNInz6obpgDQGcFmaJgB', femaleVoice: '21m00Tcm4TlvDq8ikWAM',
          azure: { region: 'southeastasia', maleMs: 'ms-MY-OsmanNeural', femaleMs: 'ms-MY-YasminNeural', maleEn: 'en-US-GuyNeural', femaleEn: 'en-US-JennyNeural' } },
        qa: [
          { q: 'berapa kill | kda saya', a: 'Setakat ini {kill} kill, {mati} mati dan {assist} assist.' },
          { q: 'berapa menang | rekod menang kalah', a: 'Rekod hari ini {menang} menang dan {kalah} kalah.' },
          { q: 'hero apa meta | top pick', a: 'Hero paling popular dalam tournament sekarang ialah {toppick}.' },
          { q: 'apa nak ban | top ban', a: 'Hero paling kerap diban ialah {topban}.' },
        ],
      },
    },
    ticker: { messages: ['FOLLOW AKAUN SAYA', 'WELCOME TO MY LIVE', 'KEDAI DIAMOND DI BIO', 'TERIMA KASIH SEMUA'] },
    logo: null,
    sessionStart: Date.now(),
    /* data widget siaran (diedit dalam panel Game; kandungan contoh, ganti dengan data anda) */
    status: { nowPlaying: '', likeLabel: 'HEART ME', likeCur: 0, likeMax: 200, viewers: 0 },
    boss: { enabled: true, name: 'TITAN TURTLE', level: 1, hp: 100000, max: 100000, shieldName: 'PLASMA GLOW', shield: 0, shieldMax: 500000 },
    toplike: [{ name: 'Penonton 1', n: 0 }, { name: 'Penonton 2', n: 0 }, { name: 'Penonton 3', n: 0 }],
    promo: {
      items: [
        { icon: 'heart', title: 'FOLLOW & SHARE', sub: 'Terima kasih sokongan anda' },
        { icon: 'bag', title: 'KEDAI DIAMOND', sub: 'Murah & dipercayai · pautan di bio' },
        { icon: 'crown', title: 'JOKI RANK', sub: 'Murah & pantas' },
      ],
      gift: [
        { icon: 'gift', title: 'GIFT ADA LAGU', sub: 'lain gift lain lagu' },
        { icon: 'star', title: 'NAK TENGOK ANIMASI GIFT?', sub: 'cuba 5 coin sekali' },
      ],
    },
    queue: { open: false, title: 'MABAR VIP', badgeOpen: 'OPEN', badgeClosed: 'CLOSED', rows: [{ name: 'Pemain 1', games: 3 }, { name: 'Pemain 2', games: 2 }], note: 'RM5 / 1 GAME · RM15 / 3 GAME' },
    deviceLabel: 'DEVICE: —',
    draft: { show: false, ally: ['', '', '', '', ''], enemy: ['', '', '', '', ''], banAlly: '', banEnemy: '', winPct: 50, phase: 'DRAFT PICK', note: '', suggest: true, lane: '' },
    spells: [
      { hero: '', spell: 'Flicker', cd: 120, until: 0 }, { hero: '', spell: 'Flicker', cd: 120, until: 0 }, { hero: '', spell: 'Retribution', cd: 35, until: 0 },
      { hero: '', spell: 'Inspire', cd: 75, until: 0 }, { hero: '', spell: 'Flicker', cd: 120, until: 0 },
    ],
    tiers: { label: 'TIER LIST', S: [], A: [], B: [], C: [], D: [] },
  });

  GS.defaultState = defaults;

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
      { const dv = defaults().voice, sv = s.voice || {}; merged.voice = Object.assign(dv, sv); merged.voice.mic = Object.assign(defaults().voice.mic, sv.mic || {}); merged.voice.game = Object.assign(defaults().voice.game, sv.game || {}); merged.voice.bot = Object.assign(defaults().voice.bot, sv.bot || {}); merged.voice.bot.tts = Object.assign(defaults().voice.bot.tts, (sv.bot && sv.bot.tts) || {}); merged.voice.bot.tts.azure = Object.assign(defaults().voice.bot.tts.azure, (sv.bot && sv.bot.tts && sv.bot.tts.azure) || {}); { const da = defaults().voice.announcer, sa = sv.announcer || {}; merged.voice.announcer = Object.assign(da, sa); merged.voice.announcer.textsEn = Object.assign(defaults().voice.announcer.textsEn, sa.textsEn || {}); merged.voice.announcer.textsMs = Object.assign(defaults().voice.announcer.textsMs, sa.textsMs || {}); if (!sa.v || sa.v < 3) { const da3 = defaults().voice.announcer; merged.voice.announcer.v = 3; merged.voice.announcer.on = true; merged.voice.announcer.lang = 'en-US'; merged.voice.announcer.keepBeep = true; merged.voice.announcer.textsEn = da3.textsEn; merged.voice.announcer.textsMs = da3.textsMs; } } if (!Array.isArray(merged.voice.triggers)) merged.voice.triggers = defaults().voice.triggers; if (!Array.isArray(merged.voice.bot.qa)) merged.voice.bot.qa = defaults().voice.bot.qa; merged.voice.bot.ai = Object.assign(defaults().voice.bot.ai, (sv.bot && sv.bot.ai) || {}); merged.voice.bot.qa = merged.voice.bot.qa.filter((e) => !(e && e.q === 'siapa noob | siapa paling noob' && e.a === 'Rahsia! Tapi pasti bukan saya.')); }
      merged.ticker = Object.assign(defaults().ticker, s.ticker || {});
      ['status', 'boss', 'promo', 'queue', 'draft', 'tiers'].forEach((k) => { merged[k] = Object.assign(defaults()[k], s[k] || {}); });
      if (!Array.isArray(merged.toplike)) merged.toplike = defaults().toplike;
      if (!Array.isArray(merged.spells)) merged.spells = defaults().spells;
      // migrasi: susun atur lalai baharu (menegak 9:16). Platform, ticker, W/L, logo, bahasa dikekalkan.
      if (s.v !== STATE_V) {
        merged.v = STATE_V;
        merged.scenes = [];
        merged.programId = null;
        merged.previewId = null;
        merged.templateId = defaults().templateId;
        Object.assign(merged.settings, defaults().settings);
      }
      return merged;
    } catch (e) {
      console.warn('[GS] gagal baca state', e);
      return d;
    }
  }
  GS.state = load();
  /* ruang reka bentuk (unit logik) mengikut orientasi; output sebenar ialah skala daripadanya */
  GS.design = { w: 1080, h: 1920 };
  GS.applyDesign = function () {
    const portrait = GS.state.settings.orientation !== 'landscape';
    GS.design = portrait ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 };
    return GS.design;
  };
  GS.orient = () => (GS.state.settings.orientation === 'landscape' ? 'landscape' : 'portrait');
  GS.applyDesign();
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
  /* Simpan automatik: setiap perubahan disimpan sebentar kemudian, dan dipaksa simpan apabila app ditutup/disembunyikan
   * supaya susunan scene, sumber, sifat dan panel kekal tanpa perlu ditambah atau disusun semula. */
  let dirty = false;
  const saveSoon = GS.debounce(() => { dirty = false; GS.saveNow(); }, 250);
  GS.save = () => { dirty = true; saveSoon(); };
  const flush = () => { if (dirty) { dirty = false; GS.saveNow(); } };
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  setInterval(flush, 5000);

  /* ---------- modal helper ---------- */
  GS.modal = function ({ title, body, footer, wide = false, onClose }) {
    const doc = GS.activeDoc && GS.activeDoc.defaultView && !GS.activeDoc.defaultView.closed ? GS.activeDoc : document; // modal dibuka dalam tetingkap yang sedang digunakan
    const root = doc.getElementById('modalRoot') || GS.$('#modalRoot');
    const close = () => {
      back.classList.remove('in');
      setTimeout(() => back.remove(), 280);
      doc.removeEventListener('keydown', onKey);
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
    doc.addEventListener('keydown', onKey);
    requestAnimationFrame(() => back.classList.add('in'));
    return { close, card, back };
  };

  /** Pengesahan (ya/tidak) yang selamat untuk app Windows: confirm() asli Electron boleh menyebabkan kotak teks tidak boleh ditaip selepasnya,
   *  jadi app Windows guna dialog dalam app. Pelayar web guna confirm() biasa. Mengembalikan Promise<boolean>. */
  GS.ask = function (message, opts) {
    opts = opts || {};
    if (!(window.gsNative && window.gsNative.app)) return Promise.resolve(window.confirm(message));
    return new Promise((resolve) => {
      let done = false, m;
      const fin = (v) => { if (done) return; done = true; try { m.close(); } catch (e) { /* abaikan */ } resolve(v); };
      const yes = GS.h('button', { type: 'button', class: 'btn ' + (opts.danger ? 'danger' : 'primary'), id: 'askYes', onClick: () => fin(true) }, opts.ok || 'Ya');
      const no = GS.h('button', { type: 'button', class: 'btn ghost', id: 'askNo', onClick: () => fin(false) }, opts.cancel || 'Batal');
      m = GS.modal({ title: opts.title || 'Pengesahan', body: GS.h('p', { class: 'ask-msg' }, message), footer: GS.h('div', { class: 'btn-row' }, no, yes), onClose: () => fin(false) });
      setTimeout(() => { try { yes.focus(); } catch (e) { /* abaikan */ } }, 60);
    });
  };
})();
