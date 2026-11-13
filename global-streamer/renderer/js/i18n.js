/* Global Streamer - dwibahasa Bahasa Melayu (BM) / English (EN).
 *
 * Teks sumber dalam kod ditulis dalam BM. Untuk English, kamus (js/lang-en.js) memadankan teks BM -> English.
 *   GS.t('Teks BM')                  -> terjemahan mengikut bahasa antara muka
 *   GS.t('Fail {0} disimpan', nama)  -> dengan ruang letak {0}, {1}
 *   GS.tov('MASA MAIN')              -> terjemahan mengikut bahasa OVERLAY siaran (boleh berbeza daripada UI)
 * GS.h() menterjemah teks anak dan atribut (title, placeholder, aria-label, alt) secara automatik.
 * Menukar bahasa UI memuat semula halaman (selamat dan ringkas). Bahasa overlay berubah serta-merta.
 */
(function () {
  'use strict';
  const I = (GS.i18n = { en: {}, missing: new Set(), langs: { ms: 'Bahasa Melayu', en: 'English' } });

  function detect() {
    return 'en'; // English ialah bahasa asal. Pilihan pengguna (Tetapan) disimpan dan diingati.
  }
  if (GS.state.lang !== 'ms' && GS.state.lang !== 'en') GS.state.lang = detect();
  // sekali sahaja: semua pengguna bermula dengan English (bahasa asal baharu); selepas itu pilihan dalam Tetapan diingati
  if (!GS.state.langEnDefault) { GS.state.langEnDefault = true; GS.state.lang = 'en'; }
  if (!['auto', 'ms', 'en'].includes(GS.state.overlayLang)) GS.state.overlayLang = 'auto';

  I.lang = () => GS.state.lang;
  I.overlayLang = () => (GS.state.overlayLang === 'auto' ? GS.state.lang : GS.state.overlayLang);

  function fmt(s, args) {
    if (!args || !args.length) return s;
    return s.replace(/\{(\d+)\}/g, (m, i) => (args[i] !== undefined ? args[i] : m));
  }

  function translate(s, lang) {
    if (typeof s !== 'string' || !s) return s;
    if (lang === 'ms') return s;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    const core = m[2];
    if (!core) return s;
    const hit = I.en[core];
    if (hit !== undefined) return m[1] + hit + m[3];
    if (/[A-Za-z]{3,}/.test(core)) I.missing.add(core);
    return s;
  }

  GS.t = (s, ...args) => fmt(translate(s, GS.state.lang), args);
  GS.tov = (s, ...args) => fmt(translate(s, I.overlayLang()), args);

  /* data contoh yang belum diubah pengguna (mesej bar teks, top like, giliran, promo) ditukar mengikut bahasa */
  const mapStrings = (v, fn) => (typeof v === 'string' ? fn(v) : Array.isArray(v) ? v.map((x) => mapStrings(x, fn)) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, mapStrings(x, fn)])) : v);
  function localizeDefaults(from, to) {
    const def = GS.defaultState();
    ['ticker', 'toplike', 'queue', 'promo', 'deviceLabel'].forEach((k) => {
      const bm = def[k];
      const en = mapStrings(bm, (x) => translate(x, 'en'));
      const src = from === 'ms' ? bm : en;
      if (JSON.stringify(GS.state[k]) === JSON.stringify(src)) GS.state[k] = JSON.parse(JSON.stringify(to === 'ms' ? bm : en));
    });
  }

  I.setLang = function (lang) {
    if (lang !== 'ms' && lang !== 'en') return;
    if (GS.state.lang === lang) return;
    if ((GS.live && GS.live.state !== 'idle') || (GS.rec && GS.rec.active)) {
      GS.toast(GS.t('Tamatkan siaran/rakaman dahulu sebelum menukar bahasa.'), 'warn');
      return false;
    }
    localizeDefaults(GS.state.lang, lang);
    GS.state.lang = lang;
    GS.saveNow();
    location.reload();
    return true;
  };
  I.setOverlayLang = function (v) {
    GS.state.overlayLang = ['auto', 'ms', 'en'].includes(v) ? v : 'auto';
    GS.save();
  };

  /* terjemah HTML statik (teks dan atribut) sekali semasa permulaan */
  const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  I.applyStatic = function (root) {
    document.documentElement.lang = GS.state.lang;
    if (GS.state.lang === 'ms') return;
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => { if (n.parentNode && !/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) n.nodeValue = translate(n.nodeValue, 'en'); });
    (root || document.body).querySelectorAll('*').forEach((el) => {
      ATTRS.forEach((a) => { if (el.hasAttribute(a)) el.setAttribute(a, translate(el.getAttribute(a), 'en')); });
    });
  };

  /* penukar bahasa kecil (digunakan di bar atas dan skrin log masuk) */
  I.switcher = function () {
    const wrap = GS.h('div', { class: 'lang-switch', role: 'group', 'aria-label': 'Language / Bahasa' });
    [['ms', 'BM'], ['en', 'EN']].forEach(([code, label]) => {
      wrap.append(GS.h('button', { type: 'button', class: GS.state.lang === code ? 'on' : '', title: I.langs[code], 'aria-pressed': GS.state.lang === code ? 'true' : 'false', onClick: () => I.setLang(code) }, label));
    });
    return wrap;
  };
})();
