/* Mobile Legends - susun atur piawai semua template + reka bentuk tambahan.
 * Peraturan: kamera di ATAS, capture card di BAWAH kamera. Tiada widget menindih capture card (kecuali Tier List dan paparan yang dibuka pengguna).
 * Portrait (TikTok): di kiri atas Boss, Top Like, Meta; kamera kecil di kanan bawah zon atas; logo di tengah atas; bar LIVE; kemudian capture card.
 * Ditambah juga template 2D bergaya gaming dan lebih banyak template Sebentar Lagi. */
(function () {
  'use strict';
  const G = GS.games.mlbb;
  const mk = (type, name, x, y, w, h, props, extra) => Object.assign({ id: GS.uid('src'), type, name, visible: true, locked: false, x, y, w, h, fit: 'cover', props: props || {} }, extra || {});
  const wid = (name, widgetType, x, y, w, h, props) => mk('widget', name, x, y, w, h, Object.assign({ widget: widgetType }, props || {}));
  const isW = (s, k) => s.type === 'widget' && s.props && s.props.widget === k;
  const same = (a, b) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

  /* ---------- salinan 2D bergaya gaming daripada template gaming asal ---------- */
  const GAMING_2D = [['flat-charcoal', '2D Arang'], ['flat-indigo', '2D Indigo'], ['flat-gold', '2D Hitam Emas']];
  const bases = G.templates.filter((t) => (t.category || 'gaming') === 'gaming' && t.id !== 'portrait-cam');
  const clones = [];
  bases.forEach((t) => {
    GAMING_2D.forEach(([theme, label]) => {
      clones.push(Object.assign({}, t, { id: t.id + '-' + theme, theme, fxStyle: theme, category: 'gaming', name: label + ' · ' + t.name, desc: 'Gaya gaming 2D (latar plain, bukan hologram). ' + (t.desc || '') }));
    });
  });
  /* ---------- lebih banyak template Sebentar Lagi (formal 2D dan gaming 2D) ---------- */
  const soonBase = G.templates.filter((t) => t.category === 'soon');
  const SOON_THEMES = [['flat-charcoal', '2D Arang'], ['flat-gold', '2D Hitam Emas'], ['flat-indigo', '2D Indigo'], ['flat-teal', '2D Teal'], ['flat-ocean', '2D Lautan'], ['flat-white', '2D Putih'], ['flat-rose', '2D Mawar']];
  soonBase.filter((t) => /navy/.test(t.id)).forEach((t) => {
    SOON_THEMES.forEach(([theme, label]) => {
      clones.push(Object.assign({}, t, { id: t.id.replace('navy', theme.replace('flat-', '')), theme, fxStyle: theme, name: 'Countdown Timer · ' + label, desc: 'Formal 2D latar ' + label.replace('2D ', '').toLowerCase() + ': kira detik, logo dan bar teks.' }));
    });
  });
  G.templates.push(...clones);

  /* ---------- template baharu dengan latar bergerak: api, kilat, peti harta, anime, neon, bintang ---------- */
  const bgfx = (style) => wid('Latar bergerak', 'bgfx', 0, 0, 0, 0, { style });
  const withBg = (build, style, por) => () => { const o = build(); const b = bgfx(style); b.w = por ? 1080 : 1920; b.h = por ? 1920 : 1080; o.unshift(b); return o; };
  const cdw = (x, y, w, h, extra) => wid('Kira Detik', 'countdown', x, y, w, h, Object.assign({ hours: 0, minutes: 10, seconds: 0, title: 'SEBENTAR LAGI', subtitle: 'MOBILE LEGENDS', endText: 'START!' }, extra || {}));
  const cam = (x, y, w, h) => mk('video', 'Kamera', x, y, w, h, { kind: 'camera', deviceId: '' });
  const logo = (x, y, w, h) => wid('Logo', 'logo', x, y, w, h);
  const tick = (x, y, w, h) => wid('Bar Teks', 'ticker', x, y, w, h);
  const bot = (x, y, w, h) => wid('Bot', 'bot', x, y, w, h);
  const brand = (x, y, w, h, text) => wid('Tajuk', 'brand', x, y, w, h, { text: text || 'MOBILE LEGENDS' });
  const SP = (o) => Object.assign({ orientation: 'portrait', category: 'soon', fxAnchor: 1180, alertY: 1500 }, o);
  const SLd = (o) => Object.assign({ orientation: 'landscape', category: 'soon' }, o);
  const soonNew = [
    SP({ id: 'sl-api-p', theme: 'crimson', fxStyle: 'crimson', name: 'Api · Countdown Timer', desc: 'Nombor api bergerak di atas latar api, tanpa kotak.',
      build: withBg(() => [logo(440, 200, 200, 170), cdw(40, 560, 1000, 600, { numStyle: 'fire', noPanel: true }), brand(140, 1240, 800, 130), tick(40, 1700, 1000, 100)], 'fire', true) }),
    SP({ id: 'sl-kilat-p', theme: 'galaxy', fxStyle: 'galaxy', name: 'Kilat · Countdown Timer', desc: 'Nombor neon dengan kilat menyambar.',
      build: withBg(() => [cdw(40, 240, 1000, 560, { numStyle: 'neon', noPanel: true, subtitle: 'LIVE AKAN BERMULA' }), cam(240, 900, 600, 600), logo(440, 1560, 200, 170), tick(40, 1760, 1000, 100)], 'lightning', true) }),
    SP({ id: 'sl-anime-p', theme: 'neon', fxStyle: 'neon', name: 'Anime · Countdown Timer', desc: 'Latar anime berwarna dengan kelopak sakura dan bot.',
      build: withBg(() => [cdw(40, 480, 1000, 560, { numStyle: 'outline', noPanel: true, title: 'SEBENTAR LAGI~', subtitle: 'JANGAN KETINGGALAN!' }), bot(60, 1160, 460, 460), logo(740, 1260, 220, 190), tick(40, 1700, 1000, 100)], 'anime', true) }),
    SP({ id: 'sl-neon-p', theme: 'neon', fxStyle: 'neon', name: 'Neon Grid · Countdown Timer', desc: 'Latar neon gaya retro dengan nombor neon di bawah matahari.',
      build: withBg(() => [logo(440, 160, 200, 170), cdw(60, 980, 960, 520, { numStyle: 'neon', noPanel: true }), tick(40, 1700, 1000, 100)], 'neon', true) }),
    SP({ id: 'sl-bintang-p', theme: 'holo', fxStyle: 'holo', name: 'Bintang · Countdown Timer', desc: 'Kamera di atas, kiraan flip di bawah, latar bintang.',
      build: withBg(() => [cam(190, 160, 700, 700), cdw(40, 940, 1000, 560, { numStyle: 'flip' }), logo(440, 1540, 200, 170), tick(40, 1740, 1000, 100)], 'stars', true) }),
  ];
  const soonNewL = [
    SLd({ id: 'sl-api-l', theme: 'crimson', fxStyle: 'crimson', name: 'Api · Countdown Timer', desc: 'Nombor api bergerak di atas latar api, tanpa kotak.',
      build: withBg(() => [logo(60, 40, 170, 130), cdw(260, 180, 1400, 600, { numStyle: 'fire', noPanel: true }), tick(40, 880, 1840, 110)], 'fire', false) }),
    SLd({ id: 'sl-kilat-l', theme: 'galaxy', fxStyle: 'galaxy', name: 'Kilat · Countdown Timer', desc: 'Nombor neon di kiri, kamera di kanan, kilat menyambar.',
      build: withBg(() => [cdw(40, 200, 1100, 600, { numStyle: 'neon', noPanel: true }), cam(1200, 260, 660, 372), logo(1500, 680, 170, 130), tick(40, 880, 1840, 110)], 'lightning', false) }),
    SLd({ id: 'sl-anime-l', theme: 'neon', fxStyle: 'neon', name: 'Anime · Countdown Timer', desc: 'Latar anime dengan kelopak sakura dan bot.',
      build: withBg(() => [cdw(260, 160, 1400, 560, { numStyle: 'outline', noPanel: true, title: 'SEBENTAR LAGI~', subtitle: 'JANGAN KETINGGALAN!' }), bot(1560, 700, 300, 300), logo(60, 40, 170, 130), tick(40, 900, 1500, 100)], 'anime', false) }),
    SLd({ id: 'sl-neon-l', theme: 'neon', fxStyle: 'neon', name: 'Neon Grid · Countdown Timer', desc: 'Latar neon retro dengan nombor neon.',
      build: withBg(() => [logo(880, 30, 160, 120), cdw(260, 440, 1400, 520, { numStyle: 'neon', noPanel: true }), tick(40, 930, 1840, 100)], 'neon', false) }),
    SLd({ id: 'sl-bintang-l', theme: 'holo', fxStyle: 'holo', name: 'Bintang · Countdown Timer', desc: 'Logo besar di kiri, kiraan flip di kanan, latar bintang.',
      build: withBg(() => [logo(120, 200, 560, 420), brand(60, 660, 700, 120), cdw(860, 180, 1000, 640, { numStyle: 'flip' }), tick(40, 900, 1840, 110)], 'stars', false) }),
  ];
  soonNew.push(SP({ id: 'sl-ribut-p', theme: 'galaxy', fxStyle: 'galaxy', name: 'Hujan Ribut · Countdown Timer', desc: 'Hujan lebat dan petir sebenar di atas awan ribut, nombor neon di tengah.',
    build: withBg(() => [logo(440, 160, 200, 170), cdw(40, 560, 1000, 560, { numStyle: 'neon', noPanel: true, subtitle: 'RIBUT AKAN TIBA' }), brand(140, 1240, 800, 130), tick(40, 1700, 1000, 100)], 'storm', true) }));
  soonNewL.push(SLd({ id: 'sl-ribut-l', theme: 'galaxy', fxStyle: 'galaxy', name: 'Hujan Ribut · Countdown Timer', desc: 'Hujan lebat dan petir sebenar di atas awan ribut.',
    build: withBg(() => [logo(60, 40, 170, 130), cdw(260, 180, 1400, 600, { numStyle: 'neon', noPanel: true, subtitle: 'RIBUT AKAN TIBA' }), tick(40, 880, 1840, 110)], 'storm', false) }));
  G.templates.push(...soonNew, ...soonNewL);

  /* ---------- template gaming dengan latar api, kilat, peti harta dan anime ---------- */
  const BG = [['fire', 'Api', 'crimson'], ['storm', 'Hujan Ribut', 'galaxy'], ['lightning', 'Kilat', 'galaxy'], ['anime', 'Anime', 'neon']];
  ['holo-portrait', 'portrait-game', 'mono-bersih', 'holo-pro', 'cam-besar', 'galaxy-kamera'].forEach((id) => {
    const t = G.templates.find((x) => x.id === id); if (!t) return;
    BG.forEach(([style, label, fx]) => {
      const por = t.orientation === 'portrait';
      clones.push(Object.assign({}, t, { id: id + '-' + style, fxStyle: fx, theme: undefined, category: 'gaming', name: label + ' · ' + t.name, desc: 'Latar ' + label.toLowerCase() + ' bergerak di belakang susun atur. ' + (t.desc || ''), build: withBg(t.build, style, por) }));
    });
  });
  G.templates.push(...clones.slice(-24));

  /* ---------- penormal susun atur ---------- */
  function normPortrait(t, items) {
    const cap = items.find((s) => s.type === 'video' && s.props.kind === 'capture' && s.visible !== false);
    if (!cap) return items;
    const cam = items.find((s) => s.type === 'video' && s.props.kind === 'camera' && s.visible !== false);
    const frames = items.filter((s) => isW(s, 'frame') && same(s, cap));
    const gaming = (t.category || 'gaming') === 'gaming';
    const get = (k) => items.find((s) => isW(s, k));
    let boss = get('boss'), tl = get('toplike'), meta = get('metaboard');
    const add = (s, after) => { items.push(s); return s; };
    if (gaming) { boss = boss || add(wid('Boss', 'boss', 0, 0, 10, 10)); tl = tl || add(wid('Top Like', 'toplike', 0, 0, 10, 10)); meta = meta || add(wid('Meta Tournament', 'metaboard', 0, 0, 10, 10)); }
    const n = [boss, tl, meta].filter(Boolean).length;
    const put = (s, x, y, w, h) => { if (s) { s.x = x; s.y = y; s.w = w; s.h = h; } };
    // zon atas (0-800)
    if (n) {
      put(boss, 20, 20, 520, 170); put(tl, 20, 200, 520, 200); put(meta, 20, 410, 520, 370);
      put(cam, 560, 430, 500, 350);
      const logo = get('logo'); put(logo, 730, 20, 160, 140);
      const sp = get('spelltimer'); put(sp, 570, 176, 490, 236);
    } else {
      put(cam, 20, 20, 1040, 770);
      const logo = get('logo'); put(logo, 900, 36, 140, 120);
    }
    if (cam) cam.visible = true;
    // bar LIVE di antara kamera dan capture card
    let sb = get('statusbar');
    if (!sb) { sb = wid('Bar Status', 'statusbar', 0, 800, 1080, 56); items.push(sb); }
    put(sb, 0, 800, 1080, 56);
    put(cap, 0, 856, 1080, 608);
    frames.forEach((f) => { put(f, 0, 856, 1080, 608); f.props.label = ''; });
    // blok bawah piawai (sama seperti Hologram Menegak): banner, giliran mabar, W/L dan hadiah tidak bertindih
    const bot = (s) => { const i = items.indexOf(s), nx = items[i + 1]; if (nx && isW(nx, 'bot')) { nx.x = s.x; nx.y = s.y - Math.round(s.h * 0.06); nx.w = Math.round(s.h * 1.24); nx.h = Math.round(s.h * 1.12); } };
    const giftPromo = items.some((s) => isW(s, 'promo') && s.props.style === 'gift');
    items.forEach((s) => {
      if (s.type !== 'widget') return;
      const k = s.props.widget;
      if (k === 'promo') { if (s.props.style === 'gift') put(s, 20, 1832, 1040, 76); else put(s, 0, 1484, 1080, 140); bot(s); }
      else if (k === 'queue') put(s, 20, 1636, 560, 184);
      else if (k === 'label') put(s, 600, 1636, 460, 52);
      else if (k === 'winloss') put(s, 600, 1698, 460, 122);
      else if (k === 'draft') put(s, 20, 1484, 1040, 340);
      else if (k === 'ticker') { if (giftPromo) { s.visible = false; } else put(s, 20, 1832, 1040, 76); }
    });
    // widget lain yang menindih capture card: alih ke bawahnya
    const other = items.filter((s) => s.type === 'widget' && s !== boss && s !== tl && s !== meta && s !== sb && !isW(s, 'logo') && !isW(s, 'spelltimer') && !isW(s, 'frame') && !isW(s, 'bot') && !isW(s, 'bgfx') && s.visible !== false && s.y < 1464 && s.y + s.h > 856);
    let ny = 1472;
    other.sort((a, b) => a.y - b.y).forEach((s) => { s.y = ny; ny += s.h + 8; });
    t.fxAnchor = 1160; t.alertY = Math.max(t.alertY || 0, 1484);
    return items;
  }
  function normLandscape(t, items) {
    const cap = items.find((s) => s.type === 'video' && s.props.kind === 'capture' && s.visible !== false);
    if (!cap || cap.w > 1900) return items;
    const frames = items.filter((s) => isW(s, 'frame') && same(s, cap));
    // bar LIVE di atas capture card
    const top = 84;
    items.forEach((s) => {
      if (s === cap || frames.includes(s) || s.type === 'video' || isW(s, 'frame')) { if (s.y < top && s.y + s.h > top) { s.h -= top - s.y; s.y = top; } }
      else if (s.type === 'widget' && s.y < top && !isW(s, 'statusbar') && !isW(s, 'bgfx')) s.y += top - s.y;
    });
    let sb = items.find((s) => isW(s, 'statusbar'));
    if (!sb) { sb = wid('Bar Status', 'statusbar', 40, 14, 1840, 56); items.push(sb); }
    sb.x = 40; sb.y = 14; sb.w = 1840; sb.h = 56;
    frames.forEach((f) => { f.props.label = ''; });
    const tk0 = items.find((s) => isW(s, 'ticker')); if (tk0 && tk0.h < 120 && tk0.y + 120 <= 1068) tk0.h = 120;
    // widget yang menindih capture card (Meta, Boss, Top Like, Pemasa Spell) dialihkan ke ruang kosong di sebelah kanan
    const cam = items.find((s) => s.type === 'video' && s.props.kind === 'camera' && s.visible !== false);
    const ticker = items.find((s) => isW(s, 'ticker'));
    const bottom = ticker ? ticker.y - 12 : 1040;
    const over = items.filter((s) => s.type === 'widget' && ['boss', 'toplike', 'metaboard', 'spelltimer'].includes(s.props.widget) && s.x < cap.x + cap.w && s.x + s.w > cap.x && s.y < cap.y + cap.h && s.y + s.h > cap.y);
    if (over.length) {
      const find = (k) => items.find((s) => isW(s, k));
      const meta = find('metaboard'), clock = find('clock'), wl = find('winloss'), logo = find('logo'), brand = find('brand');
      const put = (s, x, y, w, h) => { if (s) { s.x = x; s.y = y; s.w = w; s.h = h; } };
      const stack = items.filter((s) => s.type === 'widget' && ['boss', 'toplike', 'spelltimer'].includes(s.props.widget));
      if (cam && cam.x >= cap.x + cap.w - 10 && cam.w <= 700) {
        // A) kolum kanan: kamera, Meta, jam + menang/kalah, logo + tajuk
        const cx = cam.x, cw = cam.w;
        cam.h = Math.max(150, Math.min(Math.round(cw * 0.5), bottom - cam.y - 10 - ((meta ? 258 : 0) + 108 + 78)));
        let y = cam.y + cam.h + 10;
        put(meta, cx, y, cw, 250); if (meta) y += 258;
        put(clock, cx, y, Math.round(cw / 2) - 4, 100); put(wl, cx + Math.round(cw / 2) + 4, y, Math.round(cw / 2) - 4, 100); y += 108;
        put(logo, cx, y, 90, 78); put(brand, cx + 100, y, cw - 100, 78);
        frames.forEach((f) => { if (f !== undefined && f.props.label === 'LIVE') { f.h = cam.h; } });
        items.filter((s) => isW(s, 'frame') && s.x === cam.x && s.y === cam.y).forEach((f) => { f.h = cam.h; });
        let sy = y + 86; stack.forEach((s) => { if (sy + 70 < bottom) { put(s, cx, sy, cw, 120); sy += 128; } else s.visible = false; });
      } else {
        // B) baris di bawah capture card dan kamera
        let yb = Math.max(cap.y + cap.h, cam ? cam.y + cam.h : 0) + 12;
        const hh = Math.max(80, Math.min(180, bottom - yb));
        let x = cap.x;
        const row = [[meta, Math.round(hh * 1.92)], [clock, 360], [wl, 340], [logo, 120], [brand, 360]];
        row.forEach(([s, w]) => { if (s) { put(s, x, yb, w, hh); x += w + 10; } });
        stack.forEach((s) => { if (x + 300 < 1880) { put(s, x, yb, 300, hh); x += 310; } else s.visible = false; });
      }
    }
    return items;
  }
  G.templates.forEach((t) => {
    if (t.category === 'soon') return;
    const b = t.build;
    t.build = () => {
      const out = b();
      const por = t.orientation === 'portrait';
      return por ? normPortrait(t, out) : normLandscape(t, out);
    };
  });
  // template Sebentar Lagi dengan latar bergerak dipaparkan dahulu
  const fancyIds = new Set([...soonNew, ...soonNewL].map((t) => t.id));
  const fancy = G.templates.filter((t) => fancyIds.has(t.id));
  G.templates.splice(0, G.templates.length, ...G.templates.filter((t) => !fancyIds.has(t.id)));
  G.templates.unshift(...fancy);
  // fon berbeza untuk setiap template: Gaming, Formal dan Sebentar Lagi (countdown)
  const FONT_SETS = { gaming: ['rajdhani', 'orbitron', 'teko', 'russo', 'chakra', 'audiowide'], formal: ['montserrat', 'poppins', 'playfair', 'oswald', 'lora', 'raleway'], soon: ['bebas', 'anton', 'righteous', 'blackops', 'staatliches', 'bungee', 'orbitron', 'audiowide'] };
  const counters = { gaming: 0, formal: 0, soon: 0 };
  G.templates.forEach((t) => {
    const cat = t.category || 'gaming', set = FONT_SETS[cat] || FONT_SETS.gaming, font = set[(counters[cat]++) % set.length];
    const b = t.build;
    t.build = () => { const out = b(); out.forEach((s) => { if (s.type === 'widget' && s.props && !s.props.font && !['bgfx', 'logo', 'bot', 'frame'].includes(s.props.widget)) s.props.font = font; }); return out; };
  });
})();
