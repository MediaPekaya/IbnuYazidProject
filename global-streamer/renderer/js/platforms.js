/* Global Streamer - tetapan platform siaran (TikTok / Facebook / YouTube / RTMP lain) + simpanan key */
(function () {
  'use strict';
  const { h, icon } = GS;
  const P = (GS.platforms = {});

  P.defs = {
    tiktok: {
      name: 'TikTok LIVE', color: '#25f4ee',
      needsServer: true,
      serverHint: 'WAJIB. Tampal "Server URL" daripada TikTok LIVE Studio / Pusat LIVE (akaun perlu layak LIVE).',
      keyHint: 'WAJIB. Stream Key daripada TikTok. TikTok memerlukan kedua-dua Server URL dan Stream Key.',
    },
    facebook: {
      name: 'Facebook Live', color: '#4c8dff',
      defaultServer: 'rtmps://live-api-s.facebook.com:443/rtmp/',
      serverHint: 'Pilihan: dibiarkan kosong = guna lalai rtmps://live-api-s.facebook.com:443/rtmp/',
      keyHint: 'Hanya Stream Key diperlukan. Daripada Facebook Live Producer.',
    },
    youtube: {
      name: 'YouTube Live', color: '#ff4b4b',
      defaultServer: 'rtmp://a.rtmp.youtube.com/live2',
      serverHint: 'Pilihan: dibiarkan kosong = guna lalai rtmp://a.rtmp.youtube.com/live2',
      keyHint: 'Hanya Stream Key diperlukan. Daripada YouTube Studio > Siaran Langsung.',
    },
    custom: {
      name: 'RTMP Lain', color: '#9a7bff',
      needsServer: true,
      serverHint: 'WAJIB. Mana-mana server RTMP / RTMPS (cth Kick, Twitch, Shopee Live).',
      keyHint: 'Stream Key.',
    },
  };
  const BASE = ['tiktok', 'facebook', 'youtube'];
  P.order = BASE.slice();
  GS.on && GS.on('state:ready', () => P.sync());
  /** Platform tambahan (cth Kick, Twitch, Shopee Live): id x1, x2... dengan nama sendiri, Server URL dan Stream Key sendiri. */
  /** Platform siaran langsung yang menyediakan Server URL + Stream Key (RTMP/RTMPS). `server` = URL lalai (jika ada), selain itu salin daripada dashboard platform. */
  P.presets = [
    { id: 'twitch', name: 'Twitch', color: '#9146ff', server: 'rtmp://live.twitch.tv/app', how: 'Twitch Creator Dashboard > Settings > Stream: salin "Primary Stream Key".', link: 'https://dashboard.twitch.tv/settings/stream' },
    { id: 'kick', name: 'Kick', color: '#53fc18', server: '', how: 'Kick Creator Dashboard > Settings > Stream: salin "Stream URL" dan "Stream Key".', link: 'https://kick.com/dashboard/settings/stream' },
    { id: 'shopee', name: 'Shopee Live', color: '#ee4d2d', server: '', how: 'Shopee Live (penstriman dengan perisian pihak ketiga): salin Stream URL dan Stream Key daripada tetapan Live. Akaun perlu layak.', link: '' },
    { id: 'instagram', name: 'Instagram Live', color: '#e1306c', server: '', how: 'Instagram pada komputer > Create > Live video: salin Stream URL dan Stream key. Akaun perlu layak.', link: '' },
    { id: 'x', name: 'X (Twitter) Live', color: '#aab4c2', server: '', how: 'X Media Studio > Producer > Create broadcast: salin RTMP URL dan Stream key. Akaun perlu layak.', link: '' },
    { id: 'trovo', name: 'Trovo', color: '#19d66b', server: 'rtmp://livepush.trovo.live/live/', how: 'Trovo Creator Studio > Live settings: salin Stream Key.', link: '' },
    { id: 'restream', name: 'Restream (banyak platform serentak)', color: '#ff4d6d', server: 'rtmp://live.restream.io/live', how: 'Restream Dashboard: salin Stream Key (Restream menyiarkan ke banyak platform).', link: 'https://app.restream.io' },
    { id: 'vimeo', name: 'Vimeo Live', color: '#1ab7ea', server: 'rtmps://rtmp-global.cloud.vimeo.com:443/live', how: 'Vimeo > New > Live event: salin Stream key.', link: '' },
    { id: 'dailymotion', name: 'Dailymotion', color: '#4da3ff', server: 'rtmp://publish.dailymotion.com/publish-dm', how: 'Dailymotion > Go live: salin Stream key.', link: '' },
    { id: 'linkedin', name: 'LinkedIn Live', color: '#4c8dff', server: '', how: 'LinkedIn Live (perlu akses): salin Stream URL dan Stream key daripada acara Live anda.', link: '' },
    { id: 'rumble', name: 'Rumble', color: '#85c742', server: '', how: 'Rumble Live dashboard: salin Server URL dan Stream key.', link: '' },
    { id: 'custom', name: 'RTMP lain', color: '#9a7bff', server: '', how: 'Mana-mana platform yang memberi RTMP / RTMPS Server URL dan Stream Key.', link: '' },
  ];
  P.preset = (id) => P.presets.find((x) => x.id === id) || null;

  P.ensureDef = function (id) {
    if (P.defs[id]) return P.defs[id];
    const cfg = GS.state.platforms[id] || {};
    const pr = P.preset(cfg.preset);
    P.defs[id] = { name: cfg.name || (pr && pr.name) || 'RTMP', color: (pr && pr.color) || '#9a7bff', extra: true, preset: pr,
      defaultServer: pr && pr.server ? pr.server : '', needsServer: !(pr && pr.server),
      serverHint: pr && pr.server ? 'Pilihan: dibiarkan kosong = guna lalai ' + pr.server : 'WAJIB. Server URL RTMP / RTMPS daripada platform ini (salin daripada dashboard platform).',
      keyHint: (pr && pr.how) || 'WAJIB. Stream Key daripada platform ini.' };
    return P.defs[id];
  };
  P.sync = function () {
    const S = GS.state.platforms;
    // migrasi: "RTMP Lain" lama menjadi platform tambahan hanya jika pernah digunakan
    if (S.custom) { const c = S.custom; delete S.custom; if (c.enabled || (c.server || '').trim()) { S.x1 = S.x1 || Object.assign({ name: 'RTMP Lain' }, c); P.keyAlias = { x1: 'custom' }; } }
    P.order = BASE.concat(Object.keys(S).filter((k) => /^x\d{1,3}$/.test(k)).sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10)));
    P.order.forEach((id) => { if (id.startsWith('x')) { S[id].name = S[id].name || 'RTMP'; delete P.defs[id]; P.ensureDef(id); } });
    return P.order;
  };
  P.addExtra = function (name, presetId) {
    const S = GS.state.platforms;
    let n = 1; while (S['x' + n]) n++;
    if (n > 20) return '';
    const id = 'x' + n;
    S[id] = { enabled: false, server: '', name: String(name || '').trim().slice(0, 24) || (P.preset(presetId) && P.preset(presetId).name.slice(0, 24)) || 'RTMP ' + n };
    if (presetId && P.preset(presetId)) S[id].preset = presetId;
    GS.save(); P.sync(); GS.emit('platforms:changed', id);
    return id;
  };
  P.removeExtra = function (id) {
    const S = GS.state.platforms;
    if (!/^x\d{1,3}$/.test(id) || !S[id]) return false;
    P.setKey(id, '');
    delete S[id]; delete P.defs[id];
    GS.save(); P.sync(); GS.emit('platforms:changed', '');
    return true;
  };

  /* Key TIDAK disimpan dalam localStorage.
   * - Web: hanya dalam memori (hilang bila tab ditutup).
   * - App Windows (Electron): disimpan disulitkan melalui OS (safeStorage). */
  const mem = {};
  P.native = () => !!(window.gsNative && window.gsNative.isNative);

  P.loadKeys = async function () {
    if (!P.native()) return;
    P.sync();
    // kunci platform tambahan lama ("custom") dipindahkan ke x1
    if (P.keyAlias && P.keyAlias.x1) { try { const old = (await window.gsNative.vault.get('custom')) || ''; if (old) { await window.gsNative.vault.set('x1', old); await window.gsNative.vault.set('custom', ''); } } catch (e) { /* abaikan */ } }
    for (const id of P.order.concat(['chat-youtube', 'chat-facebook', 'tts-elevenlabs', 'tts-azure'])) {
      try { mem[id] = (await window.gsNative.vault.get(id)) || ''; } catch (e) { mem[id] = ''; }
    }
  };
  P.getKey = (id) => mem[id] || '';
  P.setKey = function (id, v) {
    mem[id] = v;
    if (P.native()) window.gsNative.vault.set(id, v).catch(() => {});
  };

  /** Server yang digunakan: yang diisi pengguna, jika tidak lalai platform (YouTube/Facebook). */
  P.serverFor = function (id) {
    const cfg = GS.state.platforms[id];
    return ((cfg.server || '').trim() || (P.defs[id].defaultServer || '')).trim();
  };

  P.validate = function (id) {
    const cfg = GS.state.platforms[id];
    if (!cfg.enabled) return { ok: false, off: true, msg: 'Tidak digunakan' };
    const server = P.serverFor(id);
    const key = P.getKey(id).trim();
    if (!server) return { ok: false, msg: 'Server URL belum diisi (diperlukan oleh platform ini)' };
    if (!/^rtmps?:\/\/\S+$/i.test(server)) return { ok: false, msg: 'Server URL mesti bermula dengan rtmp:// atau rtmps://' };
    if (!key) return { ok: false, msg: P.defs[id].needsServer ? 'Stream key belum diisi (Server URL dan Stream Key wajib)' : 'Stream key belum diisi' };
    if (/\s/.test(key)) return { ok: false, msg: 'Stream key tidak boleh mengandungi ruang' };
    return { ok: true, msg: 'Sedia' };
  };

  P.enabledIds = () => P.order.filter((id) => GS.state.platforms[id].enabled);
  P.targets = () =>
    P.order.filter((id) => P.validate(id).ok).map((id) => ({
      id,
      name: P.defs[id].name,
      url: P.serverFor(id).replace(/\/+$/, '') + '/' + P.getKey(id).trim(),
    }));

  /** Kad platform: hidupkan, Server URL, Stream Key, status. Digunakan dalam panel chat (setiap platform). */
  P.renderCard = function (id, onChange) {
    const def = P.ensureDef(id), cfg = GS.state.platforms[id];
    const status = h('span', { class: 'pf-status' });
    const upd = () => {
      const v = P.validate(id);
      status.textContent = GS.t(v.off ? 'Tidak digunakan' : v.msg);
      status.className = 'pf-status ' + (v.off ? 'off' : v.ok ? 'ok' : 'bad');
      card.classList.toggle('on', cfg.enabled);
      if (onChange) onChange();
    };
    const keyInput = h('input', { type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: 'Stream key', value: P.getKey(id), 'data-pf-key': id, 'aria-label': GS.t('Stream key {0}', GS.t(def.name)),
      onInput: (e) => {
        P.setKey(id, e.target.value);
        // memasukkan key = mahu guna platform ini (tidak perlu menghidupkan suis lagi)
        if (e.target.value.trim() && !cfg.enabled) { cfg.enabled = true; toggleIn.checked = true; GS.save(); }
        upd();
      } });
    const toggleIn = h('input', { type: 'checkbox', checked: cfg.enabled, onChange: (e) => { cfg.enabled = e.target.checked; GS.save(); upd(); } });
    const toggle = h('label', { class: 'switch', title: GS.t('Gunakan platform ini semasa LIVE') }, toggleIn, h('i'));
    const card = h('div', { class: 'pf-card' + (cfg.enabled ? ' on' : ''), 'data-pf': id, style: { '--pf': def.color } },
      h('div', { class: 'pf-head' },
        h('span', { class: 'pf-dot' }),
        h('strong', null, def.extra ? cfg.name : def.name),
        status,
        toggle),
      h('div', { class: 'pf-body' },
        def.extra ? h('label', { class: 'field' }, h('span', null, 'Nama aplikasi'), h('input', { type: 'text', maxlength: 24, value: cfg.name || '', 'data-pf-name': id, onInput: (e) => { cfg.name = e.target.value.slice(0, 24); def.name = cfg.name || 'RTMP'; GS.save(); GS.emit('platforms:changed', id); } })) : null,
        h('label', { class: 'field' }, h('span', null, def.needsServer ? 'Server URL (wajib)' : 'Server URL (pilihan)'),
          h('input', { type: 'text', spellcheck: 'false', placeholder: def.defaultServer || 'rtmp://…', value: cfg.server || '', 'data-pf-url': id, onInput: (e) => { cfg.server = e.target.value; GS.save(); upd(); } }),
          h('small', null, def.serverHint)),
        h('label', { class: 'field' }, h('span', null, def.needsServer ? 'Stream Key (wajib)' : 'Stream Key (wajib, sahaja ini perlu)'),
          h('div', { class: 'key-row' }, keyInput,
            h('button', { type: 'button', class: 'icon-btn', title: 'Tunjuk / sembunyi key', onClick: () => { keyInput.type = keyInput.type === 'password' ? 'text' : 'password'; }, html: icon('eye', 16) })),
          h('small', null, def.keyHint)),
        def.extra && def.preset && def.preset.link ? h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn ghost tiny', 'data-pf-link': id, onClick: () => window.open(def.preset.link, '_blank', 'noopener') }, GS.t('Buka halaman {0} untuk dapatkan URL dan key', def.preset.name))) : null,
        def.extra ? h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn ghost tiny', 'data-pf-del': id, onClick: () => { if (confirm(GS.t('Buang {0}?', cfg.name || id))) P.removeExtra(id); } }, 'Buang aplikasi ini')) : null,
        h('p', { class: 'muted note' }, P.native()
          ? 'Key disimpan disulitkan pada PC ini dan tidak dihantar ke mana-mana pelayan kami.'
          : 'Mod web: key hanya disimpan dalam memori tab ini dan hilang bila ditutup. Pasang app Windows untuk simpanan selamat.')));
    upd();
    return card;
  };
})();
