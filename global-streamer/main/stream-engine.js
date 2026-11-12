/* Global Streamer - enjin siaran.
 * Terima aliran WebM daripada antara muka, kodkan SEKALI dengan FFmpeg, hantar serentak ke banyak RTMP (tee muxer).
 *
 * Ciri:
 *  - Key TIDAK pernah bocor: semua teks daripada FFmpeg ditapis sebelum dihantar ke antara muka.
 *  - Status setiap destinasi (satu gagal tidak menghentikan yang lain).
 *  - Statistik masa nyata (fps, kelajuan pengekodan, bingkai dilepaskan).
 *  - Pengekod perkakasan (NVENC / QSV / AMF) dengan sandaran automatik ke CPU (x264) jika gagal dimulakan.
 *  - SAMBUNG SEMULA destinasi terputus (Fasa 2.1): pengekod turut memancar salinan FLV ke geganti setempat; setiap destinasi yang
 *    gagal disambung semula oleh proses FFmpeg tersendiri (-c copy) dengan jeda berperingkat, tanpa mengganggu destinasi lain.
 *    (Pengekod memancar salinan FLV ke geganti setempat; pekerja baharu mula pada bingkai kunci.)
 */
'use strict';
const { spawn, spawnSync } = require('child_process');
const net = require('net');

function ffmpegBinary() {
  if (process.env.GS_FFMPEG) return process.env.GS_FFMPEG;
  try {
    const p = require('ffmpeg-static');
    return p ? p.replace('app.asar', 'app.asar.unpacked') : 'ffmpeg';
  } catch (e) {
    return 'ffmpeg';
  }
}

