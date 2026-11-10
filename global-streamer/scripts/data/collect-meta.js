'use strict';
/*
 * Kumpul statistik hero tournament MLBB (pick, ban, menang/kalah, sisi biru/merah, padanan dan lawan)
 * daripada halaman "Statistics" Liquipedia (kandungan CC-BY-SA 3.0). Liquipedia mengehadkan: parse 1 setiap 30 saat.
 * Output: renderer/data/meta.json
 * Guna:  node scripts/data/collect-meta.js [--force] [--only id,id] [--cache <folder>]
 *   Tanpa --force: tournament yang sudah tamat dan sudah ada dalam meta.json lama TIDAK diambil semula.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { sleep, wikiParse, clean, num } = require('./lib');

const BASE = 'https://liquipedia.net/mobilelegends';
const OUT = path.join(__dirname, '..', '..', 'renderer', 'data', 'meta.json');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const FORCE = process.argv.includes('--force');
const ONLY = (arg('--only') || '').split(',').filter(Boolean);
const CACHE = arg('--cache');
const PARSE_GAP = 31000;

/* live: masih berlangsung (sentiasa diambil semula). tier: 'pro' = liga serantau, 'intl' = antarabangsa. */
const TOURNAMENTS = require('./tournaments.json');

function parseStats(html) {
  const $ = cheerio.load(html);
  const heroes = {};
  $('tr.character-stats-row').each((i, tr) => {
    const td = $(tr).children('td');
    if (td.length < 19) return;
    const name = clean(td.eq(1).find('a[title]').last().text() || td.eq(1).text());
    if (!name) return;
    const sub = (title) => {
      const out = [];
      td.eq(19).find('table').each((x, t) => {
        if (clean($(t).find('th').first().text()).toLowerCase() !== title) return;
        $(t).find('tr').each((y, r) => {
          const c = $(r).children('td');
          if (c.length < 6) return;
          const label = clean(c.eq(1).find('a[title]').last().text() || c.eq(1).text());
          if (label) out.push({ name: label, n: num(c.eq(2).text()), w: num(c.eq(3).text()) });
        });
      });
      return out;
    };
    heroes[name] = {
      p: num(td.eq(2).text()), w: num(td.eq(3).text()), l: num(td.eq(4).text()),
      bn: num(td.eq(7).text()), bw: num(td.eq(8).text()),
      rn: num(td.eq(11).text()), rw: num(td.eq(12).text()),
      b: num(td.eq(15).text()),
      with: sub('played with'), vs: sub('played against'), teams: sub('played by teams')
    };
  });
  return heroes;
}

function merge(a, b) {
  const out = JSON.parse(JSON.stringify(a));
  for (const [h, s] of Object.entries(b)) {
    const o = out[h] || (out[h] = { p: 0, w: 0, l: 0, bn: 0, bw: 0, rn: 0, rw: 0, b: 0, with: [], vs: [], teams: [] });
    for (const k of ['p', 'w', 'l', 'bn', 'bw', 'rn', 'rw', 'b']) o[k] += s[k] || 0;
    for (const k of ['with', 'vs', 'teams']) {
      const m = new Map(o[k].map((x) => [x.name, x]));
      for (const x of s[k] || []) { const e = m.get(x.name); if (e) { e.n += x.n; e.w += x.w; } else m.set(x.name, { ...x }); }
      o[k] = [...m.values()];
    }
  }
  return out;
}

async function fetchPage(title) {
  const f = CACHE && path.join(CACHE, 'lp_' + title.replace(/\W+/g, '_') + '.html');
  if (f && fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const html = await wikiParse(BASE, title);
  if (f) fs.writeFileSync(f, html);
  await sleep(PARSE_GAP);
  return html;
}

(async () => {
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { /* pertama kali */ }
  const prevById = new Map(((prev && prev.tournaments) || []).map((t) => [t.id, t]));
  const result = [];
  for (const t of TOURNAMENTS) {
    if (ONLY.length && !ONLY.includes(t.id)) { if (prevById.has(t.id)) result.push(prevById.get(t.id)); continue; }
    const old = prevById.get(t.id);
    if (old && !t.live && !FORCE) { console.error(`lompat ${t.id} (tamat, sudah ada)`); result.push(old); continue; }
    let heroes = {};
    const pages = [];
    for (const p of t.pages) {
      try {
        console.error(`ambil ${p}`);
        heroes = merge(heroes, parseStats(await fetchPage(p)));
        pages.push(p);
      } catch (e) { console.error(`  gagal ${p}: ${e.message}`); }
    }
    const picks = Object.values(heroes).reduce((s, h) => s + h.p, 0);
    const games = Math.round(picks / 10);
    if (!games) { console.error(`  ${t.id}: tiada data`); if (old) result.push(old); continue; }
    result.push({ id: t.id, label: t.label, region: t.region, tier: t.tier, live: !!t.live, pages, games, heroes, fetched: new Date().toISOString() });
    console.error(`  ${t.id}: ${games} game, ${Object.keys(heroes).length} hero`);
  }
  const out = {
    version: 1,
    generated: new Date().toISOString(),
    source: { name: 'Liquipedia Mobile Legends', url: BASE, license: 'CC-BY-SA 3.0', note: 'Statistik hero setiap tournament. Dikumpul oleh scripts/data/collect-meta.js' },
    tournaments: result
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.error(`siap -> ${OUT} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
})().catch((e) => { console.error(e); process.exit(1); });
