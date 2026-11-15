/* Global Streamer - Bot AI (ElevenLabs): otak (Agent), suara, telinga (Scribe), pemasa spell musuh melalui suara, dan analisis game.
 * Semuanya berada di dalam sistem Suara & Bot ("Akan datang"): tidak aktif untuk pelanggan sehingga dibuka oleh pemilik.
 * Buka kunci pemilik: tekan Ctrl+Alt+Shift+V (app dimuat semula). Tekan sekali lagi untuk menutup semula. */
(function () {
  'use strict';
  const GS = window.GS;
  const { h } = GS;
  const B = (GS.botai = { analyzing: false, mem: [], lastErr: '' });
  const st = () => GS.state.botai;
  const vc = () => GS.state.voice;
  const V = () => GS.voice;
  const native = () => !!(window.gsNative && window.gsNative.tts && window.gsNative.tts.agent);
  const norm = (t) => String(t || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const unlocked = () => !!(V() && !V().comingSoon);
  B.unlocked = unlocked;

  /* ---------- kunci pemilik ---------- */
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
      e.preventDefault();
      try { const on = localStorage.getItem('gs.voice.unlock') === '1'; localStorage.setItem('gs.voice.unlock', on ? '0' : '1'); } catch (x) { /* abaikan */ }
      location.reload();
    }
  }, true);

  /* ---------- ElevenLabs: panggilan API ---------- */
  const agentCall = async (op, params) => {
    if (!native()) throw new Error(GS.t('Bot AI ElevenLabs hanya tersedia dalam app Windows.'));
    const key = V().elevenKey();
    if (!key) throw new Error(GS.t('Kunci API ElevenLabs belum diisi.'));
    const r = await window.gsNative.tts.agent(op, Object.assign({ key }, params || {}));
    if (!r || !r.ok) { const e = new Error(errText(r || {})); e.status = r && r.status; throw e; }
    return r;
  };
  const errText = (r) => {
    const m = String(r.message || '').slice(0, 160);
    if (r.status === 401 || r.status === 403) return GS.t('Kunci ElevenLabs tidak sah atau tiada kebenaran. Buat kunci baharu dan hidupkan kebenaran "ElevenLabs Agents" dan "Speech to Text" (atau akses penuh).') + (m ? ' (' + m + ')' : '');
    if (r.status === 429) return GS.t('ElevenLabs: terlalu banyak permintaan atau had penggunaan dicapai. Cuba sebentar lagi.');
    if (r.status === 402 || /quota|limit/i.test(String(r.code))) return GS.t('Kredit ElevenLabs tidak mencukupi untuk operasi ini.');
    if (r.code === 'timeout') return GS.t('ElevenLabs tidak menjawab (tamat masa).');
    if (r.code === 'network' || r.status === 0) return GS.t('Tidak dapat menghubungi ElevenLabs. Semak sambungan internet.') + (m && r.code !== 'network' ? ' (' + m + ')' : '');
    return GS.t('ElevenLabs gagal (kod {0}): {1}', r.status, m);
  };
  B.quota = async () => { const r = await agentCall('subscription'); const j = r.json || {}; return { used: j.character_count, limit: j.character_limit, tier: j.tier, reset: j.next_character_count_reset_unix }; };

  /* ---------- arahan otak (disimpan pada ejen) ---------- */
  const SYS_VERSION = 4;
  const botName = () => (vc().bot.name || 'Jarvis').trim() || 'Jarvis';
  const voiceId = () => vc().bot.tts.femaleVoice || '21m00Tcm4TlvDq8ikWAM';
  const sysPrompt = () => 'Kamu ialah ' + botName() + ', pembantu suara AI yang menemani seorang streamer game Mobile Legends dalam siaran langsung; penonton turut mendengar. '
    + 'JAWAB TEPAT APA YANG DITANYA, mengikut topik soalan, walau apa pun topiknya (game, ilmu am, makanan, anime, perasaan, lawak). Jangan lari topik. '
    + 'Kamu AI: jangan berpura-pura manusia, tetapi tetap beri pendapat dan jawapan sebenar. '
    + 'Bercakap Bahasa Melayu Malaysia yang santai (boleh sedikit slanga seperti "wei", "bro", "lah"). Jawab dalam bahasa yang SAMA dengan soalan (jika soalan English, jawab English). '
    + 'Jawapan pendek: 1-2 ayat, paling banyak 30 patah perkataan, KECUALI diminta analisis game. Tanpa emoji, tanpa senarai, tanpa markdown, kerana jawapan akan disebut kuat. '
    + 'Mesej pengguna boleh bermula dengan blok [DATA GAME] (data sebenar yang dikesan app) dan [SOALAN]. Gunakan DATA itu hanya untuk soalan tentang game/siaran; jangan mereka nama pemain, pasukan atau statistik yang tiada dalam DATA. '
    + 'Jika mesej meminta ANALISIS GAME dengan format WIN/POINT/TIP, balas TEPAT dalam format itu sahaja. '
    + 'Untuk soalan siapa noob atau troll, bergurau dengan mesra; jangan menghina atau guna kata kesat.';

  const sigNow = () => [botName(), voiceId(), SYS_VERSION, st().llm].join('|');
  /** Pastikan ejen wujud dan sepadan dengan nama/suara semasa (dicipta atau dikemas kini secara automatik). */
  B.ensureAgent = async (force) => {
    const s = st();
    if (s.agentId && s.sig === sigNow() && !force) return s.agentId;
    const params = { name: 'Global Streamer ' + botName(), voice: voiceId(), prompt: sysPrompt(), llm: s.llm, language: 'ms' };
    let r;
    if (s.agentId) {
      try { r = await agentCall('update', Object.assign({ agent_id: s.agentId }, params)); }
      catch (e) { if (e.status === 404) { s.agentId = ''; r = await agentCall('create', params); } else throw e; }
    } else r = await agentCall('create', params);
    s.agentId = r.agent_id || s.agentId; s.sig = sigNow(); GS.save();
    if (!s.agentId) throw new Error(GS.t('ElevenLabs tidak memulangkan ID ejen.'));
    return s.agentId;
  };

  /* ---------- tanya otak melalui WebSocket (mod teks) ---------- */
  const clean = (t, lim) => {
    let x = String(t || '').replace(/[*_`#>~]/g, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/[ \t]+/g, ' ').trim();
    if (lim && x.length > lim) { const cut = x.slice(0, lim); const p = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? ')); x = p > 60 ? cut.slice(0, p + 1) : cut.replace(/\s+\S*$/, '') + '…'; }
    return x;
  };
  const useCount = () => {
    const u = st().usage, now = new Date(), mk = now.getFullYear() + '-' + GS.pad(now.getMonth() + 1), dk = mk + '-' + GS.pad(now.getDate());
    if (u.month !== mk) { u.month = mk; u.asks = 0; }
    if (u.day !== dk) { u.day = dk; u.dayAsks = 0; }
    u.asks++; u.dayAsks++; GS.save();
  };
  const GAMEQ = /\b(game|main|kill|kda|hero|draft|team|pasukan|musuh|match|perlawanan|menang|kalah|rank|analis|analys|mati|item|ban|pick|lane)\b/i;
  const wsOnce = (url, message, timeoutMs) => new Promise((resolve, reject) => {
    let ws, done = false, parts = '', ready = false;
    const end = (err, text) => { if (done) return; done = true; clearTimeout(tm); try { ws.close(); } catch (e) { /* abaikan */ } err ? reject(err) : resolve(text); };
    const tm = setTimeout(() => end(new Error(GS.t('ElevenLabs tidak menjawab (tamat masa).'))), timeoutMs || 25000);
    try { ws = new WebSocket(url); } catch (e) { end(new Error(GS.t('Tidak dapat menghubungi ElevenLabs. Semak sambungan internet.'))); return; }
    ws.onopen = () => { try { ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' })); } catch (e) { /* abaikan */ } };
    ws.onmessage = (ev) => {
      let j; try { j = JSON.parse(ev.data); } catch (e) { return; }
      switch (j.type) {
        case 'conversation_initiation_metadata':
          ready = true; ws.send(JSON.stringify({ type: 'user_message', text: message })); break;
        case 'ping': ws.send(JSON.stringify({ type: 'pong', event_id: j.ping_event && j.ping_event.event_id })); break;
        case 'agent_chat_response_part': {
          const p = j.text_response_part || {};
          if (p.type === 'delta' && p.text) parts += p.text;
          if (p.type === 'stop' && parts) end(null, parts);
          break;
        }
        case 'agent_response': { const t = j.agent_response_event && j.agent_response_event.agent_response; if (t) end(null, t); break; }
        case 'error': case 'internal_error': end(new Error(GS.t('ElevenLabs gagal: {0}', String((j.error && (j.error.message || j.error)) || j.message || j.code || 'ralat').slice(0, 160)))); break;
        default: break;   // audio, transkrip, dan lain-lain diabaikan (suara disebut melalui TTS app)
      }
    };
    ws.onerror = () => end(new Error(GS.t('Tidak dapat menghubungi ElevenLabs. Semak sambungan internet.')));
    ws.onclose = (e) => { if (!done) { if (parts) end(null, parts); else end(new Error(GS.t('Sambungan ElevenLabs ditutup{0}.', ready ? '' : ' (' + (e.reason || e.code) + ')'))); } };
  });
  /** Tanya otak ElevenLabs. Mengembalikan teks jawapan. */
  B.ask = async (question, o) => {
    o = o || {};
    const id = await B.ensureAgent();
    const s = await agentCall('signed', { agent_id: id });
    const url = s.json && s.json.signed_url;
    if (!url) throw new Error(GS.t('ElevenLabs tidak memulangkan pautan sambungan.'));
    const q = String(question).slice(0, 500);
    const withData = o.analysis || GAMEQ.test(q);
    const hist = B.mem.slice(-4).map((m) => m.q + ' -> ' + m.a).join('\n');
    const msg = (withData ? '[DATA GAME]\n' + V().gameContext() + '\n\n' : '') + (hist && !o.analysis ? '[SEBELUM INI]\n' + hist + '\n\n' : '') + '[SOALAN]\n' + q;
    useCount();
    const raw = await wsOnce(url, msg, o.analysis ? 35000 : 25000);
    const text = clean(raw, o.analysis ? 900 : 300);
    if (!text) throw new Error(GS.t('ElevenLabs tidak memberi jawapan.'));
    if (!o.analysis) { B.mem.push({ q: q.slice(0, 120), a: text.slice(0, 160) }); B.mem = B.mem.slice(-6); }
    return text;
  };

  /* ---------- telinga: ElevenLabs Scribe ---------- */
  B.transcribe = async (wav) => {
    const r = await agentCall('stt', { wav });
    return String(r.text || '').trim();
  };
  B.earsEleven = () => unlocked() && native() && st().ears === 'eleven' && !!V().elevenKey();

  /* ==================== PEMASA SPELL MUSUH MELALUI SUARA ==================== */
  const SPELLS = [
    { n: 'Flicker', cd: 120, w: ['flicker', 'flicka', 'flika', 'flick'] }, { n: 'Purify', cd: 50, w: ['purify', 'purifier', 'purified', 'purifai'] },
    { n: 'Aegis', cd: 75, w: ['aegis', 'egis', 'agis', 'ejis'] }, { n: 'Execute', cd: 90, w: ['execute', 'executed', 'eksekut'] },
    { n: 'Retribution', cd: 35, w: ['retribution', 'retri'] }, { n: 'Inspire', cd: 75, w: ['inspire', 'inspired'] },
    { n: 'Sprint', cd: 100, w: ['sprint'] }, { n: 'Petrify', cd: 90, w: ['petrify', 'petrified'] },
    { n: 'Revitalize', cd: 100, w: ['revitalize', 'revitalise'] }, { n: 'Arrival', cd: 75, w: ['arrival'] },
    { n: 'Vengeance', cd: 75, w: ['vengeance'] }, { n: 'Flameshot', cd: 50, w: ['flameshot', 'flame shot'] },
  ];
  B.SPELLS = SPELLS;
  const lev = (a, b) => {
    if (a === b) return 0; if (Math.abs(a.length - b.length) > 2) return 3;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  const wsim = (a, b) => a === b || (Math.min(a.length, b.length) >= 4 && lev(a, b) <= 1) || (Math.min(a.length, b.length) >= 8 && lev(a, b) <= 2);
  const findSeq = (words, pw) => { for (let i = 0; i + pw.length <= words.length; i++) { let k = 0; while (k < pw.length && wsim(words[i + k], pw[k])) k++; if (k === pw.length) return i; } return -1; };
  /** Cari {hero, spell} dalam satu ucapan (susunan bebas). Kembalikan null jika tiada kedua-duanya. */
  B.parseSpell = (text) => {
    const words = norm(text).split(' ').filter(Boolean);
    if (words.length < 2) return null;
    let spell = null, si = -1;
    for (const sp of SPELLS) { for (const w of sp.w) { const pw = w.split(' '); const i = findSeq(words, pw); if (i >= 0) { spell = sp; si = i; break; } } if (spell) break; }
    if (!spell) return null;
    const heroes = (GS.data && GS.data.mlbbHeroes) || [];
    let best = null, bestLen = 0;
    heroes.forEach((hh) => {
      const pw = norm(hh.name).split(' ').filter(Boolean); if (!pw.length) return;
      const i = findSeq(words, pw);
      if (i >= 0 && !(i >= si && i < si + 1) && pw.join('').length >= bestLen) { best = hh.name; bestLen = pw.join('').length; }
    });
    return best ? { hero: best, spell: spell.n, cd: spell.cd } : null;
  };
  const rows = () => GS.state.spells;
  const ensureWidget = () => {
    const sc = GS.scenes && GS.scenes.program && GS.scenes.program();
    if (!sc || sc.sources.some((s) => s.type === 'widget' && s.props && s.props.widget === 'spelltimer')) return;
    const W = GS.design.w, H = GS.design.h, w = 340, hh = 200;
    sc.sources.push({ id: GS.uid('src'), type: 'widget', name: 'Pemasa Spell', visible: true, locked: false, x: W - w - 24, y: Math.round(H * 0.16), w, h: hh, fit: 'cover', props: { widget: 'spelltimer' } });
    GS.emit('sources:changed'); GS.emit('scenes:changed'); GS.save();
  };
  /** Mula pemasa spell untuk hero musuh. Baris digunakan semula untuk hero yang sama; jika tidak, baris kosong atau yang paling awal habis. */
  B.startSpell = (hero, spell, cd, byVoice) => {
    const now = Date.now(), list = rows();
    let r = list.find((x) => x.hero && norm(x.hero) === norm(hero) && x.spell === spell)
      || list.find((x) => !x.hero)
      || list.slice().sort((a, b) => ((a.until || 0) - (b.until || 0)))[0];
    if (!r) return null;
    const keepCd = r.hero && norm(r.hero) === norm(hero) && r.spell === spell && r.cd ? r.cd : cd;
    r.hero = hero; r.spell = spell; r.cd = keepCd; r.until = now + keepCd * 1000; r.auto = !!byVoice; r.done = false; r.clearAt = 0;
    GS.save(); ensureWidget();
    return r;
  };
  let lastSpell = { key: '', at: 0 };
  /** Dipanggil oleh pengecam suara untuk setiap ucapan. Mengembalikan keputusan jika ia perintah spell. */
  B.spellFromText = (text) => {
    if (!unlocked() || st().spellOn === false) return null;
    const p = B.parseSpell(text); if (!p) return null;
    const key = norm(p.hero) + '|' + p.spell, now = Date.now();
    if (lastSpell.key === key && now - lastSpell.at < 6000) return { dup: true, hero: p.hero, spell: p.spell };
    lastSpell = { key, at: now };
    const r = B.startSpell(p.hero, p.spell, p.cd, true);
    if (r) GS.toast(GS.t('Pemasa spell: {0} {1} ({2} saat).', p.hero, p.spell, r.cd), 'ok', 3500);
    return { hero: p.hero, spell: p.spell, cd: r && r.cd };
  };
  /** Tamat masa: sebut dalam English bahawa spell sudah ada semula; baris hilang selepas 3 saat. */
  const spellTick = () => {
    const now = Date.now();
    rows().forEach((r) => {
      if (!r.hero || !r.until) return;
      if (now >= r.until && !r.done) {
        r.done = true; r.clearAt = r.auto ? now + 3500 : 0;
        if (r.auto && unlocked() && st().spellAnnounce !== false) { const t = r.hero + ' ' + r.spell + ' is ready.'; try { V().speak(t, { force: true, lang: 'en-US' }); } catch (e) { /* abaikan */ } GS.toast(t, 'info', 4000); }
      }
      if (r.auto && r.clearAt && now >= r.clearAt) { r.hero = ''; r.until = 0; r.auto = false; r.done = false; r.clearAt = 0; GS.save(); }
    });
  };

  /* ==================== ANALISIS GAME ==================== */
  /** Analisis tempatan (tanpa AI) daripada data sebenar yang dikesan app. */
  B.localAnalysis = () => {
    const v = V(), D = v.draftAnalysis(), E = GS.events || { state: {} }, k = E.state && E.state.kda, S = GS.state;
    const lines = [];
    if (k) lines.push(GS.t('K/D/A {0}/{1}/{2}{3}.', k.k, k.d, k.a, k.d ? ' · KDA ' + ((k.k + k.a) / k.d).toFixed(1) : ''));
    D.gaps.slice(0, 2).forEach((g) => lines.push(g.charAt(0).toUpperCase() + g.slice(1) + '.'));
    if (D.ally.length || D.enemy.length) lines.push(GS.t('Draft: {0} hero kita lawan {1} hero musuh.', D.ally.length, D.enemy.length));
    if (S.winloss && (S.winloss.win || S.winloss.loss)) lines.push(GS.t('Rekod sesi: {0} menang, {1} kalah.', S.winloss.win, S.winloss.loss));
    let tip = '';
    if (k && k.d > k.k) tip = GS.t('Kurangkan mati: jaga posisi dan lihat minimap sebelum bertarung.');
    else if (D.win != null && D.win < 45) tip = GS.t('Draft kurang menyebelahi kita: elak teamfight tanpa sebab, fokus objektif dan farm.');
    else if (D.win != null && D.win >= 55) tip = GS.t('Draft menyebelahi kita: tekan awal dan ambil objektif.');
    else tip = GS.t('Kekalkan tekanan, ambil objektif dan jangan bergerak sendirian.');
    if (!lines.length) lines.push(GS.t('Belum ada data game dikesan. Isi draft atau hidupkan pengesan kejadian.'));
    let win = D.win;
    if (win == null && k) { const sc = (k.k + k.a * 0.6) - k.d * 0.9; win = Math.max(25, Math.min(75, Math.round(50 + sc * 2.5))); }
    return { win: win == null ? null : Math.round(win), lines: lines.slice(0, 4), tip };
  };
  const ANALYSIS_ASK = 'ANALISIS GAME: berdasarkan DATA game di atas, analisis perlawanan yang sedang berlangsung. Balas HANYA dalam format ini (tanpa markdown, tanpa teks lain):\n'
    + 'WIN: <anggaran peluang menang kita, nombor 0 hingga 100, jika tidak boleh dikira tulis ->\n'
    + 'POINT: <satu pemerhatian pendek tentang prestasi atau draft, berdasarkan data>\nPOINT: <pemerhatian kedua>\nPOINT: <pemerhatian ketiga>\n'
    + 'TIP: <satu nasihat paling penting sekarang>\nGunakan bahasa yang sama seperti nama bot dipanggil (Bahasa Melayu Malaysia santai). Jangan mereka data yang tiada.';
  const parseAnalysis = (t) => {
    const out = { win: null, lines: [], tip: '' };
    String(t || '').split(/\r?\n/).forEach((ln) => {
      const m = ln.match(/^\s*(WIN|POINT|TIP)\s*[:：]\s*(.+)$/i); if (!m) return;
      const k = m[1].toUpperCase(), val = m[2].trim();
      if (k === 'WIN') { const n = parseInt(val.replace(/[^\d]/g, ''), 10); if (!isNaN(n) && n >= 0 && n <= 100 && /\d/.test(val)) out.win = n; }
      else if (k === 'POINT') out.lines.push(val.slice(0, 120)); else out.tip = val.slice(0, 140);
    });
    return out;
  };
  const showAnalysis = (p) => {
    try { GS.fx.active = GS.fx.active.filter((e) => e.name !== 'analysis'); } catch (e) { /* abaikan */ }
    GS.fx.trigger('analysis', Object.assign({ name: botName(), dur: Math.max(8, Math.min(40, st().analysisSecs || 16)) * 1000, sound: false }, p));
  };
  /** Analisis game sekarang. source: 'key' (papan kekunci) atau 'voice' (suara). Dua cara, satu fungsi. */
  B.analyze = async (o) => {
    o = o || {};
    if (!unlocked()) return false;
    if (B.analyzing) return false;
    B.analyzing = true; GS.emit('botai:changed');
    try {
      const local = B.localAnalysis();
      showAnalysis({ state: 'think', win: local.win, lines: [], tip: '', source: o.source });
      let res = local, ai = false;
      if (V().aiConfigured()) {
        try {
          const text = await B.ask(ANALYSIS_ASK, { analysis: true });
          const p = parseAnalysis(text);
          if (p.lines.length || p.tip) { res = { win: p.win != null ? p.win : local.win, lines: p.lines.length ? p.lines.slice(0, 3) : local.lines, tip: p.tip || local.tip }; ai = true; }
          else if (text) res = { win: local.win, lines: [clean(text, 120)], tip: local.tip };
        } catch (e) { B.lastErr = String((e && e.message) || e); GS.toast(B.lastErr, 'warn', 6000); }
      }
      const speak = (res.win != null ? GS.t('Peluang menang dianggar {0} peratus.', res.win) + ' ' : '') + res.lines.slice(0, 2).join(' ') + ' ' + res.tip;
      showAnalysis({ state: 'done', win: res.win, lines: res.lines, tip: res.tip, ai, source: o.source, skipIn: true });
      V().note({ source: 'mic', text: o.source === 'key' ? 'Ctrl+Shift+A' : (o.text || 'analisis'), result: 'analisis game' + (ai ? ' (AI)' : ' (tempatan)') });
      if (st().analysisSpeak !== false) V().speak(speak.trim(), { force: true });
      return true;
    } finally { B.analyzing = false; GS.emit('botai:changed'); }
  };
  const ANALYSE_RE = /\b(analisis|analisa|analyse|analyze|analysis|analisislah)\b/i;
  B.isAnalyzeCommand = (q) => ANALYSE_RE.test(String(q || ''));

  /* ---------- pintasan papan kekunci Ctrl+Shift+A ---------- */
  B.hotkeyOn = () => { if (window.gsNative && window.gsNative.botai) window.gsNative.botai.hotkey(unlocked()).catch(() => {}); };
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && (e.key === 'A' || e.key === 'a') && unlocked()) { e.preventDefault(); e.stopImmediatePropagation(); B.analyze({ source: 'key' }); }
  }, true);

  /* ==================== PANEL BESAR ==================== */
  const mask = (k) => (k ? '…' + k.slice(-4) : '');
  const monthNum = () => { const u = st().usage; return u.month === new Date().getFullYear() + '-' + GS.pad(new Date().getMonth() + 1) ? u.asks : 0; };
  const dayNum = () => { const u = st().usage, n = new Date(); return u.day === n.getFullYear() + '-' + GS.pad(n.getMonth() + 1) + '-' + GS.pad(n.getDate()) ? u.dayAsks : 0; };
  const field = (label, ctl, hint) => h('label', { class: 'field' }, h('span', null, label), ctl, hint ? h('small', { class: 'muted' }, hint) : null);
  B.panel = null;
  B.openPanel = function () {
    if (!unlocked()) return;
    if (B.panel && B.panel.card && B.panel.card.isConnected) return;
    const v = V(), c = vc(), s = st();
    const status = h('div', { class: 'ba-status', id: 'baStatus' });
    const out = h('div', { class: 'ba-out', id: 'baOut' });
    const spellsBox = h('div', { class: 'ba-spells', id: 'baSpells' });
    const say = (txt, cls) => { out.className = 'ba-out ' + (cls || ''); out.textContent = txt; };

    const keyIn = h('input', { type: 'password', id: 'baKey', autocomplete: 'off', spellcheck: 'false', placeholder: 'sk_…', value: v.elevenKey() });
    const nameIn = h('input', { type: 'text', id: 'baName', maxlength: 24, value: c.bot.name, placeholder: 'Jarvis', onInput: (e) => { c.bot.name = e.target.value.trim(); GS.save(); } });
    const voiceSel = h('select', { id: 'baVoice', onChange: (e) => { const id = e.target.value; if (id) { c.bot.tts.femaleVoice = id; c.bot.tts.maleVoice = id; GS.save(); v.prewarm(); } } },
      h('option', { value: '' }, GS.t('Auto (suara lalai ElevenLabs)')));
    const loadVoices = async () => {
      if (!v.elevenKey()) return;
      try {
        const j = await v.elevenApi('voices');
        (j.voices || []).slice(0, 80).forEach((x) => { const g = x.labels && x.labels.gender ? ' · ' + x.labels.gender : ''; voiceSel.append(h('option', { value: x.voice_id, selected: x.voice_id === c.bot.tts.femaleVoice }, x.name + g)); });
      } catch (e) { /* senarai suara pilihan; abaikan */ }
    };
    const earsSel = h('select', { id: 'baEars', onChange: (e) => { s.ears = e.target.value; GS.save(); if (v.running) { v.stop(); GS.toast(GS.t('Tekan Hidupkan bot semula untuk guna telinga baharu.'), 'info'); } } },
      [['eleven', GS.t('ElevenLabs Scribe: faham Melayu dan English (guna kredit)')], ['windows', GS.t('Windows luar talian: percuma, English sahaja')]].map(([val, l]) => h('option', { value: val, selected: s.ears === val }, l)));
    const llmSel = h('select', { id: 'baLlm', onChange: (e) => { s.llm = e.target.value; GS.save(); } },
      [['gemini-2.0-flash', GS.t('Gemini 2.0 Flash (laju dan murah, disyorkan)')], ['gpt-4o-mini', 'GPT-4o mini'], ['claude-3-5-sonnet', 'Claude 3.5 Sonnet']].map(([val, l]) => h('option', { value: val, selected: s.llm === val }, l)));

    const saveKey = () => { const k = keyIn.value.trim(); v.setElevenKey(k); if (k) { c.bot.tts.provider = 'eleven'; c.bot.ai.provider = 'eleven'; c.bot.voiceOn = true; c.bot.inStream = true; GS.save(); v.prewarm(); } return k; };
    const paint = () => {
      const k = v.elevenKey();
      status.innerHTML = '';
      const row = (ok, txt) => status.append(h('div', { class: 'ba-row ' + (ok ? 'ok' : 'no') }, h('i', null, ok ? '✓' : '•'), h('span', null, txt)));
      row(!!k, k ? GS.t('Kunci ElevenLabs: {0}', mask(k)) : GS.t('Kunci ElevenLabs belum diisi'));
      row(!!s.agentId, s.agentId ? GS.t('Otak AI (ejen) sedia: {0}', botName()) : GS.t('Otak AI akan dicipta secara automatik apabila anda tekan Simpan'));
      row(v.running, v.running ? GS.t('Bot mendengar: sebut "{0}" kemudian soalan anda', botName()) : GS.t('Bot belum dihidupkan'));
      status.append(h('div', { class: 'ba-use' }, GS.t('Guna hari ini: {0} soalan AI · bulan ini: {1} soalan AI', dayNum(), monthNum()), h('span', { id: 'baQuota' }, '')));
    };
    const showQuota = async () => { const el = GS.$('#baQuota'); if (!el) return; try { const q = await B.quota(); el.textContent = ' · ' + GS.t('Kredit ElevenLabs: {0} / {1} aksara digunakan', q.used, q.limit) + (q.tier ? ' (' + q.tier + ')' : ''); } catch (e) { el.textContent = ''; } };
    const btn = (id, label, cls, fn) => h('button', { type: 'button', class: 'btn ' + (cls || ''), id, onClick: fn }, label);

    const onSave = async () => {
      const k = saveKey(); if (!k) { say(GS.t('Tampal kunci API ElevenLabs dahulu.'), 'bad'); return; }
      say(GS.t('Menyimpan dan menyediakan otak AI…'));
      try { await B.ensureAgent(true); say(GS.t('Siap. Otak AI dan suara disediakan. Tekan Uji suara atau Uji audio.'), 'ok'); } catch (e) { say(String(e.message || e), 'bad'); }
      paint(); showQuota(); loadVoices();
    };
    const onCheck = async () => {
      saveKey(); say(GS.t('Menyemak kunci…'));
      try { const q = await B.quota(); say(GS.t('Kunci sah. Pelan {0}: {1} / {2} aksara digunakan bulan ini.', q.tier || '-', q.used, q.limit), 'ok'); }
      catch (e) { say(String(e.message || e), 'bad'); }
      paint(); showQuota();
    };
    const onVoice = async () => { saveKey(); say(GS.t('Menyebut ujian suara…')); try { await v.speak(GS.t('Hai, saya {0}. Ini ujian suara saya.', botName()), { force: true }); say(GS.t('Jika anda mendengar suara, suara berfungsi.'), 'ok'); } catch (e) { say(String(e.message || e), 'bad'); } };
    const askIn = h('input', { type: 'text', id: 'baAsk', placeholder: GS.t('Taip soalan apa-apa untuk menguji (cth: terangkan hero Granger)'), onKeydown: (e) => { if (e.key === 'Enter') onAsk(); } });
    const onAsk = async () => {
      const q = askIn.value.trim(); if (!q) return; saveKey(); say(GS.t('Bot berfikir…'));
      try { const a = await B.ask(q); say('🤖 ' + a, 'ok'); v.say(a, true); paint(); showQuota(); } catch (e) { say(String(e.message || e), 'bad'); }
    };
    const onListen = async () => {
      saveKey();
      if (!v.elevenKey()) { say(GS.t('Tampal dan simpan kunci ElevenLabs dahulu.'), 'bad'); return; }
      if (!v.running) { say(GS.t('Menghidupkan bot dan mikrofon…')); const ok = await v.start(); if (!ok) { say(v.error || GS.t('Bot tidak dapat dihidupkan.'), 'bad'); paint(); return; } }
      v.awaitUntil = Date.now() + 12000;
      say(GS.t('Mendengar… cakap sekarang (contoh: "siapa kau?"). Jawapan akan disebut.'), 'ok');
      paint();
    };

    const spellChk = h('input', { type: 'checkbox', checked: s.spellOn !== false, onChange: (e) => { s.spellOn = e.target.checked; GS.save(); } });
    const spellAnn = h('input', { type: 'checkbox', checked: s.spellAnnounce !== false, onChange: (e) => { s.spellAnnounce = e.target.checked; GS.save(); } });
    const spellTest = h('input', { type: 'text', id: 'baSpellTest', placeholder: 'Granger flicker', onKeydown: (e) => { if (e.key === 'Enter') runSpellTest(); } });
    const runSpellTest = () => { const r = B.spellFromText(spellTest.value || 'Granger flicker'); say(r ? (r.dup ? GS.t('Spell sama baru sahaja dimulakan.') : GS.t('Pemasa dimulakan: {0} {1}.', r.hero, r.spell)) : GS.t('Tidak dapat mengesan hero dan spell. Sebut nama hero dan spell, cth "Granger flicker".'), r ? 'ok' : 'bad'); paintSpells(); };
    const paintSpells = () => {
      spellsBox.innerHTML = '';
      const now = Date.now(); const act = rows().filter((r) => r.hero && r.until);
      if (!act.length) { spellsBox.append(h('div', { class: 'muted note' }, GS.t('Tiada pemasa spell aktif.'))); return; }
      act.forEach((r) => { const left = Math.max(0, Math.ceil((r.until - now) / 1000)); spellsBox.append(h('div', { class: 'ba-sp' }, h('b', null, r.hero), h('span', null, r.spell), h('em', null, left > 0 ? GS.pad(Math.floor(left / 60)) + ':' + GS.pad(left % 60) : 'READY'))); });
    };
    const anSecs = h('input', { type: 'range', min: 8, max: 40, value: s.analysisSecs, onInput: (e) => { s.analysisSecs = Number(e.target.value); secLbl.textContent = s.analysisSecs + ' s'; GS.save(); } });
    const secLbl = h('b', null, s.analysisSecs + ' s');
    const anSpeak = h('input', { type: 'checkbox', checked: s.analysisSpeak !== false, onChange: (e) => { s.analysisSpeak = e.target.checked; GS.save(); } });

    const body = h('div', { class: 'ba-panel' },
      h('div', { class: 'ba-top' }, status, btn('baToggle', v.running ? GS.t('Matikan bot') : GS.t('Hidupkan bot'), v.running ? '' : 'primary', async () => { saveKey(); const ok = await v.toggle(); if (!ok && v.error) say(v.error, 'bad'); paint(); b2.textContent = v.running ? GS.t('Matikan bot') : GS.t('Hidupkan bot'); })),
      h('h3', null, GS.t('Setup Bot AI (otak + suara ElevenLabs)')),
      h('p', { class: 'muted note' }, GS.t('Satu kunci API ElevenLabs sahaja untuk otak, suara dan telinga bot. Daftar di elevenlabs.io, kemudian Profile > API Keys > Create, dan tampal di bawah. Pelan paling murah sudah memadai. Kunci disimpan disulitkan oleh Windows dalam PC ini sahaja. Kunci yang sama digunakan untuk semua suara (lelaki atau perempuan): suara dipilih di bawah, bukan dengan kunci berbeza.')),
      h('div', { class: 'grid2' },
        field(GS.t('Nama bot (kata panggilan)'), nameIn, GS.t('Cth Jarvis atau Chester. Sebut nama ini, kemudian soalan atau arahan.')),
        field(GS.t('Kunci API ElevenLabs'), keyIn)),
      h('div', { class: 'grid2' }, field(GS.t('Suara bot'), voiceSel), field(GS.t('Telinga bot (mendengar suara anda)'), earsSel)),
      h('details', { class: 'dev-adv' }, h('summary', null, GS.t('Model otak (lanjutan)')), field(GS.t('Model AI dalam ejen'), llmSel)),
      h('div', { class: 'btn-row' },
        btn('baSave', GS.t('Simpan'), 'primary', onSave), btn('baCheck', GS.t('Semak kunci'), '', onCheck), btn('baVoiceTest', GS.t('Uji suara'), '', onVoice), btn('baListen', GS.t('Uji audio (cakap terus)'), '', onListen),
        btn('baClear', GS.t('Padam kunci'), 'ghost', () => { v.setElevenKey(''); keyIn.value = ''; s.agentId = ''; s.sig = ''; GS.save(); say(GS.t('Kunci dipadam.')); paint(); })),
      h('div', { class: 'voice-test' }, askIn, btn('baAskBtn', GS.t('Tanya'), '', onAsk)),
      out,

      h('h3', null, GS.t('Analisis game')),
      h('p', { class: 'muted note' }, GS.t('Dua cara, fungsi yang sama: tekan Ctrl + Shift + A, atau sebut nama bot diikuti "analisis game ni" (cth "Chester, tolong analisis game ni"). Satu paparan analisis keluar secara automatik di atas capture card dan bot menyebut keputusannya. Analisis menggunakan data sebenar yang dikesan app (hero draft, K/D/A, item, rekod, meta).')),
      h('div', { class: 'btn-row' }, btn('baAnalyze', GS.t('Analisis game sekarang'), 'primary', () => { saveKey(); B.analyze({ source: 'key' }); }), h('kbd', null, 'Ctrl + Shift + A')),
      h('div', { class: 'grid2' }, h('label', { class: 'check' }, anSpeak, GS.t('Bot menyebut keputusan analisis')), field(GS.t('Lama paparan analisis'), h('div', { class: 'ba-sec' }, anSecs, secLbl))),

      h('h3', null, GS.t('Spell musuh melalui suara')),
      h('p', { class: 'muted note' }, GS.t('Sebut hero musuh dan spell, cth "Granger flicker", "Fanny purify" atau "Lancelot aegis". Pemasa keluar sendiri pada siaran dan kekal sehingga kosong, kemudian hilang dan bot menyebut dalam English, cth "Granger flicker is ready."')),
      h('div', { class: 'grid2' }, h('label', { class: 'check' }, spellChk, GS.t('Hidupkan pemasa spell melalui suara')), h('label', { class: 'check' }, spellAnn, GS.t('Bot menyebut apabila spell sudah ada semula'))),
      h('div', { class: 'voice-test' }, spellTest, btn('baSpellBtn', GS.t('Uji spell'), '', runSpellTest)),
      spellsBox,
      h('div', { class: 'btn-row' }, btn('baAdv', GS.t('Tetapan lanjutan (suara, efek, pengumum)…'), 'ghost', () => { if (GS.voiceui && GS.voiceui.openAdvanced) GS.voiceui.openAdvanced(); })));
    const b2 = body.querySelector('#baToggle');
    B.panel = GS.modal({ title: GS.t('Suara & Bot AI'), body, wide: true, onClose: () => { clearInterval(B.panelTimer); B.panel = null; } });
    loadVoices(); paint(); paintSpells(); showQuota();
    clearInterval(B.panelTimer); B.panelTimer = setInterval(() => { paintSpells(); }, 1000);
    GS.on('voice:status', () => { if (B.panel && B.panel.card && B.panel.card.isConnected) { paint(); const bb = GS.$('#baToggle'); if (bb) bb.textContent = V().running ? GS.t('Matikan bot') : GS.t('Hidupkan bot'); } });
  };

  B.init = function () {
    setInterval(spellTick, 500);
    if (unlocked()) { B.hotkeyOn(); if (window.gsNative && window.gsNative.botai && window.gsNative.botai.onAnalyze) window.gsNative.botai.onAnalyze(() => B.analyze({ source: 'key' })); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(B.init, 1200)); else setTimeout(B.init, 1200);
})();
