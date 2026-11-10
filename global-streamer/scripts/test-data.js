/* Ujian data & enjin meta: npm run test:data
 * Memuatkan fail renderer sebenar dalam sandbox vm (tanpa pelayar) dan menyemak:
 *  - data hero/item/emblem lengkap (peranan, lane), nama dalam meta dipadankan dengan senarai hero
 *  - agregat, cadangan pick/ban, ramalan dan pengisian tier berfungsi dan masuk akal */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..', 'renderer');

let fail = 0;
const ok = (c, msg) => { if (!c) { fail++; console.error('  GAGAL: ' + msg); } else console.log('  ok: ' + msg); };

const ctx = { window: {}, console, document: { hidden: true }, location: { protocol: 'file:', href: 'file:///x/index.html' }, setInterval: () => 0, fetch: () => Promise.reject(new Error('tiada rangkaian dalam ujian')), URL, Date, Math, JSON };
ctx.window = ctx;
const GS = (ctx.GS = { state: { draft: {} }, save() {}, emit() {}, on() {}, t: (s, ...a) => String(s).replace(/\{(\d+)\}/g, (m, i) => a[i]) });
vm.createContext(ctx);
for (const f of ['data/mlbb-data.js', 'data/meta-data.js', 'games/mlbb/heroes.js', 'games/mlbb/items.js', 'js/meta.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });

console.log('Data statik');
const H = GS.data.mlbbHeroes;
ok(H.length >= 130, `bilangan hero ${H.length} >= 130`);
ok(H.every((x) => x.roles.length && x.lanes.length), 'setiap hero ada peranan dan lane');
ok(!!GS.hero('Hirara') && !!GS.hero('Marcel'), 'hero terbaharu (Hirara, Marcel) ada');
const roles = new Set(H.flatMap((x) => x.roles));
ok(['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'].every((r) => roles.has(r)), 'enam peranan hadir');
const lanes = new Set(H.flatMap((x) => x.lanes));
ok(['gold', 'mid', 'exp', 'jungle', 'roam'].every((r) => lanes.has(r)), 'lima lane hadir');
ok(GS.data.mlbbItems.length >= 80, `bilangan item kedai ${GS.data.mlbbItems.length} >= 80`);
const gw = GS.data.mlbbItemByName['glowing wand'];
ok(gw && gw.price === 2150 && gw.cat === 'magic' && gw.passives.length >= 1, 'Glowing Wand: harga 2150, magic, ada pasif');
ok(GS.data.mlbbEmblems.length === 7 && GS.data.mlbbEmblems.every((e) => e.attributes.length === 3), '7 set emblem dengan 3 atribut');

console.log('Data meta');
const M = GS.meta;
M.start();
const d = M.data;
ok(d && d.tournaments.length >= 4, `tournament dimuat ${d && d.tournaments.length}`);
let unmatched = new Set();
d.tournaments.forEach((t) => Object.keys(t.heroes).forEach((n) => { if (!M.canon(n)) unmatched.add(n); }));
ok(unmatched.size === 0, 'semua nama hero dalam meta dipadankan dengan senarai hero' + (unmatched.size ? ' (tidak padan: ' + [...unmatched].join(', ') + ')' : ''));
const a = M.aggregate('latest');
ok(a.games > 100, `agregat terkini: ${a.games} game`);
const top = M.top('pick', { n: 5 });
ok(top.length === 5 && top[0].p >= top[4].p, 'top pick tersusun: ' + top.map((x) => x.name + ' ' + x.p).join(', '));
const bans = M.top('ban', { n: 5 });
ok(bans.length === 5 && bans[0].b >= bans[4].b, 'top ban tersusun: ' + bans.map((x) => x.name + ' ' + x.b).join(', '));
ok(M.top('pick', { n: 5, lane: 'gold' }).every((x) => x.lanes.includes('gold')), 'penapis lane gold');
ok(a.tournaments.every((t) => t.games > 0), 'setiap tournament ada game');
// jumlah pick = 10 x bilangan game
const picks = Object.values(a.heroes).reduce((s, h) => s + h.p, 0);
ok(Math.abs(picks - a.games * 10) <= a.games * 0.3, `jumlah pick ${picks} ~ 10 x ${a.games}`);

console.log('Cadangan');
const ctxD = { ally: ['Gusion', 'Belerick'], enemy: ['Paquito'], bans: ['Hirara'], n: 5 };
const sp = M.suggestPick(ctxD);
ok(sp.length === 5 && sp.every((r) => !['Gusion', 'Belerick', 'Paquito', 'Hirara'].includes(r.name)), 'cadangan pick tidak mengulang hero yang sudah diambil/di-ban: ' + sp.map((r) => r.name).join(', '));
ok(sp[0].score >= sp[4].score, 'cadangan pick tersusun mengikut skor');
const sb = M.suggestBan(ctxD);
ok(sb.length === 5 && sb.every((r) => !['Gusion', 'Belerick', 'Paquito', 'Hirara'].includes(r.name)), 'cadangan ban: ' + sb.map((r) => r.name).join(', '));
ok(M.openLanes(['Miya']).join() === 'mid,exp,jungle,roam', 'lane kosong selepas Miya: ' + M.openLanes(['Miya']).join());
const pr = M.predict(['Gusion', 'Belerick', 'Miya', 'Lylia', 'Rafaela'], ['Paquito', 'Hirara', 'Claude', 'Eudora', 'Franco']);
ok(pr >= 25 && pr <= 75, 'ramalan menang dalam julat: ' + pr + '%');
ok(M.predict([], ['Paquito']) === null, 'ramalan null tanpa ally');
const tiers = {};
ok(M.fillTiers(tiers) && tiers.S.length === 6 && tiers.D.length > 0, 'tier list dijana daripada meta: S=' + (tiers.S || []).join(', '));
ok(M.parseList('gusion, X.Borg ; popol and kupa').join('|') === 'Gusion|X.Borg|Popol and Kupa', 'penghuraian senarai hero (alias)');

if (fail) { console.error(`\n${fail} ujian gagal`); process.exit(1); }
console.log('\nSemua ujian data lulus');
