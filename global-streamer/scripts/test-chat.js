/* Ujian penyambung chat (Fasa 3) terhadap pelayan tiruan tempatan: npm run test:chat
 *  YouTube Data API v3 (videos.list + liveChat/messages dengan pageToken), Facebook Graph (comments), geganti WebSocket TikTok.
 * Pelayan tiruan meniru bentuk respons API rasmi. TIDAK mengakses perkhidmatan sebenar. */
'use strict';
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const vm = require('vm');

let fail = 0;
const ok = (c, msg) => { if (!c) { fail++; console.error('  GAGAL: ' + msg); } else console.log('  ok: ' + msg); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- pelayan tiruan ---------- */
const mock = { yt: { reqs: [], mode: 'ok' }, fb: { reqs: [], mode: 'ok' }, wsClients: [] };
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (u.pathname === '/yt/videos') {
    mock.yt.reqs.push(req.url);
    if (u.searchParams.get('key') !== 'GOODKEY') return send(400, { error: { code: 400, message: 'API key not valid', errors: [{ reason: 'keyInvalid' }] } });
    if (u.searchParams.get('id') === 'NOLIVEVID001') return send(200, { items: [{ liveStreamingDetails: {} }] });
    if (u.searchParams.get('id') === 'MISSINGVID01') return send(200, { items: [] });
    return send(200, { items: [{ liveStreamingDetails: { activeLiveChatId: 'CHAT123' } }] });
  }
  if (u.pathname === '/yt/liveChat/messages') {
    mock.yt.reqs.push(req.url);
    if (mock.yt.mode === 'quota') return send(403, { error: { code: 403, message: 'quota', errors: [{ reason: 'quotaExceeded' }] } });
    if (mock.yt.mode === 'ended') return send(403, { error: { code: 403, message: 'ended', errors: [{ reason: 'liveChatEnded' }] } });
    const tok = u.searchParams.get('pageToken');
    if (!tok) {
      return send(200, { pollingIntervalMillis: 1000, nextPageToken: 'P2', items: [
        { id: 'm0', snippet: { type: 'textMessageEvent', publishedAt: iso(now - 600000), textMessageDetails: { messageText: 'mesej lama' } }, authorDetails: { displayName: 'Lama' } },
        { id: 'm1', snippet: { type: 'textMessageEvent', publishedAt: iso(Date.now()), textMessageDetails: { messageText: 'gg bro' } }, authorDetails: { displayName: 'Aiman' } },
        { id: 'm2', snippet: { type: 'superChatEvent', publishedAt: iso(Date.now()), superChatDetails: { amountMicros: '5000000', amountDisplayString: 'RM5.00', userComment: 'semangat!' } }, authorDetails: { displayName: 'Siti' } },
        { id: 'm3', snippet: { type: 'newSponsorEvent', publishedAt: iso(Date.now()) }, authorDetails: { displayName: 'Hakim' } },
        { id: 'm1', snippet: { type: 'textMessageEvent', publishedAt: iso(Date.now()), textMessageDetails: { messageText: 'gg bro' } }, authorDetails: { displayName: 'Aiman' } }, // pendua
      ] });
    }
    return send(200, { pollingIntervalMillis: 1000, nextPageToken: 'P3', items: [{ id: 'm4', snippet: { type: 'textMessageEvent', publishedAt: iso(Date.now()), textMessageDetails: { messageText: 'mesej halaman 2' } }, authorDetails: { displayName: 'Nana' } }] });
  }
  const fb = u.pathname.match(/^\/fb\/(\d+)\/comments$/);
  if (fb) {
    mock.fb.reqs.push(req.url);
    if (u.searchParams.get('access_token') !== 'GOODTOKEN') return send(400, { error: { message: 'Invalid OAuth access token.', code: 190 } });
    return send(200, { data: [
      { id: 'c1', from: { name: 'Rizal' }, message: 'salam semua', created_time: iso(Date.now()) },
      { id: 'c2', from: { name: 'Dina' }, message: 'savage!', created_time: iso(Date.now()) },
      { id: 'c0', from: { name: 'Lama' }, message: 'komen lama', created_time: iso(now - 900000) },
    ] });
  }
  send(404, { error: 'tiada' });
});
// WebSocket minimum (hanya bingkai teks pelayan -> klien)
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64') + '\r\n\r\n');
  mock.wsClients.push(socket);
  socket.on('error', () => {});
});
const wsSend = (socket, obj) => {
  const p = Buffer.from(JSON.stringify(obj));
  const head = p.length < 126 ? Buffer.from([0x81, p.length]) : Buffer.from([0x81, 126, p.length >> 8, p.length & 255]);
  socket.write(Buffer.concat([head, p]));
};

