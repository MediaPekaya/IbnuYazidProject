/* Ujian integrasi enjin siaran dengan RTMP SEBENAR (penerima FFmpeg tempatan): npm run test:engine
 * Menyemak: siaran serentak ke 2 destinasi, 1 destinasi mati tidak mengganggu, sandaran pengekod, statistik,
 * dan key tidak bocor dalam mana-mana mesej. */
'use strict';
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { StreamEngine, redact } = require('../main/stream-engine');

const FFMPEG = process.env.GS_FFMPEG || (() => { try { return require('ffmpeg-static'); } catch (e) { return 'ffmpeg'; } })();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-engine-'));
const results = [];
const check = (name, cond, extra) => results.push({ ok: !!cond, line: (cond ? 'LULUS ' : 'GAGAL ') + name + (extra ? '  :: ' + extra : '') });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SECRET_A = 'SECRETKEY-AAAA-1111', SECRET_B = 'SECRETKEY-BBBB-2222', SECRET_C = 'SECRETKEY-CCCC-3333';

function listener(port, key, out) {
  const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-listen', '1', '-i', 'rtmp://127.0.0.1:' + port + '/live/' + key, '-c', 'copy', '-f', 'flv', '-y', out], { stdio: 'ignore' });
  return p;
}
function probe(file) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const t = r.stderr || '';
  const dur = /time=(\d+):(\d+):(\d+\.\d+)/g;
  let m, last = null;
  while ((m = dur.exec(t))) last = m;
  return { video: /Video: h264/.test(t), audio: /Audio: aac/.test(t), seconds: last ? Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]) : 0 };
}

(async () => {
  // 1) fail webm 9 saat (seperti keluaran MediaRecorder: VP8 + Opus)
  const webm = path.join(tmp, 'in.webm');
  spawnSync(FFMPEG, ['-y', '-f', 'lavfi', '-i', 'testsrc=size=640x360:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=440', '-t', '9', '-c:v', 'libvpx', '-b:v', '800k', '-c:a', 'libopus', webm], { stdio: 'ignore' });
  const data = fs.readFileSync(webm);
  check('fail ujian WebM dijana', data.length > 10000, data.length + ' bait');

  // 2) penerima RTMP sebenar
  const outA = path.join(tmp, 'a.flv'), outB = path.join(tmp, 'b.flv');
  const la = listener(19451, SECRET_A, outA), lb = listener(19452, SECRET_B, outB);
  await sleep(900);

  // 3) jalankan enjin: A hidup, B hidup, C mati. Minta NVENC (tiada GPU: mesti beralih ke x264)
  const events = [];
  const eng = new StreamEngine((e) => events.push(e));
  const targets = [
    { id: 'youtube', name: 'YouTube Live', url: 'rtmp://127.0.0.1:19451/live/' + SECRET_A },
    { id: 'facebook', name: 'Facebook Live', url: 'rtmp://127.0.0.1:19452/live/' + SECRET_B },
    { id: 'tiktok', name: 'TikTok LIVE', url: 'rtmp://127.0.0.1:19459/live/' + SECRET_C },
  ];
  const info = eng.start({ targets, fps: 30, vbitrate: 1500, abitrate: 128, encoder: 'nvenc' });
  check('start() memulangkan senarai pengekod', Array.isArray(info.candidates) && info.candidates.includes('x264'), JSON.stringify(info.candidates));

  // suap chunk secara masa nyata (~250ms), seperti MediaRecorder
  const CH = Math.ceil(data.length / 36);
  for (let i = 0; i < data.length; i += CH) { eng.write(data.subarray(i, i + CH)); await sleep(250); }
  await sleep(1500);
  await eng.stop();
  await sleep(1200);
  la.kill(); lb.kill();

  // 4) semakan
  const types = (t) => events.filter((e) => e.type === t);
  const encs = types('encoder');
  check('pengekod: percubaan pertama NVENC, beralih ke x264 bila gagal', encs.length >= 1 && encs[encs.length - 1].encoder === 'x264', encs.map((e) => e.encoder + (e.fellBack ? '(sandaran)' : '')).join(' -> '));
  check('amaran sandaran pengekod dihantar', types('warn').some((w) => w.code === 'encoder-fallback') || encs.length === 1, '');
  check('siaran dimulakan (bingkai dihasilkan)', types('started').length === 1);
  const st = types('stats');
  check('statistik masa nyata diterima', st.length >= 2 && st.some((s) => s.fps > 0), st.length + ' sampel, fps terakhir=' + (st.length ? st[st.length - 1].fps : '-'));
  const failed = types('target');
  check('destinasi mati (TikTok) dilaporkan gagal, bukan yang lain', failed.length === 1 && failed[0].id === 'tiktok' && failed[0].state === 'failed', JSON.stringify(failed.map((f) => f.id)));
  const pa = probe(outA), pb = probe(outB);
  check('YouTube menerima H.264 + AAC', pa.video && pa.audio && pa.seconds >= 5, JSON.stringify(pa));
  check('Facebook menerima H.264 + AAC serentak', pb.video && pb.audio && pb.seconds >= 5, JSON.stringify(pb));
  const all = JSON.stringify(events);
  check('KEY TIDAK bocor dalam mana-mana mesej', ![SECRET_A, SECRET_B, SECRET_C].some((s) => all.includes(s)));
  check('tamat dengan bersih (event ended, tiada ralat)', types('ended').length >= 1 && types('error').length === 0, JSON.stringify(types('error')));

  // 5) unit: penapis & pengesahan URL
  const red = redact('Slave rtmp://x.example/live/' + SECRET_A + ' error ' + SECRET_A, [{ name: 'YT', url: 'rtmp://x.example/live/' + SECRET_A }]);
  check('redact() membuang key', !red.includes(SECRET_A), red);
  let rejected = 0;
  for (const bad of ['http://a/b', 'rtmp://a/b|c', 'rtmp://a/b;x', 'rtmp://a/b c']) { try { new StreamEngine().start({ targets: [{ name: 'x', url: bad }] }); } catch (e) { rejected++; } }
  check('URL berbahaya ditolak', rejected === 4, rejected + '/4');

  console.log(results.map((r) => r.line).join('\n'));
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})().catch((e) => { console.error('UJIAN RALAT', e); process.exit(2); });
