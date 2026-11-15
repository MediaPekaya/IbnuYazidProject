/* Global Streamer - ElevenLabs Agents (otak AI) dan Speech-to-Text (telinga) daripada proses utama.
 * Pengguna memasukkan kunci API ElevenLabs sendiri. Satu kunci sahaja digunakan untuk otak (Agent), suara (TTS) dan telinga (Scribe).
 * Ejen dicipta oleh app (mod teks sahaja, supaya jawapan ringkas tanpa kredit suara ejen); suara disebut melalui TTS ElevenLabs yang sedia ada. */
'use strict';

const BASE = () => process.env.GS_TTS_BASE || 'https://api.elevenlabs.io';
const bad = (message) => ({ ok: false, status: 0, code: 'input', message });
const idOk = (s) => /^[A-Za-z0-9_-]{10,80}$/.test(String(s || ''));
const keyOf = (p) => { const k = String((p && p.key) || '').trim(); return k && k.length <= 200 && !/[\r\n]/.test(k) ? k : ''; };

async function call(method, path, key, body, timeoutMs, extra) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), timeoutMs || 20000);
  try {
    const init = { method, signal: ctl.signal, headers: Object.assign({ 'xi-api-key': key, Accept: 'application/json' }, extra || {}) };
    if (body !== undefined) {
      if (body instanceof FormData) init.body = body;
      else { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
    }
    const res = await fetch(BASE() + path, init);
    const txt = await res.text();
    let json = null; try { json = JSON.parse(txt); } catch (e) { /* bukan JSON */ }
    if (!res.ok) {
      const d = (json && (json.detail || json.error || json)) || {};
      const det = Array.isArray(d) ? d.map((x) => (x && (x.msg || x.message)) || '').filter(Boolean).join('; ') : '';
      return { ok: false, status: res.status, code: String((!Array.isArray(d) && (d.status || d.code)) || ''), message: String(det || d.message || txt).slice(0, 300) };
    }
    return { ok: true, json: json || {} };
  } catch (e) {
    return { ok: false, status: 0, code: e && e.name === 'AbortError' ? 'timeout' : 'network', message: String((e && e.message) || e) };
  } finally { clearTimeout(to); }
}

function agentBody(p, withLlm, textOnly) {
  const voice = String(p.voice || '');
  const cfgv = {
    agent: { prompt: { prompt: String(p.prompt || '').slice(0, 12000), temperature: 0.8 }, first_message: '', language: /^[a-z]{2}$/.test(String(p.language || '')) ? p.language : 'ms' },
    tts: { voice_id: /^[A-Za-z0-9]{10,40}$/.test(voice) ? voice : '21m00Tcm4TlvDq8ikWAM', model_id: 'eleven_flash_v2_5' },
  };
  if (withLlm && /^[A-Za-z0-9._:-]{2,60}$/.test(String(p.llm || ''))) cfgv.agent.prompt.llm = p.llm;
  if (textOnly) cfgv.conversation = { text_only: true };
  return { name: String(p.name || 'Global Streamer Bot').replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 60) || 'Global Streamer Bot', conversation_config: cfgv };
}

/** Cipta atau kemas kini ejen. Cuba beberapa kombinasi tetapan jika API menolak medan tertentu (versi API berbeza). */
async function saveAgent(op, p, key) {
  const tries = [[true, true], [false, true], [true, false], [false, false]];
  let last = null;
  for (const [llm, txt] of tries) {
    const body = agentBody(p, llm, txt);
    const r = op === 'create'
      ? await call('POST', '/v1/convai/agents/create', key, body)
      : await call('PATCH', '/v1/convai/agents/' + p.agent_id, key, body);
    if (r.ok) return { ok: true, json: r.json, agent_id: op === 'create' ? String(r.json.agent_id || '') : p.agent_id, textOnly: txt };
    last = r;
    if (r.status !== 400 && r.status !== 422) break;   // ralat bukan berkaitan medan: jangan cuba lagi
  }
  return last;
}

async function elevenAgent(op, p) {
  p = (p && typeof p === 'object') ? p : {};
  const key = keyOf(p);
  if (!key) return bad('kunci tidak sah');
  if (op === 'subscription') return call('GET', '/v1/user/subscription', key, undefined, 15000);
  if (op === 'create') return saveAgent('create', p, key);
  if (op === 'update') { if (!idOk(p.agent_id)) return bad('ID ejen tidak sah'); return saveAgent('update', p, key); }
  if (op === 'signed') { if (!idOk(p.agent_id)) return bad('ID ejen tidak sah'); return call('GET', '/v1/convai/conversation/get-signed-url?agent_id=' + encodeURIComponent(p.agent_id), key, undefined, 15000); }
  if (op === 'stt') {
    const buf = p.wav && (Buffer.isBuffer(p.wav) ? p.wav : Buffer.from(p.wav.buffer ? new Uint8Array(p.wav.buffer, p.wav.byteOffset, p.wav.byteLength) : new Uint8Array(p.wav)));
    if (!buf || buf.length < 1000 || buf.length > 6 * 1024 * 1024) return bad('audio tidak sah');
    const fd = new FormData();
    fd.append('file', new Blob([buf], { type: 'audio/wav' }), 'ucapan.wav');
    fd.append('model_id', 'scribe_v1');
    fd.append('tag_audio_events', 'false');
    const r = await call('POST', '/v1/speech-to-text', key, fd, 25000);
    if (!r.ok) return r;
    return { ok: true, text: String(r.json.text || '').trim(), language: r.json.language_code || '' };
  }
  return bad('operasi tidak dikenali');
}

module.exports = { elevenAgent };
