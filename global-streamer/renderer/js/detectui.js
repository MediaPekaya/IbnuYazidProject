/* Global Streamer - panel pengesan hero automatik (dalam tab Draft): status, sumber, kepekaan, pratonton + kalibrasi ROI,
 * kad setiap slot dengan cadangan hero (klik untuk membetulkan dan mengajar sistem), imej ujian. */
(function () {
  'use strict';
  const { h } = GS;
  const D = GS.detect;
  const ui = (GS.detectui = {});

  const KEYS = [].concat(['ally', 'enemy', 'banAlly', 'banEnemy'].map((g) => [0, 1, 2, 3, 4].map((i) => g + i)).flat());
  const LABEL = { ally: 'Ally', enemy: 'Enemy', banAlly: 'Ban A', banEnemy: 'Ban E' };
  const short = (k) => LABEL[k.replace(/\d+$/, '')] + ' ' + (Number(k.match(/\d+$/)[0]) + 1);
  const pct = (x) => Math.round(x * 100) + '%';

  function current(key) {
    const d = GS.state.draft, g = key.replace(/\d+$/, ''), i = Number(key.match(/\d+$/)[0]);
    if (g === 'ally') return d.ally[i] || '';
    if (g === 'enemy') return d.enemy[i] || '';
    return D.settings().bans[g][i] || '';
  }

  function statusText() {
    const S = D.state, st = D.settings();
    if (!st.enabled) return GS.t('Pengesan dimatikan.');
    if (S.status === 'loading') return GS.t('Memuat ikon hero…');
    if (S.status === 'nosource') return GS.t('Tiada sumber capture card yang aktif. Sambung capture card pada sumber Game, atau muat imej ujian.');
    if (S.status === 'nosignal') return GS.t('Tiada isyarat video.');
    if (S.status === 'draft') return GS.t('Skrin draft dikesan · {0} slot diterima ({1} kuat) · imbasan {2} ms', Object.keys(S.accepted).length, S.strong, Math.round(S.ms));
    return GS.t('Mencari skrin draft… belum dikesan. ({0} ms setiap imbasan)', Math.round(S.ms));
  }

  ui.section = function () {
    const st = D.settings();
    const wrap = h('div', { class: 'gd-sec det' }, h('h4', null, 'Pengesan hero automatik (daripada capture card)'));
    const status = h('div', { class: 'callout slim det-status' });
    const grid = h('div', { class: 'det-grid' });
    const prev = h('canvas', { class: 'det-prev', width: 480, height: 220 });
    const learned = h('span', { class: 'muted' });
    const srcSel = h('select', { onChange: (e) => { st.sourceId = e.target.value; GS.save(); } });
    const fillSources = () => {
      srcSel.innerHTML = '';
      srcSel.append(h('option', { value: 'auto', selected: st.sourceId === 'auto' }, GS.t('Auto (sumber Game / capture card)')));
      D.sources().forEach((s) => srcSel.append(h('option', { value: s.id, selected: st.sourceId === s.id }, s.name)));
    };
    fillSources();

    const slider = (label, get, set, min, max, step) => {
      const val = h('b', null, String(get()));
      const inp = h('input', { type: 'range', min, max, step, value: get(), onInput: (e) => { set(Number(e.target.value)); val.textContent = String(get()); GS.save(); } });
      return h('label', { class: 'field' }, h('span', null, label, ' ', val), inp);
    };
    const check = (key, label) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!st[key], onChange: (e) => { st[key] = e.target.checked; GS.save(); } }), label);

    const fileIn = h('input', { type: 'file', accept: 'image/*', class: 'hidden', onChange: (e) => {
      const f = e.target.files[0]; if (!f) return;
      const url = URL.createObjectURL(f); const im = new Image();
      im.onload = () => { D.setTestImage(im); if (!st.enabled) D.setEnabled(true); else D.tick(); draw(); GS.toast(GS.t('Imej ujian dimuat. Pengesan kini membaca imej ini.'), 'ok'); };
      im.src = url; e.target.value = '';
    } });

    const calib = h('details', { class: 'det-calib' }, h('summary', null, 'Kalibrasi kawasan (jika peranti/skrin anda berbeza)'));
    [['ally', 'Slot Ally (kiri)'], ['enemy', 'Slot Enemy (kanan)'], ['banAlly', 'Ban Ally'], ['banEnemy', 'Ban Enemy']].forEach(([g, label]) => {
      const a = () => st.adj[g];
      calib.append(h('div', { class: 'det-adj' }, h('b', null, label),
        slider('X', () => a().dx, (v) => { a().dx = v; }, -0.1, 0.1, 0.002),
        slider('Y', () => a().dy, (v) => { a().dy = v; }, -0.1, 0.1, 0.002),
        slider('Skala', () => a().s, (v) => { a().s = v; }, 0.6, 1.5, 0.01)));
    });
    calib.append(h('button', { class: 'btn tiny ghost', onClick: () => { st.adj = null; D.settings(); GS.save(); draw(); ui.refreshAll && ui.refreshAll(); } }, 'Tetapkan semula kalibrasi'));

    wrap.append(
      status,
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!st.enabled, onChange: (e) => D.setEnabled(e.target.checked) }), 'Hidupkan pengesan hero automatik'),
      h('label', { class: 'field' }, h('span', null, 'Sumber video'), srcSel),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn ghost', onClick: () => fileIn.click() }, 'Uji dengan imej / tangkapan skrin…'),
        h('button', { class: 'btn ghost', onClick: () => { D.setTestImage(null); draw(); } }, 'Guna capture card semula'), fileIn),
      slider(GS.t('Kepekaan (lebih tinggi = lebih banyak diterima, lebih mudah silap)'), () => st.sensitivity, (v) => { st.sensitivity = v; }, 0, 1, 0.05),
      h('label', { class: 'field' }, h('span', null, 'Kekerapan imbasan'), h('select', { onChange: (e) => { st.interval = Number(e.target.value); GS.save(); D.start(); } },
        [[500, '0.5 s'], [1000, '1 s'], [2000, '2 s']].map(([v, l]) => h('option', { value: v, selected: st.interval === v }, l)))),
      check('autoShow', 'Papar widget draft secara automatik apabila draft dikesan'),
      check('autoPredict', 'Kira ramalan menang daripada meta secara automatik'),
      check('autoPhase', 'Kemas kini fasa draft secara automatik'),
      check('lockManual', 'Slot yang saya isi/betulkan sendiri tidak ditimpa pengesan'),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn ghost', onClick: () => { D.unlockAll(); GS.toast(GS.t('Semua slot dibuka kunci.'), 'ok'); } }, 'Buka kunci semua slot'),
        h('button', { class: 'btn ghost', onClick: () => { D.resetDraft(); draw(); } }, 'Draft baharu (kosongkan semua)')),
      h('div', { class: 'det-prevwrap' }, prev),
      h('p', { class: 'muted note' }, 'Kotak hijau = hero disahkan, kuning = diterima tetapi belum stabil, kelabu = tidak yakin. Klik nama cadangan pada kad di bawah untuk membetulkan slot; sistem akan mengingati rupa potret itu (disimpan pada PC ini).'),
      grid, learned,
      h('div', { class: 'btn-row' }, h('button', { class: 'btn tiny ghost', onClick: async () => { if (await GS.ask(GS.t('Padam semua templat yang dipelajari?'), { danger: true })) { D.clearLearned(); draw(); } } }, 'Padam pembelajaran')),
      calib);

    const cards = {};
    KEYS.forEach((k) => {
      const cv = h('canvas', { width: 56, height: 56 });
      const name = h('b', null, '');
      const sug = h('div', { class: 'det-sug' });
      const bar = h('i', { class: 'det-bar' });
      cards[k] = { el: h('div', { class: 'det-card' }, h('span', { class: 'det-k ' + (/^(ally|banAlly)/.test(k) ? 'side-ally' : 'side-enemy') }, short(k)), cv, name, bar, sug), cv, name, sug, bar };
      grid.append(cards[k].el);
    });

    function draw() {
      const S = D.state;
      status.innerHTML = '';
      status.append(statusText());
      status.className = 'callout slim det-status' + (S.status === 'draft' ? ' ok' : '');
      learned.textContent = GS.t('Templat dipelajari: {0}', D.learnedCount());
      const sk = D.snap.width && S.W ? D.snap.width / S.W : 0;
      // pratonton + kotak ROI
      const pc = prev.getContext('2d');
      pc.clearRect(0, 0, prev.width, prev.height);
      if (D.snap.width && S.rects) {
        const k = Math.min(prev.width / D.snap.width, prev.height / D.snap.height);
        prev.height = Math.round(D.snap.height * (prev.width / D.snap.width));
        const kk = prev.width / D.snap.width;
        pc.drawImage(D.snap, 0, 0, prev.width, prev.height);
        pc.lineWidth = 2; pc.font = '10px sans-serif';
        KEYS.forEach((key) => {
          const r = S.rects[key]; if (!r) return;
          const s = S.slots[key], cur = current(key);
          pc.strokeStyle = s && cur && cur === s.name ? '#3be39a' : s && S.accepted[key] ? '#ffd36b' : 'rgba(180,190,210,0.7)';
          pc.strokeRect(r.x * sk * kk, r.y * sk * kk, r.w * sk * kk, r.h * sk * kk);
        });
        void k;
      } else { pc.fillStyle = 'rgba(255,255,255,0.05)'; pc.fillRect(0, 0, prev.width, prev.height); pc.fillStyle = '#8aa2c4'; pc.font = '13px sans-serif'; pc.fillText(GS.t('Tiada bingkai lagi'), 14, 26); }
      // kad slot
      KEYS.forEach((key) => {
        const c = cards[key], s = S.slots[key], r = S.rects && S.rects[key], cur = current(key), locked = D.settings().locks[key] || D.settings().locks[key.replace(/\d+$/, '')];
        const cx = c.cv.getContext('2d');
        cx.clearRect(0, 0, 56, 56);
        if (r && sk) cx.drawImage(D.snap, r.x * sk, r.y * sk, r.w * sk, r.h * sk, 0, 0, 56, 56);
        c.name.textContent = cur || (s && S.accepted[key] ? '…' : '—');
        c.el.className = 'det-card' + (cur ? ' ok' : s && S.accepted[key] ? ' pend' : '') + (locked ? ' lock' : '');
        c.bar.style.width = s ? Math.round(s.conf * 100) + '%' : '0%';
        c.sug.innerHTML = '';
        if (s && S.status !== 'idle' || (s && S.status === 'idle' && D.testImage)) {
          s.top.slice(0, 3).forEach((t) => c.sug.append(h('button', { class: 'det-chip' + (t.name === cur ? ' on' : ''), title: GS.t('Betul: {0} (ajar sistem)', t.name), onClick: () => { D.correct(key, t.name, true); draw(); } }, t.name + ' ' + pct(t.score))));
        }
      });
    }
    ui.refreshAll = draw;
    wrap._draw = draw;
    draw();
    let timer = setInterval(() => { if (!wrap.isConnected) { clearInterval(timer); return; } draw(); }, 700);
    return wrap;
  };
})();
