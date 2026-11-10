/* Global Streamer - panel game (data sebenar): Hero (peranan + lane), Meta tournament, Draft dengan cadangan pick/ban, Item, Emblem.
 * Data hero/item/emblem: data/mlbb-data.js (Mobile Legends Wiki). Meta: GS.meta (Liquipedia). Semua teks hero hanya paparan peribadi,
 * kecuali widget draft / meta board yang dipilih streamer sendiri. */
(function () {
  'use strict';
  const { h, icon } = GS;
  const D = GS.gamedock;
  const roleColor = { Tank: '#2ea8ff', Fighter: '#ff8a3b', Assassin: '#ff3b5c', Mage: '#9a7bff', Marksman: '#ffd36b', Support: '#3be39a' };
  const LANE = { gold: 'Gold', mid: 'Mid', exp: 'EXP', jungle: 'Jungle', roam: 'Roam' };
  const pct = (x) => (x * 100).toFixed(1).replace(/\.0$/, '') + '%';
  const sec = (title, ...kids) => h('div', { class: 'gd-sec' }, h('h4', null, title), ...kids);
  const field = (label, input) => h('label', { class: 'field' }, h('span', null, label), input);
  const chipRow = (opts, cur, onPick) => {
    const row = h('div', { class: 'subtabs wrap' });
    opts.forEach(([v, label]) => row.append(h('button', { class: 'subtab' + (v === cur ? ' on' : ''), dataset: { v }, onClick: (e) => { GS.$$('.subtab', row).forEach((b) => b.classList.toggle('on', b === e.currentTarget)); onPick(v); } }, label)));
    return row;
  };
  const laneOpts = () => [['', 'Semua lane']].concat(GS.data.mlbbLanes.map((l) => [l.id, LANE[l.id]]));
  const roleOpts = () => [['', 'Semua peranan']].concat(GS.data.mlbbRoles.map((r) => [r, r]));

  /* panggilan semula apabila data meta dikemas kini (hanya untuk halaman aktif) */
  let metaCb = null;
  GS.on('meta:updated', () => { if (metaCb) metaCb(); });
  const leave = () => { metaCb = null; };
  D.beforeShow = leave;

  const credit = () => h('p', { class: 'muted note' }, 'Sumber: Liquipedia Mobile Legends (CC-BY-SA 3.0), dikemas kini oleh pengumpul pusat. Hero, item dan emblem: Mobile Legends Wiki (CC-BY-SA 3.0).');

  /* ============ Hero ============ */
  function heroes(root) {
    const all = GS.data.mlbbHeroes;
    let q = '', role = '', lane = '', sel = null;
    const list = h('div', { class: 'hero-grid' });
    const count = h('span', { class: 'muted' });
    const detail = h('div', { class: 'gd-sec hero-detail' });
    const showDetail = (x) => {
      sel = x;
      detail.innerHTML = '';
      if (!x) { detail.style.display = 'none'; return; }
      detail.style.display = '';
      const m = GS.meta.hero(x.name);
      const price = [x.price.bp ? x.price.bp.toLocaleString() + ' BP' : '', x.price.dm ? x.price.dm + ' DM' : '', x.price.tk ? x.price.tk + ' Tiket' : ''].filter(Boolean).join(' · ');
      const kv = (k, v) => h('div', { class: 'kv' }, h('span', null, k), h('b', null, v || '-'));
      detail.append(
        h('h4', null, x.name, ' ', h('span', { class: 'muted' }, x.title)),
        h('div', { class: 'hero-tags' },
          x.roles.map((r) => h('span', { class: 'tag', style: { '--rc': roleColor[r] } }, r)),
          x.lanes.map((l) => h('span', { class: 'tag lane' }, LANE[l]))),
        kv('Spesialiti', x.specialties.join(' / ')), kv('Asal', x.region), kv('Harga', price), kv('Keluaran', x.released || '#' + x.order));
      if (m) {
        const a = GS.meta.aggregate();
        detail.append(h('h4', null, 'Meta tournament'),
          kv('Pick', m.p + ' (' + pct(m.pickRate) + ')'), kv('Kadar menang', pct(m.wr) + ' (' + m.w + 'M ' + m.l + 'K)'),
          kv('Ban', m.b + ' (' + pct(m.banRate) + ')'), kv('Kehadiran (P&B)', pct(m.presence)),
          kv('Sisi biru / merah', (m.bn ? pct(m.blueWr) : '-') + ' / ' + (m.rn ? pct(m.redWr) : '-')));
        const top = (map, label) => {
          const r = Object.entries(map).filter(([, o]) => o.n >= 3).map(([n, o]) => [n, o.n, o.w / o.n]).sort((p, q2) => q2[1] - p[1]).slice(0, 4);
          if (r.length) detail.append(kv(label, r.map(([n, c, w]) => n + ' ' + Math.round(w * 100) + '% (' + c + ')').join(', ')));
        };
        top(m.with, 'Padanan terbaik (sering)'); top(m.vs, 'Selalu berdepan');
        void a;
      } else detail.append(h('p', { class: 'muted note' }, 'Belum ada data tournament bagi hero ini dalam skop semasa.'));
    };
    const draw = () => {
      list.innerHTML = '';
      const rows = all.filter((x) => (!role || x.roles.includes(role)) && (!lane || x.lanes.includes(lane)) && x.name.toLowerCase().includes(q));
      rows.forEach((x) => list.append(h('button', { class: 'hero' + (sel && sel.name === x.name ? ' on' : ''), style: { '--rc': roleColor[x.role] }, title: x.roles.join(' / ') + ' · ' + x.lanes.map((l) => LANE[l]).join(' / '), onClick: () => { showDetail(x); draw(); } }, h('i'), h('span', null, x.name))));
      if (!rows.length) list.append(h('div', { class: 'empty' }, 'Tiada hero dijumpai.'));
      count.textContent = rows.length + ' / ' + all.length + ' hero';
    };
    root.append(
      h('div', { class: 'callout slim' }, h('span', { html: icon('shield', 14) }), ' Panel peribadi. Senarai ini TIDAK masuk dalam siaran penonton.'),
      h('div', { class: 'search' }, h('span', { html: icon('search', 16) }), h('input', { type: 'search', placeholder: 'Cari hero…', 'aria-label': 'Cari hero', onInput: (e) => { q = e.target.value.trim().toLowerCase(); draw(); } })),
      chipRow(roleOpts(), role, (v) => { role = v; draw(); }),
      chipRow(laneOpts(), lane, (v) => { lane = v; draw(); }),
      count, list, detail,
      h('p', { class: 'muted note' }, GS.t('{0} hero, {1} item, {2} set emblem daripada Mobile Legends Wiki (CC-BY-SA 3.0).', all.length, GS.data.mlbbItems.length, GS.data.mlbbEmblems.length)));
    showDetail(null);
    draw();
    metaCb = () => { if (sel) showDetail(sel); };
  }

  /* ============ Meta ============ */
  function leaderboard(title, rows, valf, maxv) {
    const box = h('div', { class: 'gd-sec' }, h('h4', null, title));
    if (!rows.length) { box.append(h('div', { class: 'placeholder' }, 'Belum ada data')); return box; }
    rows.forEach((x, i) => {
      const v = valf(x);
      box.append(h('div', { class: 'lb-row' },
        h('span', { class: 'lb-rank' }, String(i + 1)),
        h('span', { class: 'lb-name' }, x.name),
        h('span', { class: 'lb-bar' }, h('i', { style: { width: Math.max(4, Math.round((v.bar / maxv) * 100)) + '%', '--rc': roleColor[(x.roles || [])[0]] || '#2ea8ff' } })),
        h('b', { class: 'lb-val' }, v.text)));
    });
    return box;
  }
  function meta(root) {
    const body = h('div', { class: 'meta-body' });
    const status = h('div', { class: 'callout slim' });
    let lane = '';
    const scopeSel = h('select', { onChange: (e) => { GS.meta.setScope(e.target.value); } },
      GS.meta.presets().map((p) => h('option', { value: p.id, selected: p.id === GS.meta.scope }, p.label)));
    const draw = () => {
      const a = GS.meta.aggregate();
      const M = GS.meta;
      status.innerHTML = '';
      status.append(h('span', { html: icon('trophy', 14) }), ' ' + GS.t('{0} game · {1} tournament · dikemas kini {2}', a.games, a.tournaments.length, M.ageText()) + (M.source === 'bundle' ? ' · ' + GS.t('data dalam app') : ' · ' + GS.t('data dalam talian')));
      body.innerHTML = '';
      const opt = { lane: lane || undefined, n: 8 };
      body.append(
        leaderboard('Top Pick', M.top('pick', opt), (x) => ({ bar: x.p, text: x.p + ' · ' + pct(x.pickRate) }), Math.max(1, ...M.top('pick', opt).map((x) => x.p))),
        leaderboard('Top Ban', M.top('ban', opt), (x) => ({ bar: x.b, text: x.b + ' · ' + pct(x.banRate) }), Math.max(1, ...M.top('ban', opt).map((x) => x.b))),
        leaderboard('Kadar Menang Tertinggi (min. 8 pick)', M.top('wr', opt), (x) => ({ bar: x.wr - 0.3, text: pct(x.wr) + ' · ' + x.p }), 0.5),
        leaderboard('Pick + Ban (kehadiran)', M.top('pb', opt), (x) => ({ bar: x.presence, text: pct(x.presence) }), 1));
      body.append(h('div', { class: 'gd-sec' }, h('h4', null, 'Tournament dalam skop'),
        a.tournaments.map((t) => h('div', { class: 'kv' }, h('span', null, t.label + (t.live ? ' · LIVE' : '')), h('b', null, t.games + ' game')))));
    };
    root.append(status,
      field('Skop tournament', scopeSel),
      chipRow(laneOpts(), lane, (v) => { lane = v; draw(); }),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn ghost', onClick: async (e) => { e.currentTarget.disabled = true; const ok = await GS.meta.refresh(); e.currentTarget.disabled = false; GS.toast(ok ? GS.t('Data meta disemak: {0}', GS.meta.ageText()) : GS.t('Tidak dapat menyemak data dalam talian. Guna data dalam app.'), ok ? 'ok' : 'warn'); } }, 'Semak kemas kini sekarang'),
        h('button', { class: 'btn primary', onClick: () => GS.scenes.addWidget('metaboard') }, 'Papar Top Pick / Ban pada siaran')),
      body,
      h('p', { class: 'muted note' }, 'Data tournament hanya berubah selepas game selesai. App menyemak fail data setiap 5 minit; fail itu dikemas kini oleh pengumpul pusat, bukan terus daripada app anda.'),
      credit());
    draw();
    metaCb = () => { scopeSel.value = GS.meta.scope; draw(); };
  }

  /* ============ Item ============ */
  function itemsPage(root) {
    let cat = '', q = '', sel = null;
    const list = h('div', { class: 'hero-grid' });
    const detail = h('div', { class: 'gd-sec hero-detail' });
    const kv = (k, v) => h('div', { class: 'kv' }, h('span', null, k), h('b', null, v || '-'));
    const draw = () => {
      list.innerHTML = '';
      GS.data.mlbbItems.filter((i) => (!cat || i.cat === cat) && i.name.toLowerCase().includes(q)).forEach((i) =>
        list.append(h('button', { class: 'hero' + (sel === i ? ' on' : ''), style: { '--rc': { attack: '#ff8a3b', magic: '#9a7bff', defense: '#2ea8ff', movement: '#3be39a', potion: '#ff3b5c' }[i.cat] }, onClick: () => { sel = i; draw(); show(); } }, h('i'), h('span', null, i.name))));
    };
    const show = () => {
      detail.innerHTML = '';
      detail.style.display = sel ? '' : 'none';
      if (!sel) return;
      detail.append(h('h4', null, sel.name),
        kv('Kategori', GS.data.mlbbItemCats[sel.cat]), kv('Harga', sel.price ? sel.price.toLocaleString() + ' emas' : ''), kv('Naik taraf', sel.upgrade ? String(sel.upgrade) : ''),
        kv('Stat', sel.bonus), (sel.passives || []).map((p) => kv((p.kind === 'active' ? 'Aktif · ' : 'Pasif · ') + p.name, p.text)),
        sel.recipe && sel.recipe.length ? kv('Resipi', sel.recipe.join(', ')) : null);
    };
    root.append(
      h('div', { class: 'search' }, h('span', { html: icon('search', 16) }), h('input', { type: 'search', placeholder: 'Cari item…', 'aria-label': 'Cari item', onInput: (e) => { q = e.target.value.trim().toLowerCase(); draw(); } })),
      chipRow([['', 'Semua']].concat(Object.entries(GS.data.mlbbItemCats)), cat, (v) => { cat = v; draw(); }),
      list, detail,
      h('p', { class: 'muted note' }, 'Sumber: Mobile Legends Wiki (CC-BY-SA 3.0). Harga dan stat mengikut halaman wiki pada masa data dikumpul.'));
    draw(); show();
  }

  /* ============ Emblem ============ */
  function emblemsPage(root) {
    GS.data.mlbbEmblems.forEach((e) => {
      root.append(sec(e.name,
        h('div', { class: 'kv' }, h('span', null, 'Atribut'), h('b', null, e.attributes.map((a) => a.stat + ' ' + a.value).join(' · '))),
        e.standard.map((tier, i) => h('div', { class: 'kv col' }, h('span', null, GS.t('Talent biasa {0}', i + 1)), tier.map((t) => h('b', { class: 'talent' }, t.name + ': ' + t.text)))),
        e.core.length ? h('div', { class: 'kv col' }, h('span', null, 'Talent teras'), e.core.map((t) => h('b', { class: 'talent' }, t.name + ': ' + t.text))) : null));
    });
    root.append(h('p', { class: 'muted note' }, 'Sumber: Mobile Legends Wiki (CC-BY-SA 3.0). Senarai talent mengikut halaman wiki Emblems.'));
  }

  /* ============ Draft ============ */
  const draftCtx = () => {
    const d = GS.state.draft, M = GS.meta;
    return { ally: d.ally.map((n) => M.canon(n)).filter(Boolean), enemy: d.enemy.map((n) => M.canon(n)).filter(Boolean), bans: M.parseList(d.banAlly).concat(M.parseList(d.banEnemy)), lane: d.lane || '' };
  };
  GS.draftSuggest = function (n) {
    const c = draftCtx();
    c.n = n || 3;
    return { pick: GS.meta.suggestPick(c), ban: GS.meta.suggestBan(c) };
  };

  function draft(root) {
    const d = GS.state.draft, M = GS.meta;
    const inputs = {};
    const targets = [].concat([0, 1, 2, 3, 4].map((i) => ['a' + i, 'Ally ' + (i + 1)]), [0, 1, 2, 3, 4].map((i) => ['e' + i, 'Enemy ' + (i + 1)]), [['ba', 'Ban ally'], ['be', 'Ban enemy']]);
    let target = 'a0';
    const targetSel = h('select', { onChange: (e) => { target = e.target.value; } }, targets.map(([v, l]) => h('option', { value: v }, l)));
    const setVal = (key, val) => {
      if (key[0] === 'a') d.ally[+key[1]] = val;
      else if (key[0] === 'e') d.enemy[+key[1]] = val;
      else { const f = key === 'ba' ? 'banAlly' : 'banEnemy'; const cur = M.parseList(d[f]); const i = cur.indexOf(val); if (i >= 0) cur.splice(i, 1); else cur.push(val); d[f] = cur.join(', '); }
      GS.save(); sync(); drawSuggest();
    };
    const sync = () => {
      d.ally.forEach((v, i) => { inputs['a' + i].value = v || ''; });
      d.enemy.forEach((v, i) => { inputs['e' + i].value = v || ''; });
      inputs.ba.value = d.banAlly || ''; inputs.be.value = d.banEnemy || '';
    };
    const advance = () => {
      const side = target[0];
      if (side === 'b') return;
      const arr = side === 'a' ? d.ally : d.enemy;
      const next = [0, 1, 2, 3, 4].find((i) => !arr[i]);
      if (next != null) { target = side + next; targetSel.value = target; }
    };
    const pick = (name) => { setVal(target, name); advance(); };
    const slot = (key, arr, i, ph) => (inputs[key] = h('input', { type: 'text', list: 'heroList', value: arr[i] || '', placeholder: ph, onFocus: () => { target = key; targetSel.value = key; }, onChange: (e) => { const c = M.canon(e.target.value); arr[i] = c || e.target.value.trim(); if (c) e.target.value = c; GS.save(); drawSuggest(); } }));
    const banIn = (key, f, ph) => (inputs[key] = h('input', { type: 'text', value: d[f] || '', placeholder: ph, onFocus: () => { target = key; targetSel.value = key; }, onChange: (e) => { d[f] = M.parseList(e.target.value).join(', ') || e.target.value; GS.save(); drawSuggest(); } }));

    /* pemilih hero */
    let q = '', role = '', lane = '';
    const grid = h('div', { class: 'hero-grid picker' });
    const drawGrid = () => {
      grid.innerHTML = '';
      const c = draftCtx();
      const used = new Set([].concat(c.ally, c.enemy, c.bans));
      GS.data.mlbbHeroes.filter((x) => (!role || x.roles.includes(role)) && (!lane || x.lanes.includes(lane)) && x.name.toLowerCase().includes(q))
        .forEach((x) => grid.append(h('button', { class: 'hero' + (used.has(x.name) ? ' used' : ''), style: { '--rc': roleColor[x.role] }, title: x.roles.join(' / ') + ' · ' + x.lanes.map((l) => LANE[l]).join(' / '), onClick: () => pick(x.name) }, h('i'), h('span', null, x.name))));
    };

    /* cadangan */
    const sugBox = h('div', { class: 'sug' });
    const winVal = h('b', null, d.winPct + '%');
    const drawSuggest = () => {
      sugBox.innerHTML = '';
      drawGrid();
      if (!M.aggregate().games) { sugBox.append(h('div', { class: 'placeholder' }, 'Belum ada data tournament.')); return; }
      const c = draftCtx();
      c.n = 5;
      const open = M.openLanes(c.ally);
      sugBox.append(h('div', { class: 'muted note' }, c.ally.length ? GS.t('Lane ally kosong: {0}', open.map((l) => LANE[l]).join(', ') || '-') : GS.t('Pilih hero ally untuk melihat lane kosong.')));
      const block = (title, rows, act, label) => h('div', { class: 'gd-sec' }, h('h4', null, title),
        rows.map((r) => h('div', { class: 'sug-row' }, h('div', null, h('b', null, r.name), h('span', { class: 'muted' }, ' ' + r.score), h('div', { class: 'muted small' }, r.why.slice(0, 4).join(' · '))),
          h('button', { class: 'btn tiny', onClick: () => act(r.name) }, label))));
      sugBox.append(
        block('Cadangan PICK (ally)', M.suggestPick(c), (n) => { const i = d.ally.findIndex((x) => !x); if (i >= 0) { d.ally[i] = n; GS.save(); sync(); drawSuggest(); } }, 'Pick'),
        block('Cadangan BAN', M.suggestBan(c), (n) => { setVal('ba', n); }, 'Ban'));
    };

    const phaseSel = h('select', { onChange: (e) => { d.phase = e.target.value; GS.save(); } },
      ['BAN PHASE', 'ALLY PICK', 'ENEMY PICK', 'DRAFT PICK', 'TEAM COMPLETE'].map((p) => h('option', { value: p, selected: d.phase === p }, p)));
    const lanePick = h('select', { onChange: (e) => { d.lane = e.target.value; GS.save(); drawSuggest(); } },
      [['', 'Auto (lane kosong)']].concat(GS.data.mlbbLanes.map((l) => [l.id, LANE[l.id]])).map(([v, l]) => h('option', { value: v, selected: (d.lane || '') === v }, l)));
    const sliderEl = h('input', { type: 'range', min: 0, max: 100, value: d.winPct, onInput: (e) => { d.winPct = Number(e.target.value); winVal.textContent = d.winPct + '%'; GS.save(); } });

    root.append(
      h('datalist', { id: 'heroList' }, GS.data.mlbbHeroes.map((x) => h('option', { value: x.name }))),
      sec('Draft pick / ban',
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!d.show, onChange: (e) => { d.show = e.target.checked; GS.save(); } }), 'Papar draft pada siaran'),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: d.suggest !== false, onChange: (e) => { d.suggest = e.target.checked; GS.save(); } }), 'Papar cadangan pick / ban pada siaran'),
        field('Fasa', phaseSel),
        h('div', { class: 'grid2' }, [0, 1, 2, 3, 4].map((i) => field('Ally ' + (i + 1), slot('a' + i, d.ally, i, 'Hero')))),
        h('div', { class: 'grid2' }, [0, 1, 2, 3, 4].map((i) => field('Enemy ' + (i + 1), slot('e' + i, d.enemy, i, 'Hero')))),
        h('div', { class: 'grid2' }, field('Ban ally', banIn('ba', 'banAlly', 'cth Fanny, Ling')), field('Ban enemy', banIn('be', 'banEnemy', 'cth Chou, Lancelot'))),
        field('Lane saya', lanePick),
        field('Ramalan menang ally (%)', sliderEl), winVal,
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn ghost', onClick: () => { const p = M.predict(draftCtx().ally, draftCtx().enemy); if (p == null) { GS.toast(GS.t('Perlu sekurang-kurangnya 1 hero ally dan 1 hero enemy serta data meta.'), 'warn'); return; } d.winPct = p; sliderEl.value = p; winVal.textContent = p + '%'; GS.save(); } }, 'Kira ramalan daripada meta'),
          h('button', { class: 'btn ghost', onClick: () => { d.ally = ['', '', '', '', '']; d.enemy = ['', '', '', '', '']; d.banAlly = ''; d.banEnemy = ''; GS.save(); sync(); drawSuggest(); target = 'a0'; targetSel.value = 'a0'; } }, 'Kosongkan draft')),
        h('p', { class: 'muted note' }, 'Ramalan ialah anggaran statistik meta, bukan jaminan. Pengesanan hero automatik daripada capture card belum siap (Fasa 5): pilih hero di bawah.')),
      sec('Pemilih hero', field('Masukkan ke', targetSel),
        h('div', { class: 'search' }, h('span', { html: icon('search', 16) }), h('input', { type: 'search', placeholder: 'Cari hero…', 'aria-label': 'Cari hero', onInput: (e) => { q = e.target.value.trim().toLowerCase(); drawGrid(); } })),
        chipRow(roleOpts(), role, (v) => { role = v; drawGrid(); }), chipRow(laneOpts(), lane, (v) => { lane = v; drawGrid(); }), grid),
      sugBox,
      sec('Pemasa spell musuh', D.spells()),
      credit());
    drawSuggest();
    metaCb = drawSuggest;
  }

  /* gantikan tab lama, dan tambah tab data */
  D.extra = (D.extra || []).map((e) => (e[0] === 'draft' ? ['draft', 'Draft', draft] : e));
  D.override = { heroes, meta };
  D.tail = [['items', 'Item', itemsPage], ['emblems', 'Emblem', emblemsPage]];
})();
