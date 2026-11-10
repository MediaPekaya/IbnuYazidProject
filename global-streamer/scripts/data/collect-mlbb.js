'use strict';
/*
 * Kumpul data hero, item dan emblem MLBB daripada Fandom MLBB wiki (kandungan CC-BY-SA).
 * Output: renderer/data/mlbb-static.json
 * Guna:  node scripts/data/collect-mlbb.js [--cache <folder>]
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { sleep, wikiParse, clean, num } = require('./lib');

const BASE = 'https://mobile-legends.fandom.com';
const OUT = path.join(__dirname, '..', '..', 'renderer', 'data', 'mlbb-static.json');
const cacheIdx = process.argv.indexOf('--cache');
const CACHE = cacheIdx > 0 ? process.argv[cacheIdx + 1] : null;
const GAP = 1500;

const LANE = { 'gold lane': 'gold', 'exp lane': 'exp', 'mid lane': 'mid', 'jungle': 'jungle', 'roaming': 'roam' };
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

async function page(name, extra) {
  const f = CACHE && path.join(CACHE, 'fd_' + name.replace(/\W+/g, '_') + (extra ? '_s0' : '') + '.html');
  if (f && fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const html = await wikiParse(BASE, name, extra);
  if (f) fs.writeFileSync(f, html);
  await sleep(GAP);
  return html;
}

function isoDate(s) {
  const m = clean(s).match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m || !MONTHS[m[2].toLowerCase()]) return null;
  return `${m[3]}-${String(MONTHS[m[2].toLowerCase()]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
}

/* ---------- Hero ---------- */
async function heroes() {
  const $ = cheerio.load(await page('List of heroes'));
  const out = [];
  $('table.wikitable tr').each((i, tr) => {
    const td = $(tr).find('td');
    if (td.length < 10) return;
    const nameCell = td.eq(2);
    const name = clean(nameCell.find('b').first().text()).replace(/,$/, '');
    if (!name) return;
    const title = clean(nameCell.text()).slice(name.length + 1).replace(/^,\s*/, '').replace(/^the\s+/i, 'The ').trim();
    const list = (c) => c.find('a').map((j, a) => clean($(a).text())).get();
    const lanes = list(td.eq(6)).map((l) => LANE[l.toLowerCase()]).filter(Boolean);
    const price = {};
    td.eq(8).find('li').each((j, li) => {
      const t = $(li).find('a').first().attr('title') || '';
      const n = num($(li).find('span[data-param]').attr('data-param') || $(li).text());
      if (/Battle Points/i.test(t)) price.bp = n;
      else if (/Diamond/i.test(t)) price.dm = n;
      else if (/Ticket/i.test(t)) price.tk = n;
    });
    out.push({
      name,
      title,
      order: num(td.eq(3).text()),
      roles: list(td.eq(4)),
      specialties: list(td.eq(5)),
      lanes,
      region: clean(td.eq(7).text()),
      price,
      released: isoDate(td.eq(9).text()),
      icon: (td.eq(1).find('img').attr('data-image-key') || '').replace(/_/g, ' '),
      img: ((td.eq(1).find('img').attr('data-src') || td.eq(1).find('img').attr('src') || '').match(/^(https:\/\/static\.wikia\.nocookie\.net\/[^?]*?\/revision\/latest)/) || [])[1] || ''
    });
  });
  return out;
}

/* ---------- Item ---------- */
const TAB = { attack: 'attack', magic: 'magic', defense: 'defense', movement: 'movement', jungling: 'jungle', roaming: 'roam' };

