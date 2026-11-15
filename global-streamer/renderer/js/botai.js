/* Global Streamer - Bot AI: otak Claude (kunci Anthropic) + suara dan telinga ElevenLabs, pemasa spell musuh melalui suara, dan analisis game.
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
  const native = () => !!(window.gsNative && window.gsNative.ai && window.gsNative.ai.claude);
  const norm = (t) => String(t || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
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

  /* ---------- model otak (Claude) dan anggaran kos ---------- */
  B.MODELS = [
    ['claude-opus-5-5', 'Claude Opus 5.5 (paling pandai)', 5, 25],
    ['claude-sonnet-5-5', 'Claude Sonnet 5.5 (seimbang, disyorkan)', 3, 15],
    ['claude-haiku-5-5', 'Claude Haiku 5.5 (paling murah dan laju)', 1, 5],
  ];
  const price = (id) => { const m = B.MODELS.find((x) => x[0] === id); return m ? [m[2], m[3]] : [3, 15]; };   // USD setiap juta token: anggaran, semak harga rasmi Anthropic

  const monthKey = () => { const n = new Date(); return n.getFullYear() + '-' + GS.pad(n.getMonth() + 1); };
  const dayKey = () => { const n = new Date(); return monthKey() + '-' + GS.pad(n.getDate()); };
  const usage = () => {
    const u = st().usage;
    if (u.month !== monthKey()) { u.month = monthKey(); u.asks = 0; u.mUsd = 0; u.mChars = 0; }
    if (u.day !== dayKey()) { u.day = dayKey(); u.dayAsks = 0; u.dUsd = 0; u.dChars = 0; }
    return u;
  };
  B.usage = usage;
  const addUse = (model, tin, tout) => {
    const u = usage(), p = price(model), usd = (tin * p[0] + tout * p[1]) / 1e6;
    u.asks++; u.dayAsks++; u.mUsd += usd; u.dUsd += usd; GS.save();
  };
  B.addChars = (n) => { const u = usage(); u.mChars += n; u.dChars += n; GS.save(); GS.emit('botai:changed'); };

  /* ---------- Claude: panggilan API ---------- */
  const errText = (r) => {
    const m = String(r.message || '').slice(0, 160);
    if (r.status === 401 || r.status === 403) return GS.t('Kunci Anthropic tidak sah atau tiada kebenaran. Semak kunci di console.anthropic.com > API Keys.');
    if (r.status === 429) return GS.t('Anthropic: terlalu banyak permintaan atau had dicapai. Cuba sebentar lagi.');
    if (r.status === 402 || /credit|billing/i.test(m)) return GS.t('Kredit Anthropic tidak mencukupi. Tambah kredit di console.anthropic.com > Billing.');
    if (r.status === 404 || (r.status === 400 && /model/i.test(m))) return GS.t('Anthropic: model otak tidak diterima. Pilih model lain.') + (m ? ' (' + m + ')' : '');
    if (r.code === 'timeout') return GS.t('Anthropic tidak menjawab (tamat masa).');
    if (r.code === 'network' || r.status === 0) return GS.t('Tidak dapat menghubungi Anthropic. Semak sambungan internet.');
    return GS.t('Anthropic gagal (kod {0}): {1}', r.status, m);
  };
  const elErr = (r) => {
    const m = String(r.message || '').slice(0, 160);
    if (r.status === 401 || r.status === 403) return GS.t('Kunci ElevenLabs tidak sah atau tiada kebenaran (hidupkan kebenaran Speech to Text atau beri akses penuh).');
    if (r.status === 429) return GS.t('ElevenLabs: terlalu banyak permintaan atau had dicapai. Cuba sebentar lagi.');
    if (r.status === 402 || /quota|limit/i.test(String(r.code))) return GS.t('Kredit ElevenLabs tidak mencukupi.');
    if (r.code === 'timeout') return GS.t('ElevenLabs tidak menjawab (tamat masa).');
    if (r.code === 'network' || r.status === 0) return GS.t('Tidak dapat menghubungi ElevenLabs. Semak sambungan internet.');
    return GS.t('ElevenLabs gagal (kod {0}): {1}', r.status, m);
  };
  const claude = async (op, params) => {
    if (!native()) throw new Error(GS.t('Bot AI hanya tersedia dalam app Windows.'));
    const key = V().claudeKey();
    if (!key) throw new Error(GS.t('Kunci Anthropic belum diisi.'));
    const r = await window.gsNative.ai.claude(op, Object.assign({ key }, params || {}));
    if (!r || !r.ok) { const e = new Error(errText(r || {})); e.status = r && r.status; throw e; }
    return r;
  };
  const eleven = async (op, params) => {
    if (!(window.gsNative && window.gsNative.tts && window.gsNative.tts.agent)) throw new Error(GS.t('Bot AI hanya tersedia dalam app Windows.'));
    const key = V().elevenKey();
    if (!key) throw new Error(GS.t('Kunci ElevenLabs belum diisi.'));
    const r = await window.gsNative.tts.agent(op, Object.assign({ key }, params || {}));
    if (!r || !r.ok) { const e = new Error(elErr(r || {})); e.status = r && r.status; throw e; }
    return r;
  };
  B.checkClaude = async () => { await claude('check'); return true; };
  B.quota = async () => { const r = await eleven('subscription'); const j = r.json || {}; return { used: j.character_count, limit: j.character_limit, tier: j.tier }; };

  /* ---------- arahan otak ---------- */
  const botName = () => (vc().bot.name || 'Hyper').trim() || 'Hyper';
  const sysPrompt = () => 'Kamu ialah ' + botName() + ', pembantu suara AI yang menemani seorang streamer game Mobile Legends dalam siaran langsung; penonton turut mendengar. '
    + 'JAWAB TEPAT APA YANG DITANYA, mengikut topik soalan, walau apa pun topiknya (game, ilmu am, makanan, anime, perasaan, lawak). Jangan lari topik. '
    + 'Kamu AI: jangan berpura-pura manusia, tetapi tetap beri pendapat dan jawapan sebenar. '
    + 'Bercakap Bahasa Melayu Malaysia yang santai (boleh sedikit slanga seperti "wei", "bro", "lah"). Jawab dalam bahasa yang SAMA dengan soalan (jika soalan English, jawab English). '
    + 'Jawapan pendek: 1-2 ayat, paling banyak 30 patah perkataan, KECUALI diminta analisis game. Tanpa emoji, tanpa senarai, tanpa markdown, kerana jawapan akan disebut kuat. '
    + 'Mesej pengguna boleh bermula dengan blok [DATA GAME] (data sebenar yang dikesan app). Gunakan DATA itu hanya untuk soalan tentang game/siaran; jangan mereka nama pemain, pasukan atau statistik yang tiada dalam DATA. '
    + 'Jika mesej meminta ANALISIS GAME dengan format WIN/POINT/TIP, balas TEPAT dalam format itu sahaja. '
    + 'Untuk soalan siapa noob atau troll, bergurau dengan mesra; jangan menghina atau guna kata kesat.';

  const clean = (t, lim) => {
    let x = String(t || '').replace(/[*_`#>~]/g, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/[ \t]+/g, ' ').trim();
    if (lim && x.length > lim) { const cut = x.slice(0, lim); const p = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? ')); x = p > 60 ? cut.slice(0, p + 1) : cut.replace(/\s+\S*$/, '') + '…'; }
    return x;
  };
  const GAMEQ = /\b(game|main|kill|kda|hero|draft|team|pasukan|musuh|match|perlawanan|menang|kalah|rank|analis|analys|mati|item|ban|pick|lane)\b/i;
  /** Tanya otak Claude. Mengembalikan teks jawapan. */
  B.ask = async (question, o) => {
    o = o || {};
    const q = String(question).slice(0, 500);
    const withData = o.analysis || GAMEQ.test(q);
    const msgs = [];
    if (!o.analysis) B.mem.slice(-4).forEach((m) => { msgs.push({ role: 'user', content: m.q }); msgs.push({ role: 'assistant', content: m.a }); });
    msgs.push({ role: 'user', content: (withData ? '[DATA GAME]\n' + V().gameContext() + '\n\n' : '') + (withData ? '[SOALAN]\n' : '') + q });
    const model = st().model || 'claude-sonnet-5-5';
    const r = await claude('chat', { model, system: sysPrompt(), messages: msgs, max_tokens: o.analysis ? 420 : 200, temperature: 0.8 });
    addUse(model, r.usage ? r.usage.input : 0, r.usage ? r.usage.output : 0);
    GS.emit('botai:changed');
    const text = clean(r.text, o.analysis ? 900 : 300);
    if (!text) throw new Error(GS.t('Anthropic tidak memberi jawapan.'));
    if (!o.analysis) { B.mem.push({ q: q.slice(0, 160), a: text.slice(0, 200) }); B.mem = B.mem.slice(-6); }
    return text;
  };

  /* ---------- telinga: ElevenLabs Scribe ---------- */
  B.transcribe = async (wav) => { const r = await eleven('stt', { wav }); return String(r.text || '').trim(); };
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
    const owned = (E.state && E.state.owned) || [];
    const chips = [];
    if (k) { chips.push(['KDA', k.k + '/' + k.d + '/' + k.a]); }
    if (D.ally.length || D.enemy.length) chips.push(['DRAFT', D.ally.length + ' v ' + D.enemy.length]);
    if (S.winloss && (S.winloss.win || S.winloss.loss)) chips.push(['RECORD', S.winloss.win + '-' + S.winloss.loss]);
    if (owned.length) chips.push(['ITEMS', owned.length + '/6']);
    return { win: win == null ? null : Math.round(win), lines: lines.slice(0, 4), tip, kda: k ? { k: k.k, d: k.d, a: k.a } : null, chips };
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
      showAnalysis({ state: 'think', win: local.win, lines: [], tip: '', kda: local.kda, chips: local.chips, source: o.source });
      let res = local, ai = false;
      if (V().aiConfigured()) {
        try {
          const text = await B.ask(ANALYSIS_ASK, { analysis: true });
          const p = parseAnalysis(text);
          if (p.lines.length || p.tip) { res = Object.assign({}, local, { win: p.win != null ? p.win : local.win, lines: p.lines.length ? p.lines.slice(0, 3) : local.lines, tip: p.tip || local.tip }); ai = true; }
          else if (text) res = Object.assign({}, local, { lines: [clean(text, 120)] });
        } catch (e) { B.lastErr = String((e && e.message) || e); GS.toast(B.lastErr, 'warn', 6000); }
      }
      const speak = (res.win != null ? GS.t('Peluang menang dianggar {0} peratus.', res.win) + ' ' : '') + res.lines.slice(0, 2).join(' ') + ' ' + res.tip;
      showAnalysis({ state: 'done', win: res.win, lines: res.lines, tip: res.tip, kda: res.kda, chips: res.chips, ai, source: o.source, skipIn: true });
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

  /* ==================== PANEL BESAR: SETUP BOT AI (OTAK + SUARA PREMIUM) ==================== */
  const mask = (k) => (k ? '…' + k.slice(-4) : '');
  const field = (label, ctl, hint) => h('label', { class: 'field' }, h('span', null, label), ctl, hint ? h('small', { class: 'muted' }, hint) : null);
  const rm = (usd) => (usd * (st().rm || 4.4)).toFixed(2);
  B.panel = null;
  B.openPanel = function () {
    if (!unlocked()) return;
    if (B.panel && B.panel.card && B.panel.card.isConnected) return;
    const v = V(), c = vc(), s = st(), t = c.bot.tts;
    const status = h('div', { class: 'ba-status', id: 'baStatus' });
    const out = h('div', { class: 'ba-out', id: 'baOut' });
    const spellsBox = h('div', { class: 'ba-spells', id: 'baSpells' });
    const say = (txt, cls) => { out.className = 'ba-out ' + (cls || ''); out.textContent = txt; };
    const btn = (id, label, cls, fn) => h('button', { type: 'button', class: 'btn ' + (cls || ''), id, onClick: fn }, label);

    const claudeIn = h('input', { type: 'password', id: 'baClaudeKey', autocomplete: 'off', spellcheck: 'false', placeholder: 'sk-ant-…', value: v.claudeKey() });
    const modelSel = h('select', { id: 'baModel', onChange: (e) => { s.model = e.target.value; GS.save(); } },
      B.MODELS.map(([id, l]) => h('option', { value: id, selected: s.model === id }, l)));
    const elevenIn = h('input', { type: 'password', id: 'baElevenKey', autocomplete: 'off', spellcheck: 'false', placeholder: 'sk_…', value: v.elevenKey() });
    const voiceIn = h('input', { type: 'text', id: 'baVoiceId', spellcheck: 'false', placeholder: 'cth 21m00Tcm4TlvDq8ikWAM', value: t.femaleVoice || '', list: 'baVoiceList' });
    const voiceList = h('datalist', { id: 'baVoiceList' });
    const ttsModelSel = h('select', { id: 'baTtsModel', onChange: (e) => { t.model = e.target.value; GS.save(); v.prewarm(); } },
      [['eleven_multilingual_v2', GS.t('Multilingual v2 (paling cantik)')], ['eleven_flash_v2_5', GS.t('Flash v2.5 (laju dan murah)')]].map(([id, l]) => h('option', { value: id, selected: t.model === id }, l)));
    const provSel = h('select', { id: 'baProv', onChange: (e) => { t.provider = e.target.value; GS.save(); v.prewarm(); } },
      [['eleven', GS.t('ElevenLabs (premium)')], ['system', GS.t('Suara sistem (percuma)')]].map(([id, l]) => h('option', { value: id, selected: t.provider === id }, l)));
    const nameIn = h('input', { type: 'text', id: 'baName', maxlength: 24, value: c.bot.name, placeholder: 'Hyper', onInput: (e) => { c.bot.name = e.target.value.trim(); GS.save(); paint(); } });
    const earsSel = h('select', { id: 'baEars', onChange: (e) => { s.ears = e.target.value; GS.save(); if (v.running) { v.stop(); GS.toast(GS.t('Tekan Hidupkan mic semula untuk guna telinga baharu.'), 'info'); } } },
      [['eleven', GS.t('ElevenLabs Scribe: faham Melayu dan English (guna kredit)')], ['windows', GS.t('Windows luar talian: percuma, English sahaja')]].map(([id, l]) => h('option', { value: id, selected: s.ears === id }, l)));
    const extraIn = h('textarea', { id: 'baExtra', rows: 2, maxlength: 600, placeholder: GS.t('cth: Nama streamer saya Ali. Pasukan kami Team X. Saya main jungle.'), onInput: (e) => { c.bot.ai.extra = e.target.value; GS.save(); } }, c.bot.ai.extra || '');

    const loadVoices = async () => {
      if (!v.elevenKey()) return;
      try {
        const j = await v.elevenApi('voices');
        voiceList.innerHTML = '';
        (j.voices || []).slice(0, 80).forEach((x) => voiceList.append(h('option', { value: x.voice_id }, x.name + (x.labels && x.labels.gender ? ' · ' + x.labels.gender : ''))));
      } catch (e) { /* senarai pilihan; abaikan */ }
    };
    const saveAll = () => {
      v.setClaudeKey(claudeIn.value.trim()); v.setElevenKey(elevenIn.value.trim());
      const id = voiceIn.value.trim(); if (/^[A-Za-z0-9]{10,40}$/.test(id)) { t.femaleVoice = id; t.maleVoice = id; }
      c.bot.name = nameIn.value.trim() || 'Hyper';
      if (v.claudeKey()) c.bot.ai.provider = 'claude';
      c.bot.voiceOn = true; c.bot.inStream = true; if (!c.bot.ack || c.bot.ack === 'Ya?') c.bot.ack = 'Sedia, cakap je.';
      GS.save(); v.prewarm();
    };
    const paint = () => {
      const ck = v.claudeKey(), ek = v.elevenKey(), u = B.usage();
      status.innerHTML = '';
      const on = !!(ck && ek);
      status.append(h('div', { class: 'ba-line' }, h('b', null, GS.t('Status') + ': '),
        h('span', { class: ck ? 'ok' : 'no' }, GS.t('Otak AI') + (ck ? ' ✓ key ' + mask(ck) : ' ✗')), ' · ',
        h('span', { class: ek ? 'ok' : 'no' }, 'ElevenLabs' + (ek ? ' ✓ key ' + mask(ek) : ' ✗')), ' · ',
        h('span', { class: on ? 'ok' : 'no' }, on ? 'AI ON' : 'AI OFF')));
      status.append(h('div', { class: 'ba-line' }, h('b', null, GS.t('Guna hari ni') + ': '), GS.t('{0} soalan AI · USD {1} (≈ RM {2}) · ElevenLabs {3} aksara', u.dayAsks, u.dUsd.toFixed(3), rm(u.dUsd), u.dChars)));
      status.append(h('div', { class: 'ba-line' }, h('b', null, GS.t('Bulan ni') + ': '), GS.t('{0} soalan AI · USD {1} (≈ RM {2}) · ElevenLabs {3} aksara', u.asks, u.mUsd.toFixed(3), rm(u.mUsd), u.mChars), h('span', { id: 'baQuota' }, '')));
      status.append(h('div', { class: 'ba-mic ' + (v.running ? 'on' : '') }, h('i', null), h('b', null, 'VOICE MIC ' + (v.running ? GS.t('berjalan') : GS.t('mati'))), ' · ', v.running ? GS.t('{0} sedia', botName()) : GS.t('tekan Hidupkan mic')));
    };
    const showQuota = async () => { const el = GS.$('#baQuota'); if (!el || !v.elevenKey()) return; try { const q = await B.quota(); el.textContent = ' · ' + GS.t('Kredit ElevenLabs: {0} / {1} aksara digunakan', q.used, q.limit); } catch (e) { el.textContent = ''; } };

    const onSave = async () => {
      saveAll(); paint(); loadVoices(); showQuota();
      say(GS.t('Disimpan. Kunci disimpan disulitkan dalam PC ini sahaja.'), 'ok');
    };
    const onCheck = async () => {
      saveAll(); say(GS.t('Menyemak kunci…'));
      const res = [];
      try { await B.checkClaude(); res.push('✓ Anthropic'); } catch (e) { res.push('✗ Anthropic: ' + (v.claudeKey() ? e.message : GS.t('belum diisi'))); }
      try { const q = await B.quota(); res.push('✓ ElevenLabs (' + (q.tier || '-') + ', ' + q.used + '/' + q.limit + ')'); } catch (e) { res.push('✗ ElevenLabs: ' + (v.elevenKey() ? e.message : GS.t('belum diisi'))); }
      say(res.join('\n'), res.every((x) => x[0] === '✓') ? 'ok' : 'bad'); paint(); showQuota();
    };
    const onVoice = async () => { saveAll(); say(GS.t('Menyebut ujian suara…')); try { await v.speak(GS.t('Hai, saya {0}. Ini ujian suara saya.', botName()), { force: true }); say(GS.t('Jika anda mendengar suara, suara berfungsi.'), 'ok'); paint(); } catch (e) { say(String(e.message || e), 'bad'); } };
    const onAi = async () => {
      saveAll(); say(GS.t('Bot berfikir…'));
      try { const a = await B.ask(GS.t('Hai, kau siapa? Jawab pendek.')); say('🤖 ' + a, 'ok'); v.say(a, true); paint(); } catch (e) { say(String(e.message || e), 'bad'); }
    };
    const askIn = h('input', { type: 'text', id: 'baAsk', placeholder: GS.t('Taip soalan apa-apa untuk menguji (cth: terangkan hero Granger)'), onKeydown: (e) => { if (e.key === 'Enter') onAsk(); } });
    const onAsk = async () => { const q = askIn.value.trim(); if (!q) return; saveAll(); say(GS.t('Bot berfikir…')); try { const a = await B.ask(q); say('🤖 ' + a, 'ok'); v.say(a, true); paint(); } catch (e) { say(String(e.message || e), 'bad'); } };
    const onMic = async () => {
      saveAll();
      if (v.running) { v.stop(); paint(); return; }
      say(GS.t('Menghidupkan mic…')); const ok = await v.start(); if (!ok) say(v.error || GS.t('Bot tidak dapat dihidupkan.'), 'bad'); else say(GS.t('Mic hidup. Sebut "{0}" kemudian soalan, atau "{0} analisis game ni".', botName()), 'ok');
      paint();
    };
    const onListen = async () => {
      saveAll();
      if (!v.claudeKey() || !v.elevenKey()) { say(GS.t('Isi dan simpan kedua-dua kunci (Anthropic dan ElevenLabs) dahulu.'), 'bad'); return; }
      if (!v.running) { say(GS.t('Menghidupkan mic…')); const ok = await v.start(); if (!ok) { say(v.error || GS.t('Bot tidak dapat dihidupkan.'), 'bad'); paint(); return; } }
      v.awaitUntil = Date.now() + 12000; v.say(c.bot.ack || 'Sedia, cakap je.');
      say(GS.t('Mendengar… cakap sekarang (contoh: "siapa kau?"). Jawapan akan disebut.'), 'ok'); paint();
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
    const secLbl = h('b', null, s.analysisSecs + ' s');
    const anSecs = h('input', { type: 'range', min: 8, max: 40, value: s.analysisSecs, onInput: (e) => { s.analysisSecs = Number(e.target.value); secLbl.textContent = s.analysisSecs + ' s'; GS.save(); } });
    const anSpeak = h('input', { type: 'checkbox', checked: s.analysisSpeak !== false, onChange: (e) => { s.analysisSpeak = e.target.checked; GS.save(); } });

    const body = h('div', { class: 'ba-panel' },
      h('div', { class: 'ba-card' },
        h('h3', { class: 'ba-title' }, '🔑 ' + GS.t('Setup {0} AI (otak + suara premium)', botName().toUpperCase())),
        h('p', { class: 'muted note' }, GS.t('Kunci disimpan dalam PC ini sahaja (disulitkan oleh Windows). Yang ditunjuk balik cuma 4 huruf terakhir. Satu kunci ElevenLabs sama untuk semua suara (lelaki atau perempuan): suara dipilih dengan Voice ID.')),
        h('div', { class: 'grid2' },
          field('Anthropic API key', claudeIn, 'console.anthropic.com → API Keys'),
          field(GS.t('Model otak'), modelSel)),
        h('div', { class: 'grid2' },
          field('ElevenLabs API key', elevenIn, 'elevenlabs.io → Profile → API Keys'),
          field('ElevenLabs Voice ID', voiceIn, 'Voices → Copy Voice ID'), voiceList),
        h('div', { class: 'grid2' },
          field(GS.t('Model suara'), ttsModelSel),
          field(GS.t('Suara jawapan'), provSel)),
        h('div', { class: 'grid2' },
          field(GS.t('Nama assistant'), nameIn, GS.t('Ikut suka (cth Hyper, Jarvis, Chester). Sebut nama ini untuk memanggil bot.')),
          field(GS.t('Telinga bot (mendengar suara anda)'), earsSel)),
        h('div', { class: 'btn-row' }, btn('baSave', '💾 ' + GS.t('SIMPAN'), 'primary', onSave), btn('baCheck', '✓ ' + GS.t('SEMAK KEY'), '', onCheck), btn('baVoiceTest', '🔊 ' + GS.t('UJI SUARA'), '', onVoice), btn('baAiTest', '● ' + GS.t('UJI AI'), '', onAi),
          btn('baClear', GS.t('Padam kunci'), 'ghost', () => { v.setClaudeKey(''); v.setElevenKey(''); claudeIn.value = ''; elevenIn.value = ''; say(GS.t('Kunci dipadam.')); paint(); })),
        status, out),

      h('h3', null, GS.t('PANGGIL {0}', botName().toUpperCase())),
      h('p', { class: 'muted note' }, GS.t('Sebut nama bot kemudian soalan atau arahan, cth "{0}, siapa noob?". Bot menjawab apa-apa soalan dan boleh menganalisis game.', botName())),
      h('div', { class: 'btn-row' }, btn('baToggle', v.running ? GS.t('Matikan mic') : GS.t('Hidupkan mic'), v.running ? '' : 'primary', onMic), btn('baListen', GS.t('Uji audio (cakap terus)'), '', onListen)),
      h('div', { class: 'voice-test' }, askIn, btn('baAskBtn', GS.t('Tanya'), '', onAsk)),
      field(GS.t('Maklumat tambahan untuk bot (pilihan)'), extraIn),

      h('h3', null, GS.t('Analisis game')),
      h('p', { class: 'muted note' }, GS.t('Dua cara, fungsi yang sama: tekan Ctrl + Shift + A, atau sebut nama bot diikuti "analisis game ni" (cth "Chester, tolong analisis game ni"). Satu paparan analisis keluar secara automatik di atas capture card dan bot menyebut keputusannya. Analisis menggunakan data sebenar yang dikesan app (hero draft, K/D/A, item, rekod, meta).')),
      h('div', { class: 'btn-row' }, btn('baAnalyze', GS.t('Analisis game sekarang'), 'primary', () => { saveAll(); B.analyze({ source: 'key' }); }), h('kbd', null, 'Ctrl + Shift + A')),
      h('div', { class: 'grid2' }, h('label', { class: 'check' }, anSpeak, GS.t('Bot menyebut keputusan analisis')), field(GS.t('Lama paparan analisis'), h('div', { class: 'ba-sec' }, anSecs, secLbl))),

      h('h3', null, GS.t('Spell musuh melalui suara')),
      h('p', { class: 'muted note' }, GS.t('Sebut hero musuh dan spell, cth "Granger flicker", "Fanny purify" atau "Lancelot aegis". Pemasa keluar sendiri pada siaran dan kekal sehingga kosong, kemudian hilang dan bot menyebut dalam English, cth "Granger flicker is ready."')),
      h('div', { class: 'grid2' }, h('label', { class: 'check' }, spellChk, GS.t('Hidupkan pemasa spell melalui suara')), h('label', { class: 'check' }, spellAnn, GS.t('Bot menyebut apabila spell sudah ada semula'))),
      h('div', { class: 'voice-test' }, spellTest, btn('baSpellBtn', GS.t('Uji spell'), '', runSpellTest)),
      spellsBox,
      h('div', { class: 'btn-row' }, btn('baAdv', GS.t('Tetapan lanjutan (suara, efek, pengumum)…'), 'ghost', () => { if (GS.voiceui && GS.voiceui.openAdvanced) GS.voiceui.openAdvanced(); })));
    B.panel = GS.modal({ title: GS.t('Suara & Bot AI'), body, wide: true, onClose: () => { clearInterval(B.panelTimer); B.panel = null; } });
    loadVoices(); paint(); paintSpells(); showQuota();
    clearInterval(B.panelTimer); B.panelTimer = setInterval(paintSpells, 1000);
    const live = () => { if (B.panel && B.panel.card && B.panel.card.isConnected) { paint(); const bb = GS.$('#baToggle'); if (bb) { bb.textContent = V().running ? GS.t('Matikan mic') : GS.t('Hidupkan mic'); bb.classList.toggle('primary', !V().running); } } };
    GS.on('voice:status', live); GS.on('botai:changed', live);
  };

  B.init = function () {
    setInterval(spellTick, 500);
    if (unlocked()) { B.hotkeyOn(); if (window.gsNative && window.gsNative.botai && window.gsNative.botai.onAnalyze) window.gsNative.botai.onAnalyze(() => B.analyze({ source: 'key' })); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(B.init, 1200)); else setTimeout(B.init, 1200);
})();
