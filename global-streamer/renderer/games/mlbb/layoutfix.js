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
      clones.push(Object.assign({}, t, { id: t.id.replace('navy', theme.replace('flat-', '')), theme, fxStyle: theme, name: 'Sebentar Lagi · ' + label, desc: 'Formal 2D latar ' + label.replace('2D ', '').toLowerCase() + ': kira detik, logo dan bar teks.' }));
    });
  });
  G.templates.push(...clones);

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
    const other = items.filter((s) => s.type === 'widget' && s !== boss && s !== tl && s !== meta && s !== sb && !isW(s, 'logo') && !isW(s, 'spelltimer') && !isW(s, 'frame') && !isW(s, 'bot') && s.visible !== false && s.y < 1464 && s.y + s.h > 856);
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
      else if (s.type === 'widget' && s.y < top && !isW(s, 'statusbar')) s.y += top - s.y;
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
})();
