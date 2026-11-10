'use strict';
/*
 * Kumpul maklumat tournament (tarikh, tahap, hadiah, kedudukan akhir/pemenang) daripada halaman utama tournament Liquipedia.
 * Senarai tournament ditemui secara AUTOMATIK daripada perlawanan (matches.json) + senarai tetap (tournaments.json).
 * Output: renderer/data/tournaments-info.json
 * Guna:  node scripts/data/collect-tournaments.js [--max 3] [--cache <folder>] [--force]
 * Had kadar Liquipedia: satu halaman parse setiap ~30 saat, jadi hanya --max halaman diambil setiap larian:
 * tournament yang belum pernah diambil, sedang berlangsung (sekali sehari) atau baru tamat (untuk pemenang).
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { sleep, wikiParse, clean } = require('./lib');

const BASE = 'https://liquipedia.net/mobilelegends';
const DIR = path.join(__dirname, '..', '..', 'renderer', 'data');
const OUT = path.join(DIR, 'tournaments-info.json');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const MAX = Number(arg('--max') || 3);
const CACHE = arg('--cache');
const FORCE = process.argv.includes('--force');
const DAY = 86400;

/** Halaman utama tournament daripada halaman peringkat. */
const basePage = (p) => {
  const parts = p.split('/');
  if (/^MPL\//.test(p) && parts.length >= 4) return parts.slice(0, 3).join('/');   // MPL/Indonesia/Season 18
  if (/^MSC\//.test(p) && parts.length >= 3) return parts.slice(0, 2).join('/');   // MSC/2026
  if (/^M\d+ World Championship/.test(p)) return parts[0];                          // M8 World Championship
  return parts.length > 1 ? parts.slice(0, -1).join('/') : p;
};

function parseInfo(html) {
  const $ = cheerio.load(html);
  const kv = {};
  $('.infobox-cell-2.infobox-description').each((i, e) => { kv[clean($(e).text()).replace(/:$/, '')] = clean($(e).next().text()); });
  const placements = [];
  let lastPlace = '';
  $('table.prizepooltable').first().find('tr.table2__row--body').each((i, r) => {
    const cellsAll = $(r).find('td').map((j, x) => clean($(x).text())).get();
    let place = clean($(r).find('.prizepooltable-place').text());
    if (!/^\d/.test(place)) place = /^\d/.test(cellsAll[0] || '') ? cellsAll[0] : lastPlace;
    lastPlace = place;
    const team = clean($(r).find('.prizepooltable-col-team a[title]').first().attr('title') || $(r).find('.prizepooltable-col-team').first().text());
    const cells = $(r).find('td').map((j, x) => clean($(x).text())).get();
    const qual = cells.find((c) => /^M\d+$|^MSC$/.test(c)) || '';
    if (team) placements.push({ place: place || cells[0] || '', team, qualified: qual });
  });
  return {
    name: clean($('.infobox-header').first().text().replace(/\[.*?\]/g, '')),
    start: kv['Start Date'] || '', end: kv['End Date'] || '', tier: kv['Liquipedia Tier'] || '', location: kv['Location'] || '',
    prize: (kv['Prize Pool'] || '').replace(/\s+/g, ' '), teams: Number((kv['Number of teams'] || '').replace(/\D/g, '')) || null,
    placements: placements.slice(0, 8),
  };
}

function loadJSON(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } }

async function main() {
  const matches = loadJSON(path.join(DIR, 'matches.json'), { matches: [] }).matches;
  const statics = loadJSON(path.join(__dirname, 'tournaments.json'), []);
  const prev = loadJSON(OUT, { tournaments: [] });
  const byBase = new Map((prev.tournaments || []).map((t) => [t.page, t]));
  const now = Math.floor(Date.now() / 1000);

  // 1) penemuan: asas halaman daripada perlawanan siri pro + senarai tetap
  const cand = new Map();
  const add = (page, series, name) => { if (!cand.has(page)) cand.set(page, { page, series, name: name || page, matches: [] }); return cand.get(page); };
  matches.filter((m) => m.tournament.series !== 'OTHER').forEach((m) => { add(basePage(m.tournament.page), m.tournament.series, '').matches.push(m); });
  statics.forEach((t) => (t.pages || []).forEach((p) => add(basePage(p), t.tier === 'pro' ? 'MPL' : t.id.startsWith('msc') ? 'MSC' : 'M', '')));

  // 2) keutamaan ambil: belum ada > sedang berlangsung (>1 hari) > baru tamat tanpa placement
  const todo = [];
  cand.forEach((c) => {
    const old = byBase.get(c.page);
    const live = c.matches.some((m) => !m.done && m.ts < now + 2 * DAY && m.ts > now - 12 * 3600);
    const age = old ? now - Date.parse(old.fetched) / 1000 : Infinity;
    const needWinner = old && old.end && Date.parse(old.end) / 1000 > now - 4 * DAY && !(old.placements || []).length;
    let pri = 0;
    if (!old || FORCE) pri = 3;
    else if (needWinner || (live && age > DAY)) pri = 2;
    else if (age > 7 * DAY && !(old.end && Date.parse(old.end) / 1000 < now - 7 * DAY)) pri = 1;
    if (pri) todo.push({ c, pri });
  });
  todo.sort((a, b) => b.pri - a.pri);
  const take = todo.slice(0, MAX);
  console.error(`calon ${cand.size}, perlu diambil ${todo.length}, diambil ${take.length}`);
  const result = new Map(byBase);
  for (const { c } of take) {
    try {
      const f = CACHE && path.join(CACHE, 'lq_info_' + c.page.replace(/\W+/g, '_') + '.html');
      let html;
      if (f && fs.existsSync(f)) html = fs.readFileSync(f, 'utf8');
      else { console.error('ambil ' + c.page); html = await wikiParse(BASE, c.page); if (f) fs.writeFileSync(f, html); await sleep(31000); }
      const info = parseInfo(html);
      result.set(c.page, Object.assign({ page: c.page, series: c.series, fetched: new Date().toISOString() }, info));
      console.error(`  ${c.page}: ${info.start} .. ${info.end}, ${info.placements.length} kedudukan`);
    } catch (e) { console.error(`  gagal ${c.page}: ${e.message}`); }
  }
  // buang entri yang bukan calon semasa tetapi kekalkan yang pernah diambil (sejarah)
  const out = { version: 1, generated: new Date().toISOString(), source: { name: 'Liquipedia Mobile Legends', url: BASE, license: 'CC-BY-SA 3.0' }, tournaments: [...result.values()] };
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.error(`siap -> ${OUT} (${out.tournaments.length} tournament)`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { parseInfo, basePage };
