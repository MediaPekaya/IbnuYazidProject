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
    const body = "<speak version='1.0' xml:lang='" + lang + "'><voice xml:lang='" + lang + "' name='" + voice + "'><prosody rate='" + (rate >= 0 ? '+' : '') + rate + "%'>" + esc(text) + '</prosody></voice></speak>';
    return { url: (base || 'https://' + region + '.tts.speech.microsoft.com') + '/cognitiveservices/v1', init: { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'GlobalStreamer' }, body } };
  }
  if (kind === 'eleven') {
    const voice = String(p.voice || '');
    if (!EL_VOICE_RE.test(voice)) throw new Error('ID suara ElevenLabs tidak sah');
    const model = MODELS.includes(p.model) ? p.model : MODELS[0];
    const body = { text, model_id: model };
    if (model === 'eleven_flash_v2_5' && /^[a-z]{2}$/.test(String(p.language_code || ''))) body.language_code = p.language_code;
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

module.exports = { fetchTTS, build };
