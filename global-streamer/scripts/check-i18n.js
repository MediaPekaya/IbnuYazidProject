/* Semak terjemahan: npm run check:i18n
 * Memastikan setiap teks dalam GS.t('...') / GS.tov('...') dan teks HTML statik ada dalam kamus English
 * (js/lang-en.js), kecuali istilah yang sama dalam kedua-dua bahasa (senarai SAMA di bawah). */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', 'renderer');
const GS = { i18n: { en: {} } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js', 'lang-en.js'), 'utf8'), { GS });
const dict = GS.i18n.en;

/* istilah yang sama dalam BM dan EN (nama jenama, istilah teknikal/game) */
const SAME = new Set(['GLOBAL STREAMER', 'WEB DEMO', 'APP WINDOWS', 'Normal', 'Studio', 'Game', 'LIVE', 'REC', 'STOP REC', '0 FPS', '1920×1080', 'PROGRAM',
  'Program', 'Chat', 'Scene', 'Audio Mixer', 'Meta', 'Hero', 'Logo', 'Template', 'Platform', 'Output', 'Data', 'Audio', 'Input', 'Item', 'Kill', 'Victory',
  'Defeat', 'Victory / Defeat', 'WIN', 'LOSE', 'KILL', 'TikTok', 'Facebook', 'YouTube', 'TikTok LIVE', 'Facebook Live', 'YouTube Live', 'Server URL',
  'Stream Key', 'Stream key', 'Stream Key.', 'CPU (x264)', 'NVIDIA NVENC', 'Intel Quick Sync', 'AMD AMF', '1920×1080 (Full HD)', '30 fps', '60 fps', 'Delete',
  'Game (Capture Card)', 'Capture Card (game)', 'Widget: Logo', 'Live · Hologram Pro', 'Hologram Pro', 'Mobile Legends: Bang Bang', 'Language / Bahasa',
  'Bahasa Melayu', 'English', 'BM', 'EN', 'Admin', 'Audio Capture Card', 'MOBILE LEGENDS', 'GlobalStreamer-', 'Top Ban', 'Top Pick Hero', 'WELCOME TO MY LIVE',
  'Pilih', 'Alt + ', 'PGM', 'PVW', 'INFO', 'ELIMINATED', 'VICTORY', 'DEFEAT', '@penonton', 'Rose', 'MythicDaily', 'FIRST BLOOD', 'DOUBLE KILL', 'TRIPLE KILL',
  'MANIAC', 'SAVAGE', 'KILLING SPREE', 'Blade of Despair', 'Windtalker', "Berserker's Fury", 'Hunter Strike', 'Immortality', 'Warrior Boots', 'Enter', 'Escape',
  'PUBG Mobile', 'Free Fire', 'Call of Duty: Mobile', 'Honor of Kings', 'Global Streamer', 'Global Streamer v', 'Live · ', 'Hologram', 'Input ', 'Scene ', 'Stream key ']);

function lit(src, re) {
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push(m[3].replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n'));
  return out;
}

let checked = 0;
const missing = new Map();
const add = (s, where) => {
  const core = s.trim();
  if (!core || !/[A-Za-z]{3,}/.test(core)) return;
  checked++;
  if (SAME.has(core) || SAME.has(s) || Object.prototype.hasOwnProperty.call(dict, core)) return;
  if (!missing.has(core)) missing.set(core, new Set());
  missing.get(core).add(where);
};

// 1) literal dalam GS.t / GS.tov
const jsDir = path.join(root, 'js');
const files = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js') && f !== 'lang-en.js' && f !== 'i18n.js').map((f) => path.join(jsDir, f))
  .concat(fs.readdirSync(path.join(root, 'games', 'mlbb')).map((f) => path.join(root, 'games', 'mlbb', f)));
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const s of lit(src, /GS\.(t|tov)\(\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2/g)) add(s, path.basename(f));
}

// 2) teks HTML statik
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
const textRe = />([^<>]+)</g;
let m;
while ((m = textRe.exec(html))) add(m[1].replace(/\s+/g, ' '), 'index.html');
const attrRe = /(?:title|aria-label|placeholder|alt)="([^"]+)"/g;
while ((m = attrRe.exec(html))) add(m[1], 'index.html');

if (missing.size) {
  console.error('Teks belum ada dalam renderer/js/lang-en.js (' + missing.size + '):');
  for (const [s, w] of missing) console.error('  - ' + JSON.stringify(s) + '  <' + [...w].join(', ') + '>');
  process.exit(1);
}
console.log('Kamus English lengkap: ' + checked + ' teks disemak (GS.t/GS.tov dan HTML statik), ' + Object.keys(dict).length + ' entri dalam kamus.');
