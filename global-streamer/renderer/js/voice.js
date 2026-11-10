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

  /* ---------- suara: penyedia (sistem / Azure / ElevenLabs), cache dan main ---------- */
  const ELEVEN = 'https://api.elevenlabs.io/v1';
  const MODELS = ['eleven_multilingual_v2', 'eleven_flash_v2_5'];
  const warned = new Map();
  // setiap mesej ralat dipaparkan paling kerap sekali setiap 20 saat (tidak membanjiri skrin apabila bot menjawab berulang kali)
  const warn = (msg) => { const n = Date.now(); if (n - (warned.get(msg) || 0) > 20000) { warned.set(msg, n); GS.toast(msg, 'warn', 6000); } };
  V.resetWarn = () => warned.clear();
  V.elevenKey = () => ((GS.platforms && GS.platforms.getKey('tts-elevenlabs')) || '').trim();
  V.setElevenKey = (k) => GS.platforms.setKey('tts-elevenlabs', String(k || '').trim());
  V.azureKey = () => ((GS.platforms && GS.platforms.getKey('tts-azure')) || '').trim();
  V.setAzureKey = (k) => GS.platforms.setKey('tts-azure', String(k || '').trim());
  const PROV = { azure: 'Azure Speech', eleven: 'ElevenLabs' };

  /** Ralat penyedia -> mesej yang mudah difahami. */
  const errMsg = (prov, status, code, msg) => {
    const n = PROV[prov] || prov;
    if (/quota|limit_exceeded/i.test(code || '') || /quota/i.test(msg || '')) return GS.t('Kuota percuma {0} bulan ini sudah habis.', n);
    const perm = /missing[_ ]permissions?/i.test(code || '') || /missing the permission|permission/i.test(msg || '') ? String(msg || '').match(/permission[s]?\s+[`'"]?([a-z_]+)/i) : null;
    if ((status === 401 || status === 403) && (perm || /missing[_ ]permissions?/i.test(code || ''))) return GS.t('Kunci API {0} tiada kebenaran "{1}". Buat kunci baharu dan hidupkan kebenaran itu (atau pilih akses penuh).', n, (perm && perm[1]) || 'voices');
    if (status === 401 || status === 403) return GS.t('Kunci API {0} tidak sah atau tiada kebenaran (semak kunci dan kawasan).', n);
    if (status === 429) return GS.t('{0}: terlalu banyak permintaan. Cuba sebentar lagi.', n);
    if (status === 402) return GS.t('Pelan {0} anda tidak membenarkan suara ini.', n);
    if (code === 'timeout') return GS.t('{0} tidak menjawab (tamat masa).', n);
    if (code === 'network' || status === 0) return GS.t('Tidak dapat menghubungi {0}. Semak sambungan internet.', n);
    return GS.t('{0} gagal (kod {1}).', n, status);
  };

  const azVoice = (lang, gender) => { const a = cfg().bot.tts.azure; const ms = String(lang).toLowerCase().startsWith('ms'); return gender === 'male' ? (ms ? a.maleMs : a.maleEn) : (ms ? a.femaleMs : a.femaleEn); };
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

  /** Ambil audio (ArrayBuffer) daripada penyedia AI. App Windows: melalui proses utama; web: terus dari pelayar. */
  async function netAudio(prov, text, lang, gender, mood) {
    const b = cfg().bot, t = b.tts;
    const spoken = String(text).slice(0, prov === 'eleven' ? 280 : 500);
    const model = MODELS.includes(t.model) ? t.model : MODELS[0];
    const params = prov === 'azure'
      ? { key: V.azureKey(), region: t.azure.region, voice: azVoice(lang, gender), text: spoken, rate: Math.round((Number(b.rate) || 0) * 6) + (MOODS[mood] ? MOODS[mood].rate : 0), pitch: MOODS[mood] ? MOODS[mood].pitch : 0 }
      : { key: V.elevenKey(), voice: gender === 'male' ? t.maleVoice : t.femaleVoice, model, language_code: String(lang).slice(0, 2).toLowerCase(), text: spoken, voice_settings: MOODS[mood] ? Object.assign({ similarity_boost: 0.8 }, MOODS[mood].el) : undefined };
    if (!params.key) throw new Error(GS.t('Kunci API {0} belum diisi.', PROV[prov]));
    if (native() && window.gsNative.tts) {
      const r = await window.gsNative.tts.fetch(prov, params);
      if (!r || !r.ok) throw new Error(errMsg(prov, r && r.status, r && r.code, r && r.message));
      return r.audio.buffer.slice(r.audio.byteOffset, r.audio.byteOffset + r.audio.byteLength);
    }
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 15000);
    let res;
    try {
      if (prov === 'azure') {
        const l2 = params.voice.split('-').slice(0, 2).join('-');
        res = await fetch('https://' + String(params.region).toLowerCase() + '.tts.speech.microsoft.com/cognitiveservices/v1', { method: 'POST', signal: ctl.signal,
          headers: { 'Ocp-Apim-Subscription-Key': params.key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3' },
          body: "<speak version='1.0' xml:lang='" + l2 + "'><voice xml:lang='" + l2 + "' name='" + params.voice + "'><prosody rate='" + (params.rate >= 0 ? '+' : '') + params.rate + "%' pitch='" + (params.pitch >= 0 ? '+' : '') + params.pitch + "%'>" + esc(spoken) + '</prosody></voice></speak>' });
      } else {
        const body = { text: spoken, model_id: model }; if (model === 'eleven_flash_v2_5') body.language_code = params.language_code; if (params.voice_settings) body.voice_settings = params.voice_settings;
        res = await fetch(ELEVEN + '/text-to-speech/' + params.voice + '?output_format=mp3_44100_128', { method: 'POST', signal: ctl.signal, headers: { 'xi-api-key': params.key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(body) });
      }
    } catch (e) { throw new Error(errMsg(prov, 0, e && e.name === 'AbortError' ? 'timeout' : 'network')); } finally { clearTimeout(to); }
    if (!res.ok) {
      let code = '', msg = ''; try { const j = await res.json(); const d = j.detail || j.error || j; code = String(d.status || d.code || ''); msg = String(d.message || ''); } catch (e) { /* bukan JSON */ }
      throw new Error(errMsg(prov, res.status, code, msg));
    }
    return res.arrayBuffer();
  }

  /** Panggilan API suara ElevenLabs (senarai suara, perpustakaan, tambah). App Windows: melalui proses utama; web: terus. */
  V.elevenApi = async function (op, params) {
    const key = V.elevenKey();
    if (!key) throw new Error(GS.t('Kunci API {0} belum diisi.', PROV.eleven));
    const p = Object.assign({ key }, params || {});
    if (native() && window.gsNative.tts && window.gsNative.tts.eleven) {
      const r = await window.gsNative.tts.eleven(op, p);
      if (!r || !r.ok) throw new Error(errMsg('eleven', r && r.status, r && r.code, r && r.message));
      return r.json;
    }
    let url = ELEVEN, init = { headers: { 'xi-api-key': key, Accept: 'application/json' } };
    if (op === 'voices') url += '/voices';
    else if (op === 'shared') { const q = new URLSearchParams({ page_size: String(p.page_size || 20) }); if (p.language) q.set('language', p.language); if (p.gender) q.set('gender', p.gender); if (/^[\p{L}\p{N} –-]{2,60}$/u.test(String(p.search || ''))) q.set('search', p.search); url += '/shared-voices?' + q; }
    else if (op === 'add') { url += '/voices/add/' + p.public_user_id + '/' + p.voice_id; init.method = 'POST'; init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify({ new_name: p.new_name || 'Suara Melayu' }); }
    let r;
    try { r = await fetch(url, init); } catch (e) { throw new Error(errMsg('eleven', 0, 'network')); }
    if (!r.ok) { let code = '', msg = ''; try { const j = await r.json(); const d = j.detail || j; code = String(d.status || d.code || ''); msg = String(d.message || ''); } catch (e) { /* abaikan */ } throw new Error(errMsg('eleven', r.status, code, msg)); }
    return r.json();
  };

  const isMs = (x) => /(^|[^a-z])(ms|may|malay|melayu|malaysia|malaysian)([^a-z]|$)/i.test(String(x || ''));
  const normVoice = (v, inAccount) => ({
    id: v.voice_id, name: v.name || v.voice_id, owner: v.public_owner_id || '', inAccount: !!inAccount,
    gender: String((v.labels && v.labels.gender) || v.gender || '').toLowerCase(), accent: (v.labels && v.labels.accent) || v.accent || '', language: (v.labels && v.labels.language) || v.language || '',
    preview: v.preview_url || '', category: v.category || '', free: v.free_users_allowed !== false,
  });
  /** Suara pilihan (sesuai untuk game/siaran, Melayu): dicari dan diutamakan. */
  const PREFERRED = { female: { id: 'jfD5mm5oPglFjL59x819', name: 'Aisyah – Video Game Character' }, male: { id: 'mPe1DSKUjbs1HQLfCR9S', name: 'Zain – Powerful Game Character' } };
  V.PREFERRED = PREFERRED;
  const scoreV = (c) => (c.id === PREFERRED.female.id || c.id === PREFERRED.male.id ? 20 : 0) + (isMs(c.language) ? 4 : 0) + (isMs(c.accent) || isMs(c.name) ? 2 : 0) + (c.inAccount ? 2 : 0) + (c.free ? 1 : 0) + (c.category === 'premade' ? 0.5 : 0);
  /** Cari suara ElevenLabs untuk Bahasa Melayu: suara dalam akaun + perpustakaan awam (bahasa "ms") + suara premade sebagai sandaran. */
  V.findMalayVoices = async function () {
    const res = { male: [], female: [], notes: [] };
    const seen = new Set();
    const push = (c) => { if (!c.id || seen.has(c.id) || (c.gender !== 'male' && c.gender !== 'female')) return; seen.add(c.id); c.malay = isMs(c.language) || isMs(c.accent); res[c.gender].push(c); };
    let acct = [];
    try { acct = ((await V.elevenApi('voices')).voices || []).map((v) => normVoice(v, true)); } catch (e) { if (/Kunci API/.test(e.message)) throw e; res.notes.push(e.message); }
    acct.filter((c) => isMs(c.language) || isMs(c.accent) || isMs(c.name)).forEach(push);
    for (const g of ['male', 'female']) {
      try { const sh = await V.elevenApi('shared', { language: 'ms', gender: g, page_size: 20 }); (sh.voices || []).map((v) => normVoice(v, false)).forEach((c) => { c.gender = c.gender || g; push(c); }); } catch (e) { res.notes.push(e.message); }
    }
    // suara pilihan: cari mengikut nama jika belum ada dalam senarai
    for (const g of ['male', 'female']) {
      const pf = PREFERRED[g];
      if (seen.has(pf.id)) continue;
      try { const sh = await V.elevenApi('shared', { language: 'ms', gender: g, search: pf.name, page_size: 10 }); (sh.voices || []).map((v) => normVoice(v, false)).filter((c) => c.id === pf.id).forEach((c) => { c.gender = c.gender || g; push(c); }); } catch (e) { res.notes.push(e.message); }
    }
    // sandaran: suara premade/akaun mengikut jantina (boleh menyebut Melayu melalui model multilingual, loghat mungkin tidak 100% Malaysia)
    acct.forEach(push);
    ['male', 'female'].forEach((g) => res[g].sort((a, b) => scoreV(b) - scoreV(a)));
    return res;
  };
  /** Gunakan suara: suara perpustakaan ditambah ke akaun dahulu (perlu untuk disintesis). */
  V.useElevenVoice = async function (gender, c) {
    let id = c.id;
    if (!c.inAccount && c.owner) {
      const r = await V.elevenApi('add', { public_user_id: c.owner, voice_id: c.id, new_name: 'GS ' + (gender === 'male' ? 'Lelaki' : 'Perempuan') + ' ' + c.name });
      id = (r && r.voice_id) || c.id;
      c.inAccount = true; c.id = id;
    }
    const t = cfg().bot.tts;
    if (gender === 'male') t.maleVoice = id; else t.femaleVoice = id;
    t.provider = 'eleven';
    GS.save(); V.prewarm();
    return id;
  };

  /** Baki kuota ElevenLabs (Azure tiada API kuota ringkas: lihat portal Azure). */
  V.elevenQuota = async function () {
    const key = V.elevenKey();
    if (!key) throw new Error(GS.t('Kunci API {0} belum diisi.', PROV.eleven));
    let r;
    try { r = await fetch(ELEVEN + '/user/subscription', { headers: { 'xi-api-key': key } }); } catch (e) { throw new Error(errMsg('eleven', 0, 'network')); }
    if (!r.ok) throw new Error(errMsg('eleven', r.status, ''));
    const j = await r.json();
    return { used: j.character_count, limit: j.character_limit, tier: j.tier };
  };

  /** Audio yang sudah dinyahkod disimpan supaya main semula segera (dan tidak menggunakan kuota dua kali). */
  const bufCache = new Map();
  V.getBuffer = async function (prov, text, lang, gender, mood) {
    const t = cfg().bot.tts;
    const ck = [prov, prov === 'azure' ? azVoice(lang, gender) : (gender === 'male' ? t.maleVoice : t.femaleVoice), t.model, cfg().bot.rate, lang, mood || '', text].join('|');
    if (bufCache.has(ck)) return bufCache.get(ck);
    const ab = await netAudio(prov, text, lang, gender, mood);
    const buf = await GS.audio.ensure().decodeAudioData(ab);
    bufCache.set(ck, buf);
    if (bufCache.size > 80) bufCache.delete(bufCache.keys().next().value);
    return buf;
  };

  /** Bahasa teks (supaya suara menyebut dalam bahasa yang SAMA dengan teks): 'ms-MY' atau 'en-US'. */
  const MS_W = new Set('saya aku kau kita kami anda awak dia mereka yang dan atau ini itu tak tidak bukan dah sudah belum nak mahu boleh jangan lah kah pun juga dengan untuk dari pada ke di ada apa siapa mana bila kenapa bagaimana berapa sangat sekali banyak sikit lagi sudah akan sedang telah menang kalah bunuh mati hidup selamat datang terima kasih siaran langsung tahniah syabas hebat bagus mantap jom semua kawan tolong sila maaf harap esok semalam hari malam pagi petang minggu bulan tahun rekod hero kena buat tengok dengar cakap main game'.split(' '));
  const EN_W = new Set('the you your is are was were and or this that not do does did have has had will would can could with for from to of in on at what who which when why how many much very more some any all welcome thanks thank please sorry hello hi kill victory defeat double triple first blood maniac savage legendary shutdown slain have been won lost game player team win lose good great nice'.split(' '));
  V.detectLang = function (text) {
    const words = norm(text).split(' ').filter(Boolean);
    let ms = 0, en = 0;
    words.forEach((w) => { if (MS_W.has(w)) ms++; if (EN_W.has(w)) en++; });
    if (ms > en) return 'ms-MY';
    if (en > ms) return 'en-US';
    return V.cultureFor();
  };
  /** Emosi suara: nada/kelajuan untuk gembira (victory), suram (defeat), teruja (kill). */
  const MOODS = {
    happy: { rate: 10, pitch: 14, sRate: 1.12, sPitch: 1.25, el: { stability: 0.3, style: 0.7, speed: 1.1 } },
    excited: { rate: 8, pitch: 9, sRate: 1.1, sPitch: 1.15, el: { stability: 0.35, style: 0.6, speed: 1.1 } },
    sad: { rate: -16, pitch: -12, sRate: 0.82, sPitch: 0.8, el: { stability: 0.85, style: 0.1, speed: 0.85 } },
  };
  V.MOODS = MOODS;
  const MOOD_OF = { victory: 'happy', defeat: 'sad', death: 'sad', kill: 'excited', 'first blood': 'excited', 'double kill': 'excited', 'triple kill': 'excited', maniac: 'excited', savage: 'excited', 'killing spree': 'excited', legendary: 'excited', shutdown: 'excited', fullitem: 'happy' };

  /** Pilih suara sistem mengikut jantina dan bahasa. TIDAK menggunakan suara Indonesia sebagai ganti Melayu. */
  const MALE_RE = /\b(david|mark|george|james|guy|ryan|rizwan|osman|richard|daniel|alex|fred|jorge|thomas|paul|stefan|male|lelaki)\b/i;
  const FEMALE_RE = /\b(zira|hazel|susan|aria|jenny|yasmin|emma|samantha|victoria|karen|moira|ayu|gadis|siti|female|perempuan|helen|linda|catherine|sabina)\b/i;
  V.pickSystemVoice = function (vs, gender, lang) {
    const l = String(lang || 'ms').slice(0, 2).toLowerCase();
    const rank = (v) => { const x = String(v.lang || '').toLowerCase().replace('_', '-'); return x.startsWith(l) ? 0 : x.startsWith('en') ? 2 : 3; };
    const isG = (v) => (gender === 'male' ? MALE_RE.test(v.name) && !FEMALE_RE.test(v.name) : FEMALE_RE.test(v.name) && !MALE_RE.test(v.name));
    const sorted = vs.slice().sort((a, b) => rank(a) - rank(b));
    // suara Indonesia/lain TIDAK pernah dipilih sebagai ganti Melayu; jantina yang betul diutamakan, kemudian Melayu, kemudian Inggeris
    return sorted.find((v) => isG(v) && rank(v) <= 2) || sorted.find((v) => rank(v) === 0) || sorted.find((v) => rank(v) === 2) || null;
  };
  /** Laporan suara sistem pada PC ini: ada suara Melayu lelaki/perempuan atau tidak. */
  V.systemVoiceReport = function (lang) {
    const vs = ('speechSynthesis' in window) ? speechSynthesis.getVoices() : [];
    const out = {};
    ['female', 'male'].forEach((g) => {
      const v = V.pickSystemVoice(vs, g, lang || 'ms-MY');
      const l = v ? String(v.lang || '').toLowerCase() : '';
      const genderOk = !!v && (g === 'male' ? MALE_RE.test(v.name) && !FEMALE_RE.test(v.name) : FEMALE_RE.test(v.name) && !MALE_RE.test(v.name));
      out[g] = { name: v ? v.name : '', lang: v ? v.lang : '', langOk: l.startsWith(String(lang || 'ms-MY').slice(0, 2).toLowerCase()), genderOk };
    });
    return out;
  };

  let curSrc = null;
  V.stopSpeech = function () {
    if (curSrc) { try { curSrc.onended = null; curSrc.stop(); } catch (e) { /* sudah tamat */ } curSrc = null; }
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* abaikan */ }
  };
  function playBuf(buf, done) {
    const ctx = GS.audio.ensure();
    const src = ctx.createBufferSource();
    src.buffer = buf; src.connect(GS.audio.voiceBus || GS.audio.sfxBus);
    src.onended = () => { if (curSrc === src) curSrc = null; done(); };
    curSrc = src;
    src.start();
  }

  /** Sebut teks SEKARANG (tiada giliran): suara sebelumnya dihentikan. Mengembalikan true jika suara bermula.
   *  o: {force: sebut walaupun "bot bercakap" dimatikan, lang, announcer} */
  V.speak = async function (text, o) {
    o = o || {};
    const b = cfg().bot;
    text = String(text || '').trim();
    if (!text || (!b.voiceOn && !o.force && !o.announcer)) return false;
    const tts = b.tts || {};
    const lang = o.lang || V.detectLang(text);   // bahasa suara = bahasa teks
    const mood = o.mood || '';
    V.stopSpeech();
    V.speaking = true;
    const done = () => { setTimeout(() => { if (!curSrc) { V.speaking = false; GS.emit('voice:status'); } }, 600); };
    let started = false;
    try {
      // 1) suara AI semula jadi (Azure Speech / ElevenLabs), terus masuk siaran
      if (tts.provider === 'azure' || tts.provider === 'eleven') {
        try { const buf = await V.getBuffer(tts.provider, text, lang, tts.gender, mood); playBuf(buf, done); return true; } catch (e) { warn(String((e && e.message) || e) + ' ' + GS.t('Menggunakan suara sistem.')); }
      }
      // 2) suara Windows dijana sebagai WAV dan dicampur ke dalam siaran
      if (b.inStream && native()) {
        const r = await window.gsNative.voice.say(text, { voice: b.voiceName, culture: lang, gender: tts.gender, rate: b.rate });
        if (r && r.ok) { playBuf(await GS.audio.ensure().decodeAudioData(r.wav.buffer.slice(r.wav.byteOffset, r.wav.byteOffset + r.wav.byteLength)), done); return true; }
        if (r && r.error) GS.toast(GS.t('Suara bot ke siaran gagal: {0}', r.error), 'warn');
      }
      // 3) suara sistem melalui pembesar suara (serta-merta)
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        const vs = speechSynthesis.getVoices();
        const pick = (b.voiceName && vs.find((v) => v.name === b.voiceName)) || V.pickSystemVoice(vs, tts.gender, lang);
        if (pick) { u.voice = pick; u.lang = pick.lang; } else u.lang = lang;
        u.rate = (1 + (Number(b.rate) || 0) / 10) * (MOODS[mood] ? MOODS[mood].sRate : 1);
        u.pitch = MOODS[mood] ? MOODS[mood].sPitch : 1;
        u.onend = done; u.onerror = done;
        speechSynthesis.speak(u);
        started = true;
        return true;
      }
    } catch (e) { console.warn('[GS] suara bot', e); }
    if (!started) done();
    return started;
  };

  /* ---------- pengumum: efek BERCAKAP ---------- */
  V.announceKey = (name, params) => (name === 'kill' ? String((params && params.label) || 'kill').toLowerCase() : name);
  V.announceText = function (name, params) {
    const a = cfg().announcer;
    if (!a.on) return '';
    const set = a.lang === 'ms-MY' ? a.textsMs : a.textsEn;
    return String(set[V.announceKey(name, params)] || '').trim();
  };
  /** Efek yang dicetus oleh pengecam suara tidak diumumkan semula (elak mengulang perkataan yang baru disebut/didengar). */
  V.suppressBeep = (name, params) => !!(!(params && params.viaVoice) && V.announceText(name, params) && !cfg().announcer.keepBeep);
  V.announce = async function (name, params) {
    if (params && params.viaVoice) return;
    const t = V.announceText(name, params);
    if (!t) return;
    const ok = await V.speak(t, { announcer: true, lang: cfg().announcer.lang, mood: MOOD_OF[V.announceKey(name, params)] || '' });
    if (!ok && V.suppressBeep(name, params) && GS.fx.sfxName) GS.audio.sfx(GS.fx.sfxName(name)); // suara gagal: bunyi biasa sebagai sandaran
  };
  /** Jana awal suara pengumum (penyedia AI) supaya main serta-merta tanpa lengah rangkaian. */
  let prewarmT = 0;
  V.prewarm = function () {
    clearTimeout(prewarmT);
    prewarmT = setTimeout(async () => {
      const tts = cfg().bot.tts, a = cfg().announcer;
      if (!a.on || (tts.provider !== 'azure' && tts.provider !== 'eleven')) return;
      if (!(tts.provider === 'azure' ? V.azureKey() : V.elevenKey())) return;
      const set = a.lang === 'ms-MY' ? a.textsMs : a.textsEn;
      for (const [k, raw] of Object.entries(set)) { const t = String(raw || '').trim(); if (!t) continue; try { await V.getBuffer(tts.provider, t, a.lang, tts.gender, MOOD_OF[k] || ''); } catch (e) { warn(String((e && e.message) || e)); return; } }
    }, 900);
  };
  V.cultureFor = () => { const c = cfg().culture; return c && c !== 'auto' ? c : (GS.state.lang === 'en' ? 'en-US' : 'ms-MY'); };

  V.say = function (text, force) {
    const b = cfg().bot;
    if (!text) return;
    V.log.unshift({ at: Date.now(), kind: 'bot', text });
    V.log.length = Math.min(V.log.length, 30);
    GS.fx.trigger('botsay', { name: b.name || 'BOT', text, dur: Math.min(12000, 3200 + text.length * 70), sound: false });
    V.speak(text, { force: !!force });
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
        if (!q.trim()) { V.awaitUntil = now + st.bot.listenMs; V.note({ source, text, result: 'bot dipanggil, menunggu soalan' }); if (st.bot.ack && st.bot.voiceOn) V.speak(st.bot.ack, {}); GS.emit('voice:status'); return { bot: 'menunggu' }; }
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
    if (!ev.test) params.viaVoice = true; // daripada pengecam: tidak diumumkan semula (ujian: diumumkan supaya boleh didengar)
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
  /** Sambungkan mikrofon lalai ke saluran Mikrofon dalam mixer secara automatik (tiada langkah tambahan untuk pengguna). */
  V.ensureMic = async function () {
    if (!cfg().mic.on) return true;
    const A = GS.audio; A.ensure();
    const has = () => A.channels.some((c) => c.kind === 'input' && c.stream && c.node && (c.id === 'ch_mic' || /mik|mic/i.test(c.label || '')));
    if (has() || chFor('mic')) return true;
    const ch = A.channels.find((c) => c.id === 'ch_mic') || A.channels.find((c) => c.kind === 'input');
    if (!ch) return false;
    await A.connectDevice(ch.id, ch.deviceId || '', true);
    return has() || !!chFor('mic');
  };

  V.start = async function () {
    if (V.running) return true;
    V.error = ''; V.info = {};
    cfg().enabled = true;
    // "Hidupkan bot": bot terus boleh dipanggil dan bercakap
    cfg().bot.enabled = true; cfg().bot.voiceOn = true; cfg().mic.on = true;
    try { if (!(await V.ensureMic())) V.error = GS.t('Mikrofon tidak dapat dibuka. Benarkan kebenaran mikrofon untuk app ini.'); } catch (e) { V.error = GS.t('Mikrofon tidak dapat dibuka. Benarkan kebenaran mikrofon untuk app ini.'); }
    if (V.error) { cfg().enabled = false; GS.save(); GS.emit('voice:status'); return false; }
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
    if (ok) V.say(GS.t('Hai, saya {0}. Saya sedia, panggil nama saya.', (cfg().bot.name || 'bot').trim() || 'bot'), true); // pengesahan suara berfungsi
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
    GS.on('fx:trigger', (e) => V.announce(e.name, e.params));
    try { if ('speechSynthesis' in window) { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices()); } } catch (e) { /* abaikan */ }
    V.prewarm();
    // pulihkan selepas dibuka semula: bot/efek suara dimulakan jika sebelum ini dihidupkan (mikrofon sudah diberi kebenaran)
    if (cfg().enabled && native()) setTimeout(() => { cfg().enabled = false; V.start(); }, 2500);
    else cfg().enabled = false; // pelayar: memerlukan klik pengguna untuk mikrofon
  };
})();