async function items() {
  const $ = cheerio.load(await page('Equipment'));
  const tabNames = $('.wds-tabs__tab').map((i, t) => clean($(t).text()).toLowerCase()).get();
  const byName = new Map();
  $('.wds-tab__content').each((i, t) => {
    const tab = TAB[tabNames[i]] || tabNames[i];
    $(t).find('div[style*="background-color"]').each((j, d) => {
      const n = clean($(d).text());
      const a = $(d).find('a').first().attr('title') || n;
      if (!n) return;
      const rec = byName.get(a) || { name: a, tabs: [] };
      if (!rec.tabs.includes(tab)) rec.tabs.push(tab);
      byName.set(a, rec);
    });
  });
  const list = [...byName.values()];
  console.error(`  ${list.length} item dijumpai; ambil butiran satu-satu...`);
  let k = 0;
  for (const it of list) {
    k++;
    try {
      const html = await page(it.name.replace(/ /g, '_'), '&section=0');
      const $i = cheerio.load(html);
      const f = {};
      $i('[data-source]').each((x, e) => { f[$i(e).attr('data-source')] = clean($i(e).find('.pi-data-value, .pi-title').first().text() || $i(e).text()); });
      const val = (key) => f[key] || '';
      it.bonus = clean($i('[data-source="bonus"] .pi-data-value').text() || val('bonus'));
      it.unique = clean($i('[data-source="unique"] .pi-data-value').text() || val('unique'));
      it.price = num(f.total_price);
      it.upgrade = num(f.upgrade_price);
      it.sell = num(f.sell);
      it.type = clean(val('type').replace(/^Type/i, ''));
      it.availability = clean(val('availability').replace(/^Available for\?/i, ''));
      const rec = $i('[data-source="recipe"]').find('a[title]').map((x, a) => $i(a).attr('title')).get();
      it.recipe = [...new Set(rec)].filter((r) => r !== it.name);
      it.passives = parsePassives(it.unique);
      const ikey = it.name.replace(/ /g, '_') + '.png';
      const im = $i('img').filter((x, e) => $i(e).attr('data-image-key') === ikey).first();
      const isrc = im.attr('data-src') || im.attr('src') || '';
      it.img = (isrc.match(/^(https:\/\/static\.wikia\.nocookie\.net\/[^?]*?\/revision\/latest)/) || [])[1] || '';
    } catch (e) { console.error('  gagal item', it.name, e.message); it.error = e.message; }
    if (k % 20 === 0) console.error(`  ${k}/${list.length}`);
  }
  return list;
}

function parsePassives(text) {
  if (!text) return [];
  const out = [];
  const re = /(Unique Passive|Unique Active|Active|Passive)\s*-\s*([^:]+):\s*([\s\S]*?)(?=(?:Unique Passive|Unique Active|Active|Passive)\s*-\s*[^:]+:|$)/g;
  let m;
  while ((m = re.exec(text))) out.push({ kind: m[1].replace(/^Unique /, '').toLowerCase(), name: clean(m[2]), text: clean(m[3]) });
  return out;
}

/* ---------- Emblem ---------- */
async function emblems() {
  const $ = cheerio.load(await page('Emblems'));
  const sets = [];
  $('h3').each((i, h) => {
    const title = clean($(h).text());
    if (!/Emblem Set$/i.test(title)) return;
    const root = $(h).next('div.ml');
    const rows = root.children('div');
    const set = { name: title.replace(/ Set$/i, ''), attributes: [], standard: [], core: [] };
    const head = rows.eq(0).children('div').last().text();
    rows.each((x, r) => {
      const label = clean($(r).children('div').first().text());
      if (/Attributes/i.test(label)) {
        $(r).children('div').last().children('div').each((y, a) => {
          const k = clean($(a).find('span').first().text());
          const v = clean($(a).find('b').first().text());
          if (k) set.attributes.push({ stat: k, value: v });
        });
      } else if (/Standard Talents?|Core Talents?/i.test(label)) {
        const dest = /Core/i.test(label) ? set.core : set.standard;
        const groups = new Map();
        $(r).find('pre').each((y, pre) => {
          const nm = clean($(pre).find('b').first().text());
          if (!nm) return;
          const parent = $(pre).parent().parent().get(0);
          if (!groups.has(parent)) groups.set(parent, []);
          groups.get(parent).push({ name: nm, text: clean($(pre).next('div').text()) });
        });
        // Teras ialah satu senarai rata; talent biasa dikumpul mengikut blok (peringkat).
        if (/Core/i.test(label)) dest.push(...[...groups.values()].flat());
        else for (const g of groups.values()) dest.push(g);
      }
    });
    void head;
    sets.push(set);
  });
  return sets;
}

(async () => {
  const t0 = Date.now();
  const H = await heroes();
  console.error(`hero: ${H.length}`);
  const E = await emblems();
  console.error(`emblem: ${E.length} set`);
  const I = await items();
  console.error(`item: ${I.length}`);
  const out = {
    source: { name: 'Mobile Legends: Bang Bang Wiki (Fandom)', url: BASE, license: 'CC-BY-SA 3.0', note: 'Dikumpul oleh scripts/data/collect-mlbb.js' },
    generated: new Date().toISOString(),
    heroes: H, items: I, emblems: E
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.error(`siap dalam ${Math.round((Date.now() - t0) / 1000)}s -> ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
