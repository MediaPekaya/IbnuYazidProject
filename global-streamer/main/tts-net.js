/* Global Streamer - permintaan suara AI (TTS) rasmi dari proses utama (tiada masalah CORS, kunci tidak melalui halaman web):
 *  - Microsoft Azure AI Speech (tier percuma F0: 500,000 aksara/bulan; suara Melayu ms-MY-OsmanNeural lelaki, ms-MY-YasminNeural perempuan)
 *  - ElevenLabs (tier percuma 10,000 aksara/bulan)
 * Kunci API diberi oleh pengguna sendiri. Semua nilai disahkan di sini; teks dimasukkan ke SSML/JSON dengan pelepasan yang betul. */
'use strict';

const REGION_RE = /^[a-z0-9]{3,30}$/;
const AZ_VOICE_RE = /^[A-Za-z]{2,3}-[A-Za-z]{2,4}-[A-Za-z0-9]{3,30}$/;
const EL_VOICE_RE = /^[A-Za-z0-9]{10,40}$/;
const MODELS = ['eleven_multilingual_v2', 'eleven_flash_v2_5'];
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

function build(kind, p) {
  const base = process.env.GS_TTS_BASE || '';
  const text = String(p.text || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ').trim().slice(0, kind === 'eleven' ? 280 : 500);
  if (!text) throw new Error('teks kosong');
  const key = String(p.key || '').trim();
  if (!key || key.length > 200 || /[\r\n]/.test(key)) throw new Error('kunci tidak sah');
  if (kind === 'azure') {
    const region = String(p.region || 'southeastasia').toLowerCase();
    if (!REGION_RE.test(region)) throw new Error('kawasan Azure tidak sah');
    const voice = String(p.voice || '');
    if (!AZ_VOICE_RE.test(voice)) throw new Error('nama suara Azure tidak sah');
    const lang = voice.split('-').slice(0, 2).join('-');
    const rate = Math.max(-50, Math.min(50, Math.round(Number(p.rate) || 0)));
    const pitch = Math.max(-50, Math.min(50, Math.round(Number(p.pitch) || 0)));
    const sg = (n) => (n >= 0 ? '+' : '') + n + '%';
    const body = "<speak version='1.0' xml:lang='" + lang + "'><voice xml:lang='" + lang + "' name='" + voice + "'><prosody rate='" + sg(rate) + "' pitch='" + sg(pitch) + "'>" + esc(text) + '</prosody></voice></speak>';
    return { url: (base || 'https://' + region + '.tts.speech.microsoft.com') + '/cognitiveservices/v1', init: { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'GlobalStreamer' }, body } };
  }
  if (kind === 'eleven') {
    const voice = String(p.voice || '');
    if (!EL_VOICE_RE.test(voice)) throw new Error('ID suara ElevenLabs tidak sah');
    const model = MODELS.includes(p.model) ? p.model : MODELS[0];
    const body = { text, model_id: model };
    if (model === 'eleven_flash_v2_5' && /^[a-z]{2}$/.test(String(p.language_code || ''))) body.language_code = p.language_code;
    const vs = p.voice_settings;
    if (vs && typeof vs === 'object') {
      const num = (v, a, b) => (Number.isFinite(Number(v)) ? Math.max(a, Math.min(b, Number(v))) : undefined);
      body.voice_settings = { stability: num(vs.stability, 0, 1), similarity_boost: num(vs.similarity_boost, 0, 1), style: num(vs.style, 0, 1), speed: num(vs.speed, 0.7, 1.2), use_speaker_boost: true };
    }
    return { url: (base || 'https://api.elevenlabs.io') + '/v1/text-to-speech/' + voice + '?output_format=mp3_44100_128', init: { method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(body) } };
  }
  throw new Error('penyedia tidak dikenali');
}

/** @returns {Promise<{ok:true,audio:Buffer}|{ok:false,status:number,code:string,message:string}>} */
async function fetchTTS(kind, p) {
  let r;
  try { r = build(kind, p || {}); } catch (e) { return { ok: false, status: 0, code: 'input', message: String(e.message || e) }; }
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(r.url, Object.assign({ signal: ctl.signal }, r.init));
    if (!res.ok) {
      let code = '', message = '';
      try { const txt = await res.text(); message = txt.slice(0, 200); try { const j = JSON.parse(txt); const d = j.detail || j.error || j; code = String(d.status || d.code || ''); message = String(d.message || message); } catch (e) { /* bukan JSON */ } } catch (e) { /* tiada badan */ }
      return { ok: false, status: res.status, code, message };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return { ok: false, status: res.status, code: 'empty', message: 'audio kosong' };
    return { ok: true, audio: buf };
  } catch (e) {
    return { ok: false, status: 0, code: e && e.name === 'AbortError' ? 'timeout' : 'network', message: String((e && e.message) || e) };
  } finally { clearTimeout(to); }
}

/** API suara ElevenLabs: 'voices' (suara akaun), 'shared' (perpustakaan awam, boleh tapis bahasa/jantina), 'add' (tambah suara perpustakaan ke akaun). */
async function elevenApi(op, p) {
  p = p || {};
  const key = String(p.key || '').trim();
  if (!key || key.length > 200 || /[\r\n]/.test(key)) return { ok: false, status: 0, code: 'input', message: 'kunci tidak sah' };
  const base = process.env.GS_TTS_BASE || 'https://api.elevenlabs.io';
  const init = { headers: { 'xi-api-key': key, Accept: 'application/json' } };
  let url;
  if (op === 'voices') url = base + '/v1/voices';
  else if (op === 'shared') {
    const q = new URLSearchParams();
    q.set('page_size', String(Math.max(1, Math.min(30, parseInt(p.page_size, 10) || 20))));
    if (/^[a-z]{2}$/.test(String(p.language || ''))) q.set('language', p.language);
    if (p.gender === 'male' || p.gender === 'female') q.set('gender', p.gender);
    if (/^[\p{L}\p{N} –-]{2,60}$/u.test(String(p.search || ''))) q.set('search', p.search);
    if (/^[a-z_ -]{2,24}$/i.test(String(p.accent || ''))) q.set('accent', p.accent);
    url = base + '/v1/shared-voices?' + q.toString();
  } else if (op === 'add') {
    const own = String(p.public_user_id || ''), vid = String(p.voice_id || '');
    if (!/^[A-Za-z0-9]{10,80}$/.test(own) || !/^[A-Za-z0-9]{10,40}$/.test(vid)) return { ok: false, status: 0, code: 'input', message: 'ID suara tidak sah' };
    url = base + '/v1/voices/add/' + own + '/' + vid;
    init.method = 'POST'; init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify({ new_name: String(p.new_name || 'Suara Melayu').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 40) || 'Suara Melayu' });
  } else return { ok: false, status: 0, code: 'input', message: 'operasi tidak dikenali' };
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(url, Object.assign({ signal: ctl.signal }, init));
    const txt = await res.text();
    let json = null; try { json = JSON.parse(txt); } catch (e) { /* bukan JSON */ }
    if (!res.ok) { const d = json && (json.detail || json.error || json); return { ok: false, status: res.status, code: String((d && (d.status || d.code)) || ''), message: String((d && d.message) || txt).slice(0, 200) }; }
    return { ok: true, json: json || {} };
  } catch (e) {
    return { ok: false, status: 0, code: e && e.name === 'AbortError' ? 'timeout' : 'network', message: String((e && e.message) || e) };
  } finally { clearTimeout(to); }
}

module.exports = { fetchTTS, build, elevenApi };
