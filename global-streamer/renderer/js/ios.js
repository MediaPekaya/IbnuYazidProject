/* Global Streamer - peralihan licin gaya iOS: penanda tab yang meluncur, kandungan tab yang masuk dengan lembut, dan tindak balas tekan.
 * Berfungsi untuk semua kumpulan tab (Kawalan/Hero/Meta/Draft/Tier..., Tetapan, Chat/Game/Meta) tanpa mengubah logik sedia ada. */
(function () {
  'use strict';
  const SEL = '.subtabs, .set-tabs, .rtabs';
  let raf = 0;

  function place(box) {
    const on = box.querySelector(':scope > button.on, :scope > .subtab.on');
    let pill = box.querySelector(':scope > .ios-pill');
    if (!on || !box.offsetWidth) { if (pill) pill.style.opacity = '0'; return; }
    if (!pill) {
      pill = document.createElement('i'); pill.className = 'ios-pill'; pill.style.transition = 'none';
      box.insertBefore(pill, box.firstChild); box.classList.add('has-pill');
      if (box.classList.contains('rtabs')) box.classList.add('under');
      requestAnimationFrame(() => { pill.style.transition = ''; });
    }
    const under = box.classList.contains('under');
    pill.style.opacity = '1';
    pill.style.width = on.offsetWidth + 'px';
    pill.style.height = under ? '2px' : on.offsetHeight + 'px';
    pill.style.transform = 'translate(' + on.offsetLeft + 'px,' + (under ? on.offsetTop + on.offsetHeight - 2 : on.offsetTop) + 'px)';
  }
  function updateAll() { raf = 0; document.querySelectorAll(SEL).forEach(place); }
  function schedule() { if (!raf) raf = requestAnimationFrame(updateAll); }

  /** Kandungan halaman tab masuk dengan lembut (dipanggil selepas kandungan ditukar). */
  window.GS = window.GS || {};
  GS.ios = { slide: schedule, enter(el) { if (!el) return; el.classList.remove('ios-in'); void el.offsetWidth; el.classList.add('ios-in'); } };

  function init() {
    new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
