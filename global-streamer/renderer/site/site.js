/* Laman jualan: tukar bahasa BM/EN (data-ms / data-en), dan maklumat muat turun daripada /updates/latest.json. */
(function () {
  'use strict';
  var KEY = 'gs.site.lang';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* abaikan */ } }
  var lang = get() || ((navigator.language || 'ms').toLowerCase().indexOf('ms') === 0 ? 'ms' : 'en');
  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-ms]').forEach(function (el) { el.textContent = el.getAttribute(lang === 'en' ? 'data-en' : 'data-ms'); });
    document.querySelectorAll('.lang button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-l') === lang); });
    document.title = document.documentElement.getAttribute(lang === 'en' ? 'data-title-en' : 'data-title-ms') || document.title;
  }
  document.querySelectorAll('.lang button').forEach(function (b) { b.addEventListener('click', function () { lang = b.getAttribute('data-l'); set(lang); apply(); }); });
  apply();

  var box = document.getElementById('dl');
  if (box) {
    fetch('/updates/latest.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('x'); return r.json(); }).then(function (j) {
      var mb = (j.size / 1048576).toFixed(1) + ' MB';
      box.querySelector('[data-f="version"]').textContent = j.version;
      box.querySelector('[data-f="date"]').textContent = (j.date || '').slice(0, 10);
      box.querySelector('[data-f="size"]').textContent = mb;
      box.querySelector('[data-f="sha"]').textContent = j.sha256 || '';
      var a = box.querySelector('a.btn.primary'); a.href = '/updates/' + encodeURIComponent(j.file); a.removeAttribute('aria-disabled');
      box.classList.add('ready');
    }).catch(function () { box.classList.add('soon'); });
  }
})();
