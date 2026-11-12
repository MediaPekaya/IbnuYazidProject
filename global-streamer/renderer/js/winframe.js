/* Global Streamer - bingkai tetingkap gaya MacBook (app Windows): butang kecilkan / besarkan / tutup di sebelah KANAN,
 * dengan animasi buka, tutup, kecilkan dan pulih gaya macOS. Dalam versi web bar ini tidak dipaparkan. */
(function () {
  'use strict';
  const W = window.gsNative && window.gsNative.win;
  if (!W) return;
  const root = document.documentElement;
  const bar = document.getElementById('titlebar');
  if (!bar) return;
  bar.hidden = false;
  document.body.classList.add('native-frame');

  const play = (cls, ms) => new Promise((res) => {
    root.classList.add(cls);
    setTimeout(() => { root.classList.remove(cls); res(); }, ms);
  });

  // animasi buka (selepas muatan): zum lembut dari kecil dengan lengkung gaya iOS
  root.classList.add('win-open');
  setTimeout(() => root.classList.remove('win-open'), 700);

  const max = document.getElementById('tbMax');
  const state = (s) => {
    document.body.classList.toggle('win-max', !!(s && s.maximized));
    document.body.classList.toggle('win-blur', !!(s && s.focused === false));
    if (max) max.title = s && s.maximized ? 'Pulihkan saiz' : 'Besarkan';
  };
  W.state().then(state).catch(() => {});
  W.onState(state);

  document.getElementById('tbMin').addEventListener('click', async () => {
    root.classList.add('win-min');                    // mengecil ke bawah (gaya macOS) kemudian dikecilkan
    setTimeout(() => W.minimize(), 280);
  });
  max.addEventListener('click', () => { root.classList.add('win-zoom'); setTimeout(() => root.classList.remove('win-zoom'), 500); W.maximize(); });
  document.getElementById('tbClose').addEventListener('click', () => W.close());

  W.onClosing(() => { root.classList.add('win-closing'); });                 // animasi tutup
  W.onClosingCancel(() => { root.classList.remove('win-closing'); play('win-open', 650); });
  W.onRestored(() => { root.classList.remove('win-min'); play('win-restore', 600); });
  // jika tetingkap dikecilkan melalui papan kekunci / bar tugas, pastikan keadaan bersih bila dipulihkan
  document.addEventListener('visibilitychange', () => { if (!document.hidden) root.classList.remove('win-min'); });
})();
