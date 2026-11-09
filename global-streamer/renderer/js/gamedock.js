/* Global Streamer - panel game: kawalan efek, menang/kalah, hero (peribadi), meta */
(function () {
  'use strict';
  const { h, icon } = GS;
  const D = (GS.gamedock = {});
  let killLabel = 'KILL';
  let itemName = 'Blade of Despair';

  const roleColor = { Tank: '#2ea8ff', Fighter: '#ff8a3b', Assassin: '#ff3b5c', Mage: '#9a7bff', Marksman: '#ffd36b', Support: '#3be39a' };

  D.trigger = function (id) {
    const game = GS.games[GS.state.game];
    const def = game.effects.find((e) => e.id === id);
    if (!def) return;
    const params = Object.assign({}, def.params || {});
    if (id === 'kill') params.label = killLabel;
    if (id === 'itembuy') params.item = GS.data.mlbbItems.find((i) => i.name === itemName) || GS.data.mlbbItems[0];
    GS.fx.trigger(id, params);
  };

  /* ---------- tab: kawalan ---------- */
  function controls(root) {
    const game = GS.games[GS.state.game];
    const killSel = h('select', { 'aria-label': 'Jenis kill', onChange: (e) => (killLabel = e.target.value) }, game.killLabels.map((k) => h('option', { value: k, selected: k === killLabel }, k)));
    const groups = {};
    GS.data.mlbbItems.forEach((i) => (groups[i.cat] = groups[i.cat] || []).push(i));
    const itemSel = h('select', { 'aria-label': 'Item', onChange: (e) => (itemName = e.target.value) },
      Object.keys(groups).map((c) => h('optgroup', { label: GS.data.mlbbItemCats[c] }, groups[c].map((i) => h('option', { value: i.name, selected: i.name === itemName }, i.name)))));

    root.append(
      h('div', { class: 'gd-sec' },
        h('h4', null, 'Efek skrin'),
        h('div', { class: 'fx-grid' }, game.effects.map((e) =>
          h('button', { class: 'fx-btn', onClick: () => D.trigger(e.id), title: 'Alt + ' + e.hotkey, html: icon(e.icon, 18) + '<span>' + e.label + '</span><kbd>' + e.hotkey + '</kbd>' }))),
        h('div', { class: 'grid2' },
          h('label', { class: 'field' }, h('span', null, 'Jenis kill'), killSel),
          h('label', { class: 'field' }, h('span', null, 'Item untuk "Beli Item"'), itemSel)),
        h('p', { class: 'muted note' }, 'Cetus manual, hotkey Alt+1…6, atau (Fasa 5) pengesan auto daripada capture card.')),
      h('div', { class: 'gd-sec' },
        h('h4', null, 'Menang / Kalah'),
        h('div', { class: 'wl' },
          counter('win', 'WIN', 'cyan'), counter('loss', 'LOSE', 'red')),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: GS.state.autoCount !== false, onChange: (e) => { GS.state.autoCount = e.target.checked; GS.save(); } }), 'Kira automatik bila efek Victory / Defeat dicetus'),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn ghost', onClick: () => { GS.state.winloss = { win: 0, loss: 0, streak: 0 }; GS.save(); GS.emit('winloss:changed'); } }, 'Set semula W/L'),
          h('button', { class: 'btn ghost', onClick: () => { GS.state.sessionStart = Date.now(); GS.save(); } }, 'Set semula masa main'))),
      h('div', { class: 'gd-sec' },
        h('h4', null, 'Pengesan auto (capture card)'),
        h('ul', { class: 'roadmap' },
          ['Kill / Mati', 'Victory / Defeat', 'Pembelian item & item penuh', 'Hero draft (ally / musuh)'].map((t) => h('li', null, h('i'), t, h('em', null, 'Fasa 5'))))));
  }

  function counter(key, label, tone) {
    const val = h('b', { class: tone }, GS.state.winloss[key]);
    GS.on('winloss:changed', () => (val.textContent = GS.state.winloss[key]));
    const adj = (d) => {
      const wl = GS.state.winloss;
      wl[key] = Math.max(0, wl[key] + d);
      if (d > 0) wl.streak = key === 'win' ? (wl.streak > 0 ? wl.streak + 1 : 1) : (wl.streak < 0 ? wl.streak - 1 : -1);
      GS.save();
      GS.emit('winloss:changed');
    };
    return h('div', { class: 'wl-box ' + tone }, h('span', null, label),
      h('div', null, h('button', { class: 'icon-btn', 'aria-label': 'Kurang ' + label, onClick: () => adj(-1) }, '−'), val, h('button', { class: 'icon-btn', 'aria-label': 'Tambah ' + label, onClick: () => adj(1) }, '+')));
  }

  /* ---------- tab: hero (peribadi) ---------- */
  function heroes(root) {
    const all = GS.data.mlbbHeroes;
    let q = '', role = 'Semua';
    const list = h('div', { class: 'hero-grid' });
    const count = h('span', { class: 'muted' });
    const draw = () => {
      list.innerHTML = '';
      const rows = all.filter((x) => (role === 'Semua' || x.roles.includes(role)) && x.name.toLowerCase().includes(q));
      rows.forEach((x) => list.append(h('div', { class: 'hero', style: { '--rc': roleColor[x.role] }, title: x.roles.join(' / ') }, h('i'), h('span', null, x.name))));
      if (!rows.length) list.append(h('div', { class: 'empty' }, 'Tiada hero dijumpai.'));
      count.textContent = rows.length + ' / ' + all.length + ' hero';
    };
    const chips = h('div', { class: 'subtabs wrap' }, ['Semua', ...GS.data.mlbbRoles].map((r) =>
      h('button', { class: 'subtab' + (r === role ? ' on' : ''), onClick: (e) => { role = r; GS.$$('.subtab', chips).forEach((b) => b.classList.toggle('on', b === e.currentTarget)); draw(); } }, r)));
    root.append(
      h('div', { class: 'callout slim' }, h('span', { html: icon('shield', 14) }), ' Panel peribadi. Senarai ini TIDAK masuk dalam siaran penonton.'),
      h('div', { class: 'search' }, h('span', { html: icon('search', 16) }), h('input', { type: 'search', placeholder: 'Cari hero…', 'aria-label': 'Cari hero', onInput: (e) => { q = e.target.value.trim().toLowerCase(); draw(); } })),
      chips, count, list,
      h('p', { class: 'muted note' }, 'Dataset awal. Peranan perlu disahkan mengikut patch semasa; pengemaskinian automatik dirancang (Fasa 5).'));
    draw();
  }

  /* ---------- tab: meta ---------- */
  function meta(root) {
    const sec = (t, d) => h('div', { class: 'gd-sec' }, h('h4', null, t), h('div', { class: 'placeholder' }, d));
    root.append(
      h('div', { class: 'callout slim' }, h('span', { html: icon('trophy', 14) }), ' Analisis tournament (MPL / MAL) dikemas kini setiap 5 minit pada Fasa 5.'),
      sec('Top Ban', 'Belum ada data'), sec('Top Pick Hero', 'Belum ada data'), sec('Hero Menang Terbanyak', 'Belum ada data'),
      sec('Cadangan Draft Pick', 'Aktif apabila pengesan hero draft siap (Fasa 5)'));
  }

  D.init = function () {
    const root = GS.$('#gameBody');
    if (!root) return;
    const pages = { controls, heroes, meta };
    const tabs = h('div', { class: 'subtabs' });
    const body = h('div', { class: 'gd-body' });
    const show = (id) => {
      GS.$$('.subtab', tabs).forEach((b) => b.classList.toggle('on', b.dataset.id === id));
      body.innerHTML = '';
      pages[id](body);
    };
    [['controls', 'Kawalan'], ['heroes', 'Hero'], ['meta', 'Meta']].forEach(([id, label]) => tabs.append(h('button', { class: 'subtab', dataset: { id }, onClick: () => show(id) }, label)));
    root.append(tabs, body);
    show('controls');
  };
})();
