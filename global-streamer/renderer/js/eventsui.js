/* Global Streamer - tab "Auto": pengesan kejadian (kill, death, item, victory, defeat). */
(function () {
  'use strict';
  const { h } = GS;
  const E = GS.events;
  const D = GS.detect;
  const ui = (GS.eventsui = {});
  const TYPE = { kill: 'KILL', death: 'MATI', item: 'ITEM', fullitem: 'ITEM PENUH', victory: 'VICTORY', defeat: 'DEFEAT', newmatch: 'PERLAWANAN BARU' };
  const ROI_COL = { kills: '#ffd36b', deaths: '#ff3b5c', assists: '#6be6ff', toastIcon: '#3be39a', result: '#9a7bff' };

  ui.page = function (root) {
    const st = E.settings();
    const status = h('div', { class: 'callout slim det-status' });
    const read = h('div', { class: 'ev-read' });
    const logBox = h('div', { class: 'ev-log' });
    const prev = h('canvas', { class: 'det-prev', width: 480, height: 220 });
    const slider = (label, get, set, min, max, step, after) => {
      const val = h('b', null, String(get()));
      return h('label', { class: 'field' }, h('span', null, label, ' ', val), h('input', { type: 'range', min, max, step, value: get(), onInput: (e) => { set(Number(e.target.value)); val.textContent = String(get()); GS.save(); if (after) after(); } }));
    };
    const check = (key, label) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!st[key], onChange: (e) => { st[key] = e.target.checked; GS.save(); if (key === 'items' && e.target.checked) E.start(); } }), label);

    const fileIn = h('input', { type: 'file', accept: 'image/*', class: 'hidden', onChange: (e) => {
      const f = e.target.files[0]; if (!f) return;
      const im = new Image();
      im.onload = () => { D.setTestImage(im); if (!st.enabled) E.setEnabled(true); E.tick(im); draw(); GS.toast(GS.t('Imej ujian dimuat. Pengesan kini membaca imej ini.'), 'ok'); };
      im.src = URL.createObjectURL(f); e.target.value = '';
    } });

    const calib = h('details', { class: 'det-calib' }, h('summary', null, 'Kalibrasi kawasan HUD (jika peranti/skrin anda berbeza)'));
    [['adjHud', 'Nombor K/D/A (kanan atas)'], ['adjToast', 'Ikon toast pembelian item']].forEach(([k, label]) => {
      calib.append(h('div', { class: 'det-adj' }, h('b', null, label),
        slider('X', () => st[k].dx, (v) => { st[k].dx = v; }, -0.08, 0.08, 0.002, draw),
        slider('Y', () => st[k].dy, (v) => { st[k].dy = v; }, -0.08, 0.08, 0.002, draw),
        slider('Skala', () => st[k].s, (v) => { st[k].s = v; }, 0.6, 1.6, 0.01, draw)));
    });

    root.append(
      h('div', { class: 'gd-sec det' }, h('h4', null, 'Pengesan kejadian (kill, item, victory, defeat)'),
        status,
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!st.enabled, onChange: (e) => E.setEnabled(e.target.checked) }), 'Hidupkan pengesan kejadian automatik'),
        check('kills', 'Kill dan Mati (baca nombor K/D/A pada HUD)'),
        check('items', 'Item dibeli + Item Penuh (toast pembelian)'),
        check('results', 'Victory / Defeat (skrin keputusan)'),
        slider(GS.t('Kepekaan (lebih tinggi = lebih mudah dicetus, lebih mudah silap)'), () => st.sensitivity, (v) => { st.sensitivity = v; }, 0, 1, 0.05),
        slider(GS.t('Tetingkap multi-kill (saat)'), () => st.window, (v) => { st.window = v; }, 4, 20, 1),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn ghost', onClick: () => fileIn.click() }, 'Uji dengan imej / tangkapan skrin…'),
          h('button', { class: 'btn ghost', onClick: () => { D.setTestImage(null); draw(); } }, 'Guna capture card semula'), fileIn),
        read, prev),
      h('div', { class: 'gd-sec' }, h('h4', null, 'Kejadian terkini'), logBox,
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn tiny ghost', onClick: () => { E.reset(); draw(); } }, 'Perlawanan baharu (tetapkan semula K/D/A dan item)'))),
      h('div', { class: 'gd-sec' }, h('h4', null, 'Ajar skrin keputusan'),
        h('p', { class: 'muted note' }, 'Jika Victory/Defeat pada game anda tidak dikesan, klik butang sebaik sahaja skrin itu dipaparkan supaya sistem mengingati rupanya (disimpan pada PC ini).'),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn ghost', onClick: () => GS.toast(E.learnResult('victory') ? GS.t('Skrin Victory diajar.') : GS.t('Tiada bingkai untuk diajar.'), 'ok') }, 'Ajar: ini skrin VICTORY'),
          h('button', { class: 'btn ghost', onClick: () => GS.toast(E.learnResult('defeat') ? GS.t('Skrin Defeat diajar.') : GS.t('Tiada bingkai untuk diajar.'), 'ok') }, 'Ajar: ini skrin DEFEAT'),
          h('button', { class: 'btn tiny ghost', onClick: () => { E.clearLearnedResults(); GS.toast(GS.t('Pembelajaran keputusan dipadam.'), 'ok'); } }, 'Padam pembelajaran')),
        calib),
      h('p', { class: 'muted note' }, 'Cetus manual untuk ujian: tab Kawalan. Pengesan memicu efek yang sama (Kill, Mati, Victory, Defeat, Beli Item, Item Penuh), dan kiraan W/L bertambah secara automatik apabila Victory/Defeat dikesan.'));

    function draw() {
      const S = E.state;
      status.innerHTML = '';
      const txt = !st.enabled ? GS.t('Pengesan dimatikan.')
        : S.status === 'nosource' ? GS.t('Tiada sumber capture card yang aktif. Sambung capture card pada sumber Game, atau muat imej ujian.')
        : S.status === 'nosignal' ? GS.t('Tiada isyarat video.')
        : S.status === 'loading' ? GS.t('Memuat ikon item…')
        : GS.t('Mengimbas · {0} ms setiap imbasan', Math.round(S.ms));
      status.append(txt);
      status.className = 'callout slim det-status' + (st.enabled && S.status === 'on' ? ' ok' : '');
      read.innerHTML = '';
      const k = S.kda;
      read.append(h('span', { class: 'ev-chip' }, k ? GS.t('HUD: K {0} · D {1} · A {2}', k.k, k.d, k.a) : GS.t('HUD K/D/A tidak kelihatan')));
      if (S.result) read.append(h('span', { class: 'ev-chip' }, 'Victory ' + S.result.victory.toFixed(2) + ' · Defeat ' + S.result.defeat.toFixed(2)));
      if (S.item) read.append(h('span', { class: 'ev-chip' }, GS.t('Item: {0} {1}', S.item.name, S.item.score.toFixed(2))));
      if (S.owned && S.owned.length) read.append(h('span', { class: 'ev-chip' }, GS.t('Item dimiliki: {0}/6', S.owned.length)));
      logBox.innerHTML = '';
      if (!E.log.length) logBox.append(h('div', { class: 'placeholder' }, 'Belum ada kejadian.'));
      E.log.slice(0, 12).forEach((ev) => {
        const t = new Date(ev.t).toLocaleTimeString([], { hour12: false });
        const d = ev.detail || {};
        const extra = ev.type === 'kill' ? d.label : ev.type === 'item' ? d.name : ev.type === 'fullitem' ? (d.items || []).length + '/6' : '';
        logBox.append(h('div', { class: 'ev-row ' + ev.type }, h('span', null, t), h('b', null, GS.t(TYPE[ev.type] || ev.type)), h('em', null, extra || '')));
      });
      // pratonton + kotak ROI
      const pc = prev.getContext('2d');
      const snap = E.snap;
      if (snap && snap.width && S.W) {
        prev.height = Math.round(snap.height * (prev.width / snap.width));
        pc.drawImage(snap, 0, 0, prev.width, prev.height);
        const kk = prev.width / S.W;
        pc.lineWidth = 2;
        Object.keys(ROI_COL).forEach((n) => { const r = E.rect(E.roi(n), S.W, S.H); pc.strokeStyle = ROI_COL[n]; pc.strokeRect(r.x * kk, r.y * kk, r.w * kk, r.h * kk); });
      } else { pc.clearRect(0, 0, prev.width, prev.height); pc.fillStyle = '#8aa2c4'; pc.font = '13px sans-serif'; pc.fillText(GS.t('Tiada bingkai lagi'), 14, 26); }
    }
    draw();
    const timer = setInterval(() => { if (!root.isConnected) { clearInterval(timer); return; } draw(); }, 600);
  };
})();
