/* Global Streamer - paparan chat gabungan (TikTok / Facebook / YouTube).
 * Fasa 1: antara muka + saluran masuk (GS.chat.push). Penyambung sebenar (adapter) datang pada Fasa 3. */
(function () {
  'use strict';
  const { h } = GS;
  const C = (GS.chat = { messages: [], filter: 'all', adapters: {} });
  const MAX = 250;

  const labels = { tiktok: 'TikTok', facebook: 'Facebook', youtube: 'YouTube', other: 'Lain' };
  const colors = { tiktok: '#25f4ee', facebook: '#4c8dff', youtube: '#ff4b4b', other: '#9a7bff' };

  /* antara muka adapter: { connect(config, onMessage) -> disconnect() } */
  C.registerAdapter = (id, adapter) => { C.adapters[id] = adapter; };

  C.push = function (msg) {
    const m = Object.assign({ platform: 'other', user: 'penonton', text: '', ts: Date.now(), type: 'chat', demo: false }, msg);
    C.messages.push(m);
    if (C.messages.length > MAX) C.messages.shift();
    appendOne(m);
    if (m.type === 'follow' || m.type === 'gift') {
      if (!m.demo) GS.fx.trigger('alert', { title: m.type === 'follow' ? 'Terima kasih follow' : 'Terima kasih gift', name: '@' + m.user, sound: true });
    }
  };

  function msgEl(m) {
    const time = new Date(m.ts);
    return h('div', { class: 'chat-msg ' + m.type, style: { '--pf': colors[m.platform] || colors.other } },
      h('span', { class: 'cm-badge', title: labels[m.platform] }, (labels[m.platform] || '?')[0]),
      h('span', { class: 'cm-user' }, m.user),
      h('span', { class: 'cm-text' }, m.type === 'follow' ? GS.t('follow anda') : m.type === 'gift' ? GS.t('hantar gift') + ' ' + (m.text || '') : m.text),
      m.demo ? h('span', { class: 'cm-demo' }, 'demo') : null,
      h('span', { class: 'cm-time' }, GS.pad(time.getHours()) + ':' + GS.pad(time.getMinutes())));
  }

  function appendOne(m) {
    const list = GS.$('#chatList');
    if (!list) return;
    if (C.filter !== 'all' && C.filter !== m.platform) return;
    const empty = list.querySelector('.empty');
    if (empty) empty.remove();
    const near = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
    list.append(msgEl(m));
    while (list.children.length > MAX) list.firstChild.remove();
    if (near) list.scrollTop = list.scrollHeight;
  }

  function renderList() {
    const list = GS.$('#chatList');
    if (!list) return;
    list.innerHTML = '';
    const rows = C.messages.filter((m) => C.filter === 'all' || m.platform === C.filter);
    if (!rows.length) {
      list.append(h('div', { class: 'empty' }, 'Belum ada mesej. Chat daripada TikTok, Facebook dan YouTube akan muncul di sini selepas disambung (Fasa 3).'));
      return;
    }
    rows.forEach((m) => list.append(msgEl(m)));
    list.scrollTop = list.scrollHeight;
  }

  /* contoh paparan (ditanda "demo", tidak mencetus alert siaran) */
  let demoTimer = null;
  function toggleDemo(btn) {
    if (demoTimer) { clearInterval(demoTimer); demoTimer = null; btn.textContent = GS.t('Pratonton demo'); return; }
    btn.textContent = GS.t('Henti demo');
    const users = ['aiman_gamer', 'kak_nana', 'rizal.ml', 'syafiq99', 'MythicDaily', 'dina_live', 'hakim_rank'];
    const texts = GS.state.lang === 'en'
      ? ['gg bro!', 'first blood 🔥', 'what hero is that?', 'follow back please?', 'nice kill just now', 'how much for rank boosting?', 'hi everyone', 'savage!!']
      : ['gg bro!', 'first blood 🔥', 'main hero apa tu?', 'follow back boleh?', 'mantap kill tadi', 'joki rank brp?', 'salam semua', 'savage!!'];
    const plats = ['tiktok', 'youtube', 'facebook'];
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const tick = () => {
      const r = Math.random();
      C.push({ platform: pick(plats), user: pick(users), demo: true, type: r < 0.12 ? 'follow' : r < 0.2 ? 'gift' : 'chat', text: r < 0.2 && r >= 0.12 ? 'Rose' : pick(texts) });
    };
    tick();
    demoTimer = setInterval(tick, 1400);
  }

  C.init = function () {
    const root = GS.$('#chatBody');
    if (!root) return;
    const tabs = h('div', { class: 'subtabs' }, ['all', 'tiktok', 'facebook', 'youtube'].map((id) =>
      h('button', { class: 'subtab' + (C.filter === id ? ' on' : ''), dataset: { id }, onClick: (e) => { C.filter = id; GS.$$('.subtab', tabs).forEach((b) => b.classList.toggle('on', b === e.currentTarget)); renderList(); } }, id === 'all' ? 'Semua' : labels[id])));
    const demoBtn = h('button', { class: 'btn ghost sm', onClick: (e) => toggleDemo(e.currentTarget) }, 'Pratonton demo');
    root.append(tabs, h('div', { id: 'chatList', class: 'chat-list', 'aria-live': 'polite' }),
      h('div', { class: 'chat-foot' }, h('span', { class: 'muted' }, 'Penyambung chat: Fasa 3'), demoBtn));
    renderList();
  };
})();
