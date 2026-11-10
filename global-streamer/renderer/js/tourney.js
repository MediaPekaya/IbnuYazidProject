/*
 * Global Streamer - tournament automatik: perlawanan semasa/akan datang/keputusan, pemenang dan kedudukan akhir.
 * Data: data/matches.json + data/tournaments-info.json (Liquipedia, CC-BY-SA 3.0), dibundel dalam data/tourney-data.js dan
 * disegarkan setiap 5 minit daripada Hosting. Fail itu dikemas kini oleh pengumpul pusat (tiada panggilan terus ke Liquipedia).
 * Perlawanan semasa dipilih secara automatik daripada jadual: sedang berlangsung > akan bermula dalam 90 minit > baru tamat (3 jam).
 *
 *   GS.tourney.current()   GS.tourney.live()   GS.tourney.upcoming(n)   GS.tourney.recent(n)   GS.tourney.champions()
 *   GS.tourney.labels()    -> { ally, enemy, auto } untuk widget draft
 */
(function () {
  'use strict';
  const GS = window.GS;
  const REFRESH_MS = 5 * 60 * 1000;
  const REMOTE = 'https://global-streamer.web.app/data/';
  const T = (GS.tourney = { matches: [], info: [], generated: '', source: 'bundle', lastError: '', fetchedAt: 0 });

  const cfg = () => {
    const s = GS.state.tourney || (GS.state.tourney = {});
    if (!s.filter) s.filter = 'pro';
    if (s.autoLabels == null) s.autoLabels = false;
    if (s.swap == null) s.swap = false;
    if (s.pin == null) s.pin = '';
    return s;
  };
  T.settings = cfg;

  /* ---------- data ---------- */
  function setData(matches, info, source) {
    if (matches && Array.isArray(matches.matches)) { T.matches = matches.matches; T.generated = matches.generated || T.generated; }
    if (info && Array.isArray(info.tournaments)) T.info = info.tournaments;
    T.source = source;
    GS.emit && GS.emit('tourney:updated', T);
  }
  const key = (m) => m.ts + '|' + m.teams[0].name + '|' + m.teams[1].name;
  T.key = key;
  const isTBD = (m) => m.teams.some((t) => /^TBD$/i.test(t.short) || /^TBD$/i.test(t.name));

  /** Keadaan perlawanan mengikut jam semasa: live | upcoming | finished | stale (tidak dikemas kini). */
  T.stateOf = function (m, now) {
    now = now || Date.now();
    if (m.done) return 'finished';
    if (m.ts * 1000 > now) return 'upcoming';
    return now - m.ts * 1000 > 12 * 3600 * 1000 ? 'stale' : 'live';
  };

  const pro = (m) => m.tournament.series !== 'OTHER';
  T.list = function (now) {
    const f = cfg().filter;
    return T.matches.filter((m) => f === 'all' || pro(m)).map((m) => Object.assign({ state: T.stateOf(m, now) }, m));
  };
  T.live = (now) => T.list(now).filter((m) => m.state === 'live').sort((a, b) => a.ts - b.ts);
  T.upcoming = (n, now) => T.list(now).filter((m) => m.state === 'upcoming').sort((a, b) => a.ts - b.ts).slice(0, n || 8);
  T.recent = (n, now) => T.list(now).filter((m) => m.state === 'finished').sort((a, b) => b.ts - a.ts).slice(0, n || 8);

  /** Perlawanan semasa (automatik, atau yang disematkan). */
  T.current = function (now) {
    now = now || Date.now();
    const s = cfg();
    if (s.pin) { const p = T.matches.find((m) => key(m) === s.pin); if (p) return Object.assign({ state: T.stateOf(p, now), pinned: true }, p); }
    const live = T.live(now);
    if (live.length) return live[0];
    const next = T.upcoming(20, now).filter((m) => !isTBD(m) && m.ts * 1000 - now <= 90 * 60 * 1000)[0];
    if (next) return next;
    const done = T.recent(5, now).filter((m) => now - m.ts * 1000 <= 3 * 3600 * 1000)[0];
    return done || null;
  };

  T.countdown = function (m, now) {
    now = now || Date.now();
    let s = Math.round((m.ts * 1000 - now) / 1000);
    if (s <= 0) return '';
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const mi = Math.floor(s / 60);
    s -= mi * 60;
    return d ? `${d}d ${h}h` : h ? `${h}h ${mi}m` : mi ? `${mi}m ${s}s` : `${s}s`;
  };

  /** Pemenang tournament yang sudah tamat: juara, naib juara, kelayakan. */
  T.champions = function () {
    const today = Date.now();
    // hanya tournament yang sudah TAMAT (tarikh akhir telah lalu) dan ada juara sebenar (bukan TBD)
    return T.info.filter((t) => t.placements && t.placements.length && t.end && Date.parse(t.end + 'T23:59:59Z') <= today && !/^TBD$/i.test((t.placements.find((p) => p.place === '1') || {}).team || 'TBD')).map((t) => ({
      page: t.page, name: t.name || t.page, end: t.end, tier: t.tier, prize: t.prize,
      champion: (t.placements.find((p) => p.place === '1') || {}).team || '',
      runnerUp: (t.placements.find((p) => p.place === '2') || {}).team || '',
      placements: t.placements.slice(0, 4),
      qualified: t.placements.filter((p) => p.qualified),
    })).sort((a, b) => (a.end < b.end ? 1 : -1));
  };

  /** Label ALLY/ENEMY untuk widget draft (nama pasukan daripada perlawanan semasa). */
  T.labels = function () {
    const s = cfg();
    const c = s.autoLabels ? T.current() : null;
    if (!c || isTBD(c)) return { ally: 'ALLY', enemy: 'ENEMY', auto: false };
    const a = c.teams[s.swap ? 1 : 0], e = c.teams[s.swap ? 0 : 1];
    return { ally: a.short.toUpperCase(), enemy: e.short.toUpperCase(), auto: true };
  };

  T.ageText = function () {
    if (!T.generated) return GS.t('tiada data');
    const mins = Math.max(0, Math.round((Date.now() - Date.parse(T.generated)) / 60000));
    if (mins < 2) return GS.t('baru sahaja');
    if (mins < 90) return GS.t('{0} minit lalu', mins);
    if (mins < 60 * 36) return GS.t('{0} jam lalu', Math.round(mins / 60));
    return GS.t('{0} hari lalu', Math.round(mins / 1440));
  };

  /* ---------- segar semula ---------- */
  T.refresh = async function () {
    const bases = [];
    if (/^https?:$/.test(location.protocol)) bases.push(new URL('data/', location.href).href);
    bases.push(REMOTE);
    for (const b of [...new Set(bases)]) {
      try {
        const q = '?t=' + Math.floor(Date.now() / REFRESH_MS);
        const [r1, r2] = await Promise.all([fetch(b + 'matches.json' + q, { cache: 'no-store' }), fetch(b + 'tournaments-info.json' + q, { cache: 'no-store' })]);
        if (!r1.ok) throw new Error('HTTP ' + r1.status);
        const m = await r1.json();
        const i = r2.ok ? await r2.json() : null;
        T.lastError = ''; T.fetchedAt = Date.now();
        if (!T.generated || Date.parse(m.generated) >= Date.parse(T.generated)) setData(m, i, b);
        else GS.emit && GS.emit('tourney:updated', T);
        return true;
      } catch (e) { T.lastError = String((e && e.message) || e); }
    }
    GS.emit && GS.emit('tourney:updated', T);
    return false;
  };

  T.start = function () {
    const b = GS.data && GS.data.tourneyBundled;
    if (b) setData(b.matches, b.info, 'bundle');
    cfg();
    T.refresh();
    setInterval(() => { if (!document.hidden) T.refresh(); }, REFRESH_MS);
  };
})();
