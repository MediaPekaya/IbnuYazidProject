/* Global Streamer - Tetapan dengan bahagian berasingan: Umum, Audio, Mod Aplikasi, Kemaskini, Papan Kekunci. */
(function () {
  'use strict';
  const { h } = GS;
  const native = () => !!(window.gsNative && window.gsNative.isNative);

  /* ---------- mod aplikasi (paparan antara muka), disimpan automatik ---------- */
  const MODES = [
    { id: 'hologram', name: 'Hologram', desc: 'Biru tua bercahaya dengan gradien (asal).', sw: ['#07111f', '#2ea8ff', '#ff3b5c'] },
    { id: 'formal-white', name: 'Formal Putih', desc: 'Latar putih, kemas dan rata (2D).', sw: ['#f3f5f9', '#ffffff', '#1d4fd8'] },
    { id: 'formal-gray', name: 'Formal Kelabu', desc: 'Kelabu cerah, rata dan teratur (2D).', sw: ['#dfe3ea', '#eef0f4', '#374151'] },
    { id: 'formal-dark', name: 'Formal Gelap', desc: 'Kelabu arang, rata tanpa cahaya (2D).', sw: ['#15171c', '#20232a', '#4c8dff'] },
    { id: 'formal-blue', name: 'Formal Biru', desc: 'Biru tua rata tanpa cahaya (2D).', sw: ['#0f1b33', '#18284a', '#3b82f6'] },
    { id: 'formal-green', name: 'Formal Hijau', desc: 'Hijau hutan tua rata tanpa cahaya (2D).', sw: ['#0d1f18', '#16302a', '#22c55e'] },
    { id: 'formal-purple', name: 'Formal Ungu', desc: 'Ungu tua rata tanpa cahaya (2D).', sw: ['#1a1230', '#271c48', '#a78bfa'] },
    { id: 'formal-wine', name: 'Formal Anggur', desc: 'Merah anggur tua rata tanpa cahaya (2D).', sw: ['#220d16', '#341522', '#f43f5e'] },
    { id: 'formal-gold', name: 'Formal Hitam Emas', desc: 'Hitam dengan aksen emas, rata tanpa cahaya (2D).', sw: ['#0c0c0c', '#1a1a17', '#f5b301'] },
  ];
  const M = (GS.appModes = { list: MODES });
  M.apply = function (id) {
    const m = MODES.find((x) => x.id === id) || MODES[0];
    document.documentElement.dataset.appmode = m.id;
    return m;
  };
  M.set = function (id) {
    const m = M.apply(id);
    GS.state.settings.appMode = m.id;
    GS.save();
    if (GS.saveNow) GS.saveNow();            // simpan serta-merta: pilihan kekal walaupun app ditutup
    GS.emit('appmode:changed', m.id);
  };
  M.apply((GS.state.settings && GS.state.settings.appMode) || 'hologram');

  const fpsList = [[30, '30 fps'], [60, '60 fps'], [120, '120 fps'], [200, '200 fps']];
  GS.fpsList = fpsList.map((x) => x[0]);

  function version() {
    const u = GS.updater && GS.updater.info;
    return (u && u.version) || GS.version || '';
  }

  GS.live.openSettings = function () {
    const s = GS.state.settings;
    const sel = (key, opts, parse = Number) => h('select', { onChange: (e) => { s[key] = parse(e.target.value); GS.save(); if (key === 'fps') GS.app.applyResolution(); } },
      opts.map(([v, l]) => h('option', { value: v, selected: String(s[key]) === String(v) }, l)));
    const applyRes = () => { s.height = Math.round((s.width * GS.design.h) / GS.design.w); GS.app.applyResolution(); };
    let bitrateIn;

    /* ===== UMUM ===== */
    /* Ad Block: butang merah (logo perisai + AD) bersama butang tetapan semula susun atur */
    const adOn = () => GS.state.settings.adBlock !== false;
    const adBtn = h('button', { type: 'button', class: 'btn danger', id: 'btnAdBlock', style: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#d62b2b', borderColor: '#d62b2b', color: '#fff' } });
    const adPaint = () => {
      adBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z" fill="#fff"/><text x="12" y="15.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="8.5" font-weight="900" fill="#d62b2b">AD</text><path d="M6 6l12 12" stroke="#d62b2b" stroke-width="2.2" stroke-linecap="round"/></svg><span>' + GS.t('Ad Block') + ' · ' + GS.t(adOn() ? 'HIDUP' : 'MATI') + '</span>';
      adBtn.style.opacity = adOn() ? '1' : '0.6';
    };
    adBtn.addEventListener('click', () => {
      GS.state.settings.adBlock = !adOn(); GS.save(); adPaint();
      if (window.gsNative && window.gsNative.adblock) window.gsNative.adblock.set(adOn()).catch(() => {});
    });
    adPaint();

    const umum = h('div', { class: 'set-pane' },
      h('h3', null, 'Bahasa'),
      h('div', { class: 'grid2' },
        h('label', { class: 'field' }, h('span', null, 'Bahasa antara muka'), h('select', { onChange: (e) => { if (GS.i18n.setLang(e.target.value) === false) e.target.value = GS.state.lang; } },
          [['ms', 'Bahasa Melayu'], ['en', 'English']].map(([v, l]) => h('option', { value: v, selected: GS.state.lang === v }, l)))),
        h('label', { class: 'field' }, h('span', null, 'Bahasa overlay siaran'), h('select', { onChange: (e) => GS.i18n.setOverlayLang(e.target.value) },
          [['auto', 'Ikut bahasa antara muka'], ['ms', 'Bahasa Melayu'], ['en', 'English']].map(([v, l]) => h('option', { value: v, selected: GS.state.overlayLang === v }, l))))),
      h('p', { class: 'muted note' }, 'Teks pada skrin siaran (cth "MASA MAIN", efek) menggunakan bahasa overlay. Menukar bahasa antara muka memuat semula halaman.'),
      h('h3', null, 'Output video'),
      h('div', { class: 'grid2' },
        h('label', { class: 'field' }, h('span', null, 'Orientasi siaran'), h('select', { onChange: (e) => { if (!GS.formats.set(e.target.value)) e.target.value = GS.orient(); } }, [['portrait', 'Menegak 9:16 (TikTok LIVE)'], ['landscape', 'Mendatar 16:9 (YouTube / Facebook)']].map(([v, l]) => h('option', { value: v, selected: GS.orient() === v }, l)))),
        h('label', { class: 'field' }, h('span', null, 'Resolusi'), h('select', { onChange: (e) => { GS.sizes.apply(Number(e.target.value)); bitrateIn.value = s.vbitrate; } }, GS.sizes.list().map((z) => h('option', { value: z.w, selected: s.width === z.w }, GS.sizes.label(z))))),
        h('label', { class: 'field' }, h('span', null, 'Bingkai sesaat (FPS)'), sel('fps', fpsList)),
        h('label', { class: 'field' }, h('span', null, 'Bitrate video (kbps)'), (bitrateIn = h('input', { type: 'number', min: 500, max: 60000, step: 500, value: s.vbitrate, onChange: (e) => { s.vbitrate = GS.clamp(Number(e.target.value) || 6000, 500, 60000); GS.save(); } }))),
        h('label', { class: 'field' }, h('span', null, 'Bitrate audio (kbps)'), sel('abitrate', [[96, '96'], [128, '128'], [160, '160'], [192, '192'], [320, '320']])),
        h('label', { class: 'field span2' }, h('span', null, 'Pengekod video (app Windows)'), sel('encoder', [['auto', 'Auto (GPU jika ada, sandaran CPU)'], ['x264', 'CPU (x264)'], ['nvenc', 'NVIDIA NVENC'], ['qsv', 'Intel Quick Sync'], ['amf', 'AMD AMF']], String))),
      h('p', { class: 'muted note' }, 'TikTok dan Facebook biasanya menghadkan 1080p. 4K hanya sesuai untuk YouTube dan memerlukan PC yang kuat. 120 dan 200 FPS memerlukan skrin dan PC yang menyokongnya serta bitrate yang lebih tinggi; kebanyakan platform siaran hanya menerima sehingga 60 FPS.'),
      h('h3', null, 'Peralihan scene (Mod Studio)'),
      h('div', { class: 'grid2' },
        h('label', { class: 'field' }, h('span', null, 'Jenis'), sel('transition', [['fade', 'Pudar'], ['slide', 'Luncur'], ['cut', 'Potong']], String)),
        h('label', { class: 'field' }, h('span', null, 'Tempoh (ms)'), h('input', { type: 'number', min: 50, max: 10000, step: 50, value: s.transitionMs, onChange: (e) => { s.transitionMs = GS.clamp(Number(e.target.value) || 500, 50, 10000); GS.save(); } }))),
      h('h3', null, 'Susun atur panel'),
      h('p', { class: 'muted note' }, 'Tarik pemisah antara panel (Scene, Sumber, Sifat, Audio Mixer, Template, panel kanan) untuk laras saiz, dan tarik tajuk panel untuk menukar kedudukannya. Panel kekal dalam app dan tidak boleh dikeluarkan atau dihilangkan. Klik dua kali pada pemisah untuk lalai.'),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn ghost', id: 'btnLayoutReset', onClick: () => GS.layout.resetAll() }, 'Tetapkan semula susun atur panel'), adBtn),
      h('h3', null, 'Data'),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn danger', onClick: async () => { if (await GS.ask(GS.t('Padam SEMUA tetapan, scene dan data tempatan?'), { danger: true })) GS.resetState(); } }, 'Set semula semua data')));

    /* ===== AUDIO ===== */
    const audio = h('div', { class: 'set-pane' },
      h('h3', null, 'Audio dan rakaman'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'optVoiceClean', checked: GS.state.audio.voiceClean !== false, onChange: (e) => {
        GS.state.audio.voiceClean = e.target.checked; GS.save();
        GS.audio.channels.forEach((c) => { if (c.kind === 'input' && c.stream) GS.audio.connectDevice(c.id, c.deviceId, true); });
      } }), 'Suara jelas: tapis bunyi latar, gema dan kelantangan mikrofon (disyorkan)'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'optRecDenoise', checked: GS.state.audio.recDenoise !== false, onChange: (e) => { GS.state.audio.recDenoise = e.target.checked; GS.save(); } }), 'Rakaman: buang semua bunyi latar secara automatik, hanya suara anda yang kekal (disyorkan)'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'optSfxStream', checked: !!GS.state.audio.sfxInStream, onChange: (e) => { GS.state.audio.sfxInStream = e.target.checked; GS.save(); GS.audio.applyRouting(); } }), 'Masukkan bunyi efek (beep) ke dalam siaran dan rakaman'),
      h('p', { class: 'muted note' }, 'Lalai: bunyi efek hanya didengar oleh anda, supaya suara dalam siaran dan rakaman kekal jelas. Suara bot/pengumum sentiasa masuk. Jika anda menggunakan pembesar suara (bukan fon kepala), mikrofon boleh menangkap bunyi dari pembesar suara dan menyebabkan suara bergema; gunakan fon kepala untuk kejelasan terbaik.'),
      h('p', { class: 'muted note' }, 'Lagu sendiri: tekan "+ Lagu" pada Audio Mixer untuk memilih lagu daripada komputer.'));

    /* ===== MOD APLIKASI ===== */
    const cur = () => (GS.state.settings.appMode || 'hologram');
    const grid = h('div', { class: 'mode-grid' });
    const paint = () => {
      grid.innerHTML = '';
      MODES.forEach((m) => grid.append(h('button', { type: 'button', class: 'mode-card' + (cur() === m.id ? ' on' : ''), 'data-mode': m.id, onClick: () => { M.set(m.id); paint(); GS.toast(GS.t('Mod "{0}" digunakan dan disimpan.', GS.t(m.name)), 'ok'); } },
        h('span', { class: 'mode-sw' }, m.sw.map((c) => h('i', { style: { background: c } }))),
        h('b', null, GS.t(m.name)), h('small', null, GS.t(m.desc)))));
    };
    paint();
    const mod = h('div', { class: 'set-pane' },
      h('h3', null, 'Mod aplikasi'),
      h('p', { class: 'muted note' }, 'Pilih rupa antara muka aplikasi. Mod Formal ialah paparan 2D yang rata dan teratur tanpa cahaya hologram. Pilihan disimpan secara automatik dan kekal selepas aplikasi ditutup dan dibuka semula.'),
      grid);

    /* ===== KEMASKINI ===== */
    const lang = GS.state.lang === 'en' ? 'en' : 'ms';
    const log = (window.GS_CHANGELOG && window.GS_CHANGELOG.current && window.GS_CHANGELOG.current[lang]) || [];
    const verEl = h('span', { class: 'ver-badge' }, version() ? 'v' + version() : '');
    if (native() && window.gsNative.app && window.gsNative.app.info) window.gsNative.app.info().then((i) => { if (i && i.version) verEl.textContent = 'v' + i.version; });
    const kemaskini = h('div', { class: 'set-pane' },
      h('h3', null, lang === 'en' ? 'Version update' : 'Kemaskini versi'),
      h('div', { class: 'ver-line' }, h('b', null, lang === 'en' ? 'Current version' : 'Versi semasa'), ' ', verEl),
      h('h3', null, lang === 'en' ? 'Changes in this version' : 'Perubahan dalam versi ini'),
      h('ul', { class: 'changelog' }, log.map((t) => h('li', null, t))),
      GS.updater.section());

    /* ===== PAPAN KEKUNCI ===== */
    const key = (k, t) => h('li', null, h('kbd', null, k), GS.t(t));
    const papan = h('div', { class: 'set-pane' },
      h('h3', null, 'Papan kekunci'),
      h('ul', { class: 'hotkeys' },
        GS.games[GS.state.game].effects.map((fx) => h('li', null, h('kbd', null, 'Alt + ' + fx.hotkey), fx.label)),
        key('Ctrl + A', 'Pilih semua sumber'),
        key('Ctrl + Z', 'Undur (kembali)'),
        key('Ctrl + Y', 'Ulang semula'),
        key('Ctrl + C', 'Salin sumber atau scene'),
        key('Ctrl + V', 'Tampal'),
        key('Delete', 'Padam sumber dipilih'),
        key('↑  ↓  ←  →', 'Gerak sumber ke atas, bawah, kiri dan kanan (Shift = lebih jauh)'),
        key('Ctrl + Alt + H', 'Sembunyi / papar bar rakaman REC'),
        key('Klik kanan', 'Namakan semula, salin atau padam (scene, sumber, audio)')));

    /* ===== tab ===== */
    const tabs = [['umum', 'Umum', umum], ['audio', 'Audio', audio], ['mod', 'Mod aplikasi', mod], ['kemaskini', 'Kemaskini', kemaskini], ['papan', 'Papan kekunci', papan]];
    const panes = h('div', { class: 'set-panes' });
    const bar = h('div', { class: 'set-tabs', role: 'tablist' });
    const show = (id) => {
      tabs.forEach(([k, , el]) => { el.classList.toggle('on', k === id); });
      bar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
      try { sessionStorage.setItem('gs.settingsTab', id); } catch (e) { /* abaikan */ }
    };
    tabs.forEach(([k, label, el]) => { bar.append(h('button', { type: 'button', role: 'tab', 'data-tab': k, onClick: () => show(k) }, GS.t(label))); panes.append(el); });
    let start = 'umum';
    try { start = sessionStorage.getItem('gs.settingsTab') || 'umum'; } catch (e) { /* abaikan */ }
    if (!tabs.some((t) => t[0] === start)) start = 'umum';
    const body = h('div', { class: 'settings' }, bar, panes);
    show(start);
    GS.modal({ title: 'Tetapan', body, wide: true });
  };
})();