/* ---------- muatkan penyambung dalam sandbox ---------- */
const root = path.join(__dirname, '..', 'renderer', 'js');
function load(port) {
  const rec = { pushes: [], alerts: [], statuses: [], saved: 0 };
  const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, fetch, WebSocket, URL, AbortController, Date, Math, JSON, Promise, Set, Number, String, Object, Array, Error, RegExp };
  ctx.window = ctx;
  const GS = (ctx.GS = {
    state: { boss: { enabled: true, hp: 1000, max: 1000, shield: 0, shieldMax: 500, level: 1 }, status: { likeCur: 0 }, toplike: [{ name: 'Penonton 1', n: 0 }], chatCfg: { youtube: { video: 'dQw4w9WgXcQ', base: `http://127.0.0.1:${port}/yt` }, facebook: { video: '123456789012', base: `http://127.0.0.1:${port}/fb` }, tiktok: { url: `ws://127.0.0.1:${port}/relay` } } },
    save() { rec.saved++; }, emit(ev, d) { if (ev === 'chat:status') rec.statuses.push(d.platform + ':' + d.state); }, on() { return () => {}; },
    t: (s, ...a) => String(s).replace(/\{(\d+)\}/g, (m, i) => a[i]),
    fx: { trigger: (n, a) => { if (n === 'alert') rec.alerts.push(a.title + '|' + a.name); } },
    platforms: { keys: { 'chat-youtube': 'GOODKEY', 'chat-facebook': 'GOODTOKEN' }, getKey(id) { return this.keys[id] || ''; } },
    chat: { push: (m) => rec.pushes.push(m) },
  });
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'chat-adapters.js'), 'utf8'), ctx, { filename: 'chat-adapters.js' });
  return { GS, C: GS.chat, rec };
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  console.log('Pembantu');
  {
    const { C } = load(port);
    ok(C.parseYouTubeId('dQw4w9WgXcQ') === 'dQw4w9WgXcQ', 'ID video biasa');
    ok(C.parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3') === 'dQw4w9WgXcQ', 'URL watch');
    ok(C.parseYouTubeId('https://youtu.be/dQw4w9WgXcQ') === 'dQw4w9WgXcQ', 'URL youtu.be');
    ok(C.parseYouTubeId('https://www.youtube.com/live/dQw4w9WgXcQ') === 'dQw4w9WgXcQ', 'URL /live/');
    ok(C.parseYouTubeId('bukan video') === '', 'input tidak sah ditolak');
    const n = C.normalizeRelay({ event: 'gift', data: { uniqueId: 'ali', giftName: 'Rose', repeatCount: 3, diamondCount: 1 } });
    ok(n.type === 'gift' && n.user === 'ali' && n.count === 3 && n.value === 3 && n.text === 'Rose', 'geganti: bentuk { event, data } dinormalkan');
    ok(C.normalizeRelay({ type: 'unknown' }) === null, 'jenis tidak dikenali diabaikan');
  }

  console.log('YouTube (API rasmi tiruan)');
  {
    const { C, rec, GS } = load(port);
    ok(C.connect('youtube') === true, 'sambung dimulakan');
    await sleep(3800);
    const texts = rec.pushes.map((m) => m.type + ':' + m.user + ':' + m.text);
    ok(texts.includes('chat:Aiman:gg bro') && texts.includes('chat:Nana:mesej halaman 2'), 'mesej teks diterima daripada halaman 1 dan 2 (pageToken digunakan)');
    ok(rec.pushes.filter((m) => m.text === 'gg bro').length === 1, 'mesej pendua dibuang (id sama)');
    const sc = rec.pushes.find((m) => m.type === 'superchat');
    ok(sc && sc.value === 5 && /RM5\.00/.test(sc.text) && /semangat/.test(sc.text), 'Super Chat: jumlah 5 dan komen');
    ok(rec.pushes.some((m) => m.type === 'member' && m.user === 'Hakim'), 'ahli baharu diterima');
    await sleep(4000); // alert dipaparkan satu demi satu (jarak 3.8 s)
    const old = rec.pushes.find((m) => m.text === 'mesej lama');
    ok(old, 'mesej lama dipaparkan (sejarah)');
    ok(rec.alerts.some((a) => /Super Chat/.test(a)) && rec.alerts.some((a) => /Ahli baharu/.test(a)), 'alert untuk Super Chat dan ahli: ' + rec.alerts.join(' ; '));
    ok(GS.state.boss.hp < 1000, 'boss diserang oleh Super Chat (hp ' + GS.state.boss.hp + ')');
    ok(mock.yt.reqs.some((r) => /pageToken=P2/.test(r)) && mock.yt.reqs.some((r) => /pageToken=P3/.test(r)), 'permintaan ke-2 dan ke-3 guna nextPageToken');
    ok(rec.statuses.includes('youtube:connecting') && rec.statuses.includes('youtube:live'), 'status: connecting -> live');
    C.disconnect('youtube');
    const before = mock.yt.reqs.length;
    await sleep(1600);
    ok(mock.yt.reqs.length === before && rec.statuses.includes('youtube:off'), 'putus: tiada permintaan lanjut');
  }
  {
    // ralat tetap
    mock.yt.mode = 'quota';
    const { C, rec } = load(port);
    C.connect('youtube'); await sleep(1500);
    ok(rec.statuses.includes('youtube:error') && !rec.statuses.includes('youtube:retry'), 'kuota habis: ralat tetap (tiada cuba semula yang membazir kuota)');
    mock.yt.mode = 'ended';
    const b = load(port); b.C.connect('youtube'); await sleep(1500);
    ok(b.rec.statuses.includes('youtube:error'), 'siaran tamat: ralat tetap');
    mock.yt.mode = 'ok';
    const c = load(port); c.GS.platforms.keys['chat-youtube'] = 'SALAH'; c.C.connect('youtube'); await sleep(1500);
    ok(c.rec.statuses.includes('youtube:error'), 'API key salah: ralat');
    const d = load(port); d.GS.state.chatCfg.youtube.video = 'MISSINGVID01'; d.C.connect('youtube'); await sleep(1500);
    ok(d.rec.statuses.includes('youtube:error'), 'video tidak dijumpai: ralat');
    const e = load(port); e.GS.state.chatCfg.youtube.video = 'NOLIVEVID001'; e.C.connect('youtube'); await sleep(1500);
    ok(e.rec.statuses.includes('youtube:error'), 'video tanpa chat langsung: ralat');
    const f = load(port); f.GS.platforms.keys['chat-youtube'] = ''; ok(f.C.connect('youtube') === false && f.rec.statuses.includes('youtube:error'), 'tanpa API key: tidak bersambung');
    const g = load(port); g.GS.state.chatCfg.youtube.video = 'bukan video'; ok(g.C.connect('youtube') === false, 'ID video tidak sah: tidak bersambung');
  }

  console.log('Facebook (Graph API tiruan)');
  {
    const { C, rec } = load(port);
    ok(C.connect('facebook') === true, 'sambung dimulakan');
    await sleep(1800);
    const u = rec.pushes.map((m) => m.user + ':' + m.text);
    ok(u.includes('Rizal:salam semua') && u.includes('Dina:savage!'), 'komen diterima');
    ok(rec.pushes.length === 3, 'komen tidak digandakan antara pengundian: ' + rec.pushes.length);
    ok(rec.alerts.length === 0, 'komen tidak mencetus alert');
    ok(/access_token=GOODTOKEN/.test(mock.fb.reqs[0]), 'token dihantar kepada Graph API');
    C.disconnect('facebook');
    const b = load(port); b.GS.platforms.keys['chat-facebook'] = 'TOKENSALAH'; b.C.connect('facebook'); await sleep(1500);
    ok(b.rec.statuses.includes('facebook:error'), 'token salah: ralat tetap');
    const c = load(port); c.GS.state.chatCfg.facebook.video = 'abc'; ok(c.C.connect('facebook') === false, 'ID video tidak sah ditolak');
  }

  console.log('TikTok (geganti WebSocket)');
  {
    const { C, rec, GS } = load(port);
    ok(C.connect('tiktok') === true, 'sambung dimulakan');
    await sleep(800);
    ok(mock.wsClients.length === 1 && rec.statuses.includes('tiktok:live'), 'sambungan WebSocket terbuka');
    const s = mock.wsClients[0];
    wsSend(s, { type: 'chat', user: 'ali', text: 'gg' });
    wsSend(s, [{ type: 'gift', user: 'siti', gift: 'Rose', count: 2, value: 1 }, { type: 'like', user: 'ali', count: 15 }, { event: 'follow', data: { uniqueId: 'budi' } }]);
    await sleep(500);
    ok(rec.pushes.some((m) => m.type === 'chat' && m.text === 'gg'), 'chat diterima');
    ok(rec.pushes.some((m) => m.type === 'gift' && m.text === 'Rose' && m.value === 2), 'gift (2 x 1 = 2)');
    ok(rec.pushes.some((m) => m.type === 'follow' && m.user === 'budi'), 'follow (bentuk { event, data })');
    ok(GS.state.status.likeCur === 15 && GS.state.toplike.some((r) => r.name === 'ali' && r.n === 15), 'like: kiraan matlamat + Top Like: ' + JSON.stringify(GS.state.toplike));
    ok(GS.state.boss.hp < 1000, 'boss diserang oleh like dan gift (hp ' + GS.state.boss.hp + ')');
    await sleep(4000);
    ok(rec.alerts.some((a) => /gift/i.test(a)) && rec.alerts.some((a) => /follow/i.test(a)), 'alert gift dan follow (beratur, satu demi satu): ' + rec.alerts.join(' ; '));
    // putus dari pelayan -> sambung semula automatik
    s.destroy();
    await sleep(3500);
    ok(mock.wsClients.length === 2 && rec.statuses.includes('tiktok:retry'), 'terputus -> cuba semula -> bersambung semula');
    wsSend(mock.wsClients[1], { type: 'chat', user: 'nana', text: 'selepas sambung semula' });
    await sleep(400);
    ok(rec.pushes.some((m) => m.text === 'selepas sambung semula'), 'mesej diterima selepas sambung semula');
    C.disconnect('tiktok');
    await sleep(300);
    ok(rec.statuses.includes('tiktok:off'), 'putus dengan bersih');
    const b = load(port); b.GS.state.chatCfg.tiktok.url = 'http://salah'; ok(b.C.connect('tiktok') === false, 'URL geganti tidak sah ditolak');
  }

  console.log('Keselamatan');
  {
    const { C, rec } = load(port);
    C.connect('youtube'); await sleep(1500); C.disconnect('youtube');
    const dump = JSON.stringify(rec);
    ok(!/GOODKEY|GOODTOKEN/.test(dump), 'API key/token tidak bocor dalam status, mesej atau alert');
  }

  mock.wsClients.forEach((s) => s.destroy());
  server.close();
  if (fail) { console.error(`\n${fail} ujian gagal`); process.exit(1); }
  console.log('\nSemua ujian chat lulus');
  process.exit(0);
})();
