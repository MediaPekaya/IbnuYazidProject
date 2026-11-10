'use strict';
/*
 * Kumpul senarai perlawanan (sedang berlangsung, akan datang, keputusan terkini) bagi semua tournament MLBB daripada
 * halaman "Liquipedia:Matches" (satu panggilan parse sahaja). Kandungan CC-BY-SA 3.0.
 * Output: renderer/data/matches.json
 * Guna:  node scripts/data/collect-matches.js [--cache <fail.html>]
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { wikiParse, clean } = require('./lib');

const BASE = 'https://liquipedia.net/mobilelegends';
const OUT = path.join(__dirname, '..', '..', 'renderer', 'data', 'matches.json');
const cacheIdx = process.argv.indexOf('--cache');
const CACHE = cacheIdx > 0 ? process.argv[cacheIdx + 1] : null;

const series = (page) => (/^MPL\//.test(page) ? 'MPL' : /^MSC\//.test(page) ? 'MSC' : /^M\d+ World Championship/.test(page) ? 'M' : /^(MDL|MCC|Mobile Legends|SEA Games|Southeast Asian Games)/.test(page) ? 'OTHER-PRO' : 'OTHER');

function parse(html) {
  const $ = cheerio.load(html);
  const out = [];
  $('.match-info').each((i, el) => {
    const m = $(el);
    const ts = Number(m.find('.timer-object').first().attr('data-timestamp'));
    if (!ts) return;
    const opp = m.find('.match-info-header-opponent');
    if (opp.length < 2) return;
    const teams = opp.slice(0, 2).map((j, o) => {
      const a = $(o).find('a[title]').first();
      const short = clean($(o).find('.name').first().text());
      const full = clean((a.attr('title') || '').replace(/\s*\(page does not exist\)\s*$/i, '')) || short;
      return { name: full, short: short || full };
    }).get();
    const scoreEls = m.find('.match-info-header-scoreholder-score');
    const scores = scoreEls.slice(0, 2).map((j, s) => { const t = clean($(s).text()); return t === '' ? null : Number(t); }).get();
    const boTxt = clean(m.find('.match-info-header-scoreholder-lower').first().text());
    const bo = Number((boTxt.match(/Bo(\d+)/i) || [])[1]) || 0;
    const tl = m.find('.match-info-tournament a[title]').first();
    const page = clean((tl.attr('title') || '').split('#')[0]);
    const stageAnchor = ((tl.attr('title') || '').split('#')[1] || '');
    const tname = clean(m.find('.match-info-tournament-name').first().text());
    const [sA, sB] = scores;
    const need = bo ? Math.ceil(bo / 2) : 0;
    const done = sA != null && sB != null && (need ? Math.max(sA, sB) >= need : sA !== sB && m.find('.match-info-header-winner').length > 0);
    const winner = done ? (sA > sB ? 0 : 1) : null;
    const streams = m.find('.match-info-links a[href]').map((j, a) => $(a).attr('href')).get().filter((h) => /twitch|youtube|tiktok|facebook|kick/i.test(h)).slice(0, 3);
    out.push({
      ts, bo, done, winner,
      teams: teams.map((t, k) => Object.assign(t, { score: scores[k] == null ? null : scores[k] })),
      tournament: { name: tname, page, series: series(page), group: stageAnchor.replace(/_/g, ' ') },
      streams,
    });
  });
  return out;
}

async function main() {
  const html = CACHE ? fs.readFileSync(CACHE, 'utf8') : await wikiParse(BASE, 'Liquipedia:Matches');
  const list = parse(html).sort((a, b) => a.ts - b.ts);
  const res = {
    version: 1,
    generated: new Date().toISOString(),
    source: { name: 'Liquipedia Mobile Legends', url: BASE + '/Liquipedia:Matches', license: 'CC-BY-SA 3.0', note: 'Dikumpul oleh scripts/data/collect-matches.js' },
    matches: list,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(res));
  const by = {};
  list.forEach((m) => { by[m.tournament.series] = (by[m.tournament.series] || 0) + 1; });
  console.error(`${list.length} perlawanan (${JSON.stringify(by)}) -> ${OUT} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { parse, series };
