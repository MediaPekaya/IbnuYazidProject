/* Global Streamer - kemas kini automatik (hanya app Windows). Banner + bahagian dalam Tetapan. */
(function () {
  'use strict';
  const GS = window.GS;
  const U = (GS.updater = { info: null, ev: { state: 'idle' } });
  const native = () => !!(window.gsNative && window.gsNative.app);
  const TXT = { idle: 'Belum disemak', dev: 'Mod pembangunan (semakan dimatikan)', portable: 'Versi zip: muat turun zip baharu untuk mengemas kini', unavailable: 'Tidak tersedia', checking: 'Menyemak…', current: 'Anda menggunakan versi terkini', available: 'Versi baharu {0} tersedia', downloading: 'Memuat turun… {0}%', downloaded: 'Versi {0} sedia dipasang', error: 'Ralat semakan: {0}' };

  U.text = function () {
    const e = U.ev;
    return GS.t(TXT[e.state] || e.state, e.state === 'downloading' ? e.progress : e.state === 'error' ? e.message : e.version);
  };
  /** Butang kemas kini sentiasa kelihatan di bar atas (app Windows): versi semasa, status, dan klik untuk semak/pasang. */
  U.install = async function () {
    if (U.ev.state !== 'downloaded') return;
    if (GS.live && GS.live.state && GS.live.state !== 'idle' && !(await GS.ask(GS.t('Siaran sedang berjalan. Memasang kemas kini akan menamatkan siaran. Teruskan?')))) return;
    GS.saveNow();
    window.gsNative.app.installUpdate();
  };
  function banner() {
    if (!native()) return;
    const e = U.ev;
    let el = GS.$('#updBtn');
    if (!el) {
      el = GS.h('button', { id: 'updBtn', type: 'button', class: 'chip upd', onClick: () => { if (U.ev.state === 'downloaded') U.install(); else window.gsNative.app.checkUpdate(); } });
      const host = GS.$('#platformChips');
      if (host && host.parentElement) host.parentElement.insertBefore(el, host);
    }
    const v = U.info ? 'v' + U.info.version : '';
    let label = v, title = GS.t('Klik untuk semak kemas kini sekarang');
    if (e.state === 'checking') label = GS.t('Menyemak…');
    else if (e.state === 'available') label = GS.t('Versi baharu {0} tersedia', e.version);
    else if (e.state === 'downloading') label = GS.t('Memuat turun… {0}%', e.progress);
    else if (e.state === 'downloaded') { label = GS.t('Kemas kini {0} sedia: klik untuk pasang', e.version); title = GS.t('Pasang dan mulakan semula app'); }
    else if (e.state === 'error') { label = (v ? v + ' · ' : '') + GS.t('Semakan gagal'); title = GS.t('Ralat semakan: {0}', e.message); }
    else if (e.state === 'dev') title = GS.t('Mod pembangunan (semakan dimatikan)');
    else if (e.state === 'portable') title = GS.t('Versi zip: muat turun zip baharu untuk mengemas kini');
    el.textContent = label;
    el.title = title;
    el.classList.toggle('ready', e.state === 'downloaded');
    el.classList.toggle('busy', e.state === 'checking' || e.state === 'available' || e.state === 'downloading');
    el.classList.toggle('bad', e.state === 'error');
  }
  U.section = function () {
    const h = GS.h;
    if (!native()) return h('div', { class: 'upd-sec' }, h('h3', null, 'Kemas kini'), h('p', { class: 'muted note' }, 'Versi web sentiasa terkini. Kemas kini automatik tersedia dalam app Windows.'));
    const status = h('p', { class: 'muted note' }, U.text());
    const ver = h('span', { class: 'muted' }, '');
    const refresh = () => { status.textContent = U.text(); ver.textContent = U.info ? GS.t('Versi {0}', U.info.version) : ''; };
    window.gsNative.app.info().then((i) => { U.info = i; U.ev = Object.assign({}, U.ev, i.update); refresh(); });
    const off = GS.on('updater:event', () => { if (!status.isConnected) { off(); return; } refresh(); });
    return h('div', { class: 'upd-sec' }, h('h3', null, 'Kemas kini'), ver, status,
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !U.info || U.info.update.enabled !== false, onChange: (e) => window.gsNative.app.enableUpdate(e.target.checked) }), 'Semak kemas kini secara automatik'),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn ghost', onClick: () => window.gsNative.app.checkUpdate() }, 'Semak kemas kini sekarang'),
        h('button', { class: 'btn primary', onClick: () => U.install() }, 'Mulakan semula dan pasang')));
  };
  U.init = function () {
    if (!native()) return;
    window.gsNative.app.info().then((i) => { U.info = i; U.ev = Object.assign({}, U.ev, i.update); banner(); });
    window.gsNative.app.onUpdate((e) => { U.ev = e; GS.emit('updater:event', e); banner(); });
  };
})();
