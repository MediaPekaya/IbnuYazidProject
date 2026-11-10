/* Global Streamer - kemas kini automatik (hanya app Windows). Banner + bahagian dalam Tetapan. */
(function () {
  'use strict';
  const GS = window.GS;
  const U = (GS.updater = { info: null, ev: { state: 'idle' } });
  const native = () => !!(window.gsNative && window.gsNative.app);
  const TXT = { idle: 'Belum disemak', dev: 'Mod pembangunan (semakan dimatikan)', unavailable: 'Tidak tersedia', checking: 'Menyemak…', current: 'Anda menggunakan versi terkini', available: 'Versi baharu {0} tersedia', downloading: 'Memuat turun… {0}%', downloaded: 'Versi {0} sedia dipasang', error: 'Ralat semakan: {0}' };

  U.text = function () {
    const e = U.ev;
    return GS.t(TXT[e.state] || e.state, e.state === 'downloading' ? e.progress : e.state === 'error' ? e.message : e.version);
  };
  function banner() {
    const e = U.ev;
    let el = GS.$('#updBanner');
    const show = e.state === 'downloaded' || e.state === 'available' || e.state === 'downloading';
    if (!show) { if (el) el.remove(); return; }
    if (!el) {
      el = GS.h('button', { id: 'updBanner', class: 'chip upd', onClick: () => { if (U.ev.state === 'downloaded') window.gsNative.app.installUpdate(); } });
      const host = GS.$('#platformChips') || GS.$('.topbar');
      if (host && host.parentElement) host.parentElement.insertBefore(el, host);
    }
    el.textContent = e.state === 'downloaded' ? GS.t('Kemas kini {0} sedia: klik untuk pasang', e.version) : U.text();
    el.classList.toggle('ready', e.state === 'downloaded');
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
        h('button', { class: 'btn primary', onClick: () => window.gsNative.app.installUpdate() }, 'Mulakan semula dan pasang')));
  };
  U.init = function () {
    if (!native()) return;
    window.gsNative.app.info().then((i) => { U.info = i; U.ev = Object.assign({}, U.ev, i.update); banner(); });
    window.gsNative.app.onUpdate((e) => { U.ev = e; GS.emit('updater:event', e); banner(); });
  };
})();
