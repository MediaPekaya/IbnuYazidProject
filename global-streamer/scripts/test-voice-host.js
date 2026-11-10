/* Ujian VoiceHost (main/voice-win.js) dengan pengecam palsu: protokol, keselamatan input, penamatan proses. */
'use strict';
const assert = require('assert');
const path = require('path');
const { VoiceHost, RECOGNIZER_PS, SYNTH_PS } = require('../main/voice-win');
let n = 0; const ok = (c, m, d) => { assert(c, m + (d ? ' :: ' + d : '')); console.log('LULUS ' + m); n++; };
const fake = path.join(__dirname, 'fixtures', 'fake-speech.js');
const mk = (events, mode) => new VoiceHost((e) => events.push(e), { platform: 'win32', command: (kind) => ({ exe: process.execPath, args: [fake, mode || (kind === 'synth' ? 'synth' : 'recognizer')] }) });
const until = (f, ms = 4000) => new Promise((res, rej) => { const t0 = Date.now(); const i = setInterval(() => { if (f()) { clearInterval(i); res(); } else if (Date.now() - t0 > ms) { clearInterval(i); rej(new Error('tamat masa: ' + f)); } }, 20); });

(async () => {
  // skrip PowerShell: tidak mengandungi teks pengguna dan memakai pembolehubah persekitaran
  ok(/GS_TEXT/.test(SYNTH_PS) && /GS_VOICE_CULTURE/.test(RECOGNIZER_PS) && !/\$\(/.test(SYNTH_PS.split('GS_TEXT')[0].slice(-5)), 'skrip PowerShell memakai pembolehubah persekitaran (tiada suntikan arahan)');
  ok(/SetInputToAudioStream/.test(RECOGNIZER_PS) && /SetInputToDefaultAudioDevice/.test(RECOGNIZER_PS) && /GS_SOURCE/.test(RECOGNIZER_PS) && /input = \$mode/.test(RECOGNIZER_PS), 'pengecam: jika aliran audio gagal, mikrofon lalai Windows digunakan (hanya sumber mikrofon) dan mod dilaporkan');
  ok(!/\x60/.test(RECOGNIZER_PS) && !/\$\{/.test(RECOGNIZER_PS), 'skrip pengecam selamat dimasukkan dalam String.raw (tiada tanda belakang)');
  ok(Buffer.from(RECOGNIZER_PS, 'utf16le').toString('base64').length < 20000, 'skrip dikodkan muat dalam had baris arahan Windows');

  const ev = [];
  const h = mk(ev);
  ok(h.start('radio', {}).ok === false, 'sumber tidak sah ditolak');
  ok(new VoiceHost(() => {}, { platform: 'linux' }).start('mic', {}).ok === false, 'bukan Windows: ditolak dengan mesej jelas');
  ok(h.start('mic', { culture: 'ms-MY' }).ok === true, 'pengecam dimulakan');
  await until(() => ev.some((e) => e.type === 'ready'));
  const ready = ev.find((e) => e.type === 'ready');
  ok(ready.source === 'mic' && ready.culture === 'ms-MY', 'peristiwa ready membawa sumber dan budaya', JSON.stringify(ready));
  ok(!ev.some((e) => e.type === 'text'), 'baris bukan JSON diabaikan');
  h.pcm('mic', new Int16Array(800).fill(0).buffer);
  await new Promise((r) => setTimeout(r, 150));
  ok(!ev.some((e) => e.type === 'text'), 'senyap tidak menghasilkan teks');
  const loud = new Int16Array(800).fill(1000);
  h.pcm('mic', loud.buffer);
  await until(() => ev.some((e) => e.type === 'text'));
  const t = ev.find((e) => e.type === 'text');
  ok(t.text === 'double kill' && t.conf === 0.91 && t.source === 'mic', 'baris JSON terpisah merentasi dua tulisan dicantum semula', JSON.stringify(t));
  // dua sumber serentak, berasingan
  ok(h.start('game', {}).ok, 'sumber kedua (bunyi game) berjalan serentak');
  await until(() => ev.some((e) => e.type === 'ready' && e.source === 'game'));
  ok(h.procs.size === 2, 'dua proses');
  // budaya tidak sah dibuang
  const ev2 = []; const h2 = mk(ev2); h2.start('mic', { culture: 'en-US"; calc' });
  await until(() => ev2.some((e) => e.type === 'ready'));
  ok(ev2[0].culture === 'en-US', 'budaya tidak sah dibuang (guna lalai)', ev2[0].culture); h2.stopAll();
  // henti
  const pid = h.procs.get('mic').child.pid;
  h.stop('mic');
  await until(() => ev.some((e) => e.type === 'exit' && e.source === 'mic'));
  let alive = true; try { process.kill(pid, 0); } catch (e) { alive = false; }
  ok(!alive && !h.procs.has('mic'), 'proses pengecam ditamatkan selepas stop');
  ok(h.pcm('mic', loud.buffer) === false, 'pcm ke sumber yang sudah berhenti: dibuang tanpa ralat');
  h.stopAll();
  await until(() => h.procs.size === 0);

  // ralat pengecam dilaporkan
  const ev3 = []; mk(ev3, 'crash').start('mic', {});
  await until(() => ev3.some((e) => e.type === 'exit'));
  ok(ev3.some((e) => e.type === 'error' && e.code === 'no-recognizer') && ev3.find((e) => e.type === 'exit').code === 2, 'ralat pengecam dan kod keluar dilaporkan', JSON.stringify(ev3));

  // TTS -> WAV
  const wav = await mk([]).say('Hai "dunia"; calc & echo $(x)', { voice: 'Microsoft David Desktop', culture: 'en-US', rate: 99 });
  const info = JSON.parse(wav.slice(4).toString());
  ok(wav.slice(0, 4).toString() === 'RIFF' && info.t === 'Hai "dunia"; calc & echo $(x)', 'teks dihantar utuh melalui persekitaran (tiada suntikan)', JSON.stringify(info));
  ok(info.v === 'Microsoft David Desktop' && info.c === 'en-US' && info.r === '10', 'suara/budaya sah dipakai; kadar dihadkan kepada 10');
  const gm = JSON.parse((await mk([]).say('x', { gender: 'male' })).slice(4).toString()), gf = JSON.parse((await mk([]).say('x', { gender: 'female' })).slice(4).toString()), gx = JSON.parse((await mk([]).say('x', { gender: 'x"; calc' })).slice(4).toString());
  ok(gm.g === 'male' && gf.g === 'female' && gx.g === '', 'jantina suara (lelaki/perempuan) dihantar; nilai lain dibuang', JSON.stringify([gm.g, gf.g, gx.g]));
  ok(/GS_VOICE_GENDER/.test(SYNTH_PS) && /SelectVoiceByHints/.test(SYNTH_PS), 'skrip sintesis memilih suara mengikut jantina');
  const bad = JSON.parse((await mk([]).say('x', { voice: 'a"; rm -rf /', culture: 'x y', rate: 'abc' })).slice(4).toString());
  ok(bad.v === '' && bad.c === '' && bad.r === '0', 'nama suara/budaya tidak sah dibuang');
  let err = null; try { await mk([]).say('GAGAL'); } catch (e) { err = e.message; }
  ok(err === 'suara tiada', 'kegagalan sintesis dilaporkan dengan mesej', err);
  err = null; try { await mk([]).say('   '); } catch (e) { err = e.message; }
  ok(err === 'teks kosong', 'teks kosong ditolak');
  console.log('SEMUA LULUS (' + n + ')');
})().catch((e) => { console.error('GAGAL', e.message); process.exit(1); });
