/* Global Streamer - panggilan AI sembang (API serasi OpenAI) daripada proses utama app Windows.
 * Kunci API tidak melalui halaman web dan tidak disimpan dalam fail tetapan (disulitkan oleh vault app).
 * Penyedia percuma (pengguna mendaftar sendiri dan menggunakan kunci mereka): Google Gemini (AI Studio) dan Groq. */
'use strict';

const PROVIDERS = {
  gemini: { base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash' },
  groq: { base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
};

const bad = (message) => ({ ok: false, status: 0, code: 'input', message });

async function chat(p) {
  p = p || {};
  const prov = PROVIDERS[p.provider];
  if (!prov) return bad('penyedia AI tidak dikenali');
  const key = String(p.key || '').trim();
  if (!key || key.length > 300 || /[\r\n]/.test(key)) return bad('kunci tidak sah');
  const model = String(p.model || prov.model);
  if (!/^[A-Za-z0-9._:\/-]{2,80}$/.test(model)) return bad('nama model tidak sah');
  const msgs = Array.isArray(p.messages) ? p.messages.slice(-14) : [];
  if (!msgs.length || msgs.some((m) => !m || !['system', 'user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 6000)) return bad('mesej tidak sah');
  const base = process.env.GS_AI_BASE || prov.base;
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(base + '/chat/completions', {
      method: 'POST', signal: ctl.signal,
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ model, messages: msgs, max_tokens: Math.max(16, Math.min(300, parseInt(p.max_tokens, 10) || 120)), temperature: Math.max(0, Math.min(1.5, Number(p.temperature) || 0.9)) }),
    });
    const txt = await res.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) { /* bukan JSON */ }
    if (!res.ok) { const d = (j && (j.error || (Array.isArray(j) && j[0] && j[0].error) || j)) || {}; return { ok: false, status: res.status, code: String(d.status || d.code || d.type || ''), message: String(d.message || txt).slice(0, 200) }; }
    const out = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!out || !String(out).trim()) return { ok: false, status: res.status, code: 'empty', message: 'jawapan kosong' };
    return { ok: true, text: String(out) };
  } catch (e) {
    return { ok: false, status: 0, code: e && e.name === 'AbortError' ? 'timeout' : 'network', message: String((e && e.message) || e) };
  } finally { clearTimeout(to); }
}

/** Speech-to-text (Groq Whisper, percuma): WAV pendek -> teks. Faham Bahasa Melayu. */
async function transcribe(p) {
  p = p || {};
  const key = String(p.key || '').trim();
  if (!key || key.length > 300 || /[\r\n]/.test(key)) return bad('kunci tidak sah');
  const buf = p.wav && (Buffer.isBuffer(p.wav) ? p.wav : Buffer.from(p.wav.buffer ? new Uint8Array(p.wav.buffer, p.wav.byteOffset, p.wav.byteLength) : new Uint8Array(p.wav)));
  if (!buf || buf.length < 1000 || buf.length > 3 * 1024 * 1024) return bad('audio tidak sah');
  const lang = /^[a-z]{2}$/.test(String(p.language || '')) ? p.language : 'ms';
  const model = /^[A-Za-z0-9._:\/-]{2,60}$/.test(String(p.model || '')) ? p.model : 'whisper-large-v3-turbo';
  const base = process.env.GS_AI_BASE || PROVIDERS.groq.base;
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: 'audio/wav' }), 'ucapan.wav');
  fd.append('model', model); fd.append('language', lang); fd.append('response_format', 'json'); fd.append('temperature', '0');
  if (p.prompt) fd.append('prompt', String(p.prompt).slice(0, 220));
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(base + '/audio/transcriptions', { method: 'POST', signal: ctl.signal, headers: { Authorization: 'Bearer ' + key }, body: fd });
    const txt = await res.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) { /* bukan JSON */ }
    if (!res.ok) { const d = (j && (j.error || j)) || {}; return { ok: false, status: res.status, code: String(d.status || d.code || d.type || ''), message: String(d.message || txt).slice(0, 200) }; }
    return { ok: true, text: String((j && j.text) || '').trim() };
  } catch (e) {
    return { ok: false, status: 0, code: e && e.name === 'AbortError' ? 'timeout' : 'network', message: String((e && e.message) || e) };
  } finally { clearTimeout(to); }
}

module.exports = { chat, transcribe, PROVIDERS };
