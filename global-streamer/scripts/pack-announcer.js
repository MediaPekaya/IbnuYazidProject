/* Membungkus klip suara pengumum (build/announcer/*.mp3) menjadi renderer/data/announcer-clips.js (base64), supaya dimuat melalui <script>
 * dan berfungsi dalam app Windows (file://) tanpa fetch. Jalankan: node scripts/pack-announcer.js */
'use strict';
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'build', 'announcer');
const MAP = { 'first blood': 'first-blood', 'double kill': 'double-kill', 'triple kill': 'triple-kill', maniac: 'maniac', savage: 'savage', 'killing spree': 'killing-spree', legendary: 'legendary', shutdown: 'shutdown', death: 'death', slain: 'slain', victory: 'victory', defeat: 'defeat', fullitem: 'fullitem' };
const out = {};
for (const [k, f] of Object.entries(MAP)) out[k] = fs.readFileSync(path.join(dir, f + '.mp3')).toString('base64');
const js = '/* DIJANA oleh scripts/pack-announcer.js: klip pengumum Inggeris US (Piper, model john, domain awam). */\nGS.data = GS.data || {};\nGS.data.announcerClips = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'renderer', 'data', 'announcer-clips.js'), js);
console.log('klip dibungkus:', Object.keys(out).length, 'saiz', (js.length / 1024).toFixed(0) + ' KB');
