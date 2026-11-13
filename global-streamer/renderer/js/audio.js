/* Global Streamer - mixer audio (Web Audio) + bunyi efek sintetik */
(function () {
  'use strict';
  const A = (GS.audio = {
    ctx: null,
    master: null,
    dest: null,
    sfxBus: null,
    channels: [], // runtime: {id,label,kind,deviceId,vol,muted,node,gain,analyser,stream,level}
  });

  A.ensure = function () {
    if (A.ctx) {
      if (A.ctx.state === 'suspended') A.ctx.resume();
      return A.ctx;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    A.ctx = new Ctx({ latencyHint: 'interactive' });
    A.master = A.ctx.createGain();
    A.dest = A.ctx.createMediaStreamDestination(); // dirakam / dihantar ke live
    // had puncak (limiter): suara kuat tidak retak/herot dalam rakaman dan siaran
    A.limiter = A.ctx.createDynamicsCompressor();
    A.limiter.threshold.value = -3; A.limiter.knee.value = 0; A.limiter.ratio.value = 20; A.limiter.attack.value = 0.003; A.limiter.release.value = 0.12;
    // pemotong lembut terakhir: isyarat tidak pernah melebihi 0.98 (tiada retak digital)
    A.clip = A.ctx.createWaveShaper();
    const curve = new Float32Array(2049); for (let i = 0; i < curve.length; i++) { const x = (i / 1024 - 1) * 2; curve[i] = Math.max(-0.98, Math.min(0.98, Math.tanh(x * 1.15) / Math.tanh(1.15) * 0.97)); }
    A.clip.curve = curve; A.clip.oversample = '2x';
    A.master.connect(A.limiter);
    A.limiter.connect(A.clip);
    A.clip.connect(A.dest);
    // bunyi efek (beep): streamer sahaja yang dengar; masuk siaran/rakaman hanya jika dihidupkan (supaya suara kekal jelas)
    A.sfxBus = A.ctx.createGain();
    A.sfxBus.connect(A.ctx.destination);
    // suara bot/pengumum: sentiasa masuk siaran dan rakaman, dan streamer juga mendengarnya
    A.voiceBus = A.ctx.createGain();
    A.voiceBus.connect(A.master);
    A.voiceBus.connect(A.ctx.destination);
    A.applyRouting();
    // sambung semula saluran yang sudah ada
    A.channels.forEach(connectChannel);
    return A.ctx;
  };

  /** Laluan bunyi efek ke siaran/rakaman mengikut tetapan. */
  A.applyRouting = function () {
    if (!A.sfxBus || !A.master) return;
    try { A.sfxBus.disconnect(A.master); } catch (e) { /* belum disambung */ }
    if (GS.state.audio.sfxInStream) A.sfxBus.connect(A.master);
  };
  /** Saluran suara (mikrofon): penapis bunyi latar, gema dan kelantangan automatik dihidupkan, serta rantaian pembersih. */
  const isVoice = (ch) => ch.kind === 'input' && (ch.id === 'ch_mic' || /mik|mic/i.test(ch.label || '')) && GS.state.audio.voiceClean !== false;

  /* ---------- saluran ---------- */
  function persist() {
    GS.state.audio.channels = A.channels.map((c) => ({ id: c.id, label: c.label, kind: c.kind, deviceId: c.deviceId, vol: c.vol, muted: c.muted, w: c.w || undefined,
      // lagu sendiri: hanya laluan fail (app Windows) disimpan; URL sementara pelayar tidak kekal
      tracks: c.kind === 'music' ? (c.tracks || []).filter((t) => t.path).map((t) => ({ name: t.name, path: t.path })) : undefined, idx: c.kind === 'music' ? (c.idx || 0) : undefined, loop: c.kind === 'music' ? c.loop !== false : undefined }));
    GS.save();
  }

  function makeChannel(cfg) {
    return Object.assign({ id: GS.uid('ch'), label: 'Input', kind: 'input', deviceId: '', vol: 0.8, muted: false, node: null, gain: null, analyser: null, stream: null, level: 0 }, cfg);
  }

  /* ---------- lagu sendiri (daripada PC / laptop) ---------- */
  const trackUrl = (t) => t.url || (t.path ? GS.media.clipFileUrl(t.path) : '');
  function attachMusic(ch) {
    if (!A.ctx || ch.el) return;
    const el = new Audio();
    el.preload = 'auto';
    el.addEventListener('ended', () => A.musicNext(ch.id, true));
    el.addEventListener('play', () => { ch.playing = true; GS.emit('audio:changed'); });
    el.addEventListener('pause', () => { ch.playing = false; GS.emit('audio:changed'); });
    ch.el = el;
    ch.node = A.ctx.createMediaElementSource(el);
    ch.node.connect(ch.gain);
    // penonton mendengar melalui siaran; streamer mendengar melalui pembesar suara / fon kepala
    ch.mon = A.ctx.createGain();
    ch.gain.connect(ch.mon);
    ch.mon.connect(A.ctx.destination);
    if (ch.tracks && ch.tracks[ch.idx || 0]) el.src = trackUrl(ch.tracks[ch.idx || 0]);
  }
  /** Tambah saluran lagu baharu dan buka tetingkap pilih fail (folder komputer). */
  A.addMusic = function () {
    A.ensure();
    const ch = makeChannel({ label: GS.t('Lagu {0}', A.channels.filter((c) => c.kind === 'music').length + 1), kind: 'music', vol: 0.6, tracks: [], idx: 0, loop: true });
    A.channels.push(ch);
    connectChannel(ch);
    persist();
    GS.emit('audio:changed');
    A.musicPick(ch.id);
  };
  A.musicPick = function (id) {
    const ch = A.channels.find((c) => c.id === id);
    if (!ch) return;
    const inp = GS.h('input', { type: 'file', accept: 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac', multiple: true, style: { display: 'none' } });
    inp.addEventListener('change', () => {
      const files = Array.from(inp.files || []);
      if (!files.length) return;
      const first = !ch.tracks.length;
      files.forEach((f) => {
        const path = window.gsNative && window.gsNative.pathOf ? window.gsNative.pathOf(f) : '';
        ch.tracks.push({ name: f.name.replace(/\.[^.]+$/, ''), path: path || '', url: path ? '' : URL.createObjectURL(f) });
      });
      if (first) { ch.idx = 0; if (ch.el) ch.el.src = trackUrl(ch.tracks[0]); }
      persist();
      GS.emit('audio:changed');
      GS.toast(GS.t('{0} lagu ditambah.', files.length), 'ok');
      if (first) A.musicToggle(id);
    });
    document.body.append(inp);
    inp.click();
    setTimeout(() => inp.remove(), 60000);
  };
  A.musicToggle = function (id) {
    const ch = A.channels.find((c) => c.id === id);
    if (!ch || !ch.el) return;
    A.ensure();
    if (!ch.tracks.length) { A.musicPick(id); return; }
    if (!ch.el.src) ch.el.src = trackUrl(ch.tracks[ch.idx || 0]);
    if (ch.el.paused) ch.el.play().catch(() => GS.toast(GS.t('Lagu tidak dapat dimainkan. Cuba fail lain.'), 'warn')); else ch.el.pause();
  };
  A.musicNext = function (id, auto) {
    const ch = A.channels.find((c) => c.id === id);
    if (!ch || !ch.el || !ch.tracks.length) return;
    let n = (ch.idx || 0) + 1;
    if (n >= ch.tracks.length) { if (auto && ch.loop === false) { ch.playing = false; GS.emit('audio:changed'); return; } n = 0; }
    ch.idx = n;
    ch.el.src = trackUrl(ch.tracks[n]);
    ch.el.play().catch(() => {});
    persist();
    GS.emit('audio:changed');
  };
  A.musicPrev = function (id) {
    const ch = A.channels.find((c) => c.id === id);
    if (!ch || !ch.el || !ch.tracks.length) return;
    ch.idx = ((ch.idx || 0) - 1 + ch.tracks.length) % ch.tracks.length;
    ch.el.src = trackUrl(ch.tracks[ch.idx]);
    ch.el.play().catch(() => {});
    persist();
    GS.emit('audio:changed');
  };
  A.rename = function (id, name) {
    const ch = A.channels.find((c) => c.id === id);
    if (!ch || !name || !name.trim()) return;
    ch.label = name.trim();
    persist();
    GS.emit('audio:changed');
  };

  function connectChannel(ch) {
    if (!A.ctx) return;
    if (ch.kind === 'sfx') {
      // bus efek: kelantangan melalui sfxBus, meter melalui A.sfxLevel
      A.sfxBus.gain.value = ch.muted ? 0 : ch.vol * 1.2;
      return;
    }
    if (!ch.gain) {
      ch.gain = A.ctx.createGain();
      ch.analyser = A.ctx.createAnalyser();
      ch.analyser.fftSize = 512;
      ch.gain.connect(ch.analyser);
      ch.analyser.connect(A.master);
    }
    ch.gain.gain.value = ch.muted ? 0 : ch.vol;
    if (ch.kind === 'music') attachMusic(ch);
  }

  A.channelsInit = function () {
    const saved = GS.state.audio.channels;
    if (saved && saved.length) {
      A.channels = saved.map((c) => makeChannel(c.kind === 'music' ? Object.assign({}, c, { tracks: c.tracks || [], idx: c.idx || 0 }) : c));
    } else {
      A.channels = [
        makeChannel({ id: 'ch_mic', label: 'Mikrofon', kind: 'input' }),
        makeChannel({ id: 'ch_game', label: 'Audio Capture Card', kind: 'input' }),
        makeChannel({ id: 'ch_sfx', label: 'Efek & Muzik', kind: 'sfx', vol: 0.7 }),
      ];
    }
    // jika ada deviceId tersimpan, cuba sambung senyap-senyap (hanya berjaya jika kebenaran pernah diberi)
    A.channels.forEach((c) => {
      if (c.kind === 'input' && c.deviceId) A.connectDevice(c.id, c.deviceId, true);
    });
  };

  A.connectDevice = async function (id, deviceId, silent) {
    const ch = A.channels.find((c) => c.id === id);
    if (!ch) return;
    try {
      A.ensure();
      if (ch.stream) ch.stream.getTracks().forEach((t) => t.stop());
      if (ch.node && ch.node.disconnect) ch.node.disconnect();
      (ch.chain || []).forEach((n) => { try { n.disconnect(); } catch (e) { /* abaikan */ } });
      ch.chain = [];
      const voice = isVoice(ch);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: voice
          ? { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
          : { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      ch.stream = stream;
      ch.deviceId = deviceId || stream.getAudioTracks()[0].getSettings().deviceId || '';
      connectChannel(ch);
      ch.node = A.ctx.createMediaStreamSource(stream);
      if (voice) {
        // penapis frekuensi rendah (dengung/hentakan meja) -> pemampat (suara sekata) -> penguat
        const hp = A.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90; hp.Q.value = 0.7;
        const lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 14000;
        const comp = A.ctx.createDynamicsCompressor(); comp.threshold.value = -26; comp.knee.value = 18; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
        const up = A.ctx.createGain(); up.gain.value = 1.9;
        ch.node.connect(hp); hp.connect(lp); lp.connect(comp); comp.connect(up); up.connect(ch.gain);
        ch.chain = [hp, lp, comp, up];
      } else {
        ch.node.connect(ch.gain);
      }
      persist();
      GS.emit('audio:changed');
    } catch (e) {
      if (!silent) GS.toast(GS.t('Tidak dapat buka input audio: {0}', e.message || e.name), 'warn');
    }
  };

  A.connectDisplayAudio = async function () {
    try {
      A.ensure();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const tracks = stream.getAudioTracks();
      if (!tracks.length) {
        stream.getTracks().forEach((t) => t.stop());
        GS.toast('Tiada audio dikongsi. Tandakan "Kongsi audio" semasa memilih tab/skrin.', 'warn');
        return;
      }
      stream.getVideoTracks().forEach((t) => t.stop());
      const ch = makeChannel({ label: 'Audio Skrin/Tab', kind: 'display' });
      ch.stream = new MediaStream(tracks);
      A.channels.push(ch);
      connectChannel(ch);
      ch.node = A.ctx.createMediaStreamSource(ch.stream);
      ch.node.connect(ch.gain);
      persist();
      GS.emit('audio:changed');
    } catch (e) {
      if (e && e.name !== 'NotAllowedError') GS.toast(GS.t('Gagal kongsi audio skrin: {0}', e.message), 'warn');
    }
  };

  A.addInput = function () {
    const ch = makeChannel({ label: 'Input ' + (A.channels.filter((c) => c.kind === 'input').length + 1), kind: 'input' });
    A.channels.push(ch);
    A.ensure();
    connectChannel(ch);
    persist();
    GS.emit('audio:changed');
  };

  A.remove = function (id) {
    const ch = A.channels.find((c) => c.id === id);
    if (!ch || ch.kind === 'sfx') return;
    if (ch.stream) ch.stream.getTracks().forEach((t) => t.stop());
    if (ch.el) { try { ch.el.pause(); ch.el.removeAttribute('src'); ch.el.load(); } catch (e) { /* abaikan */ } }
    try { ch.mon && ch.mon.disconnect(); } catch (e) { /* abaikan */ }
    try { ch.node && ch.node.disconnect(); ch.gain && ch.gain.disconnect(); ch.analyser && ch.analyser.disconnect(); } catch (e) { /* abaikan */ }
    A.channels = A.channels.filter((c) => c !== ch);
    persist();
    GS.emit('audio:changed');
  };

  A.setVolume = function (id, v) {
    const ch = A.channels.find((c) => c.id === id);
    if (!ch) return;
    ch.vol = GS.clamp(v, 0, 1);
    if (ch.gain) ch.gain.gain.value = ch.muted ? 0 : ch.vol;
    if (ch.kind === 'sfx' && A.sfxBus) A.sfxBus.gain.value = ch.muted ? 0 : ch.vol * 1.2;
    persist();
  };

  A.toggleMute = function (id) {
    const ch = A.channels.find((c) => c.id === id);
    if (!ch) return;
    ch.muted = !ch.muted;
    if (ch.gain) ch.gain.gain.value = ch.muted ? 0 : ch.vol;
    if (ch.kind === 'sfx' && A.sfxBus) A.sfxBus.gain.value = ch.muted ? 0 : ch.vol * 1.2;
    persist();
    GS.emit('audio:changed');
  };

  /* bacaan paras (0..1) */
  const buf = new Uint8Array(512);
  A.readLevels = function () {
    A.channels.forEach((ch) => {
      if (!ch.analyser || ch.kind === 'sfx') {
        ch.level = ch.kind === 'sfx' ? A.sfxLevel || 0 : 0;
        return;
      }
      ch.analyser.getByteTimeDomainData(buf);
      let peak = 0;
      for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128));
      const lvl = peak / 128;
      ch.level = Math.max(lvl, ch.level * 0.86);
    });
    A.sfxLevel = (A.sfxLevel || 0) * 0.9;
  };

  /* ---------- bunyi efek sintetik ---------- */
  function osc(type, f0, f1, dur, gain, delay = 0) {
    const ctx = A.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(A.sfxBus);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    A.sfxLevel = Math.max(A.sfxLevel || 0, gain * 2.5);
  }
  function noise(dur, gain, freq, delay = 0) {
    const ctx = A.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.floor(ctx.sampleRate * dur);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource();
    s.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    s.connect(f);
    f.connect(g);
    g.connect(A.sfxBus);
    s.start(t0);
    A.sfxLevel = Math.max(A.sfxLevel || 0, gain * 2);
  }

  A.sfx = function (name) {
    try {
      switch (name) {
        case 'kill': osc('sawtooth', 180, 720, 0.5, 0.16); noise(0.5, 0.25, 1800); osc('square', 520, 1040, 0.25, 0.08, 0.12); osc('sawtooth', 62, 44, 0.8, 0.2); osc('sine', 55, 34, 0.7, 0.22, 0.05); break; // seram: raungan rendah
        case 'death': noise(0.9, 0.5, 900); osc('sawtooth', 90, 38, 0.8, 0.28); osc('square', 1400, 200, 0.2, 0.1); osc('sawtooth', 700, 80, 1.1, 0.07); osc('sawtooth', 712, 90, 1.1, 0.07, 0.03); break; // seram: rintihan menurun
        case 'victory': [523, 659, 784, 1047].forEach((f, i) => osc('triangle', f, f, 0.9, 0.16, i * 0.14)); noise(1.2, 0.1, 5000, 0.5); break;
        case 'defeat': [392, 330, 262, 196].forEach((f, i) => osc('sawtooth', f, f * 0.96, 0.8, 0.1, i * 0.22)); break;
        case 'fullitem': for (let i = 0; i < 6; i++) osc('triangle', 600 + i * 110, 600 + i * 110, 0.22, 0.12, i * 0.1); osc('sine', 1760, 1760, 0.6, 0.12, 0.7); break;
        case 'itembuy': osc('sine', 988, 988, 0.12, 0.14); osc('sine', 1319, 1319, 0.35, 0.14, 0.09); break;
        case 'chest': osc('sawtooth', 140, 90, 0.55, 0.07); noise(0.5, 0.08, 900); osc('sine', 90, 40, 0.25, 0.22, 0.55); [1319, 1568, 1976, 2637].forEach((f, i) => osc('triangle', f, f, 0.4, 0.12, 0.7 + i * 0.07)); noise(0.5, 0.05, 7000, 0.75); break; // peti: berderit, hentakan, kilauan
        case 'alert': osc('sine', 880, 1320, 0.25, 0.1); break;
        case 'tick': osc('square', 1500, 1100, 0.04, 0.05); noise(0.03, 0.06, 4200); break;
        case 'beep': osc('sine', 880, 880, 0.16, 0.16); osc('triangle', 1760, 1760, 0.1, 0.05); break;
        case 'go': [523, 659, 784, 1047, 1319].forEach((f, i) => osc('triangle', f, f, 0.5, 0.16, i * 0.07)); noise(0.8, 0.12, 5000, 0.2); osc('sawtooth', 110, 55, 0.7, 0.12); break;
        default: break;
      }
    } catch (e) { console.warn('[GS] sfx gagal', e); }
  };

  /* ---------- UI mixer ---------- */
  A.renderMixer = function () {
    const root = GS.$('#mixer');
    if (!root) return;
    root.innerHTML = '';
    A.channels.forEach((ch) => {
      const meter = GS.h('div', { class: 'meter' }, GS.h('i', { dataset: { meter: ch.id } }));
      const connected = ch.kind === 'sfx' || ch.kind === 'music' || !!ch.stream;
      const strip = GS.h('div', { class: 'strip' + (ch.muted ? ' muted' : '') + (connected ? '' : ' idle') + (ch.kind === 'music' ? ' music' : ''),
        onContextmenu: (e) => { const nm = e.currentTarget.querySelector('.strip-name'); GS.ctxMenu(e, [{ label: 'Namakan semula', run: () => nm && GS.inlineEdit(nm, ch.label, (v) => A.rename(ch.id, v), () => A.renderMixer()) }].concat(ch.kind === 'music' ? [{ label: 'Tambah lagu', run: () => A.musicPick(ch.id) }] : []).concat(ch.kind !== 'sfx' ? ['-', { label: 'Buang saluran', danger: true, run: () => A.remove(ch.id) }] : [])); } },
        GS.h('div', { class: 'strip-head' },
          GS.h('span', { class: 'strip-name', title: GS.t('Klik dua kali atau klik kanan untuk namakan semula') + ': ' + ch.label, onDblclick: (e) => GS.inlineEdit(e.currentTarget, ch.label, (v) => A.rename(ch.id, v), () => A.renderMixer()) }, ch.label),
          ch.kind !== 'sfx' ? GS.h('button', { class: 'icon-btn sm', title: 'Buang saluran', onClick: () => A.remove(ch.id), html: GS.icon('x', 14) }) : null),
        GS.h('div', { class: 'strip-body' },
          meter,
          GS.h('input', {
            type: 'range', min: 0, max: 100, value: Math.round(ch.vol * 100), class: 'fader', 'aria-label': GS.t('Kelantangan {0}', GS.t(ch.label)),
            onInput: (e) => A.setVolume(ch.id, e.target.value / 100),
          }),
          GS.h('button', { class: 'icon-btn' + (ch.muted ? ' on' : ''), title: ch.muted ? 'Nyahbisu' : 'Bisu', onClick: () => A.toggleMute(ch.id), html: GS.icon(ch.muted ? 'mute' : 'volume', 16) })),
        ch.kind === 'input'
          ? GS.h('button', { class: 'btn tiny', onClick: () => A.pickDevice(ch.id) }, ch.stream ? 'Tukar input' : 'Pilih input')
          : ch.kind === 'sfx' ? GS.h('div', { class: 'strip-note' }, 'Dalaman')
          : ch.kind === 'music' ? GS.h('div', { class: 'music-box' },
              GS.h('div', { class: 'music-title', title: (ch.tracks[ch.idx || 0] || {}).name || '' }, (ch.tracks[ch.idx || 0] || {}).name || GS.t('Tiada lagu')),
              GS.h('div', { class: 'music-ctl' },
                GS.h('button', { class: 'icon-btn sm', title: GS.t('Lagu sebelum'), onClick: () => A.musicPrev(ch.id), html: GS.icon('up', 14) }),
                GS.h('button', { class: 'icon-btn sm' + (ch.playing ? ' on' : ''), title: ch.playing ? GS.t('Jeda') : GS.t('Main'), onClick: () => A.musicToggle(ch.id), html: ch.playing ? '&#10074;&#10074;' : '&#9654;' }),
                GS.h('button', { class: 'icon-btn sm', title: GS.t('Lagu seterusnya'), onClick: () => A.musicNext(ch.id), html: GS.icon('down', 14) })),
              GS.h('button', { class: 'btn tiny', onClick: () => A.musicPick(ch.id) }, '+ ' + GS.t('Tambah lagu')))
          : GS.h('div', { class: 'strip-note' }, 'Skrin/Tab'));
      // pemegang saiz: seret di tepi kanan untuk melaraskan lebar bahagian ini
      if (ch.w) { strip.style.flex = '0 0 ' + ch.w + 'px'; strip.style.width = ch.w + 'px'; }
      strip.style.position = 'relative';
      const grip = GS.h('div', { class: 'strip-grip', title: GS.t('Seret untuk laras saiz') });
      grip.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const x0 = e.clientX, w0 = strip.getBoundingClientRect().width;
        const mv = (m) => { const nw = GS.clamp(Math.round(w0 + m.clientX - x0), 110, 640); ch.w = nw; strip.style.flex = '0 0 ' + nw + 'px'; strip.style.width = nw + 'px'; };
        const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); persist(); };
        document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
      });
      grip.addEventListener('dblclick', () => { ch.w = 0; persist(); A.renderMixer(); });
      strip.append(grip);
      root.append(strip);
    });
    if (GS.voiceui) root.append(GS.voiceui.strip());
    root.append(GS.h('div', { class: 'mixer-add' },
      GS.h('button', { class: 'btn ghost', onClick: A.addInput, html: GS.icon('plus', 14) + ' ' + GS.t('Input') }),
      GS.h('button', { class: 'btn ghost', onClick: A.addMusic, html: GS.icon('plus', 14) + ' ' + GS.t('Lagu') }),
      GS.h('button', { class: 'btn ghost', onClick: A.connectDisplayAudio, html: GS.icon('monitor', 14) + ' ' + GS.t('Audio skrin') })));
  };

  A.pickDevice = async function (id) {
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());
    } catch (e) {
      GS.toast('Kebenaran mikrofon/audio ditolak atau tiada peranti.', 'warn');
      return;
    }
    const devs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
    if (!devs.length) { GS.toast('Tiada peranti audio dijumpai.', 'warn'); return; }
    const list = GS.h('div', { class: 'device-list' }, devs.map((d, i) =>
      GS.h('button', { class: 'device', onClick: async () => { m.close(); await A.connectDevice(id, d.deviceId); } },
        GS.h('span', { html: GS.icon('mic', 16) }), GS.h('span', null, d.label || GS.t('Peranti audio {0}', i + 1)))));
    const m = GS.modal({ title: 'Pilih input audio', body: list });
  };

  GS.on('audio:changed', A.renderMixer);

  /* kemas kini meter bar */
  let last = 0;
  A.tickMeters = function (now) {
    if (now - last < 33) return;
    last = now;
    A.readLevels();
    A.channels.forEach((ch) => {
      const el = GS.$('[data-meter="' + ch.id + '"]');
      if (el) el.style.transform = 'scaleX(' + GS.clamp(ch.level * 1.6, 0, 1).toFixed(3) + ')';
    });
  };
})();
