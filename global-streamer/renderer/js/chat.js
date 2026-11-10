/* Global Streamer - paparan chat gabungan (TikTok / Facebook / YouTube).
 * Antara muka + saluran masuk (GS.chat.push). Penyambung sebenar: js/chat-adapters.js (Fasa 3). */
(function () {
  'use strict';
  const { h } = GS;
  const C = (GS.chat = { messages: [], filter: 'all', adapters: {}, status: {} });
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
      if (!m.demo && !m.noalert) GS.fx.trigger('alert', { title: m.type === 'follow' ? 'Terima kasih follow' : 'Terima kasih gift', name: '@' + m.user, sound: true });
    }
  };

  function msgEl(m) {
    const time = new Date(m.ts);
    return h('div', { class: 'chat-msg ' + m.type, style: { '--pf': colors[m.platform] || colors.other } },
      h('span', { class: 'cm-badge', title: labels[m.platform] }, (labels[m.platform] || '?')[0]),
      h('span', { class: 'cm-user' }, m.user),
      h('span', { class: 'cm-text' }, m.type === 'follow' ? GS.t('follow anda') : m.type === 'gift' ? GS.t('hantar gift') + ' ' + (m.text || '') : m.type === 'superchat' ? 'Super Chat ' + (m.text || '') : m.type === 'member' ? GS.t('ahli baharu') + ' ' + (m.text || '') : m.text),
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
      list.append(h('div', { class: 'empty' }, 'Belum ada mesej. Tekan "Sambungan chat" untuk menyambung YouTube, Facebook atau TikTok (melalui geganti).'));
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


  /* ---------- sambungan chat ---------- */
  const STATE_TXT = { off: 'Tidak bersambung', connecting: 'Menyambung…', live: 'Bersambung', retry: 'Cuba semula…', error: 'Ralat' };
  C.openConnect = function () {
    const cfg = C.cfg();
    const sections = [
      { id: 'youtube', name: 'YouTube Live', color: colors.youtube, fields: [
        { label: 'ID video / URL siaran langsung', get: () => cfg.youtube.video, set: (v) => { cfg.youtube.video = v.trim(); GS.save(); }, ph: 'cth dQw4w9WgXcQ atau https://youtube.com/watch?v=…' },
        { label: 'API key (YouTube Data API v3)', secret: 'chat-youtube', ph: 'AIza…' }],
        hint: 'Guna API rasmi YouTube. Cipta API key di Google Cloud Console dan hidupkan "YouTube Data API v3". Kuota harian percuma terhad; app mengundi mengikut selang yang ditetapkan YouTube. Mesej: teks, Super Chat dan ahli baharu.' },
      { id: 'facebook', name: 'Facebook Live', color: colors.facebook, fields: [
        { label: 'ID video langsung (atau URL)', get: () => cfg.facebook.video, set: (v) => { cfg.facebook.video = v.trim(); GS.save(); }, ph: 'cth 1234567890123456' },
        { label: 'Token akses Halaman', secret: 'chat-facebook', ph: 'EAA…' }],
        hint: 'Guna Graph API rasmi Facebook (komen pada video langsung). Perlu token akses Halaman yang menyiarkan, dengan kebenaran membaca komen. Token tamat tempoh: jana semula bila perlu.' },
      { id: 'tiktok', name: 'TikTok LIVE (melalui geganti)', color: colors.tiktok, fields: [
        { label: 'URL WebSocket geganti', get: () => cfg.tiktok.url, set: (v) => { cfg.tiktok.url = v.trim(); GS.save(); }, ph: 'ws://127.0.0.1:8765' }],
        hint: 'TikTok TIDAK menyediakan API rasmi untuk chat LIVE, jadi app tidak menyambung terus kepada TikTok. Jalankan alat geganti pilihan anda (atas risiko sendiri) yang menghantar JSON melalui WebSocket, cth {"type":"chat","user":"ali","text":"gg"}, {"type":"gift","user":"ali","gift":"Rose","count":2,"value":1}, {"type":"like","user":"ali","count":15}, {"type":"follow","user":"ali"}.' },
    ];
    const body = h('div', { class: 'chat-conn' });
    const stat = {};
    sections.forEach((s) => {
      const st = h('span', { class: 'pf-status off' });
      stat[s.id] = st;
      const btn = h('button', { class: 'btn primary', 'data-p': s.id, onClick: () => { if (C.isOn(s.id)) C.disconnect(s.id); else C.connect(s.id); refresh(); } }, 'Sambung');
      const inputs = s.fields.map((f) => h('label', { class: 'field' }, h('span', null, f.label),
        f.secret
          ? h('input', { type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: f.ph || '', value: GS.platforms.getKey(f.secret), onInput: (e) => GS.platforms.setKey(f.secret, e.target.value) })
          : h('input', { type: 'text', spellcheck: 'false', placeholder: f.ph || '', value: f.get(), onInput: (e) => f.set(e.target.value) })));
      body.append(h('div', { class: 'pf-card on', style: { '--pf': s.color } },
        h('div', { class: 'pf-head' }, h('span', { class: 'pf-dot' }), h('strong', null, s.name), st),
        ...inputs, h('p', { class: 'muted note' }, s.hint), h('div', { class: 'btn-row' }, btn)));
      s.btn = btn;
    });
    function refresh() {
      sections.forEach((s) => {
        const sv = C.status[s.id] || { state: 'off' };
        stat[s.id].textContent = GS.t(STATE_TXT[sv.state] || sv.state) + (sv.detail ? ': ' + sv.detail : '');
        stat[s.id].className = 'pf-status ' + (sv.state === 'live' ? 'ok' : sv.state === 'error' || sv.state === 'retry' ? 'bad' : 'off');
        s.btn.textContent = GS.t(C.isOn(s.id) ? 'Putuskan' : 'Sambung');
      });
    }
    refresh();
    const off = GS.on('chat:status', () => { if (!body.isConnected) { off(); return; } refresh(); });
    GS.modal({ title: 'Sambungan chat', body: h('div', null, body, h('p', { class: 'muted note' }, 'Kunci/token disimpan dalam memori (web) atau disulitkan OS (app Windows), bukan dalam penyemak imbas. Chat dan alert (follow, gift, Super Chat, ahli) muncul dalam panel ini dan mencetus efek siaran.')), wide: true });
  };

  /* ---------- siaran langsung (Server URL + Stream Key) bagi setiap platform, dalam panel Chat ---------- */
  const P = () => GS.platforms;
  const pfName = (id) => { const d = P().ensureDef(id); return d.extra ? (GS.state.platforms[id].name || d.name) : d.name; };
  const SHORT = { tiktok: 'TikTok', facebook: 'Facebook', youtube: 'YouTube' };

  C.focusPlatform = function (id) {
    const tab = GS.$('.rtab[data-panel=panelChat]');
    if (tab) tab.click();
    C.filter = id || 'all';
    C.drawTabs(); C.drawSetup(true); renderList();
    const box = GS.$('#pfSetup');
    if (box && box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
  };

  /** Dialog "Tambah aplikasi untuk LIVE": senarai platform sebenar yang memberi Server URL + Stream Key. (prompt() tidak berfungsi dalam Electron.) */
  C.openAddPlatform = function () {
    const used = new Set(Object.values(GS.state.platforms).map((x) => x && x.preset).filter(Boolean));
    const grid = h('div', { class: 'add-pf-grid' });
    let m;
    const pick = (pr, name) => {
      if (pr.id !== 'custom' && used.has(pr.id)) { const ex = Object.keys(GS.state.platforms).find((k) => GS.state.platforms[k].preset === pr.id); m.close(); if (ex) C.focusPlatform(ex); return; }
      const id = P().addExtra(name || pr.name, pr.id);
      m.close();
      if (id) C.focusPlatform(id); else GS.toast(GS.t('Had aplikasi tambahan dicapai.'), 'warn');
    };
    P().presets.forEach((pr) => {
      if (pr.id === 'custom') return;
      grid.append(h('button', { type: 'button', class: 'add-pf-card', 'data-preset': pr.id, style: { '--pf': pr.color }, onClick: () => pick(pr) },
        h('i', { class: 'pf-dot' }), h('b', null, pr.name),
        h('small', null, pr.server ? GS.t('URL lalai disediakan: hanya Stream Key diperlukan') : GS.t('Salin Server URL dan Stream Key daripada dashboard platform'))));
    });
    const nameIn = h('input', { type: 'text', id: 'addPfName', maxlength: 24, placeholder: GS.t('Nama aplikasi (cth Kick, Twitch, Shopee Live):') });
    const body = h('div', { class: 'add-pf' },
      h('p', { class: 'muted note' }, 'Pilih platform yang menyediakan siaran langsung melalui RTMP. Setiap satu ada Server URL dan Stream Key sendiri yang anda dapat daripada dashboard platform itu (panduan ada pada kad selepas dipilih).'),
      grid,
      h('h4', null, 'Platform lain (RTMP)'),
      h('div', { class: 'key-row' }, nameIn, h('button', { type: 'button', class: 'btn', id: 'btnAddCustom', onClick: () => pick(P().preset('custom'), nameIn.value.trim() || 'RTMP lain') }, 'Tambah')));
    m = GS.modal({ title: 'Tambah aplikasi untuk LIVE', body, wide: true });
  };

  C.drawTabs = function () {
    const tabs = GS.$('#chatTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    ['all'].concat(P().order).forEach((id) => {
      const label = id === 'all' ? 'Semua' : SHORT[id] || pfName(id);
      tabs.append(h('button', { class: 'subtab' + (C.filter === id ? ' on' : ''), 'data-id': id, title: id === 'all' ? '' : GS.t('{0}: Server URL dan Stream Key', label), onClick: () => { C.filter = id; C.drawTabs(); C.drawSetup(); renderList(); } }, label));
    });
    tabs.append(h('button', { class: 'subtab add', id: 'btnAddPlatform', title: GS.t('Tambah aplikasi lain untuk LIVE (Kick, Twitch, Shopee Live...)'), 'aria-label': GS.t('Tambah aplikasi lain untuk LIVE'), onClick: () => C.openAddPlatform() }, '+'));
  };

  /** Bahagian Server URL / Stream Key di bawah tab: platform yang dipilih; pada tab "Semua": ringkasan semua platform. */
  C.drawSetup = function (open) {
    const box = GS.$('#pfSetup');
    if (!box) return;
    const keep = box.querySelector('details') ? box.querySelector('details').open : null;
    box.innerHTML = '';
    if (C.filter === 'all') {
      const sum = h('div', { class: 'pf-sum' }, P().order.map((id) => {
        const v = P().validate(id);
        return h('button', { type: 'button', class: 'pf-sum-row ' + (v.off ? 'off' : v.ok ? 'ok' : 'bad'), 'data-open': id, onClick: () => C.focusPlatform(id) },
          h('i', { class: 'pf-dot', style: { background: P().ensureDef(id).color } }), h('b', null, pfName(id)), h('span', null, GS.t(v.off ? 'Tidak digunakan' : v.ok ? 'Sedia' : v.msg)));
      }));
      box.append(h('details', { class: 'pf-details', open: keep == null ? true : keep }, h('summary', null, 'Siaran langsung: Server URL dan Stream Key'), sum,
        h('p', { class: 'muted note' }, 'Pilih TikTok, Facebook atau YouTube untuk memasukkan Server URL dan Stream Key. Tekan + untuk menambah aplikasi lain.')));
      return;
    }
    const card = P().renderCard(C.filter, () => { C.drawTabs(); });
    const d = h('details', { class: 'pf-details', open: open === true ? true : keep == null ? !P().validate(C.filter).ok : keep }, h('summary', null, GS.t('Siaran langsung: Server URL dan Stream Key')), card);
    box.append(d);
  };

  C.init = function () {
    const root = GS.$('#chatBody');
    if (!root) return;
    P().sync();
    const tabs = h('div', { class: 'subtabs', id: 'chatTabs' });
    const demoBtn = h('button', { class: 'btn ghost sm', onClick: (e) => toggleDemo(e.currentTarget) }, 'Pratonton demo');
    root.append(tabs, h('div', { id: 'pfSetup', class: 'pf-setup' }), h('div', { id: 'chatList', class: 'chat-list', 'aria-live': 'polite' }),
      h('div', { class: 'chat-foot' }, h('button', { class: 'btn primary sm', id: 'btnChatConn', onClick: () => C.openConnect() }, 'Sambungan chat'), demoBtn));
    C.drawTabs(); C.drawSetup();
    GS.on('platforms:changed', () => { C.drawTabs(); C.drawSetup(); if (GS.live && GS.live.render) GS.live.render(); });
    renderList();
  };
})();
