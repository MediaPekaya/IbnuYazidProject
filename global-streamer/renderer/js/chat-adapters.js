/*
 * Global Streamer - penyambung chat sebenar (Fasa 3).
 *
 *  YouTube  : YouTube Data API v3 rasmi (videos.list -> liveChatId, liveChatMessages.list). Perlu API key. Teks, Super Chat, ahli baharu.
 *  Facebook : Graph API rasmi (edge comments pada video langsung). Perlu ID video langsung + token akses Halaman. Komen.
 *  TikTok   : TIADA API rasmi untuk chat LIVE. Disokong melalui WebSocket geganti JSON yang anda jalankan sendiri
 *             (cth alat pihak ketiga). App TIDAK membundel atau memanggil protokol tidak rasmi TikTok.
 *
 * Semua peristiwa dinormalkan kepada { platform, type, user, text, count, value } dan dihantar ke GS.chat.ingest():
 *   type: chat | follow | gift | superchat | member | like
 * Kunci API / token: dalam memori (web) atau disulitkan OS (app Windows), tidak pernah dalam localStorage.
 */
(function () {
  'use strict';
  const GS = window.GS;
  const C = GS.chat;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const status = (platform, state, detail) => { C.status[platform] = { state, detail: detail || '' }; GS.emit('chat:status', { platform, state, detail: detail || '' }); };
  C.status = C.status || {};
  C.running = {};

  /* ---------- konfigurasi (bukan rahsia) ---------- */
  C.cfg = function () {
    const s = GS.state.chatCfg || (GS.state.chatCfg = {});
    s.youtube = Object.assign({ video: '', base: '' }, s.youtube);
    s.facebook = Object.assign({ video: '', base: '' }, s.facebook);
    s.tiktok = Object.assign({ url: '' }, s.tiktok);
    return s;
  };
  const secret = (id) => (GS.platforms ? GS.platforms.getKey(id) : '');

  const YT = 'https://www.googleapis.com/youtube/v3';
  const FB = 'https://graph.facebook.com/v19.0';

  /* ---------- pembantu ---------- */
  C.parseYouTubeId = function (v) {
    v = String(v || '').trim();
    if (/^[\w-]{11}$/.test(v)) return v;
    try {
      const u = new URL(v);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1, 12);
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = u.pathname.match(/\/(live|embed|shorts)\/([\w-]{11})/);
      if (m) return m[2];
    } catch (e) { /* bukan URL */ }
    return '';
  };

  async function getJSON(url, signal) {
    const res = await fetch(url, { signal, cache: 'no-store' });
    let body = null;
    try { body = await res.json(); } catch (e) { /* bukan JSON */ }
    if (!res.ok) {
      const err = new Error((body && body.error && (body.error.message || body.error)) || ('HTTP ' + res.status));
      err.status = res.status;
      err.reason = body && body.error && body.error.errors && body.error.errors[0] && body.error.errors[0].reason;
      throw err;
    }
    return body;
  }

  /** Larian pengundian am: panggil step() berulang kali; step mengembalikan ms sebelum panggilan seterusnya. */
  function runner(platform, step, opts) {
    const ctl = { stopped: false, ac: new AbortController() };
    let failures = 0;
    (async () => {
      status(platform, 'connecting');
      while (!ctl.stopped) {
        try {
          const wait = await step(ctl);
          if (ctl.stopped) break;
          failures = 0;
          status(platform, 'live');
          await sleep(Math.max(1000, wait || 5000));
        } catch (e) {
          if (ctl.stopped) break;
          if (e.fatal) { status(platform, 'error', e.message); break; }
          failures++;
          status(platform, 'retry', e.message);
          await sleep(Math.min(60000, 2000 * Math.pow(2, Math.min(failures, 5))));
        }
      }
      if (!ctl.stopped) ctl.stopped = true;
      if (C.status[platform] && C.status[platform].state !== 'error') status(platform, 'off');
    })();
    ctl.stop = () => { ctl.stopped = true; try { ctl.ac.abort(); } catch (e) { /* abaikan */ } status(platform, 'off'); };
    void opts;
    return ctl;
  }

  /* ---------- YouTube ---------- */
  C.connectYouTube = function () {
    const cfg = C.cfg().youtube, key = secret('chat-youtube').trim();
    const base = cfg.base || YT;
    const vid = C.parseYouTubeId(cfg.video);
    if (!key) { status('youtube', 'error', GS.t('API key YouTube belum diisi')); return null; }
    if (!vid && !/^[\w-]{20,}$/.test(cfg.video || '')) { status('youtube', 'error', GS.t('ID video / URL tidak sah')); return null; }
    const since = Date.now() - 20000; // mesej lebih lama daripada ini tidak mencetus alert
    let chatId = /^[\w-]{20,}$/.test(cfg.video || '') && !vid ? cfg.video : '';
    let token = '', first = true;
    const seen = new Set();
    return runner('youtube', async (ctl) => {
      if (!chatId) {
        const j = await getJSON(`${base}/videos?part=liveStreamingDetails&id=${encodeURIComponent(vid)}&key=${encodeURIComponent(key)}`, ctl.ac.signal).catch((e) => { if (e.status === 400 || e.status === 401 || e.status === 403 || e.status === 404) e.fatal = true; throw e; });
        const it = j.items && j.items[0];
        if (!it) { const e = new Error(GS.t('Video tidak dijumpai')); e.fatal = true; throw e; }
        chatId = it.liveStreamingDetails && it.liveStreamingDetails.activeLiveChatId;
        if (!chatId) { const e = new Error(GS.t('Video ini tiada chat langsung aktif')); e.fatal = true; throw e; }
      }
      let j;
      try {
        j = await getJSON(`${base}/liveChat/messages?liveChatId=${encodeURIComponent(chatId)}&part=snippet,authorDetails&maxResults=200${token ? '&pageToken=' + encodeURIComponent(token) : ''}&key=${encodeURIComponent(key)}`, ctl.ac.signal);
      } catch (e) {
        if (e.status === 403 && /quota/i.test(e.reason || e.message)) { e.message = GS.t('Kuota YouTube API habis untuk hari ini'); e.fatal = true; }
        else if (e.status === 403 && /liveChatEnded|ended/i.test(e.reason || e.message)) { e.message = GS.t('Siaran langsung telah tamat'); e.fatal = true; }
        else if (e.status === 400 || e.status === 401 || e.status === 403) { e.fatal = true; }
        throw e;
      }
      token = j.nextPageToken || token;
      (j.items || []).forEach((it) => {
        if (seen.has(it.id)) return;
        seen.add(it.id);
        const sn = it.snippet || {}, au = it.authorDetails || {};
        const old = Date.parse(sn.publishedAt || 0) < since || first && false;
        const base0 = { platform: 'youtube', user: au.displayName || 'penonton', ts: Date.parse(sn.publishedAt) || Date.now(), id: it.id, quiet: old };
        if (sn.type === 'textMessageEvent') C.ingest(Object.assign(base0, { type: 'chat', text: (sn.textMessageDetails && sn.textMessageDetails.messageText) || sn.displayMessage || '' }));
        else if (sn.type === 'superChatEvent' || sn.type === 'superStickerEvent') {
          const d = sn.superChatDetails || sn.superStickerDetails || {};
          C.ingest(Object.assign(base0, { type: 'superchat', text: (d.amountDisplayString || '') + (d.userComment ? ' · ' + d.userComment : ''), value: Number(d.amountMicros || 0) / 1e6 }));
        } else if (sn.type === 'newSponsorEvent') C.ingest(Object.assign(base0, { type: 'member', text: '' }));
        else if (sn.type === 'memberMilestoneChatEvent') C.ingest(Object.assign(base0, { type: 'member', text: (sn.memberMilestoneChatDetails && sn.memberMilestoneChatDetails.memberMonth) ? sn.memberMilestoneChatDetails.memberMonth + ' bulan' : '' }));
      });
      first = false;
      return Number(j.pollingIntervalMillis) || 6000;
    });
  };

  /* ---------- Facebook ---------- */
  C.connectFacebook = function () {
    const cfg = C.cfg().facebook, tok = secret('chat-facebook').trim();
    const base = cfg.base || FB;
    const vid = String(cfg.video || '').trim().replace(/.*\/videos\/(\d+).*/, '$1');
    if (!tok) { status('facebook', 'error', GS.t('Token akses Facebook belum diisi')); return null; }
    if (!/^\d{5,}$/.test(vid)) { status('facebook', 'error', GS.t('ID video langsung Facebook tidak sah')); return null; }
    const seen = new Set();
    const start = Date.now() - 20000;
    return runner('facebook', async (ctl) => {
      const j = await getJSON(`${base}/${vid}/comments?order=chronological&live_filter=no_filter&limit=100&fields=id,from%7Bname%7D,message,created_time&access_token=${encodeURIComponent(tok)}`, ctl.ac.signal).catch((e) => { if (e.status === 400 || e.status === 401 || e.status === 403 || e.status === 404) e.fatal = true; throw e; });
      (j.data || []).forEach((c) => {
        if (seen.has(c.id)) return;
        seen.add(c.id);
        const ts = Date.parse(c.created_time) || Date.now();
        C.ingest({ platform: 'facebook', type: 'chat', user: (c.from && c.from.name) || 'penonton', text: c.message || '', ts, id: c.id, quiet: ts < start });
      });
      return 4000;
    });
  };

  /* ---------- TikTok melalui WebSocket geganti ---------- */
  const num = (v) => { v = Number(v); return Number.isFinite(v) ? v : 0; };
  /** Normalkan satu mesej geganti (format asli kami atau bentuk umum { event, data }). */
  C.normalizeRelay = function (raw) {
    let m = raw;
    if (m && m.data && typeof m.data === 'object' && (m.event || m.type)) m = Object.assign({ type: m.event || m.type }, m.data);
    if (!m || typeof m !== 'object') return null;
    const t = String(m.type || m.event || '').toLowerCase();
    const user = String(m.user || m.nickname || m.uniqueId || m.username || 'penonton').slice(0, 60);
    const base = { platform: 'tiktok', user, ts: Date.now(), id: m.id || undefined };
    if (t === 'chat' || t === 'comment') return Object.assign(base, { type: 'chat', text: String(m.text || m.comment || m.message || '').slice(0, 300) });
    if (t === 'follow') return Object.assign(base, { type: 'follow' });
    if (t === 'gift') return Object.assign(base, { type: 'gift', text: String(m.gift || m.giftName || m.text || '').slice(0, 60), count: Math.max(1, num(m.count || m.repeatCount || 1)), value: num(m.value || m.diamonds || m.diamondCount || 0) * Math.max(1, num(m.count || m.repeatCount || 1)) });
    if (t === 'like') return Object.assign(base, { type: 'like', count: Math.max(1, num(m.count || m.likeCount || 1)) });
    if (t === 'member' || t === 'subscribe') return Object.assign(base, { type: 'member' });
    return null;
  };
  C.connectTikTok = function () {
    const url = (C.cfg().tiktok.url || '').trim();
    if (!/^wss?:\/\/\S+$/i.test(url)) { status('tiktok', 'error', GS.t('URL WebSocket geganti tidak sah (mesti bermula dengan ws:// atau wss://)')); return null; }
    const ctl = { stopped: false, ws: null };
    let failures = 0;
    const open = () => {
      if (ctl.stopped) return;
      status('tiktok', 'connecting');
      let ws;
      try { ws = new WebSocket(url); } catch (e) { status('tiktok', 'error', e.message); return; }
      ctl.ws = ws;
      ws.onopen = () => { failures = 0; status('tiktok', 'live'); };
      ws.onmessage = (ev) => {
        let j; try { j = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data)); } catch (e) { return; }
        (Array.isArray(j) ? j : [j]).forEach((x) => { const n = C.normalizeRelay(x); if (n) C.ingest(n); });
      };
      ws.onerror = () => {};
      ws.onclose = () => {
        if (ctl.stopped) return;
        failures++;
        status('tiktok', 'retry', GS.t('Sambungan geganti terputus'));
        setTimeout(open, Math.min(30000, 1500 * Math.pow(2, Math.min(failures, 5))));
      };
    };
    open();
    ctl.stop = () => { ctl.stopped = true; try { ctl.ws && ctl.ws.close(); } catch (e) { /* abaikan */ } status('tiktok', 'off'); };
    return ctl;
  };

  /* ---------- kawalan ---------- */
  const starters = { youtube: C.connectYouTube, facebook: C.connectFacebook, tiktok: C.connectTikTok };
  C.connect = function (platform) {
    C.disconnect(platform);
    const ctl = starters[platform] && starters[platform]();
    if (ctl) C.running[platform] = ctl;
    return !!ctl;
  };
  C.disconnect = function (platform) {
    const c = C.running[platform];
    if (c) { c.stop(); delete C.running[platform]; }
  };
  C.isOn = (p) => !!C.running[p];

  /* ---------- penerimaan peristiwa ---------- */
  const alertQ = [];
  let alertTimer = 0;
  function pumpAlerts() {
    if (alertTimer || !alertQ.length) return;
    const a = alertQ.shift();
    GS.fx.trigger('alert', a);
    alertTimer = setTimeout(() => { alertTimer = 0; pumpAlerts(); }, 3800);
  }
  const alertNow = (a) => { if (alertQ.length < 6) alertQ.push(a); pumpAlerts(); };

  GS.bossHit = function (n) {
    const b = GS.state.boss;
    if (!b || !b.enabled || !(n > 0)) return;
    b.hp = Math.max(0, b.hp - n);
    b.shield = Math.min(b.shieldMax, b.shield + n * 2);
    if (b.hp <= 0) {
      b.level += 1; b.max = Math.round(b.max * 1.15); b.hp = b.max;
      alertNow({ title: 'Boss tumbang', name: 'LEVEL ' + b.level, sound: true });
    }
  };
  function addLike(user, n) {
    const st = GS.state;
    st.status.likeCur = (st.status.likeCur || 0) + n;
    const row = st.toplike.find((r) => r.name === user);
    if (row) row.n += n; else st.toplike.push({ name: user, n });
    st.toplike.sort((a, b) => b.n - a.n);
    st.toplike.length = Math.min(st.toplike.length, 5);
    GS.bossHit(n * 10);
  }

  /** Terima satu peristiwa ternormal daripada mana-mana penyambung. */
  C.ingest = function (ev) {
    if (!ev) return;
    const seenKey = ev.platform + ':' + ev.id;
    if (ev.id) { C._seen = C._seen || new Set(); if (C._seen.has(seenKey)) return; C._seen.add(seenKey); if (C._seen.size > 2000) C._seen = new Set([...C._seen].slice(-500)); }
    const quiet = !!ev.quiet; // sejarah (sebelum disambung): tunjuk tetapi tiada alert/boss
    if (ev.type === 'like') { if (!quiet) addLike(ev.user, ev.count || 1); return; }
    C.push({ platform: ev.platform, user: ev.user, type: ev.type, text: ev.text, ts: ev.ts || Date.now(), count: ev.count, value: ev.value, noalert: true });
    if (quiet) return;
    if (ev.type === 'follow') alertNow({ title: 'Terima kasih follow', name: '@' + ev.user, sound: true });
    else if (ev.type === 'gift') { alertNow({ title: 'Terima kasih gift', name: '@' + ev.user + (ev.text ? ' · ' + ev.text : ''), sound: true }); GS.bossHit((ev.value || ev.count || 1) * 25); }
    else if (ev.type === 'superchat') { alertNow({ title: 'Terima kasih Super Chat', name: '@' + ev.user + (ev.text ? ' · ' + ev.text.split(' · ')[0] : ''), sound: true }); GS.bossHit(Math.max(50, (ev.value || 1) * 100)); }
    else if (ev.type === 'member') alertNow({ title: 'Ahli baharu', name: '@' + ev.user, sound: true });
    GS.save();
  };
})();
