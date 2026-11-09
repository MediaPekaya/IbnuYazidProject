/* Global Streamer - enjin siaran: terima aliran WebM daripada antara muka, hantar serentak ke banyak RTMP melalui FFmpeg.
 * Satu pengekodan sahaja, banyak destinasi (tee muxer) = ringan berbanding menjalankan banyak siaran berasingan.
 * STATUS: kerangka Fasa 2, BELUM diuji dengan siaran sebenar. */
'use strict';
const { spawn } = require('child_process');

function ffmpegBinary() {
  try {
    const p = require('ffmpeg-static');
    return p ? p.replace('app.asar', 'app.asar.unpacked') : 'ffmpeg';
  } catch (e) {
    return 'ffmpeg';
  }
}

const URL_RE = /^rtmps?:\/\/[^\s|\[\]"'`$;&<>\\]+$/i; // elak aksara khas tee/shell

class StreamEngine {
  constructor(emit) {
    this.emit = emit || (() => {});
    this.proc = null;
    this.stderr = '';
  }

  start(cfg) {
    if (this.proc) throw new Error('Siaran sudah berjalan.');
    if (!cfg || !Array.isArray(cfg.targets) || !cfg.targets.length) throw new Error('Tiada destinasi siaran.');
    const targets = cfg.targets.slice(0, 6);
    for (const t of targets) if (typeof t.url !== 'string' || !URL_RE.test(t.url)) throw new Error('URL siaran tidak sah untuk ' + (t.name || 'platform') + '.');
    const clampInt = (v, a, b, d) => { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
    const fps = clampInt(cfg.fps, 15, 60, 30);
    const vb = clampInt(cfg.vbitrate, 1000, 60000, 6000);
    const ab = clampInt(cfg.abitrate, 64, 320, 160);

    const tee = targets.map((t) => '[f=flv:onfail=ignore]' + t.url).join('|');
    const args = [
      '-hide_banner', '-loglevel', 'warning',
      '-fflags', '+genpts',
      '-f', 'webm', '-i', 'pipe:0',
      '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-pix_fmt', 'yuv420p',
      '-r', String(fps), '-g', String(fps * 2), '-b:v', vb + 'k', '-maxrate', vb + 'k', '-bufsize', vb * 2 + 'k',
      '-c:a', 'aac', '-b:a', ab + 'k', '-ar', '44100', '-ac', '2',
      '-map', '0:v:0', '-map', '0:a:0?',
      '-f', 'tee', tee,
    ];

    this.stderr = '';
    this.proc = spawn(ffmpegBinary(), args, { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true });
    this.proc.stderr.on('data', (d) => { this.stderr = (this.stderr + d.toString()).slice(-2000); });
    this.proc.stdin.on('error', () => {}); // paip ditutup semasa henti
    this.proc.on('error', (e) => { this.emit({ type: 'error', message: 'FFmpeg gagal dimulakan: ' + e.message }); this.proc = null; });
    this.proc.on('exit', (code) => {
      const was = this.proc;
      this.proc = null;
      if (was && code !== 0 && code !== null) this.emit({ type: 'error', message: 'FFmpeg berhenti (kod ' + code + '). ' + this.stderr.split('\n').slice(-3).join(' ') });
      else this.emit({ type: 'ended' });
    });
    return true;
  }

  write(buf) {
    if (this.proc && this.proc.stdin.writable) this.proc.stdin.write(Buffer.from(buf));
  }

  stop() {
    if (!this.proc) return true;
    const p = this.proc;
    try { p.stdin.end(); } catch (e) { /* abaikan */ }
    setTimeout(() => { try { p.kill(); } catch (e) { /* abaikan */ } }, 2500);
    this.proc = null;
    return true;
  }
}

module.exports = { StreamEngine, URL_RE };
