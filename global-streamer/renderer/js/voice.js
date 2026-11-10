/* Global Streamer - kawalan suara dan bot.
 *
 *  1. EFEK MELALUI SUARA: sebut "kill", "mati", "victory", "defeat" (suara streamer ATAU bunyi game/suara pengumum game dari
 *     capture card) dan efek yang sama keluar, tanpa papan kekunci. Frasa boleh diubah/ditambah.
 *  2. BOT: nama bot ditetapkan sendiri (cth "Jarvis"). "Jarvis, siapa noob?" -> bot menjawab daripada senarai soalan/jawapan
 *     yang disediakan, atau daripada data game (K/D/A, rekod menang/kalah, hero meta). Jawapan dipaparkan pada siaran dan disuarakan.
 *
 * Pengecam: app Windows = pengecam suara Windows luar talian (main/voice-win.js) disuap daripada saluran mixer (mikrofon / bunyi game);
 * pelayar web = Web Speech API (mikrofon lalai, perlukan internet). Logik padanan sama untuk kedua-duanya dan boleh diuji tanpa audio. */
(function () {
  'use strict';
  const GS = window.GS;
  const { h } = GS;
  const V = (GS.voice = { running: false, engine: '', speaking: false, awaitUntil: 0, last: null, error: '', info: {}, lastFx: {}, taps: {}, log: [] });
  const native = () => !!(window.gsNative && window.gsNative.voice);
  const cfg = () => GS.state.voice;

  /* ---------- padanan teks ---------- */
  const norm = (t) => String(t || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  V.norm = norm;
  const lev = (a, b) => {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 3;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  /** Dua perkataan dianggap sama jika serupa (salah eja kecil diterima untuk perkataan panjang). */
  const wsim = (a, b) => a === b || (Math.min(a.length, b.length) >= 5 && lev(a, b) <= 1) || (Math.min(a.length, b.length) >= 9 && lev(a, b) <= 2);
  /** Indeks permulaan frasa (senarai perkataan) yang bersebelahan dalam teks; -1 jika tiada. */
  const find = (words, pw) => {
    for (let i = 0; i + pw.length <= words.length; i++) {
      let k = 0;
      while (k < pw.length && wsim(words[i + k], pw[k])) k++;
      if (k === pw.length) return i;
    }
    return -1;
  };
  const splitList = (s) => String(s || '').split(/[,\n|]/).map((x) => norm(x)).filter(Boolean);

  /** Cari efek yang dicetuskan oleh teks. Frasa paling panjang menang ("double kill" mengatasi "kill"). */
  V.match = function (text) {
    const words = norm(text).split(' ').filter(Boolean);
    if (!words.length) return null;
    const list = [];
    (cfg().triggers || []).forEach((t) => splitList(Array.isArray(t.phrases) ? t.phrases.join(',') : t.phrases).forEach((p) => list.push({ fx: t.fx, phrase: p, pw: p.split(' ') })));
    list.sort((a, b) => b.pw.length - a.pw.length || b.phrase.length - a.phrase.length);
    for (const c of list) if (find(words, c.pw) >= 0) return { fx: c.fx, phrase: c.phrase };
    return null;
  };

  /* ---------- bot ---------- */
  const wakeWords = () => { const b = cfg().bot; return [norm(b.name)].concat(splitList(b.aliases)).filter(Boolean); };
  /** Kembalikan {woke, question} jika teks memanggil bot. `question` boleh kosong (bot menunggu soalan seterusnya). */
  V.parseWake = function (text) {
    const words = norm(text).split(' ').filter(Boolean);
    for (const w of wakeWords()) {
      const pw = w.split(' ');
      const i = find(words, pw);
      if (i >= 0) return { woke: true, question: words.slice(i + pw.length).join(' ') };
    }
    return { woke: false, question: '' };
  };

  const tokens = () => {
    const S = GS.state;
    const k = (GS.events && GS.events.state && GS.events.state.kda) || null;
    let toppick = '?', topban = '?';
    try { const p = GS.meta && GS.meta.top('pick', {}); const b = GS.meta && GS.meta.top('ban', {}); toppick = (p && p[0] && p[0].name) || '?'; topban = (b && b[0] && b[0].name) || '?'; } catch (e) { /* tiada data meta */ }
    return {
      kill: k ? k.k : (S.stats && S.stats.kills != null ? S.stats.kills : 0), mati: k ? k.d : 0, assist: k ? k.a : 0,
      menang: S.winloss ? S.winloss.win : 0, kalah: S.winloss ? S.winloss.loss : 0, streak: S.winloss ? S.winloss.streak : 0,
      toppick, topban, nama: (cfg().bot.name || '').trim(),
    };
  };
  const fill = (t) => { const T = tokens(); return String(t).replace(/\{(\w+)\}/g, (m, k) => (k in T ? String(T[k]) : m)); };

  /** Cari jawapan untuk soalan. Skor = nisbah perkataan frasa soalan yang terdapat dalam ucapan. */
  V.answer = function (question) {
    const qw = norm(question).split(' ').filter(Boolean);
    let best = null, bestScore = 0, bestLen = 0;
    (cfg().bot.qa || []).forEach((e) => {
      splitList(e.q).forEach((p) => {
        const pw = p.split(' ');
        const hit = pw.filter((w) => qw.some((x) => wsim(x, w))).length;
        const score = hit / pw.length;
        if (score >= 0.75 && (score > bestScore || (score === bestScore && pw.length > bestLen))) { best = e; bestScore = score; bestLen = pw.length; }
      });
    });
    if (best && String(best.a || '').trim()) return { text: fill(best.a), entry: best, score: bestScore };
    const fb = String(cfg().bot.fallback || '').trim();
    return { text: fb ? fill(fb) : '', entry: null, score: 0 };
  };

  /* ---------- keluaran bot: paparan pada siaran + suara ---------- */
  V.speak = async function (text) {
    const b = cfg().bot;
    if (!b.voiceOn || !text) return;
    V.speaking = true;
    const done = () => { setTimeout(() => { V.speaking = false; GS.emit('voice:status'); }, 600); };
    try {
      if (b.inStream && native()) {
        // jana WAV (suara Windows) dan campurkan ke dalam siaran melalui bas efek; streamer juga mendengarnya
        const r = await window.gsNative.voice.say(text, { voice: b.voiceName, culture: V.cultureFor(), rate: b.rate });
        if (r && r.ok) {
          const ctx = GS.audio.ensure();
          const buf = await ctx.decodeAudioData(r.wav.buffer.slice(r.wav.byteOffset, r.wav.byteOffset + r.wav.byteLength));
          const src = ctx.createBufferSource();
          src.buffer = buf; src.connect(GS.audio.sfxBus); src.onended = done; src.start();
          return;
        }
        if (r && r.error) GS.toast(GS.t('Suara bot ke siaran gagal: {0}', r.error), 'warn');
      }
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        const vs = speechSynthesis.getVoices();
        const pick = (b.voiceName && vs.find((v) => v.name === b.voiceName)) || vs.find((v) => v.lang && v.lang.toLowerCase().startsWith(V.cultureFor().slice(0, 2).toLowerCase()));
        if (pick) u.voice = pick;
        u.rate = 1 + (Number(b.rate) || 0) / 10;
        u.onend = done; u.onerror = done;
        speechSynthesis.speak(u);
        return;
      }
    } catch (e) { console.warn('[GS] suara bot', e); }
    done();
  };
  V.cultureFor = () => { const c = cfg().culture; return c && c !== 'auto' ? c : (GS.state.lang === 'en' ? 'en-US' : 'ms-MY'); };

  V.say = function (text) {
    const b = cfg().bot;
    if (!text) return;
    V.log.unshift({ at: Date.now(), kind: 'bot', text });
    V.log.length = Math.min(V.log.length, 30);
    GS.fx.trigger('botsay', { name: b.name || 'BOT', text, dur: Math.min(12000, 3200 + text.length * 70), sound: false });
    V.speak(text);
    GS.emit('voice:status');
  };

  /* ---------- pemprosesan teks yang dikenali (semua enjin lalu di sini) ---------- */
  V.handleText = function (ev) {
    const st = cfg();
    if (!st.enabled && !ev.test) return { ignored: 'mati' };
    const text = String(ev.text || '').trim();
    if (!text) return { ignored: 'kosong' };
    const source = ev.source === 'game' ? 'game' : 'mic';
    if (source === 'mic' && V.speaking && !ev.test) return { ignored: 'bot bercakap' }; // elak bot mendengar suaranya sendiri
    if (ev.conf != null && ev.conf < st.minConf) { V.note({ source, text, conf: ev.conf, result: 'keyakinan rendah' }); return { ignored: 'keyakinan' }; }
    const now = Date.now();
    // hasil sementara (pelayar): hanya untuk efek; bot menunggu hasil akhir supaya soalan lengkap
    if (ev.interim && source === 'mic' && st.bot.enabled && (V.parseWake(text).woke || V.awaitUntil > now)) return { ignored: 'sementara' };
    V.last = { text, source, at: now, conf: ev.conf == null ? null : ev.conf };
    // 1) bot (hanya suara streamer/penonton melalui mikrofon)
    if (source === 'mic' && st.bot.enabled) {
      const w = V.parseWake(text);
      let q = null;
      if (w.woke) q = w.question;
      else if (V.awaitUntil > now) q = text;
      if (q !== null) {
        if (!q.trim()) { V.awaitUntil = now + st.bot.listenMs; V.note({ source, text, result: 'bot dipanggil, menunggu soalan' }); GS.emit('voice:status'); return { bot: 'menunggu' }; }
        V.awaitUntil = 0;
        const a = V.answer(q);
        V.note({ source, text, result: a.text ? 'bot: ' + a.text : 'bot: tiada jawapan' });
        if (a.text) V.say(a.text);
        GS.emit('voice:status');
        return { bot: a.text ? 'jawab' : 'tiada', answer: a.text };
      }
    }
    // 2) efek
    if (st[source] && st[source].on === false && !ev.test) { GS.emit('voice:status'); return { ignored: 'sumber dimatikan' }; }
    const m = V.match(text);
    if (!m) { V.note({ source, text, result: '' }); GS.emit('voice:status'); return { ignored: 'tiada padanan' }; }
    if (now - (V.lastFx[m.fx] || 0) < st.cooldownMs) { V.note({ source, text, result: m.fx + ' (jeda)' }); return { ignored: 'jeda' }; }
    V.lastFx[m.fx] = now;
    const params = m.fx === 'kill' ? { label: m.phrase === 'kill' ? 'KILL' : m.phrase.toUpperCase() } : {};
    GS.fx.trigger(m.fx, params);
    V.note({ source, text, result: m.fx + (params.label ? ' · ' + params.label : '') });
    GS.emit('voice:status');
    return { fx: m.fx, phrase: m.phrase };
  };
  V.note = (e) => { V.log.unshift(Object.assign({ at: Date.now(), kind: 'heard' }, e)); V.log.length = Math.min(V.log.length, 30); };

  /* ---------- enjin: app Windows (luar talian) ---------- */
  const chFor = (source) => {
    const A = GS.audio; const want = cfg()[source].channel;
    const usable = A.channels.filter((c) => c.kind !== 'sfx' && c.stream && c.node);
    if (want && want !== 'auto') return usable.find((c) => c.id === want) || null;
    const re = source === 'mic' ? /mik|mic/i : /capture|game|skrin|screen|tab/i;
    return usable.find((c) => re.test(c.label || '')) || (source === 'mic' ? usable.find((c) => c.kind === 'input') : null) || null;
  };
  V.channelFor = chFor;

  function tap(source, ch) {
    const ctx = GS.audio.ensure();
    if (!ctx || !ch || !ch.node) return null;
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const mute = ctx.createGain(); mute.gain.value = 0;
    const ratio = ctx.sampleRate / 16000;
    proc.onaudioprocess = (e) => {
      if (source === 'mic' && V.speaking) return;
      const inp = e.inputBuffer.getChannelData(0);
      const n = Math.floor(inp.length / ratio);
      const out = new Int16Array(n);
      for (let i = 0; i < n; i++) {
        const a = Math.floor(i * ratio), b = Math.min(inp.length, Math.floor((i + 1) * ratio));
        let s = 0; for (let j = a; j < b; j++) s += inp[j];
        s /= (b - a) || 1;
        out[i] = Math.max(-1, Math.min(1, s)) * 32767;
      }
      window.gsNative.voice.pcm(source, out.buffer);
    };
    ch.node.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
    return () => { try { ch.node.disconnect(proc); } catch (e) { /* abaikan */ } try { proc.disconnect(); mute.disconnect(); } catch (e) { /* abaikan */ } };
  }

  V.onNative = function (ev) {
    if (!ev || !ev.type) return;
    const src = ev.source === 'game' ? 'game' : 'mic';
    if (ev.type === 'ready') { V.info[src] = { culture: ev.culture, name: ev.name }; V.error = ''; }
    else if (ev.type === 'text') V.handleText({ source: src, text: ev.text, conf: ev.conf, final: true });
    else if (ev.type === 'error') { V.error = ev.message || ev.code || 'ralat'; }
    else if (ev.type === 'exit') { if (V.running && ev.code && !V.error) V.error = ev.message || GS.t('Pengecam suara berhenti (kod {0})', ev.code); delete V.info[src]; }
    GS.emit('voice:status');
  };

  async function startNative() {
    const st = cfg();
    const started = [];
    for (const src of ['mic', 'game']) {
      if (!st[src].on) continue;
      const ch = chFor(src);
      if (!ch) { if (src === 'mic') V.error = GS.t('Pilih input mikrofon dalam Audio Mixer dahulu.'); continue; }
      const r = await window.gsNative.voice.start(src, { culture: st.culture === 'auto' ? '' : st.culture });
      if (!r || !r.ok) { V.error = (r && r.error) || GS.t('Pengecam suara tidak dapat dimulakan.'); continue; }
      const off = tap(src, ch);
      if (off) { V.taps[src] = off; started.push(src); }
    }
    return started.length > 0;
  }

  /* ---------- enjin: pelayar web (Web Speech API) ---------- */
  let rec = null, recOn = false;
  function startWeb() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { V.error = GS.t('Pelayar ini tidak menyokong pengecam suara. Guna Chrome atau app Windows.'); return false; }
    if (!cfg().mic.on) { V.error = GS.t('Hidupkan sumber "Suara saya" untuk guna pelayar.'); return false; }
    rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = V.cultureFor();
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0] && r[0].transcript;
        // jeda per-efek menghalang cetusan berganda antara hasil sementara dan hasil akhir
        V.handleText({ source: 'mic', text, conf: r.isFinal ? r[0].confidence || null : null, final: r.isFinal, interim: !r.isFinal });
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { V.error = GS.t('Kebenaran mikrofon ditolak.'); recOn = false; }
      else if (e.error === 'network') { V.error = GS.t('Pengecam suara pelayar memerlukan sambungan internet.'); recOn = false; }
      GS.emit('voice:status');
    };
    rec.onend = () => { if (recOn) { setTimeout(() => { try { rec.start(); } catch (e) { /* sedang berjalan */ } }, 300); } };
    recOn = true;
    try { rec.start(); } catch (e) { V.error = String(e.message || e); return false; }
    return true;
  }

  /* ---------- kawalan ---------- */
  V.start = async function () {
    if (V.running) return true;
    V.error = ''; V.info = {};
    cfg().enabled = true;
    let ok = false;
    V.engine = native() ? 'windows' : 'web';
    try {
      if (native()) { if (!(await window.gsNative.voice.available())) V.error = GS.t('Pengecam suara luar talian hanya tersedia dalam app Windows.'); else ok = await startNative(); }
      else ok = startWeb();
    } catch (e) { V.error = String((e && e.message) || e); ok = false; }
    V.running = ok;
    if (!ok) { cfg().enabled = false; V.stopEngines(); }
    GS.save();
    GS.emit('voice:status');
    return ok;
  };
  V.stopEngines = function () {
    Object.values(V.taps).forEach((f) => f && f());
    V.taps = {};
    if (native()) { try { window.gsNative.voice.stop(); } catch (e) { /* abaikan */ } }
    recOn = false;
    if (rec) { try { rec.stop(); } catch (e) { /* abaikan */ } rec = null; }
  };
  V.stop = function () {
    V.stopEngines();
    V.running = false;
    cfg().enabled = false;
    V.awaitUntil = 0;
    GS.save();
    GS.emit('voice:status');
  };
  V.toggle = () => (V.running ? (V.stop(), Promise.resolve(false)) : V.start());
  /** Sambung semula saluran apabila input mixer bertukar (pengguna memilih peranti lain). */
  V.retap = function () {
    if (!V.running || V.engine !== 'windows') return;
    Object.values(V.taps).forEach((f) => f && f()); V.taps = {};
    ['mic', 'game'].forEach((src) => { if (!cfg()[src].on || !V.info[src]) return; const ch = chFor(src); const off = ch && tap(src, ch); if (off) V.taps[src] = off; });
  };

  V.init = function () {
    if (native()) window.gsNative.voice.onEvent(V.onNative);
    GS.on('audio:changed', () => V.retap());
    // pulihkan selepas dibuka semula: bot/efek suara dimulakan jika sebelum ini dihidupkan (mikrofon sudah diberi kebenaran)
    if (cfg().enabled && native()) setTimeout(() => { cfg().enabled = false; V.start(); }, 2500);
    else cfg().enabled = false; // pelayar: memerlukan klik pengguna untuk mikrofon
  };
})();