const URL_RE = /^rtmps?:\/\/[^\s|\[\]"'`$;&<>\\]+$/i; // elak aksara khas tee/shell

const ENCODERS = {
  x264: { label: 'CPU (x264)', codec: 'libx264', args: ['-preset', 'veryfast', '-tune', 'zerolatency', '-pix_fmt', 'yuv420p', '-profile:v', 'high'] },
  nvenc: { label: 'NVIDIA NVENC', codec: 'h264_nvenc', args: ['-preset', 'p4', '-tune', 'll', '-rc', 'cbr', '-pix_fmt', 'yuv420p', '-profile:v', 'high'] },
  qsv: { label: 'Intel Quick Sync', codec: 'h264_qsv', args: ['-preset', 'veryfast', '-pix_fmt', 'nv12', '-profile:v', 'high'] },
  amf: { label: 'AMD AMF', codec: 'h264_amf', args: ['-usage', 'lowlatency', '-quality', 'speed', '-rc', 'cbr', '-pix_fmt', 'yuv420p'] },
};
const AUTO_ORDER = ['nvenc', 'amf', 'qsv', 'x264'];
const ENC_FAIL_RE = /(nvenc|libmfx|qsv|amf|Unknown encoder|Unrecognized option|No capable devices|Cannot load|OpenEncodeSession|Error initializing output stream|Could not open encoder|Failed to open|Error while opening encoder)/i;

let encoderCache = null;
function availableEncoders() {
  if (encoderCache) return encoderCache;
  try {
    const out = spawnSync(ffmpegBinary(), ['-hide_banner', '-encoders'], { encoding: 'utf8', timeout: 8000, windowsHide: true }).stdout || '';
    encoderCache = Object.keys(ENCODERS).filter((k) => out.includes(ENCODERS[k].codec));
  } catch (e) {
    encoderCache = ['x264'];
  }
  if (!encoderCache.includes('x264')) encoderCache.push('x264');
  return encoderCache;
}

/* Tapis key daripada sebarang teks sebelum dihantar ke antara muka / log. */
function redact(text, targets) {
  let s = String(text);
  for (const t of targets || []) {
    const url = t.url;
    const key = url.slice(url.lastIndexOf('/') + 1);
    s = s.split(url).join('<' + (t.name || 'platform') + '>');
    if (key && key.length >= 4) s = s.split(key).join('***');
  }
  // sebarang rtmp(s)://host/.../KEY yang terlepas
  s = s.replace(/(rtmps?:\/\/[^\s\/'"]+\/[^\s'"]*\/)[^\s'"\/|\]]+/gi, '$1***');
  return s;
}

/* Geganti TCP setempat: satu pengeluar (FFmpeg utama, aliran FLV), banyak pelanggan (proses sambung semula).
 * Pelanggan baharu menerima: pengepala FLV + metadata + konfigurasi video/audio yang disimpan, kemudian bermula pada TAG KUNCI
 * (bingkai kunci video) pertama. Dengan itu FFmpeg pekerja sentiasa memulakan aliran yang sah (tidak di tengah GOP).
 * FLV dipilih (bukan MPEG-TS) kerana destinasi ialah FLV dan binari ffmpeg-static diuji terhempas pada MPEG-TS di Linux. */
class Relay {
  constructor() { this.port = 0; this.live = new Set(); this.pending = new Set(); this.server = null; this.reset(); }
  reset() { this.rest = Buffer.alloc(0); this.head = null; this.script = null; this.vcfg = null; this.acfg = null; this.gotHeader = false; }
  subscribe(fn) { this.pending.add(fn); }
  unsubscribe(fn) { this.pending.delete(fn); this.live.delete(fn); }
  get size() { return this.pending.size + this.live.size; }
  listen() {
    this.server = net.createServer((sock) => {
      this.reset();
      sock.on('data', (c) => { try { this.onData(c); } catch (e) { /* aliran rosak: abaikan, pengeluar akan disambung semula */ } });
      sock.on('error', () => {});
    });
    this.server.on('error', () => { this.port = 0; });
    this.server.listen(0, '127.0.0.1', () => { this.port = this.server.address().port; });
    this.server.unref();
  }
  onData(c) {
    this.rest = this.rest.length ? Buffer.concat([this.rest, c]) : c;
    let buf = this.rest, off = 0;
    if (!this.gotHeader) {
      if (buf.length < 13) return;
      if (buf.toString('latin1', 0, 3) !== 'FLV') { this.rest = Buffer.alloc(0); return; }
      this.head = Buffer.from(buf.subarray(0, 13));
      this.gotHeader = true; off = 13;
    }
    const out = [];
    while (buf.length - off >= 15) {
      const size = (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3];
      const total = 11 + size + 4;
      if (buf.length - off < total) break;
      const tag = buf.subarray(off, off + total);
      off += total;
      const type = tag[0], d0 = tag[11], d1 = tag[12];
      let key = false;
      if (type === 18) this.script = Buffer.from(tag);
      else if (type === 9) {
        const codec = d0 & 0x0f, ftype = d0 >> 4;
        if (codec === 7 && d1 === 0) this.vcfg = Buffer.from(tag);
        else if (ftype === 1) key = true;
      } else if (type === 8) { if ((d0 >> 4) === 10 && d1 === 0) this.acfg = Buffer.from(tag); }
      out.push({ tag, key });
    }
    this.rest = buf.subarray(off);
    if (!out.length) return;
    // pelanggan sedia: terus hantar
    if (this.live.size) { const chunk = Buffer.concat(out.map((o) => o.tag)); for (const f of this.live) f(chunk); }
    // pelanggan menunggu: mula pada tag kunci pertama (perlu konfigurasi video sudah ada)
    if (this.pending.size && this.vcfg) {
      const i = out.findIndex((o) => o.key);
      if (i >= 0) {
        const first = Buffer.concat([this.head, this.script || Buffer.alloc(0), this.vcfg, this.acfg || Buffer.alloc(0)].concat(out.slice(i).map((o) => o.tag)));
        for (const f of this.pending) { this.live.add(f); f(first); }
        this.pending.clear();
      }
    }
  }
  close() { try { this.server && this.server.close(); } catch (e) { /* abaikan */ } }
}

const RETRY_SECONDS = [2, 4, 8, 15, 30];

class StreamEngine {
  constructor(emit) {
    this.emit = emit || (() => {});
    this.relay = new Relay();
    this.relay.listen();
    this.workers = new Map();
    this.reset();
  }

  reset() {
    this.proc = null;
    this.cfg = null;
    this.stderr = '';
    this.lineBuf = '';
    this.progress = {};
    this.pre = []; // chunk awal (termasuk header WebM) untuk dimainkan semula jika perlu tukar pengekod
    this.ok = false; // FFmpeg sudah menghasilkan bingkai
    this.startedAt = 0;
    this.candidates = [];
    this.encIdx = 0;
    this.stopping = false;
    this.slowCount = 0;
    this.failed = new Set();
    this.gen = 0;
    this.killWorkers();
    this.relayPort = 0;
  }

  killWorkers() {
    for (const w of this.workers.values()) { clearTimeout(w.timer); w.dead = true; if (w.proc) { const pr = w.proc; try { this.relay.unsubscribe(w.sub); pr.stdin.end(); pr.kill('SIGTERM'); const to = setTimeout(() => { try { pr.kill('SIGKILL'); } catch (e) { /* abaikan */ } }, 1500); pr.once('exit', () => clearTimeout(to)); } catch (e) { /* abaikan */ } } }
    this.workers.clear();
  }

  static availableEncoders() { return availableEncoders(); }

  start(cfg) {
    if (this.proc) throw new Error('Siaran sudah berjalan.');
    if (!cfg || !Array.isArray(cfg.targets) || !cfg.targets.length) throw new Error('Tiada destinasi siaran.');
    const targets = cfg.targets.slice(0, 6).map((t) => ({ id: t.id, name: String(t.name || 'platform').slice(0, 40), url: t.url }));
    for (const t of targets) if (typeof t.url !== 'string' || !URL_RE.test(t.url)) throw new Error('URL siaran tidak sah untuk ' + t.name + '.');
    const clampInt = (v, a, b, d) => { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
    this.reset();
    this.cfg = {
      targets,
      fps: clampInt(cfg.fps, 15, 200, 30),
      vb: clampInt(cfg.vbitrate, 1000, 60000, 6000),
      ab: clampInt(cfg.abitrate, 64, 320, 160),
      reconnect: cfg.reconnect !== false,
    };
    const want = ENCODERS[cfg.encoder] ? cfg.encoder : 'auto';
    const avail = availableEncoders();
    this.candidates = want === 'auto' ? AUTO_ORDER.filter((k) => avail.includes(k)) : [want, 'x264'].filter((k, i, a) => a.indexOf(k) === i);
    this.requested = want;
    this.encIdx = 0;
    this.relayPort = this.cfg.reconnect === false ? 0 : this.relay.port;
    this.spawnProc();
    return { encoder: this.candidates[0], candidates: this.candidates.slice() };
  }

  buildArgs(encKey) {
    const { fps, vb, ab, targets } = this.cfg;
    const enc = ENCODERS[encKey];
    let tee = targets.map((t) => '[f=flv:onfail=ignore]' + t.url).join('|');
    // salinan FLV ke geganti setempat (sumber untuk menyambung semula destinasi yang terputus)
    if (this.relayPort) tee += '|[f=flv:flush_packets=1:onfail=ignore]tcp://127.0.0.1:' + this.relayPort;
    return [
      '-hide_banner', '-loglevel', 'warning', '-nostats', '-progress', 'pipe:1', '-stats_period', '1',
      '-fflags', '+genpts',
      '-f', 'webm', '-i', 'pipe:0',
      '-c:v', enc.codec, ...enc.args,
      '-r', String(fps), '-g', String(fps * 2), '-b:v', vb + 'k', '-maxrate', vb + 'k', '-bufsize', vb * 2 + 'k',
      '-c:a', 'aac', '-b:a', ab + 'k', '-ar', '44100', '-ac', '2',
      '-map', '0:v:0', '-map', '0:a:0?',
      '-f', 'tee', tee,
    ];
  }

  spawnProc() {
    const encKey = this.candidates[this.encIdx];
    const gen = ++this.gen;
    this.ok = false;
    this.stderr = '';
    this.lineBuf = '';
    this.progress = {};
    this.startedAt = Date.now();
    const p = spawn(ffmpegBinary(), this.buildArgs(encKey), { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    this.proc = p;
    p.stdin.on('error', () => {});
    p.stdout.on('data', (d) => this.onProgress(d.toString()));
    p.stderr.on('data', (d) => this.onStderr(d.toString()));
    p.on('error', (e) => {
      if (gen !== this.gen) return;
      this.proc = null;
      this.emit({ type: 'error', code: 'spawn', detail: e.message, message: 'FFmpeg gagal dimulakan: ' + e.message });
    });
    p.on('exit', (code) => this.onExit(gen, code, encKey));
    this.emit({ type: 'encoder', encoder: encKey, label: ENCODERS[encKey].label, requested: this.requested, fellBack: this.encIdx > 0 });
    // main semula chunk awal pada proses baharu (tukar pengekod)
    for (const c of this.pre) this.safeWrite(c);
  }

  onStderr(txt) {
    this.stderr = (this.stderr + txt).slice(-6000);
    this.lineBuf += txt;
    const lines = this.lineBuf.split(/\r?\n|\r/);
    this.lineBuf = lines.pop();
    for (const line of lines) {
      const m = /Slave muxer #(\d+) failed: (.*?)(?:, continuing with (\d+)\/(\d+) slaves)?\.?$/.exec(line);
      if (m) {
        const idx = Number(m[1]);
        if (!this.failed.has(idx)) {
          this.failed.add(idx);
          const t = this.cfg.targets[idx];
          this.emit({ type: 'target', index: idx, id: t && t.id, name: t && t.name, state: 'failed', message: redact(m[2], this.cfg.targets), remaining: m[3] != null ? Number(m[3]) : undefined });
          if (t && this.relayPort && !this.stopping) this.scheduleReconnect(idx);
        }
      }
    }
  }

  /* ---------- sambung semula destinasi terputus ---------- */
  scheduleReconnect(idx) {
    if (this.stopping || !this.cfg || !this.proc) return;
    const t = this.cfg.targets[idx];
    const w = this.workers.get(idx) || { attempt: 0 };
    this.workers.set(idx, w);
    clearTimeout(w.timer);
    w.attempt++;
    const delay = RETRY_SECONDS[Math.min(w.attempt - 1, RETRY_SECONDS.length - 1)];
    this.emit({ type: 'target', index: idx, id: t.id, name: t.name, state: 'reconnecting', attempt: w.attempt, nextIn: delay });
    w.timer = setTimeout(() => this.spawnWorker(idx), delay * 1000);
  }

  spawnWorker(idx) {
    const w = this.workers.get(idx);
    if (!w || w.dead || this.stopping || !this.cfg || !this.proc) return;
    const t = this.cfg.targets[idx];
    const args = ['-hide_banner', '-loglevel', 'warning', '-nostats', '-progress', 'pipe:1', '-stats_period', '1',
      '-probesize', '65536', '-analyzeduration', '1000000',
      '-f', 'flv', '-i', 'pipe:0', '-c', 'copy', '-f', 'flv', t.url];
    const p = spawn(ffmpegBinary(), args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    w.proc = p; w.live = false; w.err = ''; w.startedAt = Date.now();
    p.stdin.on('error', () => {});
    w.sub = (chunk) => { if (p.stdin.writable) { if (p.stdin.writableLength > 8 * 1024 * 1024) { try { p.kill(); } catch (e) { /* abaikan */ } } else p.stdin.write(chunk); } };
    this.relay.subscribe(w.sub);
    let buf = '';
    p.stdout.on('data', (d) => {
      buf += d.toString();
      const lines = buf.split('\n'); buf = lines.pop();
      for (const l of lines) {
        const m = /^(frame|total_size)=(\d+)/.exec(l.trim());
        if (m && Number(m[2]) > 0 && !w.live) {
          w.live = true; w.liveAt = Date.now();
          this.emit({ type: 'target', index: idx, id: t.id, name: t.name, state: 'live', recovered: true, attempt: w.attempt });
        }
      }
    });
    p.stderr.on('data', (d) => { w.err = (w.err + d.toString()).slice(-1500); });
    p.on('error', () => {});
    p.on('exit', (code, sig) => {
      this.relay.unsubscribe(w.sub);
      if (process.env.GS_DEBUG) console.error('[worker exit]', idx, 'code', code, 'sig', sig, 'live', w.live, 'dur', Date.now() - w.startedAt, 'err', w.err.slice(-300));
      if (w.dead || this.stopping || !this.proc) return;
      const wasLive = w.live && Date.now() - w.liveAt > 15000;
      if (wasLive) w.attempt = 0; // sambungan stabil: mulakan jeda dari awal
      const detail = redact(w.err.trim().split('\n').slice(-2).join(' '), this.cfg.targets);
      this.emit({ type: 'target', index: idx, id: t.id, name: t.name, state: 'failed', message: detail || ('FFmpeg destinasi berhenti (kod ' + code + ')'), reconnect: true });
      this.scheduleReconnect(idx);
    });
  }

  onProgress(txt) {
    this.progBuf = (this.progBuf || '') + txt;
    const lines = this.progBuf.split('\n');
    this.progBuf = lines.pop();
    for (const line of lines) {
      const i = line.indexOf('=');
      if (i < 0) continue;
      const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
      this.progress[k] = v;
      if (k === 'progress') {
        const pr = this.progress;
        const frame = Number(pr.frame) || 0;
        if (frame > 0 && !this.ok) { this.ok = true; this.pre = []; this.emit({ type: 'started' }); }
        const speed = parseFloat(String(pr.speed).replace('x', ''));
        const stats = { type: 'stats', fps: Number(pr.fps) || 0, speed: Number.isFinite(speed) ? speed : null, drop: Number(pr.drop_frames) || 0, frames: frame, uptime: Math.round((Date.now() - this.startedAt) / 1000) };
        this.emit(stats);
        if (Number.isFinite(speed) && speed < 0.9 && this.ok) {
          if (++this.slowCount === 4) this.emit({ type: 'warn', code: 'slow', speed, message: 'Pengekod tidak sempat mengejar (kelajuan ' + speed.toFixed(2) + 'x). Turunkan resolusi/FPS atau guna pengekod perkakasan.' });
        } else this.slowCount = 0;
        this.progress = {};
      }
    }
  }

  onExit(gen, code, encKey) {
    if (gen !== this.gen) return; // proses lama yang sudah diganti
    const early = !this.ok && Date.now() - this.startedAt < 8000;
    const raw = this.stderr;
    if (!this.stopping && early && code !== 0 && ENC_FAIL_RE.test(raw) && this.encIdx < this.candidates.length - 1) {
      // pengekod perkakasan gagal dimulakan: cuba yang seterusnya dengan memainkan semula chunk awal
      this.emit({ type: 'warn', code: 'encoder-fallback', from: ENCODERS[encKey].label, to: ENCODERS[this.candidates[this.encIdx + 1]].label, message: ENCODERS[encKey].label + ' tidak dapat dimulakan, beralih ke ' + ENCODERS[this.candidates[this.encIdx + 1]].label + '.' });
      this.encIdx++;
      this.proc = null;
      this.spawnProc();
      return;
    }
    this.proc = null;
    this.killWorkers();
    if (this.stopping || code === 0 || code === null) this.emit({ type: 'ended' });
    else { const detail = redact(raw.trim().split('\n').slice(-3).join(' '), this.cfg.targets); this.emit({ type: 'error', code: 'exit', exitCode: code, detail, message: 'FFmpeg berhenti (kod ' + code + '). ' + detail }); }
  }

  safeWrite(buf) {
    const p = this.proc;
    if (!p || !p.stdin.writable) return;
    if (p.stdin.writableLength > 64 * 1024 * 1024) {
      this.emit({ type: 'error', code: 'buffer-full', message: 'Pengekod terlalu perlahan (penimbal penuh). Siaran dihentikan.' });
      this.stop();
      return;
    }
    p.stdin.write(buf);
  }

  write(buf) {
    if (!this.proc) return;
    const b = Buffer.from(buf);
    if (!this.ok && this.pre.length < 40) this.pre.push(b); // simpan chunk awal untuk sandaran pengekod
    this.safeWrite(b);
  }

  stop() {
    const p = this.proc;
    if (!p) return Promise.resolve(true);
    this.stopping = true;
    this.killWorkers();
    return new Promise((resolve) => {
      const done = () => resolve(true);
      p.once('exit', done);
      try { p.stdin.end(); } catch (e) { /* abaikan */ }
      setTimeout(() => { try { p.kill(); } catch (e) { /* abaikan */ } }, 3000);
      setTimeout(done, 4000);
    });
  }
}

module.exports = { StreamEngine, URL_RE, redact, ENCODERS, availableEncoders, ffmpegBinary };
