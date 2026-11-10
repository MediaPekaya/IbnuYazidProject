/* Ujian main/ai-net.js dengan pelayan HTTP tempatan yang meniru API serasi OpenAI (tiada kunci sebenar digunakan). */
'use strict';
const assert = require('assert');
const http = require('http');
let n = 0; const ok = (c, m, d) => { assert(c, m + (d ? ' :: ' + d : '')); console.log('LULUS ' + m); n++; };
(async () => {
  const seen = [];
  const srv = http.createServer((req, res) => {
    let body = ''; req.on('data', (d) => (body += d)); req.on('end', () => {
      seen.push({ url: req.url, method: req.method, h: req.headers, body });
      const key = (req.headers.authorization || '').replace('Bearer ', '');
      if (key === 'BAD') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { status: 'UNAUTHENTICATED', message: 'bad key' } })); }
      if (key === 'LIMIT') { res.writeHead(429, { 'content-type': 'application/json' }); return res.end(JSON.stringify([{ error: { code: 429, message: 'quota' } }])); }
      if (key === 'EMPTY') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ choices: [{ message: { content: '  ' } }] })); }
      if (key === 'SLOW') return;
      res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ choices: [{ message: { content: 'Hai dari bot' } }] }));
    });
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  process.env.GS_AI_BASE = 'http://127.0.0.1:' + srv.address().port;
  const { chat } = require('../main/ai-net');
  const msgs = [{ role: 'system', content: 'sistem' }, { role: 'user', content: 'hai' }];
  let r = await chat({ provider: 'gemini', key: 'KUNCI1', messages: msgs, max_tokens: 9999, temperature: 5 });
  const s = seen[seen.length - 1], b = JSON.parse(s.body);
  ok(r.ok && r.text === 'Hai dari bot', 'jawapan diterima');
  ok(s.url === '/chat/completions' && s.method === 'POST' && s.h.authorization === 'Bearer KUNCI1', 'permintaan: laluan, kaedah, Bearer');
  ok(b.model === 'gemini-2.5-flash' && b.max_tokens === 300 && b.temperature === 1.5 && b.messages.length === 2, 'model lalai; had token dan suhu dihadkan');
  r = await chat({ provider: 'groq', key: 'K', model: 'llama-3.3-70b-versatile', messages: msgs });
  ok(r.ok && JSON.parse(seen[seen.length - 1].body).model === 'llama-3.3-70b-versatile', 'Groq: model diterima');
  r = await chat({ provider: 'gemini', key: 'BAD', messages: msgs }); ok(!r.ok && r.status === 401 && r.code === 'UNAUTHENTICATED', 'kunci salah (401) dikenali');
  r = await chat({ provider: 'gemini', key: 'LIMIT', messages: msgs }); ok(!r.ok && r.status === 429, 'had percuma (429) dikenali');
  r = await chat({ provider: 'gemini', key: 'EMPTY', messages: msgs }); ok(!r.ok && r.code === 'empty', 'jawapan kosong dilaporkan');
  const before = seen.length;
  for (const p of [{ provider: 'lain', key: 'k', messages: msgs }, { provider: 'gemini', key: '', messages: msgs }, { provider: 'gemini', key: 'k\nX: y', messages: msgs }, { provider: 'gemini', key: 'k', model: '../x y', messages: msgs }, { provider: 'gemini', key: 'k', messages: [] }, { provider: 'gemini', key: 'k', messages: [{ role: 'tool', content: 'x' }] }, { provider: 'gemini', key: 'k', messages: [{ role: 'user', content: 'x'.repeat(7000) }] }]) {
    r = await chat(p); ok(!r.ok && r.code === 'input', 'input tidak sah ditolak: ' + JSON.stringify(p).slice(0, 50));
  }
  ok(seen.length === before, 'tiada permintaan rangkaian untuk input tidak sah');
  srv.close();
  console.log('SEMUA LULUS (' + n + ')'); process.exit(0);
})().catch((e) => { console.error('GAGAL', e.message); process.exit(1); });
