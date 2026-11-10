/* Global Streamer - aliran Go Live (wizard), siaran, rakaman & tetapan */
(function () {
  'use strict';
  const { h, icon } = GS;
  const L = (GS.live = { state: 'idle', startedAt: 0, targets: [], status: {}, demo: false });
  const R = (GS.rec = { active: false, startedAt: 0 });
  const native = () => !!(window.gsNative && window.gsNative.isNative);

  /* ---------- aliran output ---------- */
  function outputStream() {
    GS.audio.ensure();
    const cv = GS.app.programComp.canvas;
    const vs = cv.captureStream(GS.state.settings.fps);
    return new MediaStream([...vs.getVideoTracks(), ...GS.audio.dest.stream.getAudioTracks()]);
  }
  function pickMime() {
    const list = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm'];
    return list.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
  }
  function makeRecorder(stream) {
    const s = GS.state.settings;
    return new MediaRecorder(stream, { mimeType: pickMime(), videoBitsPerSecond: s.vbitrate * 1000, audioBitsPerSecond: s.abitrate * 1000 });
  }

  /* ---------- rakaman tempatan ----------
   * Mod: 'program' = apa yang penonton nampak; 'screen' = SELURUH skrin (semua aplikasi di luar app ini juga dirakam, app ini boleh
   * dikecilkan/ditinggalkan); 'window' = satu tetingkap tertentu. Audio: mixer (mikrofon yang dibersihkan, bunyi game, suara bot)
   * dan, jika dipilih, bunyi komputer. Bunyi efek (beep) tidak dirakam secara lalai supaya suara kekal jelas. */
  let recorder = null, recChunks = [], recCleanup = null, recChain = Promise.resolve(), recToDisk = false;
  R.modes = { program: 'Paparan penonton (Program)', screen: 'Seluruh skrin (semua aplikasi)', window: 'Satu tetingkap' };
  R.mode = () => (R.modes[GS.state.settings.recMode] ? GS.state.settings.recMode : 'program');
  R.toggle = function () { return R.active ? R.stop() : R.start(); };

  /** Aliran video+audio untuk mod yang dipilih. Mengembalikan {stream, cleanup}. */
  async function recordingSource(mode) {
    GS.audio.ensure();
    if (mode === 'program') return { stream: outputStream(), cleanup() { /* tiada */ } };
    const A = GS.audio, st = GS.state.settings;
    const sysAudio = !!st.recSystemAudio;
    if (native() && window.gsNative.sources) {
      let id = '';
      if (mode === 'screen') {
        const list = await window.gsNative.sources.list();
        const screens = list.filter((x) => x.kind === 'screen');
        id = screens.length === 1 ? screens[0].id : await GS.media.pickScreen({ screensOnly: true });
      } else id = await GS.media.pickScreen({ windowOnly: true });
      if (!id) { const e = new Error('dibatalkan'); e.name = 'NotAllowedError'; throw e; }
      await window.gsNative.sources.select(id, { audio: sysAudio });
    }
    const vc = { frameRate: { ideal: 30, max: 60 }, displaySurface: mode === 'screen' ? 'monitor' : 'window' };
    const dm = await navigator.mediaDevices.getDisplayMedia({ video: vc, audio: sysAudio });
    const vtrack = dm.getVideoTracks()[0];
    const mix = A.ctx.createMediaStreamDestination();
    A.master.connect(mix);                       // campuran mixer (mikrofon, game, suara bot)
    let sys = null;
    const at = dm.getAudioTracks();
    if (at.length) { sys = A.ctx.createMediaStreamSource(new MediaStream(at)); sys.connect(mix); }   // bunyi komputer
    vtrack.addEventListener('ended', () => { if (R.active) R.stop(); });   // pengguna menghentikan perkongsian melalui OS
    return {
      stream: new MediaStream([vtrack, ...mix.stream.getAudioTracks()]),
      cleanup() { try { A.master.disconnect(mix); } catch (e) { /* abaikan */ } try { if (sys) sys.disconnect(); } catch (e) { /* abaikan */ } dm.getTracks().forEach((t) => t.stop()); },
    };
  }

  function makeScreenRecorder(stream) {
    const s = GS.state.settings;
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
    return new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000, audioBitsPerSecond: Math.max(192, s.abitrate || 160) * 1000 });
  }

  R.start = async function (modeArg) {
    if (!window.MediaRecorder) { GS.toast('Pelayar tidak menyokong rakaman.', 'warn'); return false; }
    if (R.active || R.busy) return false;
    const mode = modeArg || R.mode();
    R.busy = true;
    try {
      const src = await recordingSource(mode);
      recCleanup = src.cleanup;
      recChunks = []; recChain = Promise.resolve();
      recorder = mode === 'program' ? makeRecorder(src.stream) : makeScreenRecorder(src.stream);
      recToDisk = false;
      if (native() && window.gsNative.rec) {
        const o = await window.gsNative.rec.open();
        if (!o || !o.ok) { src.cleanup(); throw new Error((o && o.error) || 'tidak dapat membuka fail rakaman'); }
        recToDisk = true; R.file = o.file;
      }
      recorder.ondataavailable = (e) => {
        if (!e.data || !e.data.size) return;
        if (recToDisk) recChain = recChain.then(() => e.data.arrayBuffer()).then((b) => window.gsNative.rec.chunk(b)).catch(() => {});
        else recChunks.push(e.data);
      };
      recorder.onstop = () => finishRecording(mode);
      recorder.start(1000);
      R.active = true; R.mode_ = mode; R.startedAt = Date.now();
      render();
      if (native() && mode !== 'program' && window.gsNative.rec) {
        window.gsNative.rec.bar(true);                                  // bar REC sentiasa di atas (tidak dirakam)
        if (GS.state.settings.recMinimize && window.gsNative.win) setTimeout(() => window.gsNative.win.minimize(), 700);
      }
      GS.toast(GS.t('Merakam: {0}', GS.t(R.modes[mode])), 'ok', 3500);
      return true;
    } catch (e) {
      if (recCleanup) { try { recCleanup(); } catch (e2) { /* abaikan */ } recCleanup = null; }
      if (!(e && e.name === 'NotAllowedError')) GS.toast(GS.t('Gagal mula rakaman: {0}', e.message), 'warn');
      return false;
    } finally { R.busy = false; }
  };

  async function finishRecording(mode) {
    R.active = false;
    try { if (recCleanup) recCleanup(); } catch (e) { /* abaikan */ }
    recCleanup = null;
    if (native() && window.gsNative.rec) { window.gsNative.rec.bar(false); if (window.gsNative.win) window.gsNative.win.restore(); }
    render();
    if (recToDisk) {
      await recChain;
      GS.toast(GS.t('Menyimpan rakaman…'), 'info', 2500);
      const r = await window.gsNative.rec.close();
      if (r && r.ok) { GS.toast(GS.t('Rakaman disimpan: {0}', r.file), 'ok', 9000); window.gsNative.rec.reveal(r.file); R.lastFile = r.file; }
      else GS.toast(GS.t('Gagal simpan rakaman: {0}', (r && r.error) || ''), 'warn');
      return;
    }
    const blob = new Blob(recChunks, { type: 'video/webm' });
    recChunks = [];
    const d = new Date();
    const name = 'GlobalStreamer-' + d.getFullYear() + GS.pad(d.getMonth() + 1) + GS.pad(d.getDate()) + '-' + GS.pad(d.getHours()) + GS.pad(d.getMinutes()) + '.webm';
    const a = h('a', { href: URL.createObjectURL(blob), download: name });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    GS.toast(GS.t('Rakaman disimpan: {0}', name), 'ok');
  }

  R.stop = function () {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    else if (R.active) finishRecording(R.mode_);
  };

  /** Menu pilihan rakaman (di sebelah butang REC). */
  R.openMenu = function () {
    GS.$$('.popover').forEach((p) => p.remove());
    const st = GS.state.settings;
    const pop = h('div', { class: 'popover rec-pop', role: 'menu' });
    const item = (label, sub, on, run) => h('button', { type: 'button', class: 'pop-item' + (on ? ' on' : ''), role: 'menuitemradio', 'aria-checked': on ? 'true' : 'false', onClick: () => { close(); run(); } },
      h('span', null, GS.t(label), sub ? h('small', null, GS.t(sub)) : null));
    const cur = R.mode();
    ['program', 'screen', 'window'].forEach((m) => pop.append(item(R.modes[m], { program: 'Apa yang penonton nampak, dengan template dan efek', screen: 'Semua yang ada pada skrin: buka mana-mana aplikasi, YouTube, presentation', window: 'Hanya satu aplikasi/tetingkap yang dipilih' }[m], cur === m, () => { st.recMode = m; GS.save(); render(); })));
    pop.append(h('hr'));
    pop.append(item('Rakam bunyi komputer', 'Bunyi daripada aplikasi lain (guna fon kepala supaya tidak berdengung dengan mikrofon)', !!st.recSystemAudio, () => { st.recSystemAudio = !st.recSystemAudio; GS.save(); }));
    pop.append(item('Kecilkan Global Streamer semasa rakam skrin', 'Bar REC kecil sentiasa di atas: tekan "Henti & simpan" bila siap', !!st.recMinimize, () => { st.recMinimize = !st.recMinimize; GS.save(); }));
    document.body.append(pop);
    const anchor = GS.$('#btnRecMode'), r = anchor.getBoundingClientRect(), pr = pop.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(window.innerWidth - pr.width - 8, r.right - pr.width)) + 'px';
    pop.style.top = (r.bottom + 8) + 'px';
    requestAnimationFrame(() => pop.classList.add('in'));
    function close() { pop.classList.remove('in'); setTimeout(() => pop.remove(), 200); document.removeEventListener('pointerdown', away, true); }
    function away(ev) { if (!pop.contains(ev.target) && ev.target !== anchor) close(); }
    setTimeout(() => document.addEventListener('pointerdown', away, true), 0);
  };
  if (window.gsNative && window.gsNative.rec) window.gsNative.rec.onStopRequest(() => R.stop());

  /* ---------- siaran ---------- */
  L.start = async function () {
    const targets = GS.platforms.targets();
    const enabled = GS.platforms.enabledIds();
    if (!enabled.length) { GS.toast('Pilih sekurang-kurangnya satu platform.', 'warn'); return false; }
    if (native() && !targets.length) { GS.toast('Server URL / stream key belum lengkap.', 'warn'); return false; }
    L.demo = !native();
    L.targets = L.demo ? enabled.map((id) => ({ id, name: GS.platforms.ensureDef(id).name })) : targets;
    L.status = {};
    L.targets.forEach((t) => (L.status[t.id] = 'connecting'));
    L.state = 'connecting';
    render();
    if (L.demo) {
      // MOD DEMO: tiada data dihantar ke mana-mana platform
      L.targets.forEach((t, i) => setTimeout(() => { if (L.state === 'idle') return; L.status[t.id] = 'live'; if (i === L.targets.length - 1) { L.state = 'live'; L.startedAt = Date.now(); } render(); }, 900 + i * 700));
      GS.toast('Mod demo web: tiada siaran sebenar dihantar. Pasang app Windows untuk live sebenar.', 'info', 5200);
      return true;
    }
    try {
      const s = GS.state.settings;
      L.stats = null;
      L.encoder = null;
      await window.gsNative.stream.start({ targets: L.targets, width: s.width, height: s.height, fps: s.fps, vbitrate: s.vbitrate, abitrate: s.abitrate, encoder: s.encoder || 'auto' });
      recorder = makeRecorder(outputStream());
      // urutan chunk mesti dikekalkan: rantai janji supaya tidak bertukar tertib
      let chain = Promise.resolve();
      recorder.ondataavailable = (e) => {
        if (!e.data || !e.data.size) return;
        chain = chain.then(() => e.data.arrayBuffer()).then((buf) => window.gsNative.stream.chunk(buf)).catch(() => {});
      };
      recorder.start(250);
      // status "live" menunggu isyarat 'started' daripada enjin (bingkai pertama dihasilkan)
      clearTimeout(L.startTimer);
      L.startTimer = setTimeout(() => {
        if (L.state === 'connecting') { GS.toast('Tiada bingkai dihasilkan dalam 20 saat. Semak sumber video dan sambungan.', 'warn', 7000); L.stop(); }
      }, 20000);
      return true;
    } catch (e) {
      L.state = 'idle';
      render();
      GS.toast(GS.t('Gagal mula siaran: {0}', e.message), 'warn', 6000);
      return false;
    }
  };

  /** Butang MULA LIVE: jika platform yang dihidupkan sudah lengkap (key dimasukkan di panel chat), terus live.
   *  Jika belum, panel chat dibuka pada platform yang kurang dan mesej menyatakan apa yang perlu diisi. */
  L.quickStart = async function () {
    GS.audio.ensure();
    const P = GS.platforms;
    const enabled = P.enabledIds();
    const bad = enabled.filter((id) => !P.validate(id).ok);
    if (!enabled.length || bad.length) {
      const target = bad[0] || P.order[0];
      if (GS.chat && GS.chat.focusPlatform) GS.chat.focusPlatform(target);
      GS.toast(bad.length ? bad.map((id) => GS.t(P.ensureDef(id).name) + ': ' + GS.t(P.validate(id).msg)).join(' · ') : GS.t('Masukkan Stream Key (dan Server URL jika diminta) pada TikTok, Facebook atau YouTube di panel Chat, kemudian tekan MULA LIVE.'), 'warn', 7000);
      return false;
    }
    return L.start();
  };

  L.stop = async function () {
    if (L.state === 'idle') return;
    try {
      if (!L.demo) {
        if (recorder && recorder.state !== 'inactive' && !R.active) recorder.stop();
        await window.gsNative.stream.stop();
      }
    } catch (e) { console.warn(e); }
    L.state = 'idle';
    L.status = {};
    render();
    GS.toast('Siaran ditamatkan.', 'info');
  };

  /* peristiwa daripada enjin siaran (app Windows) */
  function endLive(why) {
    clearTimeout(L.startTimer);
    if (recorder && recorder.state !== 'inactive' && !R.active) { try { recorder.stop(); } catch (e) { /* abaikan */ } }
    L.state = 'idle';
    L.status = {};
    L.stats = null;
    render();
    if (why) GS.toast(why, 'warn', 8000);
  }
  /* mesej enjin mengikut kod supaya boleh diterjemah */
  function engMsg(ev) {
    switch (ev.code) {
      case 'slow': return GS.t('Pengekod tidak sempat mengejar (kelajuan {0}×). Turunkan resolusi/FPS atau guna pengekod perkakasan.', Number(ev.speed).toFixed(2));
      case 'encoder-fallback': return GS.t('{0} tidak dapat dimulakan, beralih ke {1}.', ev.from, ev.to);
      case 'buffer-full': return GS.t('Pengekod terlalu perlahan (penimbal penuh). Siaran dihentikan.');
      case 'spawn': return GS.t('FFmpeg gagal dimulakan: {0}', ev.detail);
      case 'exit': return GS.t('FFmpeg berhenti (kod {0}). {1}', ev.exitCode, ev.detail);
      default: return ev.message;
    }
  }
  L.onEngineEvent = function (ev) {
    switch (ev.type) {
      case 'encoder':
        L.encoder = ev.label;
        if (ev.fellBack) GS.toast(GS.t('Pengekod perkakasan tidak tersedia. Menggunakan {0}.', ev.label), 'info', 5000);
        break;
      case 'started':
        clearTimeout(L.startTimer);
        L.targets.forEach((t) => { if (L.status[t.id] !== 'failed') L.status[t.id] = 'live'; });
        L.state = 'live';
        L.startedAt = Date.now();
        render();
        GS.toast(GS.t('Siaran bermula ({0}).', L.encoder || GS.t('Pengekod').toLowerCase()), 'ok');
        break;
      case 'stats':
        L.stats = ev;
        break;
      case 'target':
        if (ev.state === 'reconnecting') {
          if (ev.id) L.status[ev.id] = 'reconnecting';
          render();
          if (ev.attempt === 1 || ev.attempt % 5 === 0) GS.toast(GS.t('{0}: menyambung semula dalam {1} saat (percubaan {2})…', ev.name || 'Platform', ev.nextIn, ev.attempt), 'info', 5000);
          break;
        }
        if (ev.state === 'live') {
          if (ev.id) L.status[ev.id] = 'live';
          render();
          GS.toast(GS.t('{0} bersambung semula.', ev.name || 'Platform'), 'ok', 4000);
          break;
        }
        if (ev.id) L.status[ev.id] = 'failed';
        render();
        if (!ev.reconnect) GS.toast(GS.t('{0} terputus atau gagal disambung: {1}', ev.name || 'Platform', ev.message), 'warn', 8000);
        if (ev.remaining === 0) endLive('Semua destinasi gagal. Semak Server URL dan Stream Key.');
        break;
      case 'warn':
        GS.toast(engMsg(ev), 'warn', 7000);
        break;
      case 'error':
        endLive(GS.t('Ralat siaran: {0}', engMsg(ev)));
        break;
      case 'ended':
        if (L.state !== 'idle') endLive('');
        break;
      default:
        break;
    }
  };
  if (window.gsNative && window.gsNative.onStreamEvent) window.gsNative.onStreamEvent(L.onEngineEvent);

  /* ---------- kemas kini bar atas ---------- */
  function render() {
    const live = GS.$('#btnLive'), rec = GS.$('#btnRec');
    if (!live) return;
    const on = L.state !== 'idle';
    live.classList.toggle('live', on);
    live.innerHTML = on ? icon('stop', 16) + '<span>' + GS.t(L.state === 'connecting' ? 'MENYAMBUNG…' : 'TAMAT LIVE') + '</span>' : icon('play', 16) + '<span>' + GS.t('MULA LIVE') + '</span>';
    rec.classList.toggle('rec', R.active);
    rec.innerHTML = icon(R.active ? 'stop' : 'rec', 16) + '<span>' + (R.active ? 'STOP REC' : 'REC') + '</span>';
    rec.title = R.active ? GS.t('Henti dan simpan rakaman') : GS.t('Rakam: {0}', GS.t(R.modes[R.mode()]));
    const rm = GS.$('#btnRecMode'); if (rm) { rm.disabled = R.active; rm.classList.toggle('rec', R.active); }
    const chips = GS.$('#platformChips');
    chips.innerHTML = '';
    Object.keys(L.status).forEach((id) => {
      const d = GS.platforms.ensureDef(id);
      chips.append(h('span', { class: 'chip pf ' + L.status[id], style: { '--pf': d.color }, title: GS.t(d.name) + ' · ' + GS.t({ connecting: 'Menyambung', live: 'Live', failed: 'Gagal', reconnecting: 'Menyambung semula' }[L.status[id]] || L.status[id]) }, h('i'), d.name.split(' ')[0]));
    });
  }
  L.render = render;

  setInterval(() => {
    const lt = GS.$('#liveTimer'), rt = GS.$('#recTimer');
    if (lt) {
      lt.parentElement.classList.toggle('hidden', L.state !== 'live');
      if (L.state === 'live') lt.textContent = GS.fmtDur((Date.now() - L.startedAt) / 1000);
    }
    if (rt) {
      rt.parentElement.classList.toggle('hidden', !R.active);
      if (R.active) rt.textContent = GS.fmtDur((Date.now() - R.startedAt) / 1000);
    }
    const ec = GS.$('#encChip');
    if (ec) {
      const show = L.state === 'live' && !L.demo && L.stats;
      ec.classList.toggle('hidden', !show);
      if (show) {
        const s = L.stats;
        ec.textContent = (L.encoder || GS.t('Pengekod')) + ' · ' + s.fps + ' fps' + (s.speed ? ' · ' + s.speed.toFixed(2) + '×' : '') + ' · drop ' + s.drop;
        ec.classList.toggle('warn', s.speed != null && s.speed < 0.9);
      }
    }
  }, 500);

  /* ================== TETAPAN ================== */
  L.openSettings = function () {
    const s = GS.state.settings;
    const sel = (key, opts, parse = Number) => h('select', { onChange: (e) => { s[key] = parse(e.target.value); GS.save(); if (key === 'width') applyRes(); } },
      opts.map(([v, l]) => h('option', { value: v, selected: String(s[key]) === String(v) }, l)));
    const applyRes = () => { s.height = Math.round((s.width * GS.design.h) / GS.design.w); GS.app.applyResolution(); };
    let bitrateIn;
    const body = h('div', { class: 'settings' },
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
        h('label', { class: 'field' }, h('span', null, 'Bingkai sesaat (FPS)'), sel('fps', [[30, '30 fps'], [60, '60 fps']])),
        h('label', { class: 'field' }, h('span', null, 'Bitrate video (kbps)'), (bitrateIn = h('input', { type: 'number', min: 500, max: 60000, step: 500, value: s.vbitrate, onChange: (e) => { s.vbitrate = GS.clamp(Number(e.target.value) || 6000, 500, 60000); GS.save(); } }))),
        h('label', { class: 'field' }, h('span', null, 'Bitrate audio (kbps)'), sel('abitrate', [[96, '96'], [128, '128'], [160, '160'], [192, '192'], [320, '320']])),
        h('label', { class: 'field span2' }, h('span', null, 'Pengekod video (app Windows)'), sel('encoder', [['auto', 'Auto (GPU jika ada, sandaran CPU)'], ['x264', 'CPU (x264)'], ['nvenc', 'NVIDIA NVENC'], ['qsv', 'Intel Quick Sync'], ['amf', 'AMD AMF']], String))),
      h('p', { class: 'muted note' }, 'TikTok dan Facebook biasanya menghadkan 1080p. 4K hanya sesuai untuk YouTube dan memerlukan PC yang kuat.'),
      h('h3', null, 'Audio dan rakaman'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'optVoiceClean', checked: GS.state.audio.voiceClean !== false, onChange: (e) => {
        GS.state.audio.voiceClean = e.target.checked; GS.save();
        GS.audio.channels.forEach((c) => { if (c.kind === 'input' && c.stream) GS.audio.connectDevice(c.id, c.deviceId, true); }); // guna semula dengan/ tanpa penapis
      } }), 'Suara jelas: tapis bunyi latar, gema dan kelantangan mikrofon (disyorkan)'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'optSfxStream', checked: !!GS.state.audio.sfxInStream, onChange: (e) => { GS.state.audio.sfxInStream = e.target.checked; GS.save(); GS.audio.applyRouting(); } }), 'Masukkan bunyi efek (beep) ke dalam siaran dan rakaman'),
      h('p', { class: 'muted note' }, 'Lalai: bunyi efek hanya didengar oleh anda, supaya suara dalam siaran dan rakaman kekal jelas. Suara bot/pengumum sentiasa masuk. Jika anda menggunakan pembesar suara (bukan fon kepala), mikrofon boleh menangkap bunyi dari pembesar suara dan menyebabkan suara bergema; gunakan fon kepala untuk kejelasan terbaik.'),
      h('h3', null, 'Susun atur panel'),
      h('p', { class: 'muted note' }, 'Tarik pemisah antara panel (Scene, Sumber, Sifat, Audio Mixer, Template, panel kanan) untuk laras saiz, dan tarik tajuk panel untuk menukar kedudukannya. Panel kekal dalam app dan tidak boleh dikeluarkan atau dihilangkan. Klik dua kali pada pemisah untuk lalai.'),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn ghost', id: 'btnLayoutReset', onClick: () => GS.layout.resetAll() }, 'Tetapkan semula susun atur panel')),
      GS.updater.section(),
      h('h3', null, 'Peralihan scene (Mod Studio)'),
      h('div', { class: 'grid2' },
        h('label', { class: 'field' }, h('span', null, 'Jenis'), sel('transition', [['fade', 'Pudar'], ['slide', 'Luncur'], ['cut', 'Potong']], String)),
        h('label', { class: 'field' }, h('span', null, 'Tempoh (ms)'), h('input', { type: 'number', min: 100, max: 3000, step: 100, value: s.transitionMs, onChange: (e) => { s.transitionMs = GS.clamp(Number(e.target.value) || 500, 100, 3000); GS.save(); } }))),
      h('h3', null, 'Pintasan papan kekunci'),
      h('ul', { class: 'hotkeys' },
        GS.games[GS.state.game].effects.map((fx) => h('li', null, h('kbd', null, 'Alt + ' + fx.hotkey), fx.label)),
        h('li', null, h('kbd', null, 'Delete'), 'Padam sumber dipilih'),
        h('li', null, h('kbd', null, 'Anak panah'), 'Gerak sumber (Shift = lebih jauh)')),
      h('h3', null, 'Data'),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn danger', onClick: () => { if (confirm(GS.t('Padam SEMUA tetapan, scene dan data tempatan?'))) GS.resetState(); } }, 'Set semula semua data')),
      h('p', { class: 'muted note' }, GS.t('Global Streamer v{0} · {1}', GS.version, GS.t(native() ? 'App Windows' : 'Versi web (demo)'))));
    GS.modal({ title: 'Tetapan', body });
  };
})();
