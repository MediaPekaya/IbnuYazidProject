/* Ujian main/tts-net.js dengan pelayan HTTP tempatan yang meniru Azure Speech dan ElevenLabs (tiada kunci sebenar digunakan). */
'use strict';
const assert = require('assert');
const http = require('http');
let n = 0; const ok = (c, m, d) => { assert(c, m + (d ? ' :: ' + d : '')); console.log('LULUS ' + m); n++; };

(async () => {
  const seen = [];
  const srv = http.createServer((req, res) => {
    let body = ''; req.on('data', (d) => (body += d)); req.on('end', () => {
      seen.push({ url: req.url, method: req.method, h: req.headers, body });
      const key = req.headers['ocp-apim-subscription-key'] || req.headers['xi-api-key'];
      if (key === 'BAD') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ detail: { status: 'invalid_api_key', message: 'Invalid' } })); }
      if (key === 'QUOTA') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ detail: { status: 'quota_exceeded', message: 'quota' } })); }
      if (key === 'SLOW') return; // tiada jawapan
      if (key === 'EMPTY') { res.writeHead(200); return res.end(); }
      res.writeHead(200, { 'content-type': 'audio/mpeg' }); res.end(Buffer.from('ID3-audio-palsu-' + (req.url.includes('elevenlabs') ? '' : '')));
    });
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  process.env.GS_TTS_BASE = 'http://127.0.0.1:' + srv.address().port;
  const { fetchTTS, build, elevenApi } = require('../main/tts-net');

  // Azure
  let r = await fetchTTS('azure', { key: 'KUNCI1', region: 'southeastasia', voice: 'ms-MY-YasminNeural', text: 'Kita menang <hebat> & "berjaya"!', rate: 3 });
  const a = seen[0];
  ok(r.ok && r.audio.length > 5, 'Azure: audio diterima');
  ok(a.url === '/cognitiveservices/v1' && a.method === 'POST' && a.h['ocp-apim-subscription-key'] === 'KUNCI1' && a.h['content-type'] === 'application/ssml+xml' && /mp3/.test(a.h['x-microsoft-outputformat']), 'Azure: URL, kaedah dan pengepala betul');
  ok(a.body.includes("name='ms-MY-YasminNeural'") && a.body.includes("xml:lang='ms-MY'") && a.body.includes('rate=\'+3%\'') && a.body.includes('Kita menang &lt;hebat&gt; &amp; &quot;berjaya&quot;!'), 'Azure: SSML betul dan teks dilepaskan (tiada suntikan)', a.body);
  ok(build('azure', { key: 'k', region: 'eastus', voice: 'ms-MY-OsmanNeural', text: 'x' }).url.includes('127.0.0.1'), 'pangkalan ujian digunakan');
  delete process.env.GS_TTS_BASE;
  ok(build('azure', { key: 'k', region: 'eastus', voice: 'ms-MY-OsmanNeural', text: 'x' }).url === 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1', 'Azure: URL sebenar mengikut kawasan');
  ok(build('eleven', { key: 'k', voice: 'pNInz6obpgDQGcFmaJgB', text: 'x' }).url.startsWith('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB'), 'ElevenLabs: URL sebenar');
  process.env.GS_TTS_BASE = 'http://127.0.0.1:' + srv.address().port;
  // ElevenLabs
  r = await fetchTTS('eleven', { key: 'KUNCI2', voice: 'pNInz6obpgDQGcFmaJgB', model: 'eleven_flash_v2_5', language_code: 'ms', text: 'Ujian' });
  const e = seen[seen.length - 1]; const eb = JSON.parse(e.body);
  ok(r.ok && e.url.startsWith('/v1/text-to-speech/pNInz6obpgDQGcFmaJgB') && e.h['xi-api-key'] === 'KUNCI2' && eb.model_id === 'eleven_flash_v2_5' && eb.language_code === 'ms', 'ElevenLabs: permintaan betul');
  r = await fetchTTS('eleven', { key: 'K', voice: 'pNInz6obpgDQGcFmaJgB', text: 'X'.repeat(900) });
  ok(JSON.parse(seen[seen.length - 1].body).text.length === 280, 'ElevenLabs: teks dihadkan 280 aksara');
  // ralat
  r = await fetchTTS('azure', { key: 'BAD', voice: 'ms-MY-OsmanNeural', text: 'x' });
  ok(!r.ok && r.status === 401 && r.code === 'invalid_api_key', 'kunci tidak sah (401) dikenali', JSON.stringify(r));
  r = await fetchTTS('eleven', { key: 'QUOTA', voice: 'pNInz6obpgDQGcFmaJgB', text: 'x' });
  ok(!r.ok && r.code === 'quota_exceeded', 'kuota habis dikenali');
  r = await fetchTTS('azure', { key: 'EMPTY', voice: 'ms-MY-OsmanNeural', text: 'x' });
  ok(!r.ok && r.code === 'empty', 'audio kosong dilaporkan');
  // API suara ElevenLabs: senarai suara, perpustakaan (tapis Melayu), tambah suara
  r = await elevenApi('voices', { key: 'KUNCI3' });
  ok(r.ok === false || r.ok === true, 'elevenApi voices memulangkan keputusan berstruktur');
  let sv = seen[seen.length - 1];
  ok(sv.url === '/v1/voices' && sv.method === 'GET' && sv.h['xi-api-key'] === 'KUNCI3', 'elevenApi voices: GET /v1/voices dengan kunci');
  await elevenApi('shared', { key: 'KUNCI3', language: 'ms', gender: 'male', page_size: 500 });
  sv = seen[seen.length - 1];
  ok(sv.url.startsWith('/v1/shared-voices?') && /language=ms/.test(sv.url) && /gender=male/.test(sv.url) && /page_size=30/.test(sv.url), 'elevenApi shared: tapis bahasa + jantina, had halaman 30', sv.url);
  await elevenApi('add', { key: 'KUNCI3', public_user_id: 'ownerABCDEF123', voice_id: 'voiceABCDEF123', new_name: 'GS Lelaki <x>' });
  sv = seen[seen.length - 1];
  ok(sv.method === 'POST' && sv.url === '/v1/voices/add/ownerABCDEF123/voiceABCDEF123' && JSON.parse(sv.body).new_name === 'GS Lelaki x', 'elevenApi add: POST dengan nama dibersihkan');
  r = await elevenApi('voices', { key: 'BAD' });
  ok(!r.ok && r.status === 401 && r.code === 'invalid_api_key', 'elevenApi: kunci salah dikenali');
  const b4 = seen.length;
  for (const [op, q] of [['voices', { key: '' }], ['add', { key: 'k', public_user_id: '../x', voice_id: 'voiceABCDEF123' }], ['padam', { key: 'k' }], ['voices', { key: 'k\nX: y' }]]) { r = await elevenApi(op, q); ok(!r.ok && r.code === 'input', 'elevenApi: input tidak sah ditolak (' + op + ')'); }
  ok(seen.length === b4, 'elevenApi: tiada permintaan rangkaian untuk input tidak sah');
  // input tidak sah ditolak sebelum rangkaian
  const before = seen.length;
  for (const [k, p] of [['azure', { key: 'k', voice: 'x"; drop', text: 'a' }], ['azure', { key: 'k', region: 'a/b', voice: 'ms-MY-OsmanNeural', text: 'a' }], ['azure', { key: 'k\nX: y', voice: 'ms-MY-OsmanNeural', text: 'a' }], ['eleven', { key: 'k', voice: '../etc', text: 'a' }], ['azure', { key: 'k', voice: 'ms-MY-OsmanNeural', text: '   ' }], ['lain', { key: 'k', text: 'a' }]]) {
    r = await fetchTTS(k, p); ok(!r.ok && r.code === 'input', 'input tidak sah ditolak: ' + JSON.stringify(p).slice(0, 50));
  }
  ok(seen.length === before, 'tiada permintaan rangkaian untuk input tidak sah');
  srv.close();
  console.log('SEMUA LULUS (' + n + ')');
  process.exit(0);
})().catch((e) => { console.error('GAGAL', e.message); process.exit(1); });
