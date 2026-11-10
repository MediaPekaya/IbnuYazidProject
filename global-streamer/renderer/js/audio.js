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
    A.master.connect(A.dest);
    A.sfxBus = A.ctx.createGain();
    A.sfxBus.connect(A.master);
    A.sfxBus.connect(A.ctx.destination); // streamer dengar efek
    // sambung semula saluran yang sudah ada
    A.channels.forEach(connectChannel);
    return A.ctx;
  };

  /* ---------- saluran ---------- */
  function persist() {
    GS.state.audio.channels = A.channels.map((c) => ({ id: c.id, label: c.label, kind: c.kind, deviceId: c.deviceId, vol: c.vol, muted: c.muted }));
    GS.save();
  }

  function makeChannel(cfg) {
    return Object.assign({ id: GS.uid('ch'), label: 'Input', kind: 'input', deviceId: '', vol: 0.8, muted: false, node: null, gain: null, analyser: null, stream: null, level: 0 }, cfg);
  }

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
  }

  A.channelsInit = function () {
    const saved = GS.state.audio.channels;
    if (saved && saved.length) {
      A.channels = saved.map(makeChannel);
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      ch.stream = stream;
      ch.deviceId = deviceId || stream.getAudioTracks()[0].getSettings().deviceId || '';
      connectChannel(ch);
      ch.node = A.ctx.createMediaStreamSource(stream);
      ch.node.connect(ch.gain);
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
        case 'kill': osc('sawtooth', 180, 720, 0.5, 0.16); noise(0.5, 0.25, 1800); osc('square', 520, 1040, 0.25, 0.08, 0.12); break;
        case 'death': noise(0.9, 0.5, 900); osc('sawtooth', 90, 38, 0.8, 0.28); osc('square', 1400, 200, 0.2, 0.1); break;
        case 'victory': [523, 659, 784, 1047].forEach((f, i) => osc('triangle', f, f, 0.9, 0.16, i * 0.14)); noise(1.2, 0.1, 5000, 0.5); break;
        case 'defeat': [392, 330, 262, 196].forEach((f, i) => osc('sawtooth', f, f * 0.96, 0.8, 0.1, i * 0.22)); break;
        case 'fullitem': for (let i = 0; i < 6; i++) osc('triangle', 600 + i * 110, 600 + i * 110, 0.22, 0.12, i * 0.1); osc('sine', 1760, 1760, 0.6, 0.12, 0.7); break;
        case 'itembuy': osc('sine', 988, 988, 0.12, 0.14); osc('sine', 1319, 1319, 0.35, 0.14, 0.09); break;
        case 'alert': osc('sine', 880, 1320, 0.25, 0.1); break;
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
      const connected = ch.kind === 'sfx' || !!ch.stream;
      const strip = GS.h('div', { class: 'strip' + (ch.muted ? ' muted' : '') + (connected ? '' : ' idle') },
        GS.h('div', { class: 'strip-head' },
          GS.h('span', { class: 'strip-name', title: ch.label }, ch.label),
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
          : ch.kind === 'sfx' ? GS.h('div', { class: 'strip-note' }, 'Dalaman') : GS.h('div', { class: 'strip-note' }, 'Skrin/Tab'));
      root.append(strip);
    });
    root.append(GS.h('div', { class: 'mixer-add' },
      GS.h('button', { class: 'btn ghost', onClick: A.addInput, html: GS.icon('plus', 14) + ' ' + GS.t('Input') }),
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
