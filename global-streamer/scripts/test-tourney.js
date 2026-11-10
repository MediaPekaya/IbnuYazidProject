/* Ujian tournament automatik: npm run test:tourney
 *  - penghurai "Liquipedia:Matches" (fixture sintetik bersandar pada struktur sebenar)
 *  - logik pemilihan perlawanan semasa, keadaan, countdown, label pasukan, juara (jam palsu)
 *  - penemuan halaman statistik + halaman utama tournament */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { parse } = require('./data/collect-matches');
const { basePage, parseInfo } = require('./data/collect-tournaments');

let fail = 0;
const ok = (c, msg) => { if (!c) { fail++; console.error('  GAGAL: ' + msg); } else console.log('  ok: ' + msg); };

const match = (ts, a, b, sa, sb, bo, page, tname) => `<div class="match-info"><span class="match-info-countdown"><span class="timer-object" data-timestamp="${ts}">x</span></span>
<div class="match-info-header"><div class="match-info-header-opponent match-info-header-opponent-left"><div class="block-team"><span class="name"><a href="/x" title="${a[1]}">${a[0]}</a></span></div></div>
<div class="match-info-header-scoreholder"><span class="match-info-header-scoreholder-scorewrapper"><span class="match-info-header-scoreholder-upper"><span class="match-info-header-scoreholder-score">${sa}</span><span class="match-info-header-scoreholder-divider">:</span><span class="match-info-header-scoreholder-score">${sb}</span></span><span class="match-info-header-scoreholder-lower">(Bo${bo})</span></span></div>
<div class="match-info-header-opponent"><div class="block-team"><span class="name"><a href="/y" title="${b[1]} (page does not exist)">${b[0]}</a></span></div></div></div>
<div class="match-info-tournament"><span class="match-info-tournament-wrapper"><span class="match-info-tournament-name"><a href="/z" title="${page}#Playoffs">${tname}</a></span></span></div></div>`;

console.log('Penghurai perlawanan');
const NOW = 1794300000; // tetap
const html = '<div>' + [
  match(NOW - 3600, ['AE', 'Alter Ego'], ['BTR', 'Bigetron by Vitality'], 1, 2, 5, 'MPL/Indonesia/Season 18/Playoffs', 'MPL Indonesia Season 18 - Playoffs'),     // live (belum 3 menang)
  match(NOW - 86400, ['NAVI', 'Natus Vincere'], ['TLID', 'Team Liquid ID'], 3, 2, 5, 'MPL/Indonesia/Season 18/Playoffs', 'MPL Indonesia Season 18 - Playoffs'), // tamat
  match(NOW + 1800, ['PRO', 'PRO Esports'], ['TNR', 'TNR Esports'], '', '', 5, 'MPL/Cambodia/Season 11/Playoffs', 'MPL Cambodia Season 11 - Playoffs'),     // 30 min lagi
  match(NOW + 7200, ['TBD', 'TBD'], ['TBD', 'TBD'], '', '', 5, 'MPL/Cambodia/Season 11/Playoffs', 'MPL Cambodia Season 11 - Playoffs'),
  match(NOW + 90000, ['A', 'Alpha'], ['B', 'Beta'], '', '', 3, 'Some Cup/2026/Group Stage', 'Some Cup - Group Stage'),
].join('') + '</div>';
const ms = parse(html);
ok(ms.length === 5, '5 perlawanan dihurai');
ok(ms[0].done === false && ms[0].teams[0].score === 1 && ms[0].teams[1].score === 2, 'skor 1:2 pada Bo5 = belum tamat');
ok(ms[1].done === true && ms[1].winner === 0, 'skor 3:2 pada Bo5 = tamat, pemenang pasukan pertama');
ok(ms[2].teams[0].score === null && ms[2].done === false, 'perlawanan akan datang: skor kosong');
ok(ms[0].teams[1].name === 'Bigetron by Vitality', 'nama penuh daripada title (buang "page does not exist")');
ok(ms[0].tournament.page === 'MPL/Indonesia/Season 18/Playoffs' && ms[0].tournament.series === 'MPL', 'halaman dan siri tournament');
ok(ms[4].tournament.series === 'OTHER', 'tournament bukan pro ditanda OTHER');
ok(basePage('MPL/Indonesia/Season 18/Playoffs') === 'MPL/Indonesia/Season 18' && basePage('MSC/2026/Knockout Stage') === 'MSC/2026' && basePage('M8 World Championship/Wildcard') === 'M8 World Championship', 'halaman utama tournament daripada peringkat');

