'use strict';
/*
 * Tambah URL gambar emblem dan talent (Fandom MLBB wiki, CDN yang sama dengan gambar hero/item) kepada data MLBB.
 * Gambar TIDAK dibundel; ia dimuat pada PC pengguna. Guna sebagai modul (collect-mlbb.js) atau CLI:
 *   node scripts/data/emblem-images.js    -> mengemas kini renderer/data/mlbb-static.json di tempat (idempoten)
 */
const fs = require('fs');
const path = require('path');
const { get, sleep } = require('./lib');
const BASE = 'https://mobile-legends.fandom.com';

async function fileUrls(names) {
  const out = {};
  for (let i = 0; i < names.length; i += 40) {
    const chunk = names.slice(i, i + 40);
    const url = `${BASE}/api.php?action=query&prop=imageinfo&iiprop=url&format=json&formatversion=2&titles=${encodeURIComponent(chunk.map((n) => 'File:' + n + '.png').join('|'))}`;
    const j = JSON.parse(await get(url));
    const norm = {};
    ((j.query && j.query.normalized) || []).forEach((n) => { norm[n.to] = n.from; });
    ((j.query && j.query.pages) || []).forEach((p) => {
      const u = p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url;
      if (!u) return;
      const title = (norm[p.title] || p.title).replace(/^File:/, '').replace(/\.png$/i, '');
      out[title] = u.replace(/\/revision\/latest.*$/, '') + '/revision/latest';
    });
    await sleep(800);
  }
  return out;
}

async function addEmblemImages(data) {
  const names = new Set();
  (data.emblems || []).forEach((e) => {
    names.add(e.name);
    (e.standard || []).forEach((g) => g.forEach((t) => names.add(t.name)));
    (e.core || []).forEach((t) => names.add(t.name));
  });
  const urls = await fileUrls([...names]);
  let n = 0;
  (data.emblems || []).forEach((e) => {
    if (urls[e.name]) { e.img = urls[e.name]; n++; }
    (e.standard || []).forEach((g) => g.forEach((t) => { if (urls[t.name]) t.img = urls[t.name]; }));
    (e.core || []).forEach((t) => { if (urls[t.name]) t.img = urls[t.name]; });
  });
  return { sets: n, files: Object.keys(urls).length, total: names.size };
}

/** Item yang gambarnya tiada dalam data (cth nama berapostrof): cari fail "<nama>.png" melalui API wiki. */
async function addMissingItemImages(data) {
  const miss = (data.items || []).filter((i) => !i.img);
  if (!miss.length) return { filled: 0, missing: 0 };
  const urls = await fileUrls(miss.map((i) => i.name));
  let n = 0;
  miss.forEach((i) => { if (urls[i.name]) { i.img = urls[i.name]; n++; } });
  return { filled: n, missing: miss.length - n };
}

module.exports = { addEmblemImages, addMissingItemImages };

if (require.main === module) {
  const f = path.join(__dirname, '..', '..', 'renderer', 'data', 'mlbb-static.json');
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  addEmblemImages(data).then(async (r) => { console.error('emblem:', JSON.stringify(r)); console.error('item:', JSON.stringify(await addMissingItemImages(data))); fs.writeFileSync(f, JSON.stringify(data)); }).catch((e) => { console.error(e); process.exit(1); });
}
