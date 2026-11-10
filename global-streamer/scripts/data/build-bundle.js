'use strict';
/*
 * Bungkus JSON data menjadi fail skrip supaya app berfungsi tanpa fetch (juga pada file:// dalam Electron):
 *   renderer/data/mlbb-data.js  -> GS.data.static
 *   renderer/data/meta-data.js  -> GS.data.metaBundled
 * Guna: node scripts/data/build-bundle.js
 */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', '..', 'renderer', 'data');

function wrap(jsonFile, outFile, key, banner) {
  const src = path.join(dir, jsonFile);
  if (!fs.existsSync(src)) throw new Error('Tiada ' + jsonFile + '. Jalankan pengumpul dahulu.');
  const data = fs.readFileSync(src, 'utf8').trim();
  JSON.parse(data); // pastikan sah
  const js = `/* ${banner}\n * JANGAN edit tangan. Dijana oleh scripts/data/build-bundle.js */\n(function(){var GS=window.GS=window.GS||{};GS.data=GS.data||{};GS.data.${key}=${data};})();\n`;
  fs.writeFileSync(path.join(dir, outFile), js);
  console.log(outFile, Math.round(js.length / 1024) + ' KB');
}

wrap('mlbb-static.json', 'mlbb-data.js', 'static', 'Data hero, item dan emblem MLBB. Sumber: Mobile Legends Wiki (Fandom), CC-BY-SA 3.0.');
wrap('meta.json', 'meta-data.js', 'metaBundled', 'Statistik tournament MLBB. Sumber: Liquipedia, CC-BY-SA 3.0.');
