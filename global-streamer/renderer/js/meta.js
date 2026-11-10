/*
 * Global Streamer - enjin meta tournament MLBB.
 * Data: statistik hero setiap tournament (Liquipedia, CC-BY-SA 3.0) dibundel dalam data/meta-data.js
 * dan disegarkan setiap 5 minit daripada data/meta.json di Hosting (fail itu dikemas kini oleh pengumpul pusat).
 * Tiada capaian terus ke Liquipedia daripada klien (mengikut had kadar mereka).
 *
 *   GS.meta.top('pick'|'ban'|'wr'|'pb', { n, lane, role, min })
 *   GS.meta.suggestPick(ctx) / suggestBan(ctx)   ctx = { ally:[], enemy:[], bans:[], lane? }
 *   GS.meta.predict(ally, enemy)                  anggaran % menang pasukan ally
 */
(function () {
  'use strict';
  const GS = window.GS;
  const K = 10; // pemberat awal untuk kadar menang (mengelakkan sampel kecil terlalu berpengaruh)
  const REFRESH_MS = 5 * 60 * 1000;
  const REMOTE = 'https://global-streamer.web.app/data/meta.json';

  const M = (GS.meta = {
    data: null,
    scope: 'latest',
    fetchedAt: 0,
    lastCheck: 0,
    lastError: '',
    source: 'bundle',
  });

  /* ---------- data ---------- */
  function setData(d, source) {
    if (!d || !Array.isArray(d.tournaments)) return false;
    M.data = d;
    M.source = source;
    cache = {};
    GS.emit && GS.emit('meta:updated', M);
    return true;
  }
  let cache = {};

  M.presets = function () {
    const ts = (M.data && M.data.tournaments) || [];
    const out = [{ id: 'latest', label: 'Terkini (semua kecuali sejarah)', f: (t) => t.tier !== 'history' }];
    out.push({ id: 'pro', label: 'Liga serantau (MPL S18)', f: (t) => t.tier === 'pro' });
    out.push({ id: 'intl', label: 'Antarabangsa (MSC)', f: (t) => t.tier === 'intl' });
    [...new Set(ts.filter((t) => t.tier === 'pro').map((t) => t.region))].forEach((r) => out.push({ id: 'r:' + r, label: 'MPL ' + r, f: (t) => t.tier === 'pro' && t.region === r }));
    out.push({ id: 'all', label: 'Semua termasuk sejarah', f: () => true });
    return out;
  };

  M.setScope = function (id) {
    M.scope = id;
    GS.state.metaScope = id;
    GS.save && GS.save();
    GS.emit && GS.emit('meta:updated', M);
  };

  /* ---------- nama hero ---------- */
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  let canonMap = null;
  const ALIAS = { popolkupa: 'Popol and Kupa', popolandkupa: 'Popol and Kupa', chang: "Chang'e", change: "Chang'e", yisunshin: 'Yi Sun-shin', xborg: 'X.Borg', lapulapu: 'Lapu-Lapu' };
  M.canon = function (name) {
    if (!canonMap) {
      canonMap = {};
      (GS.data.mlbbHeroes || []).forEach((x) => { canonMap[norm(x.name)] = x.name; });
    }
    const n = norm(name);
    if (!n) return '';
    return canonMap[n] || ALIAS[n] || '';
  };
  M.parseList = (txt) => String(txt || '').split(/[,;\n]/).map((x) => M.canon(x.trim())).filter(Boolean);

  /* ---------- agregat ---------- */
  M.aggregate = function (scopeId) {
    const id = scopeId || M.scope;
    if (!M.data) return { games: 0, heroes: {}, tournaments: [] };
    const key = id + '|' + M.data.generated;
    if (cache[key]) return cache[key];
    const preset = M.presets().find((p) => p.id === id) || M.presets()[0];
    const ts = M.data.tournaments.filter(preset.f);
    const heroes = {};
    let games = 0;
    const get = (raw) => {
      const name = M.canon(raw) || raw;
      return heroes[name] || (heroes[name] = { name, p: 0, w: 0, l: 0, bn: 0, bw: 0, rn: 0, rw: 0, b: 0, with: {}, vs: {} });
    };
    ts.forEach((t) => {
      games += t.games;
      Object.entries(t.heroes).forEach(([raw, s]) => {
        const h = get(raw);
        ['p', 'w', 'l', 'bn', 'bw', 'rn', 'rw', 'b'].forEach((k) => { h[k] += s[k] || 0; });
        (s.with || []).forEach((x) => { const o = h.with[M.canon(x.name) || x.name] || (h.with[M.canon(x.name) || x.name] = { n: 0, w: 0 }); o.n += x.n; o.w += x.w; });
        (s.vs || []).forEach((x) => { const o = h.vs[M.canon(x.name) || x.name] || (h.vs[M.canon(x.name) || x.name] = { n: 0, w: 0 }); o.n += x.n; o.w += x.w; });
      });
    });
    Object.values(heroes).forEach((h) => {
      h.wr = h.p ? h.w / h.p : 0;
      h.wrS = (h.w + K * 0.5) / (h.p + K);
      h.pickRate = games ? h.p / games : 0;
      h.banRate = games ? h.b / games : 0;
      h.presence = games ? Math.min(1, (h.p + h.b) / games) : 0;
      h.blueWr = h.bn ? h.bw / h.bn : 0;
      h.redWr = h.rn ? h.rw / h.rn : 0;
      const info = GS.hero && GS.hero(h.name);
      h.lanes = info ? info.lanes : [];
      h.roles = info ? info.roles : [];
    });
    const out = { id, games, heroes, tournaments: ts.map((t) => ({ id: t.id, label: t.label, games: t.games, live: t.live })) };
    cache[key] = out;
    return out;
  };

  M.hero = (name) => M.aggregate().heroes[M.canon(name) || name] || null;

  M.top = function (kind, opts) {
    opts = opts || {};
    const a = M.aggregate();
    let list = Object.values(a.heroes);
    if (opts.lane) list = list.filter((h) => h.lanes.includes(opts.lane));
    if (opts.role) list = list.filter((h) => h.roles.includes(opts.role));
    const min = opts.min == null ? 15 : opts.min;
    const keyf = { pick: (h) => h.p, ban: (h) => h.b, pb: (h) => h.p + h.b, wr: (h) => h.wr }[kind] || ((h) => h.p);
    if (kind === 'wr') list = list.filter((h) => h.p >= min);
    return list.sort((x, y) => keyf(y) - keyf(x) || y.p - x.p).slice(0, opts.n || 10);
  };

  /* ---------- lane ---------- */
  /** Lane yang masih kosong bagi pasukan: padanan terbaik hero -> lane. */
  M.openLanes = function (ally) {
    const all = ['gold', 'mid', 'exp', 'jungle', 'roam'];
    const sets = ally.map((n) => (GS.hero(n) || {}).lanes || []).filter((l) => l.length);
    let best = [];
    const rec = (i, used, assigned) => {
      if (assigned.length > best.length) best = assigned.slice();
      if (i >= sets.length) return;
      for (const l of sets[i]) {
        if (!used.has(l)) { used.add(l); assigned.push(l); rec(i + 1, used, assigned); assigned.pop(); used.delete(l); }
      }
      rec(i + 1, used, assigned);
    };
    rec(0, new Set(), []);
    return all.filter((l) => !best.includes(l));
  };

  /* ---------- padanan / lawan ---------- */
  const shr = (o) => (o ? (o.w + 3) / (o.n + 6) : null); // kadar menang dengan pemberat awal
  /** Kadar menang A menentang B (gabungan dua arah). null jika tiada data. */
  function vsRate(A, B) {
    const a = M.aggregate().heroes;
    const x = a[A] && a[A].vs[B];
    const y = a[B] && a[B].vs[A];
    const r = [];
    if (x && x.n) r.push({ v: shr(x), n: x.n });
    if (y && y.n) r.push({ v: 1 - shr(y), n: y.n });
    if (!r.length) return null;
    const n = r.reduce((s, q) => s + q.n, 0);
    return { v: r.reduce((s, q) => s + q.v * q.n, 0) / n, n };
  }
  function synRate(A, B) {
    const a = M.aggregate().heroes;
    const x = a[A] && a[A].with[B];
    const y = a[B] && a[B].with[A];
    const r = [];
    if (x && x.n) r.push({ v: shr(x), n: x.n });
    if (y && y.n) r.push({ v: shr(y), n: y.n });
    if (!r.length) return null;
    const n = r.reduce((s, q) => s + q.n, 0);
    return { v: r.reduce((s, q) => s + q.v * q.n, 0) / n, n };
  }
  const pct = (x) => Math.round(x * 100) + '%';

  /* ---------- cadangan ---------- */
  function taken(ctx) { return new Set([].concat(ctx.ally || [], ctx.enemy || [], ctx.bans || [])); }

  M.suggestPick = function (ctx) {
    const a = M.aggregate();
    if (!a.games) return [];
    const used = taken(ctx);
    const open = M.openLanes(ctx.ally || []);
    const want = ctx.lane ? [ctx.lane] : open;
    const out = [];
    Object.values(a.heroes).forEach((h) => {
      if (used.has(h.name) || (h.p < 3 && h.b < 3) || !(GS.hero && GS.hero(h.name))) return;
      let score = 100 * (h.wrS - 0.5) + 20 * h.presence;
      const why = [`WR ${pct(h.wr)} (${h.p} game)`, `Kehadiran ${pct(h.presence)}`];
      let cSum = 0, cN = 0;
      (ctx.enemy || []).forEach((e) => { const r = vsRate(h.name, e); if (r) { cSum += 60 * (r.v - 0.5); cN++; if (r.v >= 0.55) why.push(`Counter ${e} ${pct(r.v)}`); else if (r.v <= 0.45) why.push(`Lemah vs ${e} ${pct(r.v)}`); } });
      let sSum = 0;
      (ctx.ally || []).forEach((m) => { const r = synRate(h.name, m); if (r) { sSum += 50 * (r.v - 0.5); if (r.v >= 0.55) why.push(`Padan dgn ${m} ${pct(r.v)}`); } });
      score += cSum + sSum;
      if (want.length) {
        if (h.lanes.some((l) => want.includes(l))) { score += 6; why.push('Lane ' + h.lanes.filter((l) => want.includes(l)).join('/') + ' kosong'); } else score -= 6;
      }
      out.push({ name: h.name, score: Math.round(score * 10) / 10, why });
    });
    return out.sort((x, y) => y.score - x.score).slice(0, ctx.n || 5);
  };

  M.suggestBan = function (ctx) {
    const a = M.aggregate();
    if (!a.games) return [];
    const used = taken(ctx);
    const out = [];
    Object.values(a.heroes).forEach((h) => {
      if (used.has(h.name) || (h.p < 3 && h.b < 3)) return;
      let score = 100 * (h.wrS - 0.5) + 30 * h.presence + 10 * h.banRate;
      const why = [`WR ${pct(h.wr)} (${h.p} game)`, `Kehadiran ${pct(h.presence)}`, `Ban ${pct(h.banRate)}`];
      (ctx.ally || []).forEach((m) => { const r = vsRate(h.name, m); if (r) { score += 50 * (r.v - 0.5); if (r.v >= 0.55) why.push(`Counter ${m} ${pct(r.v)}`); } });
      (ctx.enemy || []).forEach((e) => { const r = synRate(h.name, e); if (r) { score += 40 * (r.v - 0.5); if (r.v >= 0.55) why.push(`Padan dgn ${e} ${pct(r.v)}`); } });
      out.push({ name: h.name, score: Math.round(score * 10) / 10, why });
    });
    return out.sort((x, y) => y.score - x.score).slice(0, ctx.n || 5);
  };

  /** Anggaran % menang pasukan ally (50 = seimbang). BUKAN jaminan; hanya berasaskan statistik meta. */
  M.predict = function (ally, enemy) {
    const a = M.aggregate();
    const A = ally.filter(Boolean), E = enemy.filter(Boolean);
    if (!a.games || !A.length || !E.length) return null;
    const hs = a.heroes;
    const team = (T) => T.reduce((s, n) => s + ((hs[n] ? hs[n].wrS : 0.5) - 0.5), 0) / T.length;
    let adv = team(A) - team(E);
    let c = 0, cn = 0;
    A.forEach((x) => E.forEach((y) => { const r = vsRate(x, y); if (r) { c += r.v - 0.5; cn++; } }));
    if (cn) adv += c / cn;
    return Math.max(25, Math.min(75, Math.round(50 + adv * 100)));
  };

  /** Isi tier list S..D mengikut skor meta (kadar menang + kehadiran). Hanya hero dengan sampel mencukupi. */
  M.fillTiers = function (t) {
    const a = M.aggregate();
    const rows = Object.values(a.heroes).filter((h) => h.p >= 8 && GS.hero(h.name)).map((h) => ({ n: h.name, s: 100 * (h.wrS - 0.5) + 25 * h.presence })).sort((x, y) => y.s - x.s);
    if (rows.length < 10) return false;
    const cut = [[0, 6], [6, 14], [14, 24], [24, 34], [34, 44]];
    ['S', 'A', 'B', 'C', 'D'].forEach((k, i) => { t[k] = rows.slice(cut[i][0], cut[i][1]).map((r) => r.n); });
    const p = M.presets().find((x) => x.id === M.scope);
    t.label = 'TIER META · ' + (p ? p.label.replace(/\s*\(.*\)/, '') : '');
    return true;
  };

  /* ---------- masa ---------- */
  M.ageText = function () {
    const g = M.data && M.data.generated;
    if (!g) return GS.t('tiada data');
    const mins = Math.max(0, Math.round((Date.now() - Date.parse(g)) / 60000));
    if (mins < 2) return GS.t('baru sahaja');
    if (mins < 90) return GS.t('{0} minit lalu', mins);
    if (mins < 60 * 36) return GS.t('{0} jam lalu', Math.round(mins / 60));
    return GS.t('{0} hari lalu', Math.round(mins / 1440));
  };

  /* ---------- segar semula ---------- */
  M.refresh = async function () {
    M.lastCheck = Date.now();
    const urls = [];
    if (/^https?:$/.test(location.protocol)) urls.push(new URL('data/meta.json', location.href).href);
    urls.push(REMOTE);
    for (const u of [...new Set(urls)]) {
      try {
        const res = await fetch(u + '?t=' + Math.floor(Date.now() / REFRESH_MS), { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const d = await res.json();
        M.lastError = '';
        M.fetchedAt = Date.now();
        if (!M.data || Date.parse(d.generated) > Date.parse(M.data.generated)) setData(d, u);
        else GS.emit && GS.emit('meta:updated', M);
        return true;
      } catch (e) { M.lastError = String(e && e.message || e); }
    }
    GS.emit && GS.emit('meta:updated', M);
    return false;
  };

  M.start = function () {
    setData(GS.data.metaBundled, 'bundle');
    M.scope = (GS.state && GS.state.metaScope) || 'latest';
    if (!M.presets().some((p) => p.id === M.scope)) M.scope = 'latest';
    M.refresh();
    setInterval(() => { if (!document.hidden) M.refresh(); }, REFRESH_MS);
  };
})();
