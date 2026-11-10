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
  P.order = ['tiktok', 'facebook', 'youtube', 'custom'];

  /* Key TIDAK disimpan dalam localStorage.
   * - Web: hanya dalam memori (hilang bila tab ditutup).
   * - App Windows (Electron): disimpan disulitkan melalui OS (safeStorage). */
  const mem = {};
  P.native = () => !!(window.gsNative && window.gsNative.isNative);

  P.loadKeys = async function () {
    if (!P.native()) return;
    for (const id of P.order.concat(['chat-youtube', 'chat-facebook', 'tts-elevenlabs'])) {
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

  /* kad platform (digunakan dalam wizard) */
  P.renderCards = function (root, onChange) {
    root.innerHTML = '';
    P.order.forEach((id) => {
      const def = P.defs[id], cfg = GS.state.platforms[id];
      const status = h('span', { class: 'pf-status' });
      const upd = () => {
        const v = P.validate(id);
        status.textContent = GS.t(v.off ? 'Tidak digunakan' : v.msg);
        status.className = 'pf-status ' + (v.off ? 'off' : v.ok ? 'ok' : 'bad');
        card.classList.toggle('on', cfg.enabled);
        if (onChange) onChange();
      };
      const keyInput = h('input', { type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: 'Stream key', value: P.getKey(id), 'aria-label': GS.t('Stream key {0}', GS.t(def.name)),
        onInput: (e) => {
          P.setKey(id, e.target.value);
          // memasukkan key = mahu guna platform ini (tidak perlu menghidupkan suis lagi)
          if (e.target.value.trim() && !cfg.enabled) { cfg.enabled = true; toggleIn.checked = true; GS.save(); }
          upd();
        } });
      const toggleIn = h('input', { type: 'checkbox', checked: cfg.enabled, onChange: (e) => { cfg.enabled = e.target.checked; GS.save(); upd(); } });
      const toggle = h('label', { class: 'switch' }, toggleIn, h('i'));
      const card = h('div', { class: 'pf-card' + (cfg.enabled ? ' on' : ''), style: { '--pf': def.color } },
        h('div', { class: 'pf-head' },
          h('span', { class: 'pf-dot' }),
          h('strong', null, def.name),
          status,
          toggle),
        h('div', { class: 'pf-body' },
          h('label', { class: 'field' }, h('span', null, def.needsServer ? 'Server URL (wajib)' : 'Server URL (pilihan)'),
            h('input', { type: 'text', spellcheck: 'false', placeholder: def.defaultServer || 'rtmp://…', value: cfg.server || '', onInput: (e) => { cfg.server = e.target.value; GS.save(); upd(); } }),
            h('small', null, def.serverHint)),
          h('label', { class: 'field' }, h('span', null, def.needsServer ? 'Stream Key (wajib)' : 'Stream Key (wajib, sahaja ini perlu)'),
            h('div', { class: 'key-row' }, keyInput,
              h('button', { type: 'button', class: 'icon-btn', title: 'Tunjuk / sembunyi key', onClick: () => { keyInput.type = keyInput.type === 'password' ? 'text' : 'password'; }, html: icon('eye', 16) })),
            h('small', null, def.keyHint))));
      root.append(card);
      upd();
    });
    root.append(h('p', { class: 'muted note' }, P.native()
      ? 'Key disimpan disulitkan pada PC ini dan tidak dihantar ke mana-mana pelayan kami.'
      : 'Mod web: key hanya disimpan dalam memori tab ini dan hilang bila ditutup. Pasang app Windows untuk simpanan selamat.'));
  };
})();
