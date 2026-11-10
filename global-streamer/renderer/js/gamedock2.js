/* Global Streamer - panel kawalan widget siaran: Siaran (status, boss, top like, giliran, promo), Draft (draft + pemasa spell), Tier List.
 * Semua data disimpan dalam GS.state dan dilukis oleh widgets2.js / effects.js. */
(function () {
  'use strict';
  const { h } = GS;
  const D = GS.gamedock;

  /* ---------- pembantu borang ---------- */
  const field = (label, input, cls) => h('label', { class: 'field' + (cls ? ' ' + cls : '') }, h('span', null, label), input);
  const num = (obj, key, opts = {}) => h('input', { type: 'number', min: opts.min != null ? opts.min : 0, max: opts.max, step: opts.step || 1, value: obj[key], onInput: (e) => { obj[key] = Number(e.target.value) || 0; GS.save(); if (opts.after) opts.after(); } });
  const text = (obj, key, ph) => h('input', { type: 'text', value: obj[key] || '', placeholder: ph || '', onInput: (e) => { obj[key] = e.target.value; GS.save(); } });
  const check = (obj, key, label, after) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!obj[key], onChange: (e) => { obj[key] = e.target.checked; GS.save(); if (after) after(); } }), label);
  const area = (label, get, set, rows, hint) => field(label, h('textarea', { rows: rows || 3, spellcheck: 'false', onInput: (e) => { set(e.target.value); GS.save(); } }, get()), '' );
  const sec = (title, ...kids) => h('div', { class: 'gd-sec' }, h('h4', null, title), ...kids);
  const lines = (v) => String(v).split('\n').map((l) => l.trim()).filter(Boolean);

  /* ================= Siaran ================= */
  function broadcast(root) {
    const st = GS.state, b = st.boss;
    const hpFields = h('div', { class: 'grid2' });
    const redrawBoss = () => {
      hpFields.innerHTML = '';
      hpFields.append(field('HP', num(b, 'hp')), field('HP maksimum', num(b, 'max')), field('Perisai', num(b, 'shield')), field('Perisai maksimum', num(b, 'shieldMax')));
    };
    redrawBoss();
    const hit = (n) => {
      b.hp = Math.max(0, b.hp - n);
      b.shield = Math.min(b.shieldMax, b.shield + n * 2);
      if (b.hp <= 0) {
        b.level += 1;
        b.max = Math.round(b.max * 1.15);
        b.hp = b.max;
        GS.fx.trigger('alert', { title: 'Boss tumbang', name: 'LEVEL ' + b.level, sound: true });
      }
      GS.save();
      redrawBoss();
    };
    root.append(
      sec('Bar status',
        field('Lagu sedang dimainkan', text(st.status, 'nowPlaying', 'cth Nama lagu - Artis')),
        h('div', { class: 'grid2' }, field('Label matlamat like', text(st.status, 'likeLabel')), field('Penonton', num(st.status, 'viewers'))),
        h('div', { class: 'grid2' }, field('Like semasa', num(st.status, 'likeCur')), field('Sasaran like', num(st.status, 'likeMax')))),
      sec('Boss game (like / gift)',
        check(b, 'enabled', 'Papar boss pada siaran'),
        h('div', { class: 'grid2' }, field('Nama boss', text(b, 'name')), field('Level', num(b, 'level', { min: 1 }))),
        field('Nama bar kedua', text(b, 'shieldName')),
        hpFields,
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', onClick: () => hit(1000) }, 'Serang −1K'),
          h('button', { class: 'btn', onClick: () => hit(10000) }, 'Serang −10K'),
          h('button', { class: 'btn ghost', onClick: () => { b.hp = b.max; b.shield = 0; GS.save(); redrawBoss(); } }, 'Isi semula HP')),
        h('p', { class: 'muted note' }, 'Penyambungan automatik ke like/gift TikTok datang pada Fasa 3. Buat masa ini serangan dikawal secara manual.')),
      sec('Top Like',
        area('Satu baris: Nama | jumlah', () => st.toplike.map((r) => r.name + ' | ' + r.n).join('\n'), (v) => { st.toplike = lines(v).slice(0, 5).map((l) => { const [n, c] = l.split('|'); return { name: (n || '').trim(), n: Number((c || '').replace(/[^\d]/g, '')) || 0 }; }); }, 4)),
      sec('Giliran Mabar',
        check(st.queue, 'open', 'Buka (OPEN)'),
        h('div', { class: 'grid2' }, field('Tajuk', text(st.queue, 'title')), field('Nota harga', text(st.queue, 'note'))),
        area('Satu baris: Nama | bilangan game', () => st.queue.rows.map((r) => r.name + ' | ' + r.games).join('\n'), (v) => { st.queue.rows = lines(v).slice(0, 6).map((l) => { const [n, g] = l.split('|'); return { name: (n || '').trim(), games: Number((g || '').replace(/[^\d]/g, '')) || 0 }; }); }, 4)),
      sec('Banner promosi',
        area('Satu baris: ikon | TAJUK | sub', () => st.promo.items.map((r) => r.icon + ' | ' + r.title + ' | ' + r.sub).join('\n'), (v) => { st.promo.items = lines(v).slice(0, 8).map(parsePromo); }, 4),
        area('Banner hadiah', () => st.promo.gift.map((r) => r.icon + ' | ' + r.title + ' | ' + r.sub).join('\n'), (v) => { st.promo.gift = lines(v).slice(0, 8).map(parsePromo); }, 3),
        h('p', { class: 'muted note' }, 'Ikon: heart, bag, crown, gift, star, diamond, bolt.')),
      sec('Label peranti', field('Teks', text(st, 'deviceLabel', 'DEVICE: nama peranti anda'))));
  }
  function parsePromo(l) {
    const [icon, title, sub] = l.split('|').map((x) => (x || '').trim());
    return { icon: icon || 'star', title: title || '', sub: sub || '' };
  }

  /* ================= Draft + spell ================= */
  const SPELLS = [['Flicker', 120], ['Retribution', 35], ['Inspire', 75], ['Sprint', 100], ['Purify', 50], ['Execute', 90], ['Petrify', 90], ['Revitalize', 100], ['Arrival', 75]];
  function draft(root) {
    const d = GS.state.draft;
    const dl = h('datalist', { id: 'heroList' }, GS.data.mlbbHeroes.map((x) => h('option', { value: x.name })));
    const heroIn = (arr, i, ph) => h('input', { type: 'text', list: 'heroList', value: arr[i] || '', placeholder: ph, onInput: (e) => { arr[i] = e.target.value; GS.save(); } });
    const phaseSel = h('select', { onChange: (e) => { d.phase = e.target.value; GS.save(); } },
      ['BAN PHASE', 'ALLY PICK', 'ENEMY PICK', 'DRAFT PICK', 'TEAM COMPLETE'].map((p) => h('option', { value: p, selected: d.phase === p }, p)));
    const winVal = h('b', null, d.winPct + '%');
    root.append(dl,
      sec('Draft pick / ban',
        check(d, 'show', 'Papar draft pada siaran'),
        field('Fasa', phaseSel),
        h('div', { class: 'grid2' }, [0, 1, 2, 3, 4].map((i) => field('Ally ' + (i + 1), heroIn(d.ally, i, 'Hero')))),
        h('div', { class: 'grid2' }, [0, 1, 2, 3, 4].map((i) => field('Enemy ' + (i + 1), heroIn(d.enemy, i, 'Hero')))),
        h('div', { class: 'grid2' }, field('Ban ally', text(d, 'banAlly', 'cth Fanny, Ling')), field('Ban enemy', text(d, 'banEnemy', 'cth Chou, Lancelot'))),
        field('Ramalan menang ally (%)', h('input', { type: 'range', min: 0, max: 100, value: d.winPct, onInput: (e) => { d.winPct = Number(e.target.value); winVal.textContent = d.winPct + '%'; GS.save(); } })),
        winVal,
        field('Nota / cadangan', text(d, 'note', 'cth Counter pick: pilih hero X')),
        h('p', { class: 'muted note' }, 'Ramalan dan cadangan dimasukkan secara manual. Pengesanan dan cadangan automatik datang pada Fasa 5. Nama hero dipaparkan sebagai teks sahaja.')),
      sec('Pemasa spell musuh', spells()));
  }
  function spells() {
    const wrap = h('div', { class: 'spells' });
    GS.state.spells.forEach((r, i) => {
      const heroInp = h('input', { type: 'text', list: 'heroList', value: r.hero, placeholder: 'Hero musuh', onInput: (e) => { r.hero = e.target.value; GS.save(); } });
      const sp = h('select', { onChange: (e) => { r.spell = e.target.value; const f = SPELLS.find((x) => x[0] === r.spell); if (f) { r.cd = f[1]; cd.value = f[1]; } GS.save(); } }, SPELLS.map(([n]) => h('option', { value: n, selected: r.spell === n }, n)));
      const cd = h('input', { type: 'number', min: 5, max: 300, value: r.cd, title: 'Cooldown (saat)', onInput: (e) => { r.cd = Number(e.target.value) || 60; GS.save(); } });
      wrap.append(h('div', { class: 'spell-row' }, heroInp, sp, cd,
        h('button', { class: 'btn tiny', onClick: () => { r.until = Date.now() + r.cd * 1000; GS.save(); } }, 'Mula'),
        h('button', { class: 'btn tiny ghost', onClick: () => { r.until = 0; GS.save(); } }, 'Set semula')));
    });
    wrap.append(h('p', { class: 'muted note' }, 'Isi nama hero untuk memaparkan pemasa pada siaran. Nilai cooldown boleh diedit; semak mengikut patch semasa.'));
    return wrap;
  }

  /* ================= Tier List ================= */
  function tier(root) {
    const t = GS.state.tiers;
    root.append(sec('Tier List',
      field('Tajuk (cth patch / musim)', text(t, 'label', 'TIER LIST')),
      ['S', 'A', 'B', 'C', 'D'].map((k) => field(GS.t('Tier {0} (pisahkan dengan koma)', k), h('input', { type: 'text', value: (t[k] || []).join(', '), onInput: (e) => { t[k] = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); GS.save(); } }))),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn primary', onClick: () => { GS.audio.ensure(); GS.fx.trigger('tierlist'); } }, 'Papar Tier List'),
        h('button', { class: 'btn ghost', onClick: () => { const n = GS.data.mlbbHeroes.map((x) => x.name); const pick = (a, b) => n.slice(a, b); t.label = 'TIER LIST (CONTOH)'; t.S = pick(0, 4); t.A = pick(4, 10); t.B = pick(10, 16); t.C = pick(16, 20); t.D = pick(20, 23); GS.save(); D.show('tier'); } }, 'Isi contoh')),
      h('p', { class: 'muted note' }, 'Isi senarai anda sendiri daripada data meta yang anda percayai. "Isi contoh" hanya data ujian, BUKAN meta sebenar.')));
  }

  D.extra = [['broadcast', 'Siaran', broadcast], ['draft', 'Draft', draft], ['tier', 'Tier', tier]];
})();
