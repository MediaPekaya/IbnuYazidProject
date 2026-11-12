/* Global Streamer - Presentation: baca PDF dan tukar PowerPoint (PPT, PPTX, ODP) kepada PDF.
 * Penukaran menggunakan Microsoft PowerPoint (COM) jika dipasang, jika tidak LibreOffice. Hasil disimpan dalam cache supaya pantas dibuka semula. */
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const MAX_PDF = 300 * 1024 * 1024;
const PPT_EXT = /\.(pptx?|ppsx?|odp)$/i;

function readPdf(file) {
  try {
    const p = String(file || '');
    if (!path.isAbsolute(p) || !/\.pdf$/i.test(p)) return { ok: false, message: 'fail PDF tidak sah' };
    const st = fs.statSync(p);
    if (!st.isFile() || st.size > MAX_PDF) return { ok: false, message: 'fail terlalu besar atau tidak dijumpai' };
    return { ok: true, data: fs.readFileSync(p) };
  } catch (e) { return { ok: false, message: 'tidak dapat membaca fail' }; }
}

function run(cmd, args, env, timeoutMs) {
  return new Promise((resolve) => {
    let out = '', done = false;
    let child;
    try { child = spawn(cmd, args, { env: Object.assign({}, process.env, env || {}), windowsHide: true }); } catch (e) { resolve({ code: -1, out: String(e.message || e) }); return; }
    const timer = setTimeout(() => { if (!done) { done = true; try { child.kill(); } catch (e) { /* abaikan */ } resolve({ code: -2, out: 'tamat masa' }); } }, timeoutMs || 180000);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('error', (e) => { if (!done) { done = true; clearTimeout(timer); resolve({ code: -1, out: String(e.message || e) }); } });
    child.on('close', (code) => { if (!done) { done = true; clearTimeout(timer); resolve({ code, out }); } });
  });
}

async function viaPowerPoint(input, output) {
  if (process.platform !== 'win32') return false;
  const script = [
    "$ErrorActionPreference = 'Stop'",
    '$app = New-Object -ComObject PowerPoint.Application',
    'try {',
    '  $pres = $app.Presentations.Open($env:GS_DECK_IN, -1, 0, 0)',
    '  $pres.SaveAs($env:GS_DECK_OUT, 32)',
    '  $pres.Close()',
    '} finally { try { $app.Quit() } catch {} }',
  ].join('; ');
  const r = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { GS_DECK_IN: input, GS_DECK_OUT: output }, 240000);
  return r.code === 0 && fs.existsSync(output);
}

function sofficeCandidates() {
  const c = [];
  if (process.platform === 'win32') {
    for (const base of [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA]) {
      if (base) c.push(path.join(base, 'LibreOffice', 'program', 'soffice.exe'));
    }
  } else {
    c.push('/usr/bin/soffice', '/usr/bin/libreoffice', '/Applications/LibreOffice.app/Contents/MacOS/soffice');
  }
  return c.filter((x) => { try { return fs.existsSync(x); } catch (e) { return false; } }).concat(['soffice']);
}

async function viaLibreOffice(input, output) {
  const outDir = path.dirname(output);
  const profile = path.join(os.tmpdir(), 'gs-lo-' + crypto.randomBytes(4).toString('hex'));
  for (const bin of sofficeCandidates()) {
    const r = await run(bin, ['--headless', '--norestore', '-env:UserInstallation=file:///' + profile.replace(/\\/g, '/'), '--convert-to', 'pdf', '--outdir', outDir, input], {}, 240000);
    const produced = path.join(outDir, path.basename(input).replace(/\.[^.]+$/, '') + '.pdf');
    if (fs.existsSync(produced)) { if (produced !== output) fs.renameSync(produced, output); return true; }
    if (r.code === -1) continue;   // pelaksana tiada: cuba calon seterusnya
  }
  return false;
}

async function convert(input, cacheDir) {
  const p = String(input || '');
  if (!path.isAbsolute(p) || !PPT_EXT.test(p)) return { ok: false, message: 'jenis fail tidak disokong' };
  let st;
  try { st = fs.statSync(p); } catch (e) { return { ok: false, message: 'fail tidak dijumpai' }; }
  if (!st.isFile()) return { ok: false, message: 'fail tidak sah' };
  fs.mkdirSync(cacheDir, { recursive: true });
  const key = crypto.createHash('sha1').update(p + '|' + st.size + '|' + st.mtimeMs).digest('hex').slice(0, 20);
  const out = path.join(cacheDir, key + '.pdf');
  if (fs.existsSync(out)) return { ok: true, pdf: out, cached: true };
  if (await viaPowerPoint(p, out)) return { ok: true, pdf: out };
  // LibreOffice menamakan hasil mengikut nama fail asal; salin ke fail sementara dahulu supaya nama cache kekal
  const tmpIn = path.join(cacheDir, key + path.extname(p));
  try { fs.copyFileSync(p, tmpIn); } catch (e) { return { ok: false, message: 'tidak dapat menyediakan fail' }; }
  const ok = await viaLibreOffice(tmpIn, out);
  try { fs.unlinkSync(tmpIn); } catch (e) { /* abaikan */ }
  if (ok) return { ok: true, pdf: out };
  return { ok: false, message: 'Tidak dapat menukar PowerPoint. Pasang Microsoft PowerPoint atau LibreOffice, atau simpan fail sebagai PDF dahulu.' };
}

module.exports = { readPdf, convert };
