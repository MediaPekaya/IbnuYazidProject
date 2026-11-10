/* Global Streamer - tab "Turnamen": perlawanan semasa (dipilih automatik), jadual, keputusan dan juara. */
(function () {
  'use strict';
  const { h } = GS;
  const T = GS.tourney;
  const ui = (GS.tourneyui = {});

  const fmtTime = (ts) => new Date(ts * 1000).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  const teamLine = (m) => m.teams.map((t) => t.short).join('  vs  ');

  function matchCard(m, opts) {
    opts = opts || {};
    const a = m.teams[0], b = m.teams[1];
    const score = a.score == null ? 'VS' : a.score + ' : ' + b.score;
    const stateTxt = m.state === 'live' ? 'LIVE' : m.state === 'finished' ? GS.t('TAMAT') : m.state === 'upcoming' ? GS.t('Mula dalam {0}', T.countdown(m)) : GS.t('Tidak dikemas kini');
    return h('div', { class: 'tm-card ' + m.state + (opts.cur ? ' cur' : '') },
      h('div', { class: 'tm-top' }, h('span', { class: 'tm-st' }, stateTxt), h('span', { class: 'muted' }, m.tournament.name + (m.bo ? ' · Bo' + m.bo : ''))),
      h('div', { class: 'tm-teams' },
        h('b', { class: m.done && m.winner === 1 ? 'dim' : '' }, a.name),
        h('span', { class: 'tm-score' }, score),
        h('b', { class: m.done && m.winner === 0 ? 'dim' : '' }, b.name)),
      h('div', { class: 'muted small' }, fmtTime(m.ts)));
  }

  ui.page = function (root) {
    const st = T.settings();
    const status = h('div', { class: 'callout slim' });
    const body = h('div', { class: 'meta-body' });
    const filterRow = h('div', { class: 'subtabs wrap' }, [['pro', 'Pro (MPL, MSC, M-series)'], ['all', 'Semua tournament']].map(([v, l]) =>
      h('button', { class: 'subtab' + (st.filter === v ? ' on' : ''), onClick: (e) => { st.filter = v; GS.save(); GS.$$('.subtab', filterRow).forEach((b) => b.classList.toggle('on', b === e.currentTarget)); draw(); } }, l)));
    const pinSel = h('select', { onChange: (e) => { st.pin = e.target.value; GS.save(); draw(); } });

    function draw() {
      status.innerHTML = '';
      status.append(h('span', { html: GS.icon('trophy', 14) }), ' ' + GS.t('{0} perlawanan · dikemas kini {1}', T.matches.length, T.ageText()) + (T.source === 'bundle' ? ' · ' + GS.t('data dalam app') : ' · ' + GS.t('data dalam talian')));
      const cur = T.current();
      // pilihan sematan
      pinSel.innerHTML = '';
      pinSel.append(h('option', { value: '' }, GS.t('Automatik (ikut jadual)')));
      T.list().filter((m) => m.state !== 'stale').sort((a, b) => b.ts - a.ts).slice(0, 40).forEach((m) => pinSel.append(h('option', { value: T.key(m), selected: st.pin === T.key(m) }, fmtTime(m.ts) + ' · ' + teamLine(m))));
      body.innerHTML = '';
      body.append(h('div', { class: 'gd-sec' }, h('h4', null, 'Perlawanan semasa'),
        cur ? matchCard(cur, { cur: true }) : h('div', { class: 'placeholder' }, GS.t('Tiada perlawanan sedang berlangsung atau bermula dalam 90 minit.')),
        h('label', { class: 'field' }, h('span', null, 'Pilih perlawanan'), pinSel),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn primary', onClick: () => GS.scenes.addWidget('matchboard') }, 'Papar papan perlawanan pada siaran'),
          h('button', { class: 'btn ghost', onClick: () => GS.scenes.addWidget('resultsboard') }, 'Papar keputusan & juara')),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!st.autoLabels, onChange: (e) => { st.autoLabels = e.target.checked; GS.save(); } }), 'Guna nama pasukan pada widget draft (ganti ALLY / ENEMY)'),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!st.swap, onChange: (e) => { st.swap = e.target.checked; GS.save(); draw(); } }), 'Tukar sisi (pasukan pertama = ENEMY)')));
      const live = T.live();
      if (live.length) body.append(h('div', { class: 'gd-sec' }, h('h4', null, 'Sedang berlangsung'), live.map((m) => matchCard(m))));
      const up = T.upcoming(8);
      body.append(h('div', { class: 'gd-sec' }, h('h4', null, 'Seterusnya'), up.length ? up.map((m) => matchCard(m)) : h('div', { class: 'placeholder' }, 'Tiada perlawanan akan datang dalam data.')));
      const rec = T.recent(8);
      body.append(h('div', { class: 'gd-sec' }, h('h4', null, 'Keputusan terkini'), rec.length ? rec.map((m) => matchCard(m)) : h('div', { class: 'placeholder' }, 'Belum ada keputusan.')));
      const ch = T.champions();
      body.append(h('div', { class: 'gd-sec' }, h('h4', null, 'Juara tournament'), ch.length ? ch.map((c) => h('div', { class: 'tm-champ' },
        h('b', null, c.name), h('span', { class: 'muted small' }, GS.t('Tamat {0}', c.end)),
        h('div', { class: 'tm-pl' }, c.placements.map((p) => h('span', { class: 'ev-chip' + (p.place === '1' ? ' gold' : '') }, p.place + '. ' + p.team + (p.qualified ? ' → ' + p.qualified : '')))))) : h('div', { class: 'placeholder' }, 'Belum ada tournament yang tamat dalam data.')));
    }

    root.append(status, filterRow, h('div', { class: 'btn-row' },
      h('button', { class: 'btn ghost', onClick: async (e) => { e.currentTarget.disabled = true; const ok = await T.refresh(); e.currentTarget.disabled = false; GS.toast(ok ? GS.t('Data tournament disemak: {0}', T.ageText()) : GS.t('Tidak dapat menyemak data dalam talian. Guna data dalam app.'), ok ? 'ok' : 'warn'); } }, 'Semak kemas kini sekarang')),
      body,
      h('p', { class: 'muted note' }, 'Perlawanan semasa dipilih automatik daripada jadual (sedang berlangsung, kemudian yang bermula dalam 90 minit, kemudian yang baru tamat). App menyemak data setiap 5 minit; data itu dikemas kini oleh pengumpul pusat (Liquipedia, CC-BY-SA 3.0), bukan terus daripada app anda, jadi skor langsung mungkin lewat beberapa minit.'));
    draw();
    const off = GS.on('tourney:updated', () => { if (!root.isConnected) { off(); return; } draw(); });
    const timer = setInterval(() => { if (!root.isConnected) { clearInterval(timer); return; } draw(); }, 15000);
  };
})();