console.log('Maklumat tournament');
const info = parseInfo(`<div><table class="fo-nttax-infobox"><tr><th class="infobox-header">MPL Test S1[e]</th></tr></table>
<div class="infobox-cell-2 infobox-description">Start Date:</div><div>2026-08-14</div><div class="infobox-cell-2 infobox-description">End Date:</div><div>2026-11-08</div>
<div class="infobox-cell-2 infobox-description">Liquipedia Tier:</div><div>A-Tier</div>
<table class="prizepooltable"><tr class="table2__row--head"><th></th></tr>
<tr class="table2__row--body"><td class="prizepooltable-place">1</td><td class="prizepooltable-col-team"><a title="Team Alpha">Team Alpha</a></td><td>$1</td><td>M8</td></tr>
<tr class="table2__row--body"><td class="prizepooltable-place">2</td><td class="prizepooltable-col-team"><a title="Team Beta">Team Beta</a></td><td>$1</td><td>M8</td></tr>
<tr class="table2__row--body"><td class="prizepooltable-place">5-6</td><td class="prizepooltable-col-team"><a title="Gamma">Gamma</a></td><td>$1</td></tr>
<tr class="table2__row--body"><td class="prizepooltable-place"></td><td class="prizepooltable-col-team"><a title="Delta">Delta</a></td><td>$1</td></tr></table></div>`);
ok(info.start === '2026-08-14' && info.end === '2026-11-08' && info.tier === 'A-Tier', 'tarikh dan tahap');
ok(info.placements[0].team === 'Team Alpha' && info.placements[0].qualified === 'M8', 'juara + kelayakan M8');
ok(info.placements[3].place === '5-6', 'tempat seri diwarisi (5-6)');

console.log('Logik klien (jam palsu)');
const root = path.join(__dirname, '..', 'renderer');
const ctx = { window: {}, console, document: { hidden: true }, location: { protocol: 'file:', href: 'file:///x' }, setInterval: () => 0, fetch: () => Promise.reject(new Error('x')), URL, Date, Math, JSON };
ctx.window = ctx;
const GS = (ctx.GS = { state: {}, save() {}, emit() {}, on() {}, t: (s, ...a) => String(s).replace(/\{(\d+)\}/g, (m, i) => a[i]), data: {} });
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'tourney.js'), 'utf8'), ctx);
const T = GS.tourney;
T.matches = ms;
T.info = [
  { page: 'MPL/Indonesia/Season 18', name: 'MPL Indonesia Season 18', end: '2026-11-08', tier: 'A-Tier', placements: info.placements },
  { page: 'MPL/Cambodia/Season 11', name: 'MPL Cambodia Season 11', end: '2099-01-01', placements: info.placements },
  { page: 'X', name: 'X', end: '2026-01-01', placements: [{ place: '1', team: 'TBD', qualified: '' }] },
];
const now = NOW * 1000;
ok(T.stateOf(ms[0], now) === 'live' && T.stateOf(ms[1], now) === 'finished' && T.stateOf(ms[2], now) === 'upcoming', 'keadaan live / tamat / akan datang');
ok(T.stateOf(Object.assign({}, ms[0], { ts: NOW - 20 * 3600 }), now) === 'stale', 'perlawanan lama tanpa keputusan = stale');
ok(T.current(now).teams[0].short === 'AE', 'perlawanan semasa = yang sedang berlangsung');
T.matches = ms.filter((m) => m !== ms[0]);
ok(T.current(now).teams[0].short === 'PRO', 'tiada live: yang bermula dalam 90 minit dipilih');
T.matches = ms.filter((m) => m !== ms[0] && m !== ms[2]);
ok(T.current(now) && T.current(now).state === 'finished' && T.current(now).teams[0].short === 'NAVI' || T.current(now) === null, 'tiada live/akan datang dekat: yang baru tamat (<=3 jam) atau tiada');
ok(T.current(now + 5 * 3600 * 1000) === null || T.current(now + 5 * 3600 * 1000).state !== 'finished', 'perlawanan tamat lebih 3 jam tidak dipilih');
T.matches = ms;
T.settings().pin = T.key(ms[1]);
ok(T.current(now).teams[0].short === 'NAVI' && T.current(now).pinned, 'perlawanan boleh disematkan secara manual');
T.settings().pin = '';
ok(T.upcoming(8, now).length === 2 && T.upcoming(8, now)[0].teams[0].short === 'PRO', 'senarai akan datang tersusun mengikut masa');
T.settings().filter = 'pro';
ok(T.list(now).length === 4 && !T.list(now).some((m) => m.teams[0].short === 'A'), 'penapis "pro" membuang tournament lain');
T.settings().filter = 'all';
ok(T.list(now).length === 5, 'penapis "semua" memaparkan semua');
T.settings().filter = 'pro';
ok(T.countdown(ms[2], now) === '30m 0s' && T.countdown(Object.assign({}, ms[2], { ts: NOW + 90000 }), now) === '1d 1h', 'countdown: ' + T.countdown(ms[2], now));
T.settings().autoLabels = false;
ok(T.labels().ally === 'ALLY', 'label draft lalai ALLY/ENEMY');
T.settings().autoLabels = true;
let L = T.labels();
ok(L.auto && L.ally === 'AE' && L.enemy === 'BTR', 'label draft guna nama pasukan: ' + L.ally + ' vs ' + L.enemy);
T.settings().swap = true;
L = T.labels();
ok(L.ally === 'BTR' && L.enemy === 'AE', 'tukar sisi');
const ch = T.champions();
ok(ch.length === 1 && ch[0].champion === 'Team Alpha' && ch[0].runnerUp === 'Team Beta', 'juara hanya daripada tournament yang sudah tamat dan bukan TBD: ' + ch.map((c) => c.name).join(','));
ok(ch[0].qualified.length === 2, 'kelayakan dikesan');

if (fail) { console.error(`\n${fail} ujian gagal`); process.exit(1); }
console.log('\nSemua ujian tournament lulus');
