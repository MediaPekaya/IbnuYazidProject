/* Global Streamer - TIER LIST hero MLBB (S / A / B / C / D).
 * Reka bentuk mengikut rujukan: tajuk "TIER LIST" + baris "MLBB META · PATCH x · Season n · MYTHIC WIN RATE · tarikh" + nama pengguna di kanan,
 * baris tier berwarna (S kuning, A ungu, B biru, C hijau, D merah), potret hero bulat berkelim warna tier dengan nama, dan lencana naik/turun/baharu.
 *
 * Data: kedudukan lalai S dan A diambil daripada senarai meta Mythic terkini (patch 2.2.16a, Season 42). Hero lain dibahagikan ke B/C/D mengikut
 * statistik meta dalam app (kadar menang + kehadiran). Semua boleh disunting (klik hero untuk tukar tier) dan dikira semula daripada data meta.
 * Pangkat (Mythic / Mythic Honor / Mythic Glory / Mythic Immortal) dan patch/season ditulis oleh pengguna: app TIDAK dapat membaca pangkat akaun
 * daripada skrin, jadi tajuk mengikut pilihan pengguna. */
(function () {
  'use strict';
  const { h } = GS;
  const W = GS.widgets;
  const T = (GS.tier = {});

  T.TIERS = ['S', 'A', 'B', 'C', 'D'];
  T.COLORS = { S: '#f7d23a', A: '#c78bf2', B: '#5cc4ff', C: '#5fe08a', D: '#ff6b6b' };
  T.RANKS = ['Mythic', 'Mythic Honor', 'Mythic Glory', 'Mythic Immortal'];

  // S dan A daripada senarai meta terkini (rujukan). Nama dipadankan dengan senarai hero app.
  const SEED_S = 'Masha,Marcel,Rafaela,Gloo,Valir,Aulus,Sun,Minotaur,Carmilla,Obsidia,Alice,Nolan,Belerick,Barats,Atlas,Lukas,Guinevere,Kalea,Eudora,Kaja,Hirara'.split(',');
  const SEED_A = ('Alpha,Arlott,Badang,Esmeralda,Freya,Paquito,Leomord,Sora,Terizla,Thamuz,Uranus,Brody,Claude,Miya,Moskov,Karrie,Yi Sun-shin,Clint,Bruno,Lylia,Kimmy,Luo Yi,Cecilion,Pharsa,Selena,Zhuxin,Zetian,Yve,Odette,Kagura,Baxia,Fanny,Fredrinn,Ling,Suyou,Hanzo,Aamon,Minsitthar,Valentina,Estes,Hylos,Floryn,Mathilda,Chou,Diggie,Khufra,Angela').split(',');
  const SEED_BADGE = { Masha: 'new', Marcel: 'new', Rafaela: 'down', Aulus: 'down', Sun: 'up', Lukas: 'up', Kalea: 'up', Eudora: 'down', Kaja: 'up', Hirara: 'down', Alpha: 'up', Paquito: 'down', Miya: 'down', Bruno: 'new', Odette: 'new', Kagura: 'up', Hylos: 'new', 'Yi Sun-shin': 'down' };

  const allHeroes = () => (GS.data && GS.data.mlbbHeroes ? GS.data.mlbbHeroes.map((x) => x.name) : []);
  const canon = (n) => (GS.meta && GS.meta.canon ? GS.meta.canon(n) : '') || '';

  /** Tier lalai: S/A daripada rujukan; selebihnya mengikut skor meta (kadar menang + kehadiran) ke B / C / D. */
  T.build = function (keepFixed) {
    const names = allHeroes();
    const set = new Set(names);
    const tiers = { S: [], A: [], B: [], C: [], D: [] };
    const taken = new Set();
    const put = (list, key) => list.forEach((raw) => { const n = canon(raw) || raw; if (set.has(n) && !taken.has(n)) { tiers[key].push(n); taken.add(n); } });
    if (keepFixed !== false) { put(SEED_S, 'S'); put(SEED_A, 'A'); }
    const score = (n) => { const m = GS.meta && GS.meta.hero ? GS.meta.hero(n) : null; return m ? m.wrS * 100 + m.presence * 40 + Math.min(m.p, 40) * 0.1 : -1; };
    const rest = names.filter((n) => !taken.has(n)).sort((a, b) => score(b) - score(a));
    const nB = Math.ceil(rest.length * 0.42), nC = Math.ceil(rest.length * 0.33);
    rest.forEach((n, i) => { tiers[i < nB ? 'B' : i < nB + nC ? 'C' : 'D'].push(n); });
    if (keepFixed === false) {
      // kira semula penuh daripada meta: 15% S, 30% A
      const sorted = names.slice().sort((a, b) => score(b) - score(a));
      const nS = Math.round(sorted.length * 0.15), nA = Math.round(sorted.length * 0.3), nB2 = Math.round(sorted.length * 0.3), nC2 = Math.round(sorted.length * 0.17);
      Object.keys(tiers).forEach((k) => { tiers[k] = []; });
      sorted.forEach((n, i) => { tiers[i < nS ? 'S' : i < nS + nA ? 'A' : i < nS + nA + nB2 ? 'B' : i < nS + nA + nB2 + nC2 ? 'C' : 'D'].push(n); });
    }
    return tiers;
  };
  T.defaults = () => ({ patch: '2.2.16a', season: '42', rank: 'Mythic', date: '2026-11-08', owner: 'ANDA', tiers: T.build(true), badges: Object.assign({}, SEED_BADGE) });
  T.cfg = function () {
    const st = GS.state;
    if (!st.tierlist || !st.tierlist.tiers) st.tierlist = T.defaults();
    return st.tierlist;
  };
  T.tierOf = (c, name) => T.TIERS.find((k) => c.tiers[k].includes(name)) || '';
  T.move = function (name, to) {
    const c = T.cfg();
    T.TIERS.forEach((k) => { c.tiers[k] = c.tiers[k].filter((n) => n !== name); });
    if (to) c.tiers[to].push(name);
    GS.save();
  };

  /* ---------- lukisan ---------- */
  function badge(ctx, kind, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    if (kind === 'up') { ctx.fillStyle = '#23b45a'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r, r * 0.8); ctx.lineTo(-r, r * 0.8); ctx.closePath(); ctx.fill(); }
    else if (kind === 'down') { ctx.fillStyle = '#3d8bff'; ctx.beginPath(); ctx.moveTo(0, r); ctx.lineTo(r, -r * 0.8); ctx.lineTo(-r, -r * 0.8); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = '#ffc928'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function avatar(ctx, name, cx, cy, r, color) {
    const img = GS.heroImg && GS.heroImg(name);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#16213f'; ctx.fill();
    if (img) { ctx.save(); ctx.clip(); ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2); ctx.restore(); }
    else W.text(ctx, name.slice(0, 2).toUpperCase(), cx, cy + r * 0.28, { size: r * 0.8, weight: 800, align: 'center', color: '#8aa2c4' });
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.lineWidth = Math.max(2, r * 0.1); ctx.strokeStyle = color; ctx.stroke();
    ctx.restore();
  }
  W.tierlist = function (ctx, s) {
    const c = T.cfg(), { x, y, w, h } = s;
    const R = Math.min(22, h * 0.02);
    // bingkai dan latar
    ctx.save();
    W.rr(ctx, x, y, w, h, R); ctx.fillStyle = 'rgba(8,14,34,0.93)'; ctx.fill();
    ctx.lineWidth = Math.max(3, w * 0.004); ctx.strokeStyle = '#f2c53d'; ctx.stroke();
    ctx.restore();
    // kepala
    const hh = Math.max(64, h * 0.095);
    ctx.save();
    W.rr(ctx, x + 2, y + 2, w - 4, hh, R); ctx.clip();
    const g = ctx.createLinearGradient(x, y, x + w, y); g.addColorStop(0, '#1b3c8f'); g.addColorStop(1, '#2a58c4');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, hh + 4);
    ctx.restore();
    ctx.fillStyle = '#f2c53d'; ctx.fillRect(x + 4, y + hh, w - 8, Math.max(3, w * 0.003));
    const ts = Math.min(hh * 0.6, w * 0.075);
    ctx.save(); ctx.font = 'italic 900 ' + ts + 'px ' + W.FONT; ctx.textBaseline = 'alphabetic';
    const tw1 = ctx.measureText('TIER ').width;
    ctx.fillStyle = '#ffffff'; ctx.fillText('TIER ', x + w * 0.03, y + hh * 0.72);
    ctx.fillStyle = '#ffd21f'; ctx.fillText('LIST', x + w * 0.03 + tw1, y + hh * 0.72);
    const tw2 = ctx.measureText('LIST').width;
    ctx.restore();
    const sx = x + w * 0.03 + tw1 + tw2 + w * 0.022, ss = Math.max(11, hh * 0.19);
    W.text(ctx, 'MLBB META · PATCH ' + (c.patch || ''), sx, y + hh * 0.42, { size: ss, weight: 800, color: '#ffffff', spacing: 2, maxW: w * 0.36 });
    W.text(ctx, 'Season ' + (c.season || '') + ' · ' + String(c.rank || 'Mythic').toUpperCase() + ' WIN RATE · ' + (c.date || ''), sx, y + hh * 0.75, { size: ss, weight: 700, color: '#dfe8ff', spacing: 1.5, maxW: w * 0.36 });
    ctx.save(); ctx.font = 'italic 900 ' + hh * 0.42 + 'px ' + W.FONT; ctx.textAlign = 'right'; ctx.fillStyle = '#ffffff';
    let owner = String(c.owner || '').toUpperCase(); while (owner.length > 1 && ctx.measureText(owner).width > w * 0.21) owner = owner.slice(0, -1);
    ctx.fillText(owner, x + w - w * 0.03, y + hh * 0.7); ctx.restore();

    // kedudukan baris: cari saiz sel terbesar yang memuatkan semua hero
    const tiers = T.TIERS.filter((k) => c.tiers[k].length), padX = w * 0.022, labW = Math.min(w * 0.085, 90), gapT = h * 0.012;
    const top = y + hh + h * 0.022, availH = h - hh - h * 0.04, availW = w - padX * 2 - labW - 10;
    let cell = 0, cols = 1;
    for (let cs = Math.min(110, availW / 5); cs >= 24; cs -= 1) {
      const cc = Math.max(1, Math.floor(availW / cs));
      const rows = tiers.reduce((n, k) => n + Math.max(1, Math.ceil(c.tiers[k].length / cc)), 0);
      if (rows * cs * 1.16 + gapT * (tiers.length - 1) <= availH) { cell = cs; cols = cc; break; }
    }
    if (!cell) { cell = 24; cols = Math.max(1, Math.floor(availW / 24)); }
    const rowH = cell * 1.16, ar = cell * 0.4;
    let cy = top;
    tiers.forEach((k) => {
      const list = c.tiers[k], rows = Math.max(1, Math.ceil(list.length / cols)), bh = rows * rowH;
      // label tier
      ctx.save(); W.rr(ctx, x + padX, cy, labW, bh - 4, labW * 0.14); ctx.fillStyle = T.COLORS[k]; ctx.fill(); ctx.restore();
      ctx.save(); ctx.font = 'italic 900 ' + Math.min(labW * 0.8, bh * 0.7) + 'px ' + W.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#10131c';
      ctx.fillText(k, x + padX + labW / 2, cy + (bh - 4) / 2); ctx.restore();
      list.forEach((name, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const hx = x + padX + labW + 10 + col * cell + cell / 2, hy = cy + row * rowH + cell * 0.5 + 1;
        avatar(ctx, name, hx, hy, ar, T.COLORS[k]);
        const b = c.badges && c.badges[name];
        if (b) badge(ctx, b, hx + ar * 0.8, hy - ar * 0.8, Math.max(4, cell * 0.1));
        if (cell >= 40) W.text(ctx, name.toUpperCase(), hx, cy + row * rowH + cell * 1.12, { size: Math.max(7, cell * 0.17), weight: 800, align: 'center', color: '#ffffff', maxW: cell * 0.98 });
      });
      cy += bh + gapT;
    });
  };

  /* ---------- editor ---------- */
  T.openEditor = function (src) {
    const c = T.cfg();
    const box = h('div', { class: 'tier-editor' });
    const paint = () => {
      box.innerHTML = '';
      T.TIERS.forEach((k) => {
        const row = h('div', { class: 'tier-row' }, h('b', { class: 'tier-lab', style: { background: T.COLORS[k] } }, k),
          h('div', { class: 'tier-chips' }, c.tiers[k].map((n) => h('button', { type: 'button', class: 'tier-chip', title: GS.t('Klik: pindah ke tier seterusnya. Shift + klik: tier sebelumnya.'), onClick: (e) => { const i = T.TIERS.indexOf(k); const to = T.TIERS[(i + (e.shiftKey ? -1 : 1) + 5) % 5]; T.move(n, to); paint(); } }, n))));
        box.append(row);
      });
    };
    paint();
    const reset = h('button', { type: 'button', class: 'btn ghost', onClick: () => { c.tiers = T.build(true); GS.save(); paint(); } }, GS.t('Pulihkan lalai'));
    const auto = h('button', { type: 'button', class: 'btn', onClick: () => { c.tiers = T.build(false); GS.save(); paint(); GS.toast(GS.t('Tier dikira semula daripada data meta.'), 'ok'); } }, GS.t('Kira semula daripada meta'));
    const m = GS.modal({ title: 'Sunting Tier List', wide: true, body: h('div', null, h('p', { class: 'muted note' }, GS.t('Klik nama hero untuk memindahkannya ke tier seterusnya (S, A, B, C, D). Shift + klik untuk tier sebelumnya.')), box),
      footer: h('div', { class: 'btn-row' }, reset, auto, h('button', { type: 'button', class: 'btn primary', onClick: () => m.close() }, GS.t('Siap'))) });
  };
  T.props = function (root, s, field, renderProps) {
    const c = T.cfg();
    const inp = (k, label, ph) => field(label, h('input', { type: 'text', value: c[k] || '', placeholder: ph || '', onInput: (e) => { c[k] = e.target.value; GS.save(); } }));
    root.append(h('div', { class: 'grid2' }, inp('patch', 'Patch', '2.2.16a'), inp('season', 'Season', '42')));
    root.append(field('Pangkat', h('select', { onChange: (e) => { c.rank = e.target.value; GS.save(); } }, T.RANKS.map((r) => h('option', { value: r, selected: c.rank === r }, r)))));
    root.append(h('div', { class: 'grid2' }, inp('date', 'Tarikh data', '2026-11-08'), inp('owner', 'Nama pengguna (hujung kanan)', 'Nama anda')));
    root.append(h('div', { class: 'btn-row' }, h('button', { class: 'btn primary', id: 'btnTierEdit', onClick: () => T.openEditor(s) }, 'Sunting tier hero')));
    root.append(h('p', { class: 'muted note' }, 'Kedudukan lalai berdasarkan meta Mythic terkini. Tukar patch, season, pangkat dan tarikh mengikut data yang anda guna.'));
  };
})();
