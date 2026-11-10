/* Sediakan keluaran untuk Hosting: node scripts/release-stage.js
 * Selepas `npm run dist`: salin pemasang + latest.yml + blockmap daripada dist/ ke renderer/updates/ dan jana latest.json
 * (versi, nama fail, saiz, SHA-256) yang dibaca oleh halaman /download. renderer/updates diabaikan oleh git dan tidak dimasukkan dalam app.
 * Kemudian deploy: firebase deploy --only hosting  (feed kemas kini = https://global-streamer.web.app/updates/latest.yml) */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'renderer', 'updates');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

if (!fs.existsSync(dist)) { console.error('Tiada folder dist/. Jalankan `npm run dist` dahulu.'); process.exit(1); }
const files = fs.readdirSync(dist);
const exe = files.find((f) => /^GlobalStreamer-Setup-.*\.exe$/i.test(f) || /Setup.*\.exe$/i.test(f));
if (!exe) { console.error('Tiada pemasang .exe dalam dist/.'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
for (const f of files) if (f === exe || f === exe + '.blockmap' || f === 'latest.yml') fs.copyFileSync(path.join(dist, f), path.join(out, f));
const buf = fs.readFileSync(path.join(dist, exe));
const manifest = { version: pkg.version, file: exe, size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), date: new Date().toISOString() };
fs.writeFileSync(path.join(out, 'latest.json'), JSON.stringify(manifest, null, 2));
console.log('Dikemas:', manifest.file, (manifest.size / 1048576).toFixed(1) + ' MB', manifest.sha256.slice(0, 12) + '…', '->', path.relative(root, out));
