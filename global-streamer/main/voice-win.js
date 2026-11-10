/* Global Streamer - pengecam suara luar talian untuk app Windows.
 *
 * Menggunakan pengecam suara bawaan Windows (System.Speech, tiada internet, tiada kunci API) melalui PowerShell.
 * Audio PCM 16 kHz mono (daripada saluran mixer: mikrofon atau bunyi game) disuap ke stdin; setiap frasa yang dikenali
 * dihantar semula sebagai satu baris JSON. Satu proses bagi setiap sumber ('mic', 'game').
 * Suara bot (TTS) dijana sebagai fail WAV supaya boleh dicampur ke dalam siaran.
 *
 * Skrip PowerShell dihantar melalui -EncodedCommand (tiada fail sementara, tiada masalah dengan arkib asar).
 * Semua nilai daripada UI disahkan di sini; teks tidak pernah dimasukkan ke dalam arahan (hanya pembolehubah persekitaran). */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RECOGNIZER_PS = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
function Send($o) { [Console]::Out.WriteLine((ConvertTo-Json -InputObject $o -Compress)); [Console]::Out.Flush() }
try {
  Add-Type -AssemblyName System.Speech
  $infos = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers()
  if ($infos.Count -eq 0) { Send @{ type = 'error'; code = 'no-recognizer'; message = 'Tiada pengecam suara Windows dipasang (Settings > Time & language > Speech).' }; exit 2 }
  $want = $env:GS_VOICE_CULTURE
  $info = $null
  if ($want) { $info = $infos | Where-Object { $_.Culture.Name -eq $want } | Select-Object -First 1 }
  if (-not $info) { $info = $infos | Where-Object { $_.Culture.Name -like 'en-*' } | Select-Object -First 1 }
  if (-not $info) { $info = $infos | Select-Object -First 1 }
  $rec = New-Object System.Speech.Recognition.SpeechRecognitionEngine($info)
  $rec.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
  $rec.EndSilenceTimeout = [TimeSpan]::FromMilliseconds(450)
  $fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
  $rec.SetInputToAudioStream([Console]::OpenStandardInput(), $fmt)
  Send @{ type = 'ready'; culture = $info.Culture.Name; name = $info.Description }
  $quick = 0
  while ($true) {
    $t0 = Get-Date
    $r = $rec.Recognize([TimeSpan]::FromSeconds(30))
    if ($r -ne $null -and $r.Text) {
      Send @{ type = 'text'; text = $r.Text; conf = [math]::Round($r.Confidence, 3) }
      $quick = 0
    } else {
      if (((Get-Date) - $t0).TotalMilliseconds -lt 300) { $quick++ } else { $quick = 0 }
      if ($quick -gt 30) { Send @{ type = 'ended' }; break }
    }
  }
} catch {
  Send @{ type = 'error'; code = 'exception'; message = $_.Exception.Message }
  exit 3
}
`;

const SYNTH_PS = String.raw`
$ErrorActionPreference = 'Stop'
try {
  Add-Type -AssemblyName System.Speech
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $v = $env:GS_VOICE
  if ($v) { try { $s.SelectVoice($v) } catch { } }
  else {
    $c = $env:GS_VOICE_CULTURE
    if ($c) { $m = $s.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq $c } | Select-Object -First 1; if ($m) { $s.SelectVoice($m.VoiceInfo.Name) } }
  }
  $s.Rate = [int]$env:GS_RATE
  $s.SetOutputToWaveFile($env:GS_OUT)
  $s.Speak($env:GS_TEXT)
  $s.Dispose()
} catch { [Console]::Error.WriteLine($_.Exception.Message); exit 3 }
`;

const enc = (s) => Buffer.from(s, 'utf16le').toString('base64');
const SOURCES = new Set(['mic', 'game']);
const CULTURE_RE = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})?$/;
const VOICE_RE = /^[\p{L}\p{N} .()_-]{1,80}$/u;

class VoiceHost {
  /** emit(event) menerima {source, type, ...}. `command` boleh diganti dalam ujian. */
  constructor(emit, opts = {}) {
    this.emit = emit;
    this.platform = opts.platform || process.platform;
    this.command = opts.command || ((kind) => ({
      exe: 'powershell.exe',
      args: ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', enc(kind === 'synth' ? SYNTH_PS : RECOGNIZER_PS)],
    }));
    this.procs = new Map();
    this.tmp = opts.tmp || os.tmpdir();
  }

  available() { return this.platform === 'win32' || this.command.custom === true; }

  start(source, cfg = {}) {
    if (!SOURCES.has(source)) return { ok: false, error: 'sumber tidak sah' };
    if (!this.available()) return { ok: false, error: 'Pengecam suara luar talian hanya tersedia dalam app Windows.' };
    this.stop(source);
    const culture = CULTURE_RE.test(String(cfg.culture || '')) ? String(cfg.culture) : '';
    const c = this.command('recognizer');
    let child;
    try {
      child = spawn(c.exe, c.args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: Object.assign({}, process.env, { GS_VOICE_CULTURE: culture }) });
    } catch (e) { return { ok: false, error: String(e.message || e) }; }
    const rec = { child, buf: '', err: '', closed: false };
    this.procs.set(source, rec);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (d) => {
      rec.buf += d;
      let i;
      while ((i = rec.buf.indexOf('\n')) >= 0) {
        const line = rec.buf.slice(0, i).trim();
        rec.buf = rec.buf.slice(i + 1);
        if (!line) continue;
        try { const o = JSON.parse(line); if (o && typeof o === 'object') this.emit(Object.assign({ source }, o)); } catch (e) { /* baris bukan JSON (cth amaran PowerShell): abaikan */ }
      }
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (d) => { rec.err = (rec.err + d).slice(-600); });
    child.stdin.on('error', () => { /* proses sudah tamat */ });
    child.on('error', (e) => { this.emit({ source, type: 'error', code: 'spawn', message: String(e.message || e) }); });
    child.on('close', (code) => {
      rec.closed = true;
      if (this.procs.get(source) === rec) this.procs.delete(source);
      this.emit({ source, type: 'exit', code, message: rec.err.trim() });
    });
    return { ok: true };
  }

  pcm(source, data) {
    const rec = this.procs.get(source);
    if (!rec || rec.closed || !rec.child.stdin.writable) return false;
    if (rec.child.stdin.writableLength > 1 << 20) return false; // pengecam ketinggalan: buang bingkai, jangan tambah memori
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data.buffer ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data));
    rec.child.stdin.write(buf);
    return true;
  }

  stop(source) {
    const rec = this.procs.get(source);
    if (!rec) return;
    this.procs.delete(source);
    try { rec.child.stdin.end(); } catch (e) { /* abaikan */ }
    try { rec.child.kill(); } catch (e) { /* abaikan */ }
  }

  stopAll() { [...this.procs.keys()].forEach((s) => this.stop(s)); }

  /** Jana suara bot sebagai WAV (Buffer). Teks dihantar melalui pembolehubah persekitaran, bukan arahan. */
  say(text, opts = {}) {
    return new Promise((resolve, reject) => {
      if (!this.available()) return reject(new Error('Suara bot ke dalam siaran hanya tersedia dalam app Windows.'));
      const t = String(text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 500);
      if (!t) return reject(new Error('teks kosong'));
      const voice = VOICE_RE.test(String(opts.voice || '')) ? String(opts.voice) : '';
      const culture = CULTURE_RE.test(String(opts.culture || '')) ? String(opts.culture) : '';
      const rate = Math.max(-10, Math.min(10, Math.round(Number(opts.rate) || 0)));
      const out = path.join(this.tmp, 'gs-voice-' + process.pid + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.wav');
      const c = this.command('synth');
      let err = '';
      let child;
      try {
        child = spawn(c.exe, c.args, { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true, env: Object.assign({}, process.env, { GS_TEXT: t, GS_OUT: out, GS_VOICE: voice, GS_VOICE_CULTURE: culture, GS_RATE: String(rate) }) });
      } catch (e) { return reject(e); }
      const timer = setTimeout(() => { try { child.kill(); } catch (e) { /* abaikan */ } }, 20000);
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (d) => { err = (err + d).slice(-300); });
      child.on('error', (e) => { clearTimeout(timer); reject(e); });
      child.on('close', (code) => {
        clearTimeout(timer);
        try {
          if (code !== 0) throw new Error(err.trim() || 'sintesis gagal (kod ' + code + ')');
          const wav = fs.readFileSync(out);
          resolve(wav);
        } catch (e) { reject(e); } finally { try { fs.unlinkSync(out); } catch (e) { /* tiada fail */ } }
      });
    });
  }
}

module.exports = { VoiceHost, RECOGNIZER_PS, SYNTH_PS, SOURCES };
