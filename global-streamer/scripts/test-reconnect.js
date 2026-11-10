/* Ujian sambung semula destinasi (Fasa 2.1) dengan RTMP SEBENAR tempatan: npm run test:reconnect
 *  A: stabil sepanjang ujian. B: dimatikan di tengah siaran lalu dihidupkan semula. C: belum hidup ketika siaran bermula, hidup kemudian.
 * Menyemak: destinasi terputus ditanda gagal -> "reconnecting" -> "live" semula, data sebenar (H.264 + AAC) sampai ke penerima baharu,
 * destinasi A tidak terganggu, key tidak bocor, dan semua proses FFmpeg dibersihkan selepas siaran dihentikan. */
'use strict';
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { StreamEngine } = require('../main/stream-engine');

const FFMPEG = process.env.GS_FFMPEG || (() => { try { return require('ffmpeg-static'); } catch (e) { return 'ffmpeg'; } })();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-reconn-'));
const results = [];
const check = (name, cond, extra) => results.push({ ok: !!cond, line: (cond ? 'LULUS ' : 'GAGAL ') + name + (extra ? '  :: ' + extra : '') });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const KA = 'KEYAAAA-1111', KB = 'KEYBBBB-2222', KC = 'KEYCCCC-3333';

const listener = (port, key, out) => spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-listen', '1', '-i', 'rtmp://127.0.0.1:' + port + '/live/' + key, '-c', 'copy', '-f', 'flv', '-y', out], { stdio: 'ignore' });
function probe(file) {
  if (!fs.existsSync(file)) return { video: false, audio: false, seconds: 0 };
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const t = r.stderr || '';
  const dur = /time=(\d+):(\d+):(\d+\.\d+)/g;
  let m, last = null;
  while ((m = dur.exec(t))) last = m;
  return { video: /Video: h264/.test(t), audio: /Audio: aac/.test(t), seconds: last ? Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]) : 0 };
}
// proses enjin (pengekod utama dan pekerja sambung semula) membaca daripada pipe:0
const strayFfmpeg = () => {
  try { return spawnSync('pgrep', ['-f', 'ffmpeg.* -i pipe:0'], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean).length; } catch (e) { return 0; }
};

(async () => {
  const webm = path.join(tmp, 'in.webm');
  spawnSync(FFMPEG, ['-y', '-f', 'lavfi', '-i', 'testsrc=size=640x360:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=440', '-t', '44', '-c:v', 'libvpx', '-b:v', '600k', '-c:a', 'libopus', webm], { stdio: 'ignore' });
  const data = fs.readFileSync(webm);
  const outA = path.join(tmp, 'a.flv'), outB1 = path.join(tmp, 'b1.flv'), outB2 = path.join(tmp, 'b2.flv'), outC = path.join(tmp, 'c.flv');
  const la = listener(19461, KA, outA);
  let lb = listener(19462, KB, outB1);
  await sleep(900);

  const events = [];
  const eng = new StreamEngine((e) => { e.t = Date.now(); events.push(e); });
  await sleep(300); // geganti sedia
  const targets = [
    { id: 'youtube', name: 'YouTube Live', url: 'rtmp://127.0.0.1:19461/live/' + KA },
    { id: 'facebook', name: 'Facebook Live', url: 'rtmp://127.0.0.1:19462/live/' + KB },
    { id: 'tiktok', name: 'TikTok LIVE', url: 'rtmp://127.0.0.1:19463/live/' + KC },
  ];
  eng.start({ targets, fps: 30, vbitrate: 1200, abitrate: 128, encoder: 'x264' });
  const t0 = Date.now();
  const CH = Math.ceil(data.length / 176);
  let killedB = false, restartedB = false, startedC = false, lc = null;
  for (let i = 0; i < data.length; i += CH) {
    eng.write(data.subarray(i, i + CH));
    await sleep(250);
    const el = (Date.now() - t0) / 1000;
    if (!killedB && el > 9) { killedB = true; lb.kill('SIGKILL'); }                                   // B terputus mendadak
    if (killedB && !restartedB && el > 12) { restartedB = true; lb = listener(19462, KB, outB2); }  // B hidup semula
    if (!startedC && el > 16) { startedC = true; lc = listener(19463, KC, outC); }                   // C hidup lewat
  }
  await sleep(6000);
  const aliveBeforeStop = events.filter((e) => e.type === 'target' && e.state === 'live').length;
  await eng.stop();
  await sleep(1500);
  la.kill('SIGKILL'); lb.kill('SIGKILL'); if (lc) lc.kill('SIGKILL');
  await sleep(500);

  const ev = (id, state) => events.filter((e) => e.type === 'target' && e.id === id && e.state === state);
  check('B: ditanda gagal apabila terputus', ev('facebook', 'failed').length >= 1);
  check('B: "reconnecting" dihantar dengan jeda berperingkat', ev('facebook', 'reconnecting').length >= 1 && ev('facebook', 'reconnecting')[0].nextIn === 2, JSON.stringify(ev('facebook', 'reconnecting').map((e) => e.attempt + ':' + e.nextIn)));
  check('B: "live" semula (recovered) selepas penerima hidup', ev('facebook', 'live').some((e) => e.recovered), 'attempt=' + (ev('facebook', 'live')[0] || {}).attempt);
  check('C: gagal pada permulaan, kemudian disambung automatik', ev('tiktok', 'failed').length >= 1 && ev('tiktok', 'live').some((e) => e.recovered));
  check('A: tidak pernah gagal / disambung semula', ev('youtube', 'failed').length === 0 && ev('youtube', 'reconnecting').length === 0);
  const pa = probe(outA), pb1 = probe(outB1), pb2 = probe(outB2), pc = probe(outC);
  check('A: aliran penuh tanpa gangguan (H.264 + AAC, >= 36 s)', pa.video && pa.audio && pa.seconds >= 36, JSON.stringify(pa));
  check('B (sebelum putus): menerima data sah', pb1.video && pb1.seconds >= 4, JSON.stringify(pb1));
  check('B (selepas sambung semula): menerima H.264 + AAC sah >= 10 s', pb2.video && pb2.audio && pb2.seconds >= 10, JSON.stringify(pb2));
  check('C (disambung lewat): menerima H.264 + AAC sah >= 8 s', pc.video && pc.audio && pc.seconds >= 8, JSON.stringify(pc));
  const dump = JSON.stringify(events);
  check('key tidak bocor dalam mana-mana kejadian', ![KA, KB, KC].some((k) => dump.includes(k)));
  check('tiada ralat enjin', !events.some((e) => e.type === 'error'), events.filter((e) => e.type === 'error').map((e) => e.message).join('|'));
  await sleep(1500);
  const stray = spawnSync('pgrep', ['-af', 'ffmpeg.* -i pipe:0'], { encoding: 'utf8' }).stdout.trim();
  check('semua proses FFmpeg dibersihkan selepas stop', strayFfmpeg() === 0, stray ? 'tinggal: ' + stray.replace(/\n/g, ' ## ').slice(0, 300) : 'bersih');
  void aliveBeforeStop;

  console.log(results.map((r) => r.line).join('\n'));
  const bad = results.filter((r) => !r.ok).length;
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
