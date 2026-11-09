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

  /* ---------- rakaman tempatan ---------- */
  let recorder = null, recChunks = [];
  R.toggle = function () { return R.active ? R.stop() : R.start(); };
  R.start = function () {
    if (!window.MediaRecorder) { GS.toast('Pelayar tidak menyokong rakaman.', 'warn'); return; }
    try {
      recChunks = [];
      recorder = makeRecorder(outputStream());
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) recChunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(recChunks, { type: 'video/webm' });
        recChunks = [];
        const d = new Date();
        const name = 'GlobalStreamer-' + d.getFullYear() + GS.pad(d.getMonth() + 1) + GS.pad(d.getDate()) + '-' + GS.pad(d.getHours()) + GS.pad(d.getMinutes()) + '.webm';
        const a = h('a', { href: URL.createObjectURL(blob), download: name });
        document.body.append(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        GS.toast('Rakaman disimpan: ' + name, 'ok');
      };
      recorder.start(1000);
      R.active = true;
      R.startedAt = Date.now();
      render();
    } catch (e) {
      GS.toast('Gagal mula rakaman: ' + e.message, 'warn');
    }
  };
  R.stop = function () {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    R.active = false;
    render();
  };

  /* ---------- siaran ---------- */
  L.start = async function () {
    const targets = GS.platforms.targets();
    const enabled = GS.platforms.enabledIds();
    if (!enabled.length) { GS.toast('Pilih sekurang-kurangnya satu platform.', 'warn'); return false; }
    if (native() && !targets.length) { GS.toast('Server URL / stream key belum lengkap.', 'warn'); return false; }
    L.demo = !native();
    L.targets = L.demo ? enabled.map((id) => ({ id, name: GS.platforms.defs[id].name })) : targets;
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
      await window.gsNative.stream.start({ targets: L.targets, width: s.width, height: s.height, fps: s.fps, vbitrate: s.vbitrate, abitrate: s.abitrate });
      recorder = makeRecorder(outputStream());
      recorder.ondataavailable = async (e) => { if (e.data && e.data.size) window.gsNative.stream.chunk(await e.data.arrayBuffer()); };
      recorder.start(250);
      L.targets.forEach((t) => (L.status[t.id] = 'live'));
      L.state = 'live';
      L.startedAt = Date.now();
      render();
      return true;
    } catch (e) {
      L.state = 'idle';
      render();
      GS.toast('Gagal mula siaran: ' + e.message, 'warn', 6000);
      return false;
    }
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

  if (window.gsNative && window.gsNative.onStreamEvent) {
    window.gsNative.onStreamEvent((ev) => {
      if (ev.type === 'error') { GS.toast('Ralat siaran: ' + ev.message, 'warn', 7000); L.state = 'idle'; render(); }
      if (ev.type === 'ended') { L.state = 'idle'; render(); }
    });
  }

  /* ---------- kemas kini bar atas ---------- */
  function render() {
    const live = GS.$('#btnLive'), rec = GS.$('#btnRec');
    if (!live) return;
    const on = L.state !== 'idle';
    live.classList.toggle('live', on);
    live.innerHTML = on ? icon('stop', 16) + '<span>' + (L.state === 'connecting' ? 'MENYAMBUNG…' : 'TAMAT LIVE') + '</span>' : icon('play', 16) + '<span>MULA LIVE</span>';
    rec.classList.toggle('rec', R.active);
    rec.innerHTML = icon(R.active ? 'stop' : 'rec', 16) + '<span>' + (R.active ? 'STOP REC' : 'REC') + '</span>';
    const chips = GS.$('#platformChips');
    chips.innerHTML = '';
    Object.keys(L.status).forEach((id) => {
      const d = GS.platforms.defs[id];
      chips.append(h('span', { class: 'chip pf ' + L.status[id], style: { '--pf': d.color }, title: d.name + ' · ' + L.status[id] }, h('i'), d.name.split(' ')[0]));
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
  }, 500);

  /* ================== WIZARD: Setup Live ================== */
  const STEPS = ['Game', 'Template', 'Platform', 'Semak & Mula'];
  L.openWizard = function (startStep) {
    const wiz = { step: startStep == null ? 0 : startStep, game: GS.state.game, tpl: GS.state.templateId };
    const body = h('div', { class: 'wizard' });
    const stepper = h('ol', { class: 'stepper' });
    const stage = h('div', { class: 'wiz-stage' });
    body.append(stepper, stage);
    const back = h('button', { class: 'btn ghost', onClick: () => go(wiz.step - 1) }, 'Kembali');
    const next = h('button', { class: 'btn primary', onClick: () => (wiz.step === 3 ? finish() : go(wiz.step + 1)) }, 'Seterusnya');
    const foot = h('div', { class: 'foot-row' }, back, h('span', { class: 'spacer' }), next);
    const m = GS.modal({ title: 'Sediakan Live', body, footer: foot, wide: true });

    function go(n) {
      if (n < 0 || n > 3) return;
      if (wiz.step === 1 && n > 1) applyTemplate(); // simpan pilihan template apabila meninggalkan langkah
      wiz.step = n;
      draw();
    }

    function applyTemplate() {
      const game = GS.games[wiz.game];
      if (!game || !wiz.tpl) return;
      const pg = GS.scenes.program();
      if (pg && pg.templateId === wiz.tpl) return; // template sama: kekalkan suntingan pengguna
      const target = pg && pg.templateId ? pg.id : null;
      const sc = GS.scenes.applyTemplate(wiz.tpl, target);
      if (sc && !target) { GS.state.programId = sc.id; GS.state.previewId = sc.id; GS.save(); GS.emit('scenes:changed'); }
    }

    function draw() {
      stepper.innerHTML = '';
      STEPS.forEach((s, i) => stepper.append(h('li', { class: i === wiz.step ? 'cur' : i < wiz.step ? 'done' : '' }, h('span', null, i < wiz.step ? '✓' : i + 1), s)));
      back.disabled = wiz.step === 0;
      next.textContent = wiz.step === 3 ? (L.state === 'idle' ? 'MULA LIVE' : 'Tutup') : 'Seterusnya';
      next.classList.toggle('go', wiz.step === 3);
      stage.classList.remove('in');
      stage.innerHTML = '';
      [stepGame, stepTemplate, stepPlatform, stepCheck][wiz.step]();
      requestAnimationFrame(() => stage.classList.add('in'));
    }

    function stepGame() {
      stage.append(h('p', { class: 'lead' }, 'Pilih game yang anda mainkan. Sistem akan guna template, efek dan data khusus game itu.'),
        h('div', { class: 'cards' }, GS.gameList.map((g) =>
          h('button', { class: 'pick-card' + (wiz.game === g.id ? ' sel' : '') + (g.ready ? '' : ' locked'), disabled: !g.ready, onClick: () => { wiz.game = g.id; GS.state.game = g.id; GS.save(); draw(); } },
            h('strong', null, g.name), h('span', null, g.ready ? 'Sedia' : 'Akan datang')))));
    }

    function stepTemplate() {
      const game = GS.games[wiz.game];
      stage.append(h('p', { class: 'lead' }, 'Pilih template paparan live. Setiap template ada gaya efek sendiri (kill, victory, defeat dan lain-lain).'));
      const grid = h('div', { class: 'cards tpl' });
      game.templates.forEach((t) => {
        const cv = h('canvas', { width: 480, height: 270 });
        GS.Compositor.thumb(cv, t.build());
        grid.append(h('button', { class: 'pick-card tpl' + (wiz.tpl === t.id ? ' sel' : ''), onClick: () => { wiz.tpl = t.id; draw(); } },
          cv, h('strong', null, t.name), h('span', null, t.desc),
          h('span', { class: 'fxtag' }, 'Gaya efek: ' + ({ holo: 'Hologram biru-merah', crimson: 'Merah menyala', gold: 'Emas' }[t.fxStyle]))));
      });
      stage.append(grid);
    }

    function stepPlatform() {
      stage.append(h('p', { class: 'lead' }, 'Hidupkan platform yang anda mahu siarkan serentak, kemudian masukkan Server URL dan Stream Key (seperti OBS).'));
      const box = h('div', { class: 'pf-list' });
      stage.append(box);
      GS.platforms.renderCards(box);
    }

    function stepCheck() {
      const s = GS.state.settings, game = GS.games[wiz.game];
      const tpl = game.templates.find((t) => t.id === wiz.tpl);
      const pg = GS.scenes.program();
      const vids = pg ? pg.sources.filter((x) => x.type === 'video' && x.visible && x.props.kind === 'capture') : [];
      const sig = vids.some((v) => GS.media.videos[v.id]);
      const aud = GS.audio.channels.some((c) => c.kind !== 'sfx' && c.stream);
      const enabled = GS.platforms.enabledIds();
      const bad = enabled.filter((id) => !GS.platforms.validate(id).ok);
      const rows = [
        ['ok', 'Game', game.name],
        [tpl ? 'ok' : 'bad', 'Template', tpl ? tpl.name : 'Belum dipilih'],
        [sig ? 'ok' : 'warn', 'Isyarat game (Capture Card)', sig ? 'Ada isyarat' : 'Tiada isyarat. Pilih capture card pada sumber game.'],
        [aud ? 'ok' : 'warn', 'Audio', aud ? 'Input audio disambung' : 'Tiada input audio disambung.'],
        [enabled.length && !bad.length ? 'ok' : enabled.length ? (native() ? 'bad' : 'warn') : 'bad', 'Platform', enabled.length ? enabled.map((id) => GS.platforms.defs[id].name + (GS.platforms.validate(id).ok ? '' : ' (belum lengkap)')).join(', ') : 'Tiada platform dipilih'],
        ['ok', 'Output', s.width + '×' + s.height + ' · ' + s.fps + ' fps · ' + s.vbitrate + ' kbps'],
      ];
      stage.append(h('p', { class: 'lead' }, 'Semak sebelum mula. Bila ditekan MULA LIVE, semua platform yang dipilih dimulakan serentak.'),
        h('ul', { class: 'checklist' }, rows.map(([k, a, b]) => h('li', { class: k }, h('i', { html: icon(k === 'ok' ? 'check' : 'x', 14) }), h('strong', null, a), h('span', null, b)))),
        native() ? null : h('div', { class: 'callout' }, h('strong', null, 'Mod demo web. '), 'Versi web tidak boleh menghantar siaran sebenar ke TikTok/Facebook/YouTube kerana pelayar tidak menyokong RTMP. Aplikasi Windows (Global Streamer) menghantar siaran sebenar.'));
    }

    async function finish() {
      if (L.state !== 'idle') { m.close(); return; }
      if (!wiz.tpl) { go(1); return; }
      const ok = await L.start();
      if (ok) m.close();
    }

    draw();
  };

  /* ================== TETAPAN ================== */
  L.openSettings = function () {
    const s = GS.state.settings;
    const sel = (key, opts, parse = Number) => h('select', { onChange: (e) => { s[key] = parse(e.target.value); GS.save(); if (key === 'width') applyRes(); } },
      opts.map(([v, l]) => h('option', { value: v, selected: String(s[key]) === String(v) }, l)));
    const applyRes = () => { s.height = Math.round((s.width * 9) / 16); GS.app.applyResolution(); };
    const body = h('div', { class: 'settings' },
      h('h3', null, 'Output video'),
      h('div', { class: 'grid2' },
        h('label', { class: 'field' }, h('span', null, 'Resolusi'), sel('width', [[1280, '1280×720 (HD)'], [1920, '1920×1080 (Full HD)'], [2560, '2560×1440 (2K)'], [3840, '3840×2160 (4K)']])),
        h('label', { class: 'field' }, h('span', null, 'Bingkai sesaat (FPS)'), sel('fps', [[30, '30 fps'], [60, '60 fps']])),
        h('label', { class: 'field' }, h('span', null, 'Bitrate video (kbps)'), h('input', { type: 'number', min: 1000, max: 60000, step: 500, value: s.vbitrate, onChange: (e) => { s.vbitrate = GS.clamp(Number(e.target.value) || 6000, 1000, 60000); GS.save(); } })),
        h('label', { class: 'field' }, h('span', null, 'Bitrate audio (kbps)'), sel('abitrate', [[96, '96'], [128, '128'], [160, '160'], [192, '192'], [320, '320']]))),
      h('p', { class: 'muted note' }, 'TikTok dan Facebook biasanya menghadkan 1080p. 4K hanya sesuai untuk YouTube dan memerlukan PC yang kuat.'),
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
      h('div', { class: 'btn-row' }, h('button', { class: 'btn danger', onClick: () => { if (confirm('Padam SEMUA tetapan, scene dan data tempatan?')) GS.resetState(); } }, 'Set semula semua data')),
      h('p', { class: 'muted note' }, 'Global Streamer v' + GS.version + ' · ' + (native() ? 'App Windows' : 'Versi web (demo)')));
    GS.modal({ title: 'Tetapan', body });
  };
})();
